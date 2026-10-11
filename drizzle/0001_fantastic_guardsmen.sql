CREATE TABLE `character_presets` (
	`id` varchar(64) NOT NULL,
	`ownerToken` varchar(180) NOT NULL,
	`name` varchar(100) NOT NULL,
	`settingsJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `character_presets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `character_projects` (
	`id` varchar(64) NOT NULL,
	`ownerToken` varchar(180) NOT NULL,
	`name` varchar(100) NOT NULL,
	`age` int NOT NULL,
	`identitySeed` varchar(100) NOT NULL,
	`settingsJson` text NOT NULL,
	`adultAttestedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `character_projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `character_renders` (
	`id` varchar(64) NOT NULL,
	`projectId` varchar(64) NOT NULL,
	`ownerToken` varchar(180) NOT NULL,
	`view` enum('front','side','rear','portrait','pose') NOT NULL,
	`status` enum('queued','rendering','complete','failed') NOT NULL DEFAULT 'queued',
	`sourceMode` enum('none','reference','project-anchor') NOT NULL DEFAULT 'none',
	`imageUrl` text,
	`storageKey` varchar(512),
	`mimeType` varchar(100),
	`modelId` varchar(160),
	`transparencyRequested` boolean NOT NULL DEFAULT false,
	`transparentVerified` boolean NOT NULL DEFAULT false,
	`errorMessage` text,
	`provenanceJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `character_renders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `character_versions` (
	`id` varchar(64) NOT NULL,
	`projectId` varchar(64) NOT NULL,
	`ownerToken` varchar(180) NOT NULL,
	`version` int NOT NULL,
	`label` varchar(120) NOT NULL,
	`settingsJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `character_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `export_receipts` (
	`id` varchar(64) NOT NULL,
	`renderId` varchar(64) NOT NULL,
	`projectId` varchar(64) NOT NULL,
	`ownerToken` varchar(180) NOT NULL,
	`rightsConfirmed` boolean NOT NULL,
	`provenanceIncluded` boolean NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `export_receipts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `character_presets_owner_updated_idx` ON `character_presets` (`ownerToken`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `character_projects_owner_updated_idx` ON `character_projects` (`ownerToken`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `character_renders_owner_created_idx` ON `character_renders` (`ownerToken`,`createdAt`);--> statement-breakpoint
CREATE INDEX `character_renders_project_created_idx` ON `character_renders` (`projectId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `character_versions_project_version_idx` ON `character_versions` (`projectId`,`version`);--> statement-breakpoint
CREATE INDEX `character_versions_owner_idx` ON `character_versions` (`ownerToken`);--> statement-breakpoint
CREATE INDEX `export_receipts_owner_created_idx` ON `export_receipts` (`ownerToken`,`createdAt`);