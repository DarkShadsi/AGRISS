PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_crops` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`catalog_id` integer,
	`custom_name` text,
	`block` text NOT NULL,
	`quantity` integer NOT NULL,
	`planting_date` text NOT NULL,
	`created_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`catalog_id`) REFERENCES `crops_catalog`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_crops`("id", "catalog_id", "custom_name", "block", "quantity", "planting_date", "created_at", "deleted_at") SELECT "id", "catalog_id", "custom_name", "block", "quantity", "planting_date", "created_at", "deleted_at" FROM `crops`;--> statement-breakpoint
DROP TABLE `crops`;--> statement-breakpoint
ALTER TABLE `__new_crops` RENAME TO `crops`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_crops_deleted_at` ON `crops` (`deleted_at`);