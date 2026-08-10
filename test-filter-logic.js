function getAgeCategory(days) {
  if (days > 90) return { category: "red", label: "מעל 90 יום" };
  if (days >= 45) return { category: "dark_orange", label: "45-90 ימים" };
  if (days >= 30) return { category: "orange", label: "30-45 ימים" };
  if (days >= 14) return { category: "yellow", label: "14-30 ימים" };
  return { category: "green", label: "פחות משבועיים" };
}

let result = [
  { id: 1, ageDays: 50, currentStock: 10, categories: "A" },
  { id: 2, ageDays: 20, currentStock: 10, categories: "B" },
  { id: 3, ageDays: 50, currentStock: 0, categories: "A" }
];

let categoryFilter = "all";
let colorFilter = "dark_orange";
let stockFilter = "in_stock";

if (categoryFilter !== "all") {
  result = result.filter(p => p.categories === categoryFilter);
}
if (colorFilter !== "all") {
  result = result.filter(p => getAgeCategory(p.ageDays).category === colorFilter);
}
if (stockFilter === "in_stock") {
  result = result.filter(p => p.currentStock > 0);
} else if (stockFilter === "out_of_stock") {
  result = result.filter(p => p.currentStock <= 0);
}

console.log(result);
