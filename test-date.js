const dates = [
  "2026-08-16 16:30:17",
  "16-08-2026 16:30:17",
  "16/08/2026 16:30:17",
  "08/16/2026 16:30:17"
];
for (const d of dates) {
  console.log(d, "->", new Date(d));
}
