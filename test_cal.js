const { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek, isBefore, startOfDay, differenceInMonths, isValid } = require('date-fns');

let currentDate = new Date(2026, 9, 1); // October 2026
let taskDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 2); // Oct 2nd is Friday

if (taskDate.getDay() === 5) {
  taskDate = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate() + 2);
}
console.log("Friday task shifted to:", taskDate); // Should be Oct 4 (Sunday)

// Let's test the monthly summary
let lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Last day of month
while (lastDay.getDay() === 5 || lastDay.getDay() === 6) {
  lastDay = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate() - 1);
}
console.log("Last day of Oct (31 is Sat) shifted to:", lastDay); // Should be Oct 29 (Thu)

