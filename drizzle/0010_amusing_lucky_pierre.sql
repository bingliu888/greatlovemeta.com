CREATE TABLE `game_redemptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`wallet_address` text NOT NULL,
	`amount` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`requested_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `greatlovemeta_game_redemption_user_idx` ON `game_redemptions` (`user_id`,`requested_at`);--> statement-breakpoint
CREATE INDEX `greatlovemeta_game_redemption_status_idx` ON `game_redemptions` (`status`);--> statement-breakpoint
ALTER TABLE `users` ADD `wallet_address` text;