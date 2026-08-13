import { db } from "./src/lib/db";
import { laburaInventoryCounts } from "./src/lib/db/schema";
import { sql } from "drizzle-orm";

const items = [
  { displayOrder: 1, butterName: "350ml ORLEAN BODY BUTTER חמאת גוף אורליאן" },
  { displayOrder: 2, butterName: "350ml BIANCA BODY BUTTER חמאת גוף ביאנקה" },
  { displayOrder: 3, butterName: "350ml DOLOMYA BODY BUTTER חמאת גוף דולומיה" },
  { displayOrder: 4, butterName: "350ml HESTER BODY BUTTER חמאת גוף הסטר" },
  { displayOrder: 5, butterName: "350ml VALENTINA BODY BUTTER חמאת גוף ולנטינה" },
  { displayOrder: 6, butterName: "350ml LUNA BODY BUTTER חמאת גוף לונה" },
  { displayOrder: 7, butterName: "350ml MICHAELA BODY BUTTER חמאת גוף מיקאלה" },
  { displayOrder: 8, butterName: "350ml SELESTIALE BODY BUTTER חמאת גוף סלסטיאלה" },
  { displayOrder: 9, butterName: "350ml SANTORINA BODY BUTTER חמאת גוף סנטורינה" },
  { displayOrder: 10, butterName: "350ml CENTIERO BODY BUTTER חמאת גוף סנטיירו" },
  { displayOrder: 11, butterName: "350ml CAMILLA BODY BUTTER חמאת גוף קמילה" },
];

async function seed() {
  console.log("Seeding labura inventory counts...");
  try {
    // Check if table is already seeded
    const existing = await db.select({ count: sql<number>`count(*)` }).from(laburaInventoryCounts);
    if (existing[0].count > 0) {
      console.log("Table is already seeded. Exiting.");
      process.exit(0);
    }

    for (const item of items) {
      await db.insert(laburaInventoryCounts).values(item);
    }
    console.log("Seeding complete.");
  } catch (error) {
    console.error("Error seeding:", error);
  }
  process.exit(0);
}

seed();
