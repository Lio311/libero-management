const fs = require('fs');
let code = fs.readFileSync('src/app/calendar-client.tsx', 'utf8');
code = code.replace('  const { isLight } = useBrightness();\nexport default function CalendarPage', 'export default function CalendarPage');
code = code.replace('export default function CalendarPage({ scheduleData, bankTasksData = [] }: CalendarClientProps) {\n', 'export default function CalendarPage({ scheduleData, bankTasksData = [] }: CalendarClientProps) {\n  const { isLight } = useBrightness();\n');
fs.writeFileSync('src/app/calendar-client.tsx', code);
