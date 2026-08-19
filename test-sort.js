const arr = [
  { id: 1, d: "16-08-2026 16:30:17" },
  { id: 2, d: "15-08-2026 16:30:17" },
  { id: 3, d: "17-08-2026 16:30:17" }
];
arr.sort((a, b) => new Date(b.d).getTime() - new Date(a.d).getTime());
console.log(arr);
