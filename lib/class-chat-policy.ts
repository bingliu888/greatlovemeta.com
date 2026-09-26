// SmartMeeting v2 Gold private support-chat contract, mapped to site-local tables.
export const CLASS_CHAT_RETENTION_SECONDS=7*24*60*60;

export const SELECT_VISIBLE_CLASS_CHAT_SQL=`SELECT chat.id,
  chat.sender_user_id AS senderUserId, chat.sender_name AS senderName,
  chat.recipient_user_id AS recipientUserId,
  recipient.display_name AS recipientName,
  CASE WHEN chat.sender_user_id=(SELECT host_user_id FROM class_rooms WHERE id=chat.room_id)
    OR EXISTS (SELECT 1 FROM class_cohosts sender_cohost
      WHERE sender_cohost.room_id=chat.room_id AND sender_cohost.user_id=chat.sender_user_id)
    THEN 1 ELSE 0 END AS senderIsSupportAgent,
  chat.body,chat.created_at AS createdAt
  FROM class_chat_messages chat
  LEFT JOIN users recipient ON recipient.id=chat.recipient_user_id
  WHERE chat.room_id=? AND chat.created_at>?
    AND (?=1 OR chat.sender_user_id=? OR chat.recipient_user_id=?)
  ORDER BY chat.created_at DESC,chat.id DESC LIMIT 100`;

export const SELECT_CLASS_SUPPORT_REPLY_TARGET_SQL=`SELECT chat.sender_user_id AS userId
  FROM class_chat_messages chat
  JOIN class_rooms reply_room ON reply_room.id=chat.room_id
  WHERE chat.id=? AND chat.room_id=? AND chat.created_at>?
    AND chat.sender_user_id<>reply_room.host_user_id
    AND NOT EXISTS (SELECT 1 FROM class_cohosts reply_cohost
      WHERE reply_cohost.room_id=chat.room_id AND reply_cohost.user_id=chat.sender_user_id)
  LIMIT 1`;

export function canDeleteClassChatMessage(input:{supportAgent:boolean;userId:string;senderUserId:string}) {
  return input.supportAgent||input.userId===input.senderUserId;
}
