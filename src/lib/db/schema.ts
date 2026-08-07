import { pgTable, uuid, varchar, text, boolean, integer, timestamp, date, decimal, serial, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).unique().notNull(),
  color: varchar("color", { length: 20 }).notNull(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  tasks: many(tasks),
}));

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  categoryId: uuid("category_id").references(() => categories.id).notNull(),
  isRecurring: boolean("is_recurring").default(false).notNull(),
  recurrenceDay: integer("recurrence_day"), // 1-31
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  category: one(categories, {
    fields: [tasks.categoryId],
    references: [categories.id],
  }),
  instances: many(taskInstances),
}));

export const taskInstances = pgTable("task_instances", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id").references(() => tasks.id).notNull(),
  dueDate: date("due_date").notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
});

export const taskInstancesRelations = relations(taskInstances, ({ one }) => ({
  task: one(tasks, {
    fields: [taskInstances.taskId],
    references: [tasks.id],
  }),
}));

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  endpoint: text("endpoint").unique().notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inventoryItems = pgTable("inventory_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  brand: varchar("brand", { length: 255 }),
  modelName: varchar("model_name", { length: 255 }),
  itemIndex: integer("item_index"),
  costPrice: decimal("cost_price"),
  targetStockLevel: decimal("target_stock_level"),
  orderedQuantity: integer("ordered_quantity"),
  lastOrderQuantity: integer("last_order_quantity"),
  currentStock: decimal("current_stock"),
});

export const teamTasks = pgTable("team_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  assignee: varchar("assignee", { length: 255 }).notNull(),
  taskDescription: text("task_description").notNull(),
});

export const teamTaskConnections = pgTable("team_task_connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceTaskId: uuid("source_task_id").references(() => teamTasks.id).notNull(),
  targetTaskId: uuid("target_task_id").references(() => teamTasks.id).notNull(),
});

// NEW TABLES FOR EXCEL INTEGRATION

export const importPayments = pgTable("import_payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  brand: varchar("brand", { length: 255 }),
  orderAmountForeign: decimal("order_amount_foreign"),
  orderAmountNis: decimal("order_amount_nis"),
  vat: decimal("vat"),
  shippingCost: decimal("shipping_cost"),
});

export const creditCards = pgTable("credit_cards", {
  id: uuid("id").defaultRandom().primaryKey(),
  cardCompany: varchar("card_company", { length: 100 }),
  bank: varchar("bank", { length: 100 }),
  creditLimit: decimal("credit_limit"),
  cardNumber: varchar("card_number", { length: 50 }),
  expiration: varchar("expiration", { length: 50 }),
  cvv: varchar("cvv", { length: 10 }),
  cardType: varchar("card_type", { length: 100 }), // עסקי / פרטי
  billingDate: varchar("billing_date", { length: 10 }),
});

export const chinaOrders = pgTable("china_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  products: text("products"),
  arrivalDate: varchar("arrival_date", { length: 100 }),
});

export const suppliers = pgTable("suppliers", {
  id: uuid("id").defaultRandom().primaryKey(),
  brandName: varchar("brand_name", { length: 255 }),
  inventoryStatus: varchar("inventory_status", { length: 255 }),
  planningStatus: varchar("planning_status", { length: 255 }),
  contactStatus: varchar("contact_status", { length: 255 }),
  notes: text("notes"),
  paymentMonth: varchar("payment_month", { length: 20 }),
});

export const influencers = pgTable("influencers", {
  id: uuid("id").defaultRandom().primaryKey(),
  brand: varchar("brand", { length: 255 }),
  isPaid: varchar("is_paid", { length: 50 }),
  videoCount: varchar("video_count", { length: 50 }),
  postCount: varchar("post_count", { length: 50 }),
  activities: text("activities"),
  influencerName: varchar("influencer_name", { length: 255 }),
  productsGiven: text("products_given"),
  videosUploaded: text("videos_uploaded"),
  notes: text("notes"),
  paymentMonth: varchar("payment_month", { length: 20 }),
  baseSalary: decimal("base_salary"),
  influencerId: varchar("influencer_id", { length: 255 }),
});

