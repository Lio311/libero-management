CREATE TABLE "labura_orders" (
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
CREATE TABLE "labura_products" (
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
CREATE TABLE "monthly_tier_samples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"month_year" varchar(7) NOT NULL,
	"tier" integer NOT NULL,
	"samples" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_rewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"store" varchar(50) NOT NULL,
	"score" integer NOT NULL,
	"customer_class" varchar(50) NOT NULL,
	"sample_kit" varchar(100) NOT NULL,
	"gift" varchar(100),
	"official_sample" boolean DEFAULT false NOT NULL,
	"requires_manager_review" boolean DEFAULT false NOT NULL,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "print_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"store" varchar(50) NOT NULL,
	"order_ids" jsonb NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reward_brand_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"keyword" varchar(255) NOT NULL,
	"classification" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reward_brand_rules_keyword_unique" UNIQUE("keyword")
);
