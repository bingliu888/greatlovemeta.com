import { getDatabase } from "@/lib/auth";
import { classProviderCreateFailureIsDefinite, classProviderCreateTitle,
  createClassProviderRoom, findClassProviderRoomsByExactTitle,
  teardownClassProviderRoom } from "@/lib/class-realtimekit";
import { CLAIM_IDLE_CLASS_PROVIDER_TEARDOWN_SQL } from "@/lib/class-provider-lifecycle-sql";
import { ATTACH_CLASS_PROVIDER_ROOM_SQL } from "@/lib/class-provider-room-claim";

const RECOVERY_SECONDS=15*60;
const retryAt=(attempts:number,now:number)=>now+Math.min(3600,2**Math.min(10,Math.max(1,attempts)));

export async function createClaimedClassProviderRoom(roomId:string,title:string,now=Math.floor(Date.now()/1000)) {
  const db=getDatabase();
  const existing=await db.prepare(`SELECT 1 FROM class_provider_create_attempts WHERE room_id=?`)
    .bind(roomId).first();
  if(existing)throw new Error("CLASS_PROVIDER_CREATE_RECOVERY_PENDING");
  const correlationId=crypto.randomUUID(),providerTitle=classProviderCreateTitle(title,correlationId);
  const claim=await db.prepare(`INSERT OR IGNORE INTO class_provider_create_attempts
    (room_id,correlation_id,provider_title,next_attempt_at,deadline_at,created_at,updated_at)
    SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM class_rooms WHERE id=? AND provider_meeting_id IS NULL)`)
    .bind(roomId,correlationId,providerTitle,now+30,now+RECOVERY_SECONDS,now,now,roomId).run();
  if(Number(claim.meta?.changes||0)!==1)throw new Error("CLASS_PROVIDER_CREATE_RECOVERY_PENDING");
  try {
    const created=await createClassProviderRoom(title,correlationId);
    if(!created.id)throw new Error("REALTIME_PROVIDER_MEETING_ID_MISSING");
    await db.prepare(`UPDATE class_provider_create_attempts SET provider_meeting_id=?,
      next_attempt_at=?,updated_at=? WHERE correlation_id=?`)
      .bind(created.id,now,now,correlationId).run();
    const attached=await db.prepare(ATTACH_CLASS_PROVIDER_ROOM_SQL)
      .bind(created.id,now,roomId).run();
    if(Number(attached.meta?.changes||0)!==1){
      const current=await db.prepare(`SELECT provider_meeting_id AS id FROM class_rooms WHERE id=?`)
        .bind(roomId).first<{id:string|null}>();
      if(current?.id!==created.id){
        await queueClassProviderTeardown(roomId,created.id);
        await processClassProviderTeardown(created.id);
        await db.prepare(`DELETE FROM class_provider_create_attempts WHERE correlation_id=?`)
          .bind(correlationId).run();
        throw new Error("PROVIDER_ROOM_ATTACH_CONFLICT");
      }
    }
    await db.prepare(`DELETE FROM class_provider_create_attempts WHERE correlation_id=?`)
      .bind(correlationId).run();
    return created.id;
  } catch(error) {
    if(classProviderCreateFailureIsDefinite(error))
      await db.prepare(`DELETE FROM class_provider_create_attempts WHERE correlation_id=?`)
        .bind(correlationId).run();
    else await db.prepare(`UPDATE class_provider_create_attempts SET
      discovery_attempts=discovery_attempts+1,next_attempt_at=?,last_error=?,updated_at=?
      WHERE correlation_id=?`).bind(now+30,error instanceof Error?error.message.slice(0,240):"Provider create uncertain",now,correlationId).run();
    throw error;
  }
}

