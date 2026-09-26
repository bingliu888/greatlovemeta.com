import {getDatabase} from "./auth";
import {generateClassCode} from "./classrooms";
import {HELP_ROOM_INSERT_SQL,HELP_ROOM_POINTER_SQL,HELP_ROOM_SELECT_SQL} from "./help-room-sql";

export async function helpRoomCode():Promise<string|null>{
  const row=await getDatabase().prepare(HELP_ROOM_SELECT_SQL).first<{code:string}>();
  return row?.code??null;
}

/** Provision a site-owned audio Webinar without starting RealtimeKit. */
export async function ensureHelpRoom():Promise<string|null>{
  const existing=await helpRoomCode();
  if(existing)return existing;
  // A changed room needs an administrator to fix its configuration; never
  // silently send members to a private or video room.
  if(await getDatabase().prepare("SELECT 1 FROM site_help_rooms WHERE singleton=1").first())return null;
  for(let attempt=0;attempt<3;attempt+=1){
    const id="site-help-room-v1",code=await generateClassCode(),now=Math.floor(Date.now()/1000);
    try{
      await getDatabase().batch([
        getDatabase().prepare(HELP_ROOM_INSERT_SQL).bind(id,code,"Help","","Help",now,now,now),
        getDatabase().prepare(HELP_ROOM_POINTER_SQL).bind(id,id),
      ]);
      return await helpRoomCode();
    }catch(error){
      if(!/UNIQUE constraint failed:\s*class_rooms\.(?:code|id)|SQLITE_CONSTRAINT_UNIQUE/i.test(String(error))||attempt===2)throw error;
      const winner=await helpRoomCode();
      if(winner)return winner;
    }
  }
  return null;
}
