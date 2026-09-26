import {
  classAccess,
  classByCode,
  recordClassJoin,
  verifyClassEntryPassword,
} from "@/lib/classrooms";
import { createId, getDatabase, getSessionUser } from "@/lib/auth";
import { classRoomOnlineMembers, hasClassRoomMemberTab, ROOM_TAB_ID } from "@/lib/class-room-member-presence";
import { CLAIM_CLASS_PROVIDER_ROOM_SQL } from "@/lib/class-provider-room-claim";
import { createClaimedClassProviderRoom, reconcileClassProviderRoom } from "@/lib/class-provider-lifecycle";
import { classPublisherStartsAuthorized } from "@/lib/class-publishing-policy";
import {
  createClassParticipant,
} from "@/lib/class-realtimekit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    let room = await classByCode(code);
    if (!room)
      return Response.json({ error: "Course not found" }, { status: 404 });
    await reconcileClassProviderRoom(room.id);
    room = await classByCode(code);
    if (!room) return Response.json({error:"Course not found"},{status:404});
    const body = (await request.json().catch(() => ({}))) as {
        password?: string;
        identity?: string;
        publish?: boolean;
        start?: boolean;
        screenShareCompanion?: boolean;
        tabId?: string;
      },
      user = await getSessionUser(request),
      access = await classAccess(room, user, true);
    if (!user) return Response.json({error:"Sign in required"},{status:401});
    if (!access.allowed)
      return Response.json(
        { error: "Private course invitation required" },
        { status: 403 },
      );
    const tabId=String(body.tabId||"");
    if(!ROOM_TAB_ID.test(tabId)||!await hasClassRoomMemberTab(room.id,user.id,tabId))
      return Response.json({error:"Enter the room on this device first",errorCode:"ROOM_PRESENCE_REQUIRED"},{status:409});
    if((body.publish||body.start||body.screenShareCompanion)&&(await classRoomOnlineMembers(room.id)).length<2)
      return Response.json({error:"Waiting for another member",errorCode:"WAITING_FOR_MEMBER"},{status:409});
    if (room.hasPassword && !access.manager && !await verifyClassEntryPassword(code, String(body.password || "")))
      return Response.json({ error: "Incorrect course password", errorCode: "INCORRECT_CLASS_PASSWORD" }, { status: 403 });
    const db = getDatabase(),
      now = Math.floor(Date.now() / 1000),
      identity = String(body.identity || crypto.randomUUID()).slice(0, 100),
      displayName = String(user.displayName || user.email || "Member")
        .trim().slice(0,80);
    let canPublish=classPublisherStartsAuthorized(room.realtimeMode,access.manager);
    if(!canPublish&&room.realtimeMode==="webinar")
      canPublish=Boolean(await db.prepare(`SELECT 1 FROM class_stage_requests
        WHERE room_id=? AND identity=? AND user_id=? AND status='approved' LIMIT 1`)
        .bind(room.id,identity,user.id).first());
    if(!canPublish&&room.realtimeMode==="livestream")
      canPublish=Boolean(await db.prepare(`SELECT 1 FROM class_stage_speakers
        WHERE room_id=? AND lower(member_email)=lower(?) LIMIT 1`)
        .bind(room.id,user.email).first());
    if(body.publish&&!canPublish)
      return Response.json({error:room.realtimeMode==="webinar"?
        "Raise your hand and wait for host approval":
        "The host has not added this member email as a speaker",
        errorCode:"STAGE_ACCESS_REQUIRED"},{status:403});
    const pending=await db.prepare(`SELECT provider_meeting_id AS providerMeetingId
      FROM class_provider_teardown_jobs WHERE room_id=? LIMIT 1`).bind(room.id)
      .first<{providerMeetingId:string}>();
    if(pending)return Response.json({error:"Provider room is closing",
      errorCode:"PROVIDER_ROOM_CLOSING"},{status:409});
    let providerMeetingId = room.providerMeetingId;
    if (
      body.publish &&
      canPublish &&
      !room.streamActive &&
      !providerMeetingId
    ) {
      const claimToken=crypto.randomUUID();
      const claimed=await db.prepare(CLAIM_CLASS_PROVIDER_ROOM_SQL)
        .bind(room.id,claimToken,now,now-60).run();
      if(Number(claimed.meta?.changes||0)<1)
        return Response.json({error:"Provider room is starting",errorCode:"PROVIDER_ROOM_STARTING"},{status:409});
      try {
        const current=await db.prepare("SELECT provider_meeting_id AS providerMeetingId FROM class_rooms WHERE id=?")
          .bind(room.id).first<{providerMeetingId:string|null}>();
        if(current?.providerMeetingId)providerMeetingId=current.providerMeetingId;
        else {
          providerMeetingId=await createClaimedClassProviderRoom(room.id,room.title,now);
        }
      } finally {
        await db.prepare("DELETE FROM class_provider_room_claims WHERE room_id=? AND claim_token=?")
          .bind(room.id,claimToken).run();
      }
    }
    if (!providerMeetingId || (!room.streamActive && !body.start && !body.publish))
      return Response.json({ error: "STREAM_NOT_ACTIVE" }, { status: 409 });
    if (body.screenShareCompanion) {
      if (room.streamingMode !== "audio" || room.realtimeMode === "livestream")
        return Response.json(
          { error: "Screen-share companion is unavailable" },
          { status: 409 },
        );
      const participant = await createClassParticipant(
        providerMeetingId,
        "screenshare-" + user.id,
        displayName + " · Screen",
        access.manager ? "host" : "viewer",
        room.realtimeMode,
        room.streamingMode,
      );
      return Response.json({
        authToken: participant.token,
        role: access.manager ? "host" : "viewer",
        meetingId: providerMeetingId,
        screenShareCompanion: true,
      });
    }
    const active = await db
      .prepare(
        "SELECT COUNT(*) AS count FROM class_media_presence WHERE room_id=? AND active=1 AND last_seen_at>?",
      )
      .bind(room.id, now - 45)
      .first<{ count: number }>();
    if (
      room.realtimeMode === "group_call" &&
      Number(active?.count || 0) >= 100 &&
      !(await db
        .prepare(
          "SELECT 1 FROM class_media_presence WHERE room_id=? AND identity=? AND active=1",
        )
        .bind(room.id, identity)
        .first())
    )
      return Response.json(
        {
          error: "Too many people in streaming",
          errorCode: "STREAMING_ROOM_FULL",
          participantLimit: 100,
        },
        { status: 409 },
      );
    let role: "viewer" | "member" | "host" = "viewer";
    if (access.manager) role = "host";
    else if (body.publish) {
      if (!canPublish)
        return Response.json(
          {
            error:
              room.realtimeMode === "webinar"
                ? "Raise your hand and wait for host approval"
                : "The host has not added this member email as a speaker",
            errorCode: "STAGE_ACCESS_REQUIRED",
          },
          { status: 403 },
        );
      if (room.realtimeMode !== "group_call") {
        const count = await db
          .prepare(
            "SELECT COUNT(*) AS count FROM class_media_presence WHERE room_id=? AND active=1 AND (mic_on=1 OR camera_on=1) AND last_seen_at>?",
          )
          .bind(room.id, now - 45)
          .first<{ count: number }>();
        if (Number(count?.count || 0) >= 9)
          return Response.json(
            { error: "The 9-speaker stage is full", errorCode: "STAGE_FULL" },
            { status: 409 },
          );
      }
      role = "member";
    }
    const participant = await createClassParticipant(
      providerMeetingId,
      identity,
      displayName,
      role,
      room.realtimeMode,
      room.streamingMode,
    );
    await db
      .prepare(
        `INSERT INTO class_media_presence(id,room_id,identity,user_id,display_name,is_member,mic_on,camera_on,active,last_seen_at) VALUES(?,?,?,?,?,?,0,0,1,?) ON CONFLICT(room_id,identity) DO UPDATE SET user_id=excluded.user_id,display_name=excluded.display_name,is_member=excluded.is_member,active=1,last_seen_at=excluded.last_seen_at`,
      )
      .bind(
        createId(),
        room.id,
        identity,
        user.id,
        displayName,
        1,
        now,
      )
      .run();
    await recordClassJoin(user.id, room.id, now);
    return Response.json({
      authToken: participant.token,
      identity,
      role,
      meetingId: providerMeetingId,
      streamingMode: room.streamingMode,
      realtimeMode: room.realtimeMode,
      manager: access.manager,
      canPublish,
      participantLimit: room.realtimeMode === "group_call" ? 100 : null,
      publisherLimit: room.realtimeMode === "group_call" ? null : 9,
    });
  } catch (issue) {
    const message =
      issue instanceof Error ? issue.message : "REALTIMEKIT_REQUEST_FAILED";
    console.error("Course room RealtimeKit join failed", message);
    return Response.json({ error: message }, { status: 502 });
  }
}