export async function recoverClassProviderCreates(limit=5) {
  const db=getDatabase(),now=Math.floor(Date.now()/1000);
  const attempts=(await db.prepare(`SELECT room_id AS roomId,correlation_id AS correlationId,
    provider_title AS providerTitle,provider_meeting_id AS providerMeetingId,
    discovery_attempts AS discoveryAttempts,no_match_confirmations AS noMatchConfirmations,
    deadline_at AS deadlineAt FROM class_provider_create_attempts
    WHERE next_attempt_at<=? ORDER BY next_attempt_at,updated_at LIMIT ?`)
    .bind(now,Math.max(1,Math.min(10,limit))).run<{roomId:string;correlationId:string;
      providerTitle:string;providerMeetingId:string|null;discoveryAttempts:number;
      noMatchConfirmations:number;deadlineAt:number}>()).results||[];
  for(const attempt of attempts){
    try{
      const found=attempt.providerMeetingId?[{id:attempt.providerMeetingId}]:
        await findClassProviderRoomsByExactTitle(attempt.providerTitle);
      const providerId=found[0]?.id;
      for(const loser of found.slice(1))if(loser.id)
        await queueClassProviderTeardown(attempt.roomId,loser.id);
      if(providerId){
        const room=await db.prepare(`SELECT provider_meeting_id AS id FROM class_rooms WHERE id=?`)
          .bind(attempt.roomId).first<{id:string|null}>();
        if(!room||room.id&&room.id!==providerId)
          await queueClassProviderTeardown(attempt.roomId,providerId);
        else if(!room.id){
          const attached=await db.prepare(ATTACH_CLASS_PROVIDER_ROOM_SQL)
            .bind(providerId,now,attempt.roomId).run();
          if(Number(attached.meta?.changes||0)!==1)
            await queueClassProviderTeardown(attempt.roomId,providerId);
        }
        await db.prepare(`DELETE FROM class_provider_create_attempts WHERE correlation_id=?`)
          .bind(attempt.correlationId).run();
        continue;
      }
      const confirmations=attempt.noMatchConfirmations+1;
      if(now>=attempt.deadlineAt&&confirmations>=3)
        await db.prepare(`DELETE FROM class_provider_create_attempts WHERE correlation_id=?`)
          .bind(attempt.correlationId).run();
      else await db.prepare(`UPDATE class_provider_create_attempts SET
        discovery_attempts=discovery_attempts+1,no_match_confirmations=?,
        next_attempt_at=?,last_error=NULL,updated_at=? WHERE correlation_id=?`)
        .bind(confirmations,now+60,now,attempt.correlationId).run();
    }catch(error){
      const failures=attempt.discoveryAttempts+1;
      await db.prepare(`UPDATE class_provider_create_attempts SET discovery_attempts=?,
        next_attempt_at=?,last_error=?,updated_at=? WHERE correlation_id=?`)
        .bind(failures,retryAt(failures,now),error instanceof Error?error.message.slice(0,240):"Provider recovery failed",now,attempt.correlationId).run();
    }
  }
  return attempts.length;
}

export async function processClassProviderTeardowns(limit=5){
  const db=getDatabase(),now=Math.floor(Date.now()/1000);
  const jobs=(await db.prepare(`SELECT provider_meeting_id AS id FROM class_provider_teardown_jobs
    WHERE updated_at<=? ORDER BY updated_at LIMIT ?`)
    .bind(now,Math.max(1,Math.min(10,limit))).run<{id:string}>()).results||[];
  for(const job of jobs)await processClassProviderTeardown(job.id);
  return jobs.length;
}

export async function reconcileIdleClassProviderRooms(limit=10){
  const db=getDatabase(),now=Math.floor(Date.now()/1000);
  const rooms=(await db.prepare(`SELECT id FROM class_rooms WHERE provider_meeting_id IS NOT NULL
    AND stream_active=1 AND updated_at<=? ORDER BY updated_at LIMIT ?`)
    .bind(now-15,Math.max(1,Math.min(25,limit))).run<{id:string}>()).results||[];
  for(const room of rooms)await reconcileClassProviderRoom(room.id,now);
  return rooms.length;
}

export async function claimIdleClassProviderTeardown(roomId:string,now=Math.floor(Date.now()/1000)) {
  const result=await getDatabase().prepare(CLAIM_IDLE_CLASS_PROVIDER_TEARDOWN_SQL)
    .bind(now,now,roomId,now-15,now-45).run();
  return Number(result.meta?.changes||0)>0;
}

