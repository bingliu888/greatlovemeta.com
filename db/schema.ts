import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  preferredLanguage: text("preferred_language").notNull().default("en"),
  walletAddress: text("wallet_address"),
  createdAt: integer("created_at").notNull(),
});

export const userAvatars = sqliteTable("user_avatars", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  objectKey: text("object_key").notNull().unique(),
  mimeType: text("mime_type").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const passwordlessLoginCodes = sqliteTable("passwordless_login_codes", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: integer("expires_at").notNull(),
  attempts: integer("attempts").notNull().default(0),
  usedAt: integer("used_at"),
  createdAt: integer("created_at").notNull(),
}, (table) => [index("greatlovemeta_passwordless_email_idx").on(table.email), index("greatlovemeta_passwordless_expires_idx").on(table.expiresAt)]);

export const passwordResetRequests = sqliteTable("password_reset_requests", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(),
  usedAt: integer("used_at"),
  createdAt: integer("created_at").notNull(),
});

export const referralCodes = sqliteTable("referral_codes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  createdAt: integer("created_at").notNull(),
});

export const referrals = sqliteTable("referrals", {
  id: text("id").primaryKey(),
  referralCodeId: text("referral_code_id").notNull().references(() => referralCodes.id, { onDelete: "cascade" }),
  referredUserId: text("referred_user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  discountPercent: integer("discount_percent").notNull().default(15),
  firstPaymentId: text("first_payment_id").unique(),
  qualifiedAt: integer("qualified_at"),
  rewardedAt: integer("rewarded_at"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [index("greatlovemeta_referrals_code_idx").on(table.referralCodeId), index("greatlovemeta_referrals_status_idx").on(table.status)]);

export const referralMedia = sqliteTable("referral_media", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  objectKey: text("object_key").notNull().unique(),
  mimeType: text("mime_type").notNull(),
  name: text("name").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: integer("created_at").notNull(),
}, (table) => [index("greatlovemeta_referral_media_user_created_idx").on(table.userId, table.createdAt)]);

export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  paypalSubscriptionId: text("paypal_subscription_id").unique(),
  paypalPlanId: text("paypal_plan_id"),
  cadence: text("cadence").notNull(),
  status: text("status").notNull().default("pending"),
  trialEndsAt: integer("trial_ends_at"),
  currentPeriodEndsAt: integer("current_period_ends_at"),
  cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" }).notNull().default(false),
  referralId: text("referral_id").references(() => referrals.id, { onDelete: "set null" }),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [index("greatlovemeta_subscriptions_status_idx").on(table.status)]);

export const rewardLedger = sqliteTable("reward_ledger", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  points: integer("points").notNull(),
  reason: text("reason").notNull(),
  reference: text("reference").notNull().unique(),
  createdAt: integer("created_at").notNull(),
}, (table) => [index("greatlovemeta_reward_user_idx").on(table.userId)]);

export const liveVoiceUsage = sqliteTable("live_voice_usage", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  usageDate: text("usage_date").notNull(),
  usedSeconds: integer("used_seconds").notNull().default(0),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [index("greatlovemeta_live_voice_user_date_idx").on(table.userId, table.usageDate)]);

export const paymentWebhookEvents = sqliteTable("payment_webhook_events", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(),
  processedAt: integer("processed_at").notNull(),
});

export const notificationPreferences = sqliteTable("notification_preferences", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  language: text("language").notNull().default("en"),
  marketingEmail: integer("marketing_email", { mode: "boolean" }).notNull().default(false),
  productEmail: integer("product_email", { mode: "boolean" }).notNull().default(true),
  reminderEmail: integer("reminder_email", { mode: "boolean" }).notNull().default(true),
  updatedAt: integer("updated_at").notNull(),
});

export const communityTopics = sqliteTable("community_topics", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: text("category").notNull().default("general"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [index("greatlovemeta_community_topic_updated_idx").on(table.updatedAt), index("greatlovemeta_community_topic_category_idx").on(table.category)]);

export const communityReplies = sqliteTable("community_replies", {
  id: text("id").primaryKey(),
  topicId: text("topic_id").notNull().references(() => communityTopics.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: integer("created_at").notNull(),
}, (table) => [index("greatlovemeta_community_reply_topic_idx").on(table.topicId), index("greatlovemeta_community_reply_created_idx").on(table.createdAt)]);

export const editorialDocuments = sqliteTable("editorial_documents", {
  kind: text("kind").primaryKey(),
  editionDate: text("edition_date").notNull(),
  payload: text("payload").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const messageThreads = sqliteTable("message_threads", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull().default("direct"),
  subject: text("subject").notNull().default(""),
  createdBy: text("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [index("greatlovemeta_message_threads_updated_idx").on(table.updatedAt)]);

export const messageParticipants = sqliteTable("message_participants", {
  id: text("id").primaryKey(),
  threadId: text("thread_id").notNull().references(() => messageThreads.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lastReadAt: integer("last_read_at").notNull().default(0),
  deletedAt: integer("deleted_at"),
}, (table) => [index("greatlovemeta_message_participant_user_idx").on(table.userId), index("greatlovemeta_message_participant_thread_idx").on(table.threadId)]);

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  threadId: text("thread_id").notNull().references(() => messageThreads.id, { onDelete: "cascade" }),
  senderId: text("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: integer("created_at").notNull(),
  deletedAt: integer("deleted_at"),
}, (table) => [index("greatlovemeta_messages_thread_created_idx").on(table.threadId, table.createdAt)]);

export const userPresence = sqliteTable("user_presence", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  lastSeenAt: integer("last_seen_at").notNull(),
});

export const gameDailyLogs = sqliteTable("game_daily_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  gameKey: text("game_key").notNull(),
  playDate: text("play_date").notNull(),
  rawScore: integer("raw_score").notNull(),
  score: integer("score").notNull(),
  unit: text("unit").notNull().default("GLC"),
  attemptId: text("attempt_id").notNull().unique(),
  createdAt: integer("created_at").notNull(),
}, (table) => [
  index("greatlovemeta_game_log_user_date_idx").on(table.userId, table.playDate),
  index("greatlovemeta_game_log_user_created_idx").on(table.userId, table.createdAt),
]);

export const gameRedemptions = sqliteTable("game_redemptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  walletAddress: text("wallet_address").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"),
  requestedAt: integer("requested_at").notNull(),
}, (table) => [
  index("greatlovemeta_game_redemption_user_idx").on(table.userId, table.requestedAt),
  index("greatlovemeta_game_redemption_status_idx").on(table.status),
]);
