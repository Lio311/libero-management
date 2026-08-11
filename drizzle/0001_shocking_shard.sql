CREATE TABLE "price_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"woo_product_id" integer NOT NULL,
	"product_name" text NOT NULL,
	"old_price" numeric,
	"new_price" numeric,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
