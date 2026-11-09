CREATE TABLE `app_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text
);
--> statement-breakpoint
CREATE TABLE `crop_fertilization_stages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`crop_catalog_id` integer NOT NULL,
	`stage_order` integer NOT NULL,
	`stage_name` text NOT NULL,
	`fertilizer` text,
	`day_offset` integer NOT NULL,
	`is_recurring` integer NOT NULL,
	`interval_days` integer,
	`repeat_until_harvest` integer NOT NULL,
	FOREIGN KEY (`crop_catalog_id`) REFERENCES `crops_catalog`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `crops` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`catalog_id` integer NOT NULL,
	`block` text NOT NULL,
	`quantity` integer NOT NULL,
	`planting_date` text NOT NULL,
	`created_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`catalog_id`) REFERENCES `crops_catalog`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_crops_deleted_at` ON `crops` (`deleted_at`);--> statement-breakpoint
CREATE TABLE `crops_catalog` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`english_name` text NOT NULL,
	`filipino_name` text,
	`scientific_name` text,
	`days_to_maturity` integer NOT NULL,
	`is_one_time_harvest` integer NOT NULL,
	`harvest_interval` integer,
	`yield_per_plant` real,
	`unit` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`crop_id` integer NOT NULL,
	`units_yield` real NOT NULL,
	`price_per_unit` real NOT NULL,
	`sale_date` text NOT NULL,
	FOREIGN KEY (`crop_id`) REFERENCES `crops`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_sales_date` ON `sales` (`sale_date`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`crop_id` integer,
	`stage_id` integer,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`source` text NOT NULL,
	`block` text,
	`scheduled_date` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`crop_id`) REFERENCES `crops`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`stage_id`) REFERENCES `crop_fertilization_stages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_tasks_date_status` ON `tasks` (`scheduled_date`,`status`);--> statement-breakpoint
CREATE INDEX `idx_tasks_crop` ON `tasks` (`crop_id`);