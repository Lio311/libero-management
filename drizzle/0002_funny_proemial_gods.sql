CREATE TABLE "labura_inventory_counts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"butter_name" text NOT NULL,
	"finished_product_units" integer DEFAULT 0 NOT NULL,
	"carton_packages" integer DEFAULT 0 NOT NULL,
	"cartons_to_order" integer DEFAULT 0 NOT NULL,
	"body_butters_to_order" integer DEFAULT 0 NOT NULL,
	"stickers" integer DEFAULT 0 NOT NULL,
	"small_stickers_for_samples" integer DEFAULT 0 NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"factory_name" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"employee_name" text NOT NULL,
	"department" text NOT NULL,
	"start_time" text,
	"end_time" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "velour_orders" (
	"id" integer PRIMARY KEY NOT NULL,
	"total" numeric,
	"customer_id" integer,
	"date_created" timestamp with time zone,
	"status" varchar(50),
	"line_items" jsonb,
	"shipping_lines" jsonb,
	"billing" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "velour_products" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"sku" varchar(100),
	"price" numeric,
	"stock_quantity" integer,
	"date_created" timestamp with time zone,
	"status" varchar(50),
	"categories" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "influencer_payments" ADD COLUMN "base_libero" numeric;--> statement-breakpoint
ALTER TABLE "influencer_payments" ADD COLUMN "base_velour" numeric;--> statement-breakpoint
ALTER TABLE "influencer_payments" ADD COLUMN "base_labura" numeric;--> statement-breakpoint
ALTER TABLE "influencers" ADD COLUMN "base_libero" numeric;--> statement-breakpoint
ALTER TABLE "influencers" ADD COLUMN "base_velour" numeric;--> statement-breakpoint
ALTER TABLE "influencers" ADD COLUMN "base_labura" numeric;--> statement-breakpoint
ALTER TABLE "wc_orders" ADD COLUMN "shipping_lines" jsonb;