const products = [
  { id: '1', categories: 'shoes, shirts', ageDays: 10, currentStock: 5 }, // green, in_stock
  { id: '2', categories: 'shoes', ageDays: 40, currentStock: 0 }, // orange, out_of_stock
  { id: '3', categories: 'pants', ageDays: 100, currentStock: 10 } // red, in_stock
];

function getAgeCategory(days) {
  if (days > 90) return { category: "red" };
  if (days >= 45) return { category: "dark_orange" };
  if (days >= 30) return { category: "orange" };
  if (days >= 14) return { category: "yellow" };
  return { category: "green" };
}

let result = products.map(p => ({ ...p, catStr: p.categories }));

// Test categoryFilter
const categoryFilter = ['shoes', 'pants'];
if (categoryFilter.length > 0) {
  result = result.filter(p => {
    if (!p.catStr) return false;
    const pCats = p.catStr.split(',').map(c => c.trim());
    return pCats.some(c => categoryFilter.includes(c));
  });
}
console.log('After category:', result.length); // should be 3

// Test colorFilter
const colorFilter = ['green', 'red'];
if (colorFilter.length > 0) {
  result = result.filter(p => colorFilter.includes(getAgeCategory(p.ageDays).category));
}
console.log('After color:', result.length); // should be 2 (shoes, shirts / pants)

// Test stockFilter
const stockFilter = ['in_stock'];
if (stockFilter.length > 0) {
  result = result.filter(p => {
    const inStock = p.currentStock > 0;
    if (inStock && stockFilter.includes("in_stock")) return true;
    if (!inStock && stockFilter.includes("out_of_stock")) return true;
    return false;
  });
}
console.log('After stock:', result.length); // should be 2

