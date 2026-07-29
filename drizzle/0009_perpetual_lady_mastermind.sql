CREATE TABLE `game_daily_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`game_key` text NOT NULL,
	`play_date` text NOT NULL,
	`raw_score` integer NOT NULL,
	`score` integer NOT NULL,
	`unit` text DEFAULT 'GLC' NOT NULL,
	`attempt_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_daily_logs_attempt_id_unique` ON `game_daily_logs` (`attempt_id`);--> statement-breakpoint
CREATE INDEX `greatlovemeta_game_log_user_date_idx` ON `game_daily_logs` (`user_id`,`play_date`);--> statement-breakpoint
CREATE INDEX `greatlovemeta_game_log_user_created_idx` ON `game_daily_logs` (`user_id`,`created_at`);