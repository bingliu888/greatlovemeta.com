import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { CLASS_CHAT_RETENTION_SECONDS, SELECT_CLASS_SUPPORT_REPLY_TARGET_SQL, SELECT_VISIBLE_CLASS_CHAT_SQL, canDeleteClassChatMessage } from '../lib/class-chat-policy.ts';
import { ACTIVE_CLASS_ROOM_TAB_SQL, CLAIM_CLASS_ROOM_SQL, RELEASE_CLASS_ROOM_SQL, ROOM_MEMBER_LIVE_SECONDS } from '../lib/class-room-member-lease-sql.ts';
import { ATTACH_CLASS_PROVIDER_ROOM_SQL, CLAIM_CLASS_PROVIDER_ROOM_SQL } from '../lib/class-provider-room-claim.ts';
import { CLAIM_IDLE_CLASS_PROVIDER_TEARDOWN_SQL } from '../lib/class-provider-lifecycle-sql.ts';
import { audioNoteDurationAllowed, MAX_AUDIO_FILE_SECONDS, MAX_BROWSER_RECORDING_SECONDS } from '../lib/class-room-audio-note-policy.ts';
import { meetingSpeechChunks, meetingSpeechText } from '../lib/meeting-speech-text.ts';
import { classPublisherStartsAuthorized } from '../lib/class-publishing-policy.ts';
import { CLASS_AUDIO_NOTE_ENTITLEMENT_SQL, CLASS_ROOM_OBJECT_KEYS_SQL } from '../lib/class-room-resource-sql.ts';

function fixture(){
  const db=new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE users(id TEXT PRIMARY KEY,display_name TEXT);
    CREATE TABLE class_rooms(id TEXT PRIMARY KEY,host_user_id TEXT);
    CREATE TABLE class_cohosts(room_id TEXT,user_id TEXT);
    CREATE TABLE class_chat_messages(id TEXT PRIMARY KEY,room_id TEXT,sender_user_id TEXT,sender_name TEXT,recipient_user_id TEXT,body TEXT,created_at INTEGER);
    CREATE TABLE class_room_member_presence(room_id TEXT,user_id TEXT,tab_id TEXT,display_name TEXT,entered_at INTEGER,last_seen_at INTEGER,PRIMARY KEY(room_id,user_id));`);
  for(const [id,name] of [['host','Host'],['cohost','Cohost'],['alice','Alice'],['bob','Bob']])db.prepare('INSERT INTO users VALUES(?,?)').run(id,name);
  db.prepare('INSERT INTO class_rooms VALUES(?,?)').run('room','host');
  db.prepare('INSERT INTO class_cohosts VALUES(?,?)').run('room','cohost');
  const add=(id,sender,recipient,time)=>db.prepare('INSERT INTO class_chat_messages VALUES(?,?,?,?,?,?,?)').run(id,'room',sender,sender,recipient,id,time);
  add('a1','alice',null,1000);add('r1','host','alice',1001);add('b1','bob',null,1002);add('r2','cohost','bob',1003);
  return db;
}

test('SmartMeeting private chat visibility maps to class members without cross-member leaks',()=>{
  const db=fixture();
  const visible=(agent,id)=>db.prepare(SELECT_VISIBLE_CLASS_CHAT_SQL).all('room',900,agent?1:0,id,id).map(row=>row.id);
  assert.deepEqual(visible(false,'alice'),['r1','a1']);
  assert.deepEqual(visible(false,'bob'),['r2','b1']);
  assert.deepEqual(visible(true,'host'),['r2','b1','r1','a1']);
  assert.equal(db.prepare(SELECT_CLASS_SUPPORT_REPLY_TARGET_SQL).get('a1','room',900)?.userId,'alice');
  assert.equal(db.prepare(SELECT_CLASS_SUPPORT_REPLY_TARGET_SQL).get('r1','room',900),undefined);
  assert.equal(db.prepare(SELECT_CLASS_SUPPORT_REPLY_TARGET_SQL).get('a1','room',1001),undefined);
  assert.equal(canDeleteClassChatMessage({supportAgent:false,userId:'alice',senderUserId:'bob'}),false);
  assert.equal(canDeleteClassChatMessage({supportAgent:true,userId:'host',senderUserId:'bob'}),true);
  assert.equal(CLASS_CHAT_RETENTION_SECONDS,604800);
});

test('SmartMeeting one-member-one-room lease permits only the same live tab until expiry',()=>{
  const db=fixture(),a='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',b='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const claim=(tab,at)=>db.prepare(CLAIM_CLASS_ROOM_SQL).run('room','alice',tab,'Alice',at,at,at-ROOM_MEMBER_LIVE_SECONDS).changes;
  assert.equal(claim(a,100),1);
  assert.equal(claim(b,101),0);
  assert.equal(claim(a,102),1);
  assert.ok(db.prepare(ACTIVE_CLASS_ROOM_TAB_SQL).get('room','alice',a,100));
  assert.equal(claim(b,121),1);
  assert.equal(db.prepare(ACTIVE_CLASS_ROOM_TAB_SQL).get('room','alice',a,103),undefined);
  db.prepare(RELEASE_CLASS_ROOM_SQL).run('room','alice',a);
  assert.ok(db.prepare(ACTIVE_CLASS_ROOM_TAB_SQL).get('room','alice',b,103));
  db.prepare(RELEASE_CLASS_ROOM_SQL).run('room','alice',b);
  assert.equal(db.prepare(ACTIVE_CLASS_ROOM_TAB_SQL).get('room','alice',b,103),undefined);
});

test('first two publishers share one provider room claim and only one room attaches',()=>{
  const db=new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE class_rooms(id TEXT PRIMARY KEY,provider_meeting_id TEXT,stream_active INTEGER,mute_all INTEGER,updated_at INTEGER);
    CREATE TABLE class_provider_room_claims(room_id TEXT PRIMARY KEY,claim_token TEXT,claimed_at INTEGER);
    INSERT INTO class_rooms VALUES('room',NULL,0,0,0);`);
  const claim=(token,at)=>db.prepare(CLAIM_CLASS_PROVIDER_ROOM_SQL).run('room',token,at,at-60).changes;
  assert.equal(claim('first',100),1);
  assert.equal(claim('second',101),0);
  assert.equal(db.prepare(ATTACH_CLASS_PROVIDER_ROOM_SQL).run('provider-a',102,'room').changes,1);
  assert.equal(db.prepare(ATTACH_CLASS_PROVIDER_ROOM_SQL).run('provider-b',103,'room').changes,0);
  assert.equal(db.prepare('SELECT provider_meeting_id FROM class_rooms').get().provider_meeting_id,'provider-a');
  db.prepare('DELETE FROM class_provider_room_claims WHERE room_id=? AND claim_token=?').run('room','first');
  assert.equal(claim('second',104),1);
});

