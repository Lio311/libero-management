CREATE TABLE "bank_of_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignee" varchar(255),
	"status" varchar(50),
	"task_name" text,
	"due_date" varchar(100),
	"item_index" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bonus_employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"full_name" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bonus_employees_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "bonuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"sale_date" date DEFAULT now() NOT NULL,
	"amount" numeric DEFAULT '0' NOT NULL,
	"invoice_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(20) NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "china_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"products" text,
	"arrival_date" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "credit_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_company" varchar(100),
	"bank" varchar(100),
	"credit_limit" numeric,
	"card_number" varchar(50),
	"expiration" varchar(50),
	"cvv" varchar(10),
	"card_type" varchar(100),
	"billing_date" varchar(10)
);
--> statement-breakpoint
CREATE TABLE "generated_shipping_labels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" text,
	"customer_id" text,
	"customer_name" text,
	"label_url" text,
	"tracking_url" text,
	"barcode" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand" varchar(255),
	"order_amount_foreign" numeric,
	"order_amount_nis" numeric,
	"vat" numeric,
	"shipping_cost" numeric
);
--> statement-breakpoint
CREATE TABLE "influencer_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"influencer_name" varchar(255),
	"amount" numeric,
	"is_done" varchar(50),
	"notes" text,
	"payment_month" varchar(20),
	"base_salary" numeric,
	"influencer_id" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "influencers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand" varchar(255),
	"is_paid" varchar(50),
	"video_count" varchar(50),
	"post_count" varchar(50),
	"activities" text,
	"influencer_name" varchar(255),
	"products_given" text,
	"videos_uploaded" text,
	"notes" text,
	"payment_month" varchar(20),
	"base_salary" numeric,
	"influencer_id" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand" varchar(255),
	"model_name" varchar(255),
	"item_index" integer,
	"cost_price" numeric,
	"target_stock_level" numeric,
	"ordered_quantity" integer,
	"last_order_quantity" integer,
	"current_stock" numeric
);
--> statement-breakpoint
CREATE TABLE "monthly_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_number" integer,
	"task" text,
	"status" varchar(50) DEFAULT 'לא התחיל',
	"last_completed_date" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "qc_inspections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"inspected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"inspected_by" text
);
--> statement-breakpoint
CREATE TABLE "qc_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"woo_product_id" integer NOT NULL,
	"product_name" text NOT NULL,
	"product_sku" text,
	"product_image" text,
	"notes" text,
	"price_status" text,
	"price_status_date" timestamp with time zone,
	"date_added_to_site" timestamp with time zone,
	"last_restock_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "qc_products_woo_product_id_unique" UNIQUE("woo_product_id")
);
--> statement-breakpoint
CREATE TABLE "qc_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"report_date" date NOT NULL,
	"total_inspected" integer NOT NULL,
	"report_data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_holders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100),
	"role" text
);
--> statement-breakpoint
CREATE TABLE "scanned_wholesale_products" (
	"id" integer PRIMARY KEY NOT NULL,
	"product_name" text NOT NULL,
	"brand" text,
	"img" text,
	"price" numeric,
	"stock" text,
	"scanned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(255) NOT NULL,
	"value" text,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_name" varchar(255),
	"inventory_status" varchar(255),
	"planning_status" varchar(255),
	"contact_status" varchar(255),
	"notes" text,
	"payment_month" varchar(20)
);
--> statement-breakpoint
CREATE TABLE "task_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"due_date" date NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"category_id" uuid NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurrence_day" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_task_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_task_id" uuid NOT NULL,
	"target_task_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignee" varchar(255) NOT NULL,
	"task_description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wc_orders" (
	"id" integer PRIMARY KEY NOT NULL,
	"total" numeric,
	"customer_id" integer,
	"date_created" timestamp with time zone,
	"status" varchar(50),
	"line_items" jsonb,
	"billing" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wc_products" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sku" text,
	"price" numeric,
	"stock_quantity" integer,
	"date_created" timestamp with time zone,
	"status" varchar(50),
	"categories" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wholesale_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_name" varchar(255),
	"city" varchar(255),
	"address" varchar(255),
	"phone_call" varchar(50),
	"visit" varchar(50),
	"potential" varchar(50),
	"interest" varchar(50),
	"notes" text,
	"payment_month" varchar(20),
	"last_order_date" varchar(100),
	"total_amount_nis" numeric
);
--> statement-breakpoint
ALTER TABLE "bonuses" ADD CONSTRAINT "bonuses_employee_id_bonus_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."bonus_employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_inspections" ADD CONSTRAINT "qc_inspections_product_id_qc_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."qc_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_instances" ADD CONSTRAINT "task_instances_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_task_connections" ADD CONSTRAINT "team_task_connections_source_task_id_team_tasks_id_fk" FOREIGN KEY ("source_task_id") REFERENCES "public"."team_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_task_connections" ADD CONSTRAINT "team_task_connections_target_task_id_team_tasks_id_fk" FOREIGN KEY ("target_task_id") REFERENCES "public"."team_tasks"("id") ON DELETE no action ON UPDATE no action;