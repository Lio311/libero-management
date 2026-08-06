const { format } = require('date-fns');

const currentDate = new Date(2026, 7, 1); // August 2026
const taskTitle = 'פגישת מלאי';
const isInventoryMeeting = taskTitle.includes('פגישת מלאי');
let taskDate;

if (isInventoryMeeting) {
  let inventoryDay = 15;
  const tempDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 15);
  const dayOfWeek = tempDate.getDay();
  
  if (dayOfWeek === 5) {
    inventoryDay = 14;
  } else if (dayOfWeek === 6) {
    inventoryDay = 16;
  }
  
  taskDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), inventoryDay);
}

if (taskDate.getDay() === 5) {
  taskDate = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate() + 2);
} else if (taskDate.getDay() === 6) {
  taskDate = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate() + 1);
}

console.log(format(taskDate, 'yyyy-MM-dd'));