test('uncertain provider create keeps one recoverable correlation for a room',()=>{
  const db=new DatabaseSync(':memory:');
  db.exec(`PRAGMA foreign_keys=ON;CREATE TABLE class_rooms(id TEXT PRIMARY KEY);
    INSERT INTO class_rooms VALUES('room');`);
  db.exec(readFileSync(new URL('../drizzle/0132_class_provider_create_recovery.sql',import.meta.url),'utf8'));
  const insert=db.prepare(`INSERT OR IGNORE INTO class_provider_create_attempts
    (room_id,correlation_id,provider_title,next_attempt_at,deadline_at,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?)`);
  assert.equal(insert.run('room','correlation-a','[GLM2:a] Room',130,1000,100,100).changes,1);
  assert.equal(insert.run('room','correlation-b','[GLM2:b] Room',131,1001,101,101).changes,0);
  assert.equal(db.prepare('SELECT correlation_id FROM class_provider_create_attempts WHERE room_id=?')
    .get('room').correlation_id,'correlation-a');
  db.prepare('UPDATE class_provider_create_attempts SET provider_meeting_id=? WHERE room_id=?')
    .run('provider-a','room');
  assert.equal(db.prepare('SELECT provider_meeting_id FROM class_provider_create_attempts WHERE room_id=?')
    .get('room').provider_meeting_id,'provider-a');
});