export async function queueClassProviderTeardown(roomId:string,providerMeetingId:string,
  now=Math.floor(Date.now()/1000)) {
  await getDatabase().prepare(`INSERT INTO class_provider_teardown_jobs
    (provider_meeting_id,room_id,attempts,last_error,requested_at,updated_at)
    VALUES(?,?,0,NULL,?,?) ON CONFLICT(provider_meeting_id) DO NOTHING`)
    .bind(providerMeetingId,roomId,now,now).run();
}

export async function processClassProviderTeardown(providerMeetingId:string) {
  const db=getDatabase();
  const job=await db.prepare(`SELECT room_id AS roomId,provider_meeting_id AS providerMeetingId
    FROM class_provider_teardown_jobs WHERE provider_meeting_id=?`)
    .bind(providerMeetingId).first<{roomId:string;providerMeetingId:string}>();
  if(!job)return false;
  // A participant may have started publishing after the idle job was queued.
  // Retain the current provider generation when that happens; stale create-loser
  // generations still need teardown and have no matching class_rooms pointer.
  const current=await db.prepare(`SELECT provider_meeting_id AS providerMeetingId
    FROM class_rooms WHERE id=?`).bind(job.roomId)
    .first<{providerMeetingId:string|null}>();
  if(current?.providerMeetingId===job.providerMeetingId){
    const active=await db.prepare(`SELECT 1 FROM class_media_presence
      WHERE room_id=? AND active=1 AND (mic_on=1 OR camera_on=1)
        AND last_seen_at>? LIMIT 1`).bind(job.roomId,Math.floor(Date.now()/1000)-45).first();
    if(active){
      await db.prepare(`DELETE FROM class_provider_teardown_jobs
        WHERE provider_meeting_id=?`).bind(job.providerMeetingId).run();
      return false;
    }
  }
  try{
    await teardownClassProviderRoom(job.providerMeetingId);
    const now=Math.floor(Date.now()/1000);
    // A stale create-loser job must not touch a different provider generation.
    const retired=await db.prepare(`UPDATE class_rooms SET stream_active=0,
      provider_meeting_id=NULL,mute_all=0,updated_at=?
      WHERE id=? AND provider_meeting_id=?`)
      .bind(now,job.roomId,job.providerMeetingId).run();
    if(Number(retired.meta?.changes||0)>0)
      await db.prepare(`UPDATE class_media_presence SET active=0,mic_on=0,
        camera_on=0,last_seen_at=? WHERE room_id=? AND active=1`)
        .bind(now,job.roomId).run();
    await db.prepare(`DELETE FROM class_provider_teardown_jobs
      WHERE provider_meeting_id=?`).bind(job.providerMeetingId).run();
    return true;
  }catch(error){
    await db.prepare(`UPDATE class_provider_teardown_jobs SET attempts=attempts+1,
      last_error=?,updated_at=? WHERE provider_meeting_id=?`)
      .bind(error instanceof Error?error.message.slice(0,200):"unknown",
        Math.floor(Date.now()/1000),job.providerMeetingId).run();
    return false;
  }
}

export async function reconcileClassProviderRoom(roomId:string,now=Math.floor(Date.now()/1000)) {
  const db=getDatabase();
  const pending=await db.prepare(`SELECT provider_meeting_id AS providerMeetingId
    FROM class_provider_teardown_jobs WHERE room_id=? ORDER BY requested_at LIMIT 5`)
    .bind(roomId).run<{providerMeetingId:string}>();
  for(const job of pending.results||[])await processClassProviderTeardown(job.providerMeetingId);
  if(await claimIdleClassProviderTeardown(roomId,now)) {
    const current=await db.prepare(`SELECT provider_meeting_id AS providerMeetingId
      FROM class_rooms WHERE id=?`).bind(roomId).first<{providerMeetingId:string|null}>();
    if(current?.providerMeetingId)
      await processClassProviderTeardown(current.providerMeetingId);
  }
}
