import re

with open('src/lib/db/schema.ts', 'r') as f:
    content = f.read()

new_tables = """
// Customer Rewards Model Tables

export const rewardBrandRules = pgTable("reward_brand_rules", {
  id: serial("id").primaryKey(),
  keyword: varchar("keyword", { length: 255 }).unique().notNull(), // e.g. "creed", "velour"
  classification: varchar("classification", { length: 50 }).notNull(), // 'house_brand', 'luxury', 'designer_dupe'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orderRewards = pgTable("order_rewards", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  store: varchar("store", { length: 50 }).notNull(), // 'libero', 'velour', 'labura'
  score: integer("score").notNull(),
  customerClass: varchar("customer_class", { length: 50 }).notNull(),
  sampleKit: varchar("sample_kit", { length: 100 }).notNull(),
  gift: varchar("gift", { length: 100 }),
  officialSample: boolean("official_sample").default(false).notNull(),
  calculatedAt: timestamp("calculated_at", { withTimezone: true }).defaultNow().notNull(),
});
"""

# Append to the end of the file
content += "\n" + new_tables

with open('src/lib/db/schema.ts', 'w') as f:
    f.write(content)
