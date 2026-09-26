-- One administrator-owned public audio Webinar, using this site's class
-- chat and media lifecycle. Opening it does not start RealtimeKit.
CREATE TABLE site_help_rooms (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  room_id TEXT NOT NULL UNIQUE REFERENCES class_rooms(id) ON DELETE CASCADE
);

INSERT INTO class_rooms (
  id,code,host_user_id,host_email,host_name,title,description,subject,
  class_type,streaming_mode,realtime_mode,starts_at,duration_minutes,
  trial_minutes,tuition_cents,password_hash,created_at,updated_at
)
SELECT 'site-help-room-v1',printf('%06d',candidate.n),admin.id,admin.email,
  admin.display_name,'Help','','Help','public','audio','webinar',
  unixepoch(),480,0,0,NULL,unixepoch(),unixepoch()
FROM users admin
JOIN platform_user_roles role ON role.user_id=admin.id
CROSS JOIN (
  WITH RECURSIVE codes(n) AS (
    VALUES(990000) UNION ALL SELECT n+1 FROM codes WHERE n<999999
  )
  SELECT n FROM codes WHERE NOT EXISTS (
    SELECT 1 FROM class_rooms WHERE code=printf('%06d',codes.n)
  ) LIMIT 1
) candidate
WHERE role.role='admin' AND admin.email_verified=1
  AND NOT EXISTS(SELECT 1 FROM class_rooms WHERE id='site-help-room-v1')
ORDER BY admin.created_at,admin.id LIMIT 1;

INSERT INTO site_help_rooms(singleton,room_id)
SELECT 1,id FROM class_rooms WHERE id='site-help-room-v1';
