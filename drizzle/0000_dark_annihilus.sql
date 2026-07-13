CREATE TABLE `status_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vehicle_id` integer NOT NULL,
	`previous_status` text,
	`new_status` text NOT NULL,
	`reason` text,
	`changed_by` text DEFAULT 'administrativo' NOT NULL,
	`changed_at` integer NOT NULL,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`brand` text NOT NULL,
	`model` text NOT NULL,
	`year` text NOT NULL,
	`mileage` integer NOT NULL,
	`plate` text NOT NULL,
	`status` text DEFAULT 'cadastrado' NOT NULL,
	`damages` text DEFAULT '[]' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`photo_url` text,
	`color` text DEFAULT '#69706f' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vehicles_plate_unique` ON `vehicles` (`plate`);
--> statement-breakpoint
INSERT INTO `vehicles` (`brand`,`model`,`year`,`mileage`,`plate`,`status`,`damages`,`notes`,`color`,`created_at`,`updated_at`) VALUES
('Chevrolet','Onix 1.0 Turbo LTZ','2022/2023',18450,'SFP2A34','disponivel','["Arranhão leve no para-choque traseiro"]','Único dono, IPVA pago e chave reserva.','#252b30',strftime('%s','now'),strftime('%s','now')),
('Volkswagen','T-Cross 250 TSI Highline','2021/2022',26780,'RHT5B67','reservado','["Pequeno amassado na porta dianteira direita"]','Revisões realizadas na concessionária.','#e5e5df',strftime('%s','now'),strftime('%s','now')),
('Hyundai','HB20 1.0 Comfort Plus','2020/2021',34120,'QWE7C18','disponivel','[]','Pneus novos e manual do proprietário.','#9ba0a2',strftime('%s','now'),strftime('%s','now')),
('Toyota','Corolla 2.0 XEi','2019/2020',41560,'GHI9D21','vendido','["Marca superficial na roda traseira"]','Laudo cautelar aprovado.','#f1f2f2',strftime('%s','now'),strftime('%s','now')),
('Jeep','Compass 2.0 Longitude','2022/2023',15300,'JKL3E45','disponivel','["Risco pequeno na tampa do porta-malas"]','Garantia de fábrica vigente.','#5f6665',strftime('%s','now'),strftime('%s','now'));
