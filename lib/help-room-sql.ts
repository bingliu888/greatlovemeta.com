export const HELP_ROOM_INSERT_SQL = `INSERT INTO class_rooms
  (id,code,host_user_id,host_email,host_name,title,description,subject,
   class_type,streaming_mode,realtime_mode,starts_at,duration_minutes,
   trial_minutes,tuition_cents,password_hash,created_at,updated_at)
  SELECT ?,?,admin.id,admin.email,admin.display_name,?,?,?,
    'public','audio','webinar',?,480,0,0,NULL,?,?
  FROM users admin JOIN platform_user_roles role ON role.user_id=admin.id
  WHERE role.role='admin' AND admin.email_verified=1
    AND NOT EXISTS(SELECT 1 FROM site_help_rooms WHERE singleton=1)
  ORDER BY admin.created_at,admin.id LIMIT 1`;

export const HELP_ROOM_POINTER_SQL = `INSERT INTO site_help_rooms(singleton,room_id)
  SELECT 1,? WHERE EXISTS(SELECT 1 FROM class_rooms WHERE id=?)
  ON CONFLICT(singleton) DO NOTHING`;

export const HELP_ROOM_SELECT_SQL = `SELECT room.code FROM site_help_rooms help
  JOIN class_rooms room ON room.id=help.room_id
  JOIN users admin ON admin.id=room.host_user_id
  JOIN platform_user_roles role ON role.user_id=admin.id
  WHERE help.singleton=1 AND room.streaming_mode='audio'
    AND room.realtime_mode='webinar' AND room.class_type='public'
    AND room.tuition_cents=0 AND room.password_hash IS NULL
    AND room.status='active' AND role.role='admin' AND admin.email_verified=1
  LIMIT 1`;
