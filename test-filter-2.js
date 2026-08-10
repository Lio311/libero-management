const processedProducts = [
  { id: '1', productName: 'a', catStr: 'shoes, shirts', ageDays: 10, currentStock: 5 }, // green, in_stock
  { id: '2', productName: 'b', catStr: 'shoes', ageDays: 40, currentStock: 0 }, // orange, out_of_stock
  { id: '3', productName: 'c', catStr: 'pants', ageDays: 100, currentStock: 10 } // red, in_stock
];

function getAgeCategory(days) {
  if (days > 90) return { category: "red" };
  if (days >= 45) return { category: "dark_orange" };
  if (days >= 30) return { category: "orange" };
  if (days >= 14) return { category: "yellow" };
  return { category: "green" };
}

let result = [...processedProducts];

const categoryFilter = ['shoes', 'pants'];
const colorFilter = ['green', 'red'];
const stockFilter = ['in_stock'];

if (categoryFilter.length > 0) {
  result = result.filter(p => {
    if (!p.catStr) return false;
    const pCats = p.catStr.split(',').map(c => c.trim());
    return pCats.some(c => categoryFilter.includes(c));
  });
}
if (colorFilter.length > 0) {
  result = result.filter(p => colorFilter.includes(getAgeCategory(p.ageDays).category));
}
if (stockFilter.length > 0) {
  result = result.filter(p => {
    const inStock = p.currentStock > 0;
    if (inStock && stockFilter.includes("in_stock")) return true;
    if (!inStock && stockFilter.includes("out_of_stock")) return true;
    return false;
  });
}
result.sort((a, b) => a.productName.localeCompare(b.productName));

console.log('Result length:', result.length); // should be 2
console.log('Results:', result.map(p => p.id));
