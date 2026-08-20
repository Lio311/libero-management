import { db } from "../src/lib/db";
import { rewardBrandRules } from "../src/lib/db/schema";

async function main() {
  const rules = [
    { keyword: "ליברו", classification: "house_brand" },
    { keyword: "libero", classification: "house_brand" },
    { keyword: "וולור", classification: "house_brand" },
    { keyword: "velour", classification: "house_brand" },
    { keyword: "לה בורה", classification: "house_brand" },
    { keyword: "labura", classification: "house_brand" },
    { keyword: "creed", classification: "luxury" },
    { keyword: "קריד", classification: "luxury" },
    { keyword: "roja", classification: "luxury" },
    { keyword: "רוז'ה", classification: "luxury" },
    { keyword: "xerjoff", classification: "luxury" },
    { keyword: "סרג'וף", classification: "luxury" },
  ];

  console.log("Seeding reward brand rules...");
  
  for (const rule of rules) {
    try {
      await db.insert(rewardBrandRules).values(rule).onConflictDoNothing();
      console.log(`Inserted rule: ${rule.keyword} -> ${rule.classification}`);
    } catch (error) {
      console.error(`Failed to insert rule ${rule.keyword}:`, error);
    }
  }

  console.log("Done seeding.");
  process.exit(0);
}

main();