test('idle provider teardown waits for the final publisher and fifteen-second grace',()=>{
  const db=new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE class_rooms(id TEXT PRIMARY KEY,provider_meeting_id TEXT,stream_active INTEGER,updated_at INTEGER);
    CREATE TABLE class_media_presence(room_id TEXT,active INTEGER,mic_on INTEGER,camera_on INTEGER,last_seen_at INTEGER);
    CREATE TABLE class_provider_teardown_jobs(provider_meeting_id TEXT PRIMARY KEY,room_id TEXT,attempts INTEGER,last_error TEXT,requested_at INTEGER,updated_at INTEGER);
    INSERT INTO class_rooms VALUES('room','provider',1,100);
    INSERT INTO class_media_presence VALUES('room',1,1,0,120);`);
  const claim=(now)=>db.prepare(CLAIM_IDLE_CLASS_PROVIDER_TEARDOWN_SQL)
    .run(now,now,'room',now-15,now-45).changes;
  assert.equal(claim(130),0,'a live publisher retains its provider room');
  db.exec(`UPDATE class_media_presence SET mic_on=0;
    UPDATE class_rooms SET updated_at=130 WHERE id='room';`);
  assert.equal(claim(144),0,'the mute grace has not elapsed');
  assert.equal(claim(145),1);
  assert.equal(claim(146),0,'one provider generation has one teardown job');
});

test('local audio notes keep SmartMeeting duration and text-to-speech boundaries',()=>{
  assert.equal(audioNoteDurationAllowed('browser',MAX_BROWSER_RECORDING_SECONDS),true);
  assert.equal(audioNoteDurationAllowed('browser',MAX_BROWSER_RECORDING_SECONDS+1),false);
  assert.equal(audioNoteDurationAllowed('file',MAX_AUDIO_FILE_SECONDS),true);
  assert.equal(audioNoteDurationAllowed('file',MAX_AUDIO_FILE_SECONDS+1),false);
  assert.equal(meetingSpeechText(' Hello\r\nworld '),'Hello\nworld');
  assert.equal(meetingSpeechText('x'.repeat(5001)),null);
  assert.deepEqual(meetingSpeechChunks('Hello. World.'),['Hello.','World.']);
});

test('private classroom access never bypasses webinar or HLS stage permission',()=>{
  assert.equal(classPublisherStartsAuthorized('group_call',false),true);
  assert.equal(classPublisherStartsAuthorized('webinar',false),false);
  assert.equal(classPublisherStartsAuthorized('livestream',false),false);
  assert.equal(classPublisherStartsAuthorized('webinar',true),true);
});

test('permanent room deletion includes playlist, hidden attachments and audio notes',()=>{
  const db=new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE class_playlist_items(room_id TEXT,r2_key TEXT);
    CREATE TABLE class_materials(room_id TEXT,object_key TEXT,deleted_at INTEGER);
    CREATE TABLE class_room_audio_notes(room_id TEXT,object_key TEXT,deleted_at INTEGER);
    INSERT INTO class_playlist_items VALUES('room','playlist/key'),('other','other/key');
    INSERT INTO class_materials VALUES('room','materials/key',NULL),('room','materials/hidden',100);
    INSERT INTO class_room_audio_notes VALUES('room','audio/key',NULL),('room','audio/hidden',100);`);
  const keys=db.prepare(CLASS_ROOM_OBJECT_KEYS_SQL).all('room','room','room').map(row=>row.r2Key);
  assert.deepEqual(keys,['audio/hidden','audio/key','materials/hidden','materials/key','playlist/key']);
});

test('GreatLoveMeta recording add-on requires an active subscription beyond seven days',()=>{
  const db=new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE subscriptions(user_id TEXT,status TEXT,current_period_ends_at INTEGER);`);
  const after=2000000000+7*86400;
  const eligible=()=>Boolean(db.prepare(CLASS_AUDIO_NOTE_ENTITLEMENT_SQL).get('member',after));
  assert.equal(eligible(),false);
  db.prepare('INSERT INTO subscriptions VALUES(?,?,?)').run('member','trial',after+1);
  assert.equal(eligible(),false);
  db.prepare('UPDATE subscriptions SET status=?,current_period_ends_at=?').run('active',after);
  assert.equal(eligible(),false);
  db.prepare('UPDATE subscriptions SET current_period_ends_at=?').run(after+1);
  assert.equal(eligible(),true);
  db.prepare('UPDATE subscriptions SET status=?').run('cancelled');
  assert.equal(eligible(),false);
  db.close();
});
