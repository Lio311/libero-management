const currentDate = new Date('2026-08-06T00:00:00Z');

let inventoryDay = 15;
const tempDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 15);
const dayOfWeek = tempDate.getDay();

console.log("tempDate:", tempDate.toString());
console.log("dayOfWeek:", dayOfWeek);

if (dayOfWeek === 5) {
  inventoryDay = 14;
} else if (dayOfWeek === 6) {
  inventoryDay = 16;
}

let taskDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), inventoryDay);
console.log("taskDate before shift:", taskDate.toString());

if (taskDate.getDay() === 5) {
  taskDate = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate() + 2);
} else if (taskDate.getDay() === 6) {
  taskDate = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate() + 1);
}

console.log("taskDate after shift:", taskDate.toString());