export const influencerPayments = pgTable("influencer_payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  influencerName: varchar("influencer_name", { length: 255 }),
  amount: decimal("amount"),
  isDone: varchar("is_done", { length: 50 }),
  notes: text("notes"),
  paymentMonth: varchar("payment_month", { length: 20 }),
  baseSalary: decimal("base_salary"),
  influencerId: varchar("influencer_id", { length: 255 }),
});

export const wholesaleCustomers = pgTable("wholesale_customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeName: varchar("store_name", { length: 255 }),
  city: varchar("city", { length: 255 }),
  address: varchar("address", { length: 255 }),
  phoneCall: varchar("phone_call", { length: 50 }),
  visit: varchar("visit", { length: 50 }),
  potential: varchar("potential", { length: 50 }),
  interest: varchar("interest", { length: 50 }),
  notes: text("notes"),
  paymentMonth: varchar("payment_month", { length: 20 }),
  lastOrderDate: varchar("last_order_date", { length: 100 }),
  totalAmountNis: decimal("total_amount_nis"),
});

export const roleHolders = pgTable("role_holders", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }),
  role: text("role"),
});

export const monthlySchedule = pgTable("monthly_schedule", {
  id: uuid("id").defaultRandom().primaryKey(),
  weekNumber: integer("week_number"),
  task: text("task"),
  status: varchar("status", { length: 50 }).default("לא התחיל"),
  lastCompletedDate: varchar("last_completed_date", { length: 100 }),
});

export const bankOfTasks = pgTable("bank_of_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  assignee: varchar("assignee", { length: 255 }),
  status: varchar("status", { length: 50 }),
  taskName: text("task_name"),
  dueDate: varchar("due_date", { length: 100 }),
  itemIndex: integer("item_index"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: varchar("key", { length: 255 }).unique().notNull(),
  value: text("value"),
});

export const bonusEmployees = pgTable("bonus_employees", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  fullName: text("full_name").notNull(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const bonuses = pgTable("bonuses", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => bonusEmployees.id, { onDelete: 'cascade' }),
  saleDate: date("sale_date").defaultNow().notNull(),
  amount: decimal("amount").default('0').notNull(),
  invoiceUrl: text("invoice_url"),
  status: text("status", { enum: ['pending', 'approved', 'paid'] }).default('pending').notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const bonusEmployeesRelations = relations(bonusEmployees, ({ many }) => ({
  bonuses: many(bonuses),
}));

export const bonusesRelations = relations(bonuses, ({ one }) => ({
  employee: one(bonusEmployees, {
    fields: [bonuses.employeeId],
    references: [bonusEmployees.id],
  }),
}));

// QC (Quality Control) Tables
export const qcProducts = pgTable("qc_products", {
  id: uuid("id").defaultRandom().primaryKey(),
  wooProductId: integer("woo_product_id").unique().notNull(),
  productName: text("product_name").notNull(),
  productSku: text("product_sku"),
  productImage: text("product_image"),
  notes: text("notes"),
  priceStatus: text("price_status"),
  priceStatusDate: timestamp("price_status_date", { withTimezone: true }),
  dateAddedToSite: timestamp("date_added_to_site", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const qcInspections = pgTable("qc_inspections", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").references(() => qcProducts.id, { onDelete: 'cascade' }).notNull(),
  inspectedAt: timestamp("inspected_at", { withTimezone: true }).defaultNow().notNull(),
  inspectedBy: text("inspected_by"),
});

export const qcProductsRelations = relations(qcProducts, ({ many }) => ({
  inspections: many(qcInspections),
}));

export const qcInspectionsRelations = relations(qcInspections, ({ one }) => ({
  product: one(qcProducts, {
    fields: [qcInspections.productId],
    references: [qcProducts.id],
  }),
}));

// Cached WooCommerce Data for fast dashboard rendering
export const wcProducts = pgTable("wc_products", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku"),
  price: decimal("price"),
  stockQuantity: integer("stock_quantity"),
  dateCreated: timestamp("date_created", { withTimezone: true }),
  status: varchar("status", { length: 50 }),
  categories: jsonb("categories"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const wcOrders = pgTable("wc_orders", {
  id: integer("id").primaryKey(),
  total: decimal("total"),
  customerId: integer("customer_id"),
  dateCreated: timestamp("date_created", { withTimezone: true }),
  status: varchar("status", { length: 50 }),
  lineItems: jsonb("line_items"),
  billing: jsonb("billing"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
