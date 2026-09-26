import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

test("GreatLoveMeta D1 migrations apply in order with v2 Gold classroom tables",()=>{
  const directory=new URL("../drizzle/",import.meta.url);
  const names=readdirSync(directory).filter(name=>/^\d{4}_.+\.sql$/u.test(name)).sort();
  const db=new DatabaseSync(":memory:");
  try{
    db.exec("PRAGMA foreign_keys=ON");
    for(const name of names){
      try{db.exec(readFileSync(new URL(name,directory),"utf8"));}
      catch(error){throw new Error(`Fresh GreatLoveMeta migration failed at ${name}`,{cause:error});}
    }
    assert.equal(names.at(-1),"0132_class_provider_create_recovery.sql");
    for(const table of ["class_room_member_presence","class_room_audio_notes",
      "class_provider_room_claims","class_provider_teardown_jobs",
      "class_provider_create_attempts"])
      assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
        .get(table),`${table} must exist`);
    assert.ok(db.prepare("SELECT name FROM pragma_table_info('class_chat_messages') WHERE name='recipient_user_id'").get());
    assert.ok(db.prepare("SELECT name FROM pragma_table_info('class_materials') WHERE name='deleted_at'").get());
  }finally{db.close();}
});
