CREATE TABLE "customer_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_key" varchar(255) NOT NULL,
	"is_vip" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_flags_customer_key_unique" UNIQUE("customer_key")
);
--> statement-breakpoint
CREATE TABLE "manual_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"city" varchar(255),
	"address" varchar(500),
	"notes" text,
	"is_vip" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pending_regular_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" integer NOT NULL,
	"product_name" text NOT NULL,
	"brand" text,
	"price" text,
	"old_price" text,
	"stock" text,
	"dt_created" text,
	"type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "influencer_payments" ADD COLUMN "monthly_bonus" numeric;--> statement-breakpoint
ALTER TABLE "influencer_payments" ADD COLUMN "coupon_rates" jsonb;--> statement-breakpoint
ALTER TABLE "labura_orders" ADD COLUMN "customer_note" text;--> statement-breakpoint
ALTER TABLE "print_jobs" ADD COLUMN "job_type" varchar(50) DEFAULT 'mini-perfume' NOT NULL;--> statement-breakpoint
ALTER TABLE "print_jobs" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD COLUMN "job_type" varchar(50) DEFAULT 'mini-perfume' NOT NULL;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "job_type" varchar(50) DEFAULT 'mini-perfume' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "velour_orders" ADD COLUMN "customer_note" text;--> statement-breakpoint
ALTER TABLE "wc_orders" ADD COLUMN "customer_note" text;