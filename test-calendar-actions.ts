import { createBankOfTaskAction } from "./src/app/actions/bankOfTasks";

async function main() {
  const result = await createBankOfTaskAction({
    taskName: "Test Task from Script",
    dueDate: "05.08.2026",
    status: "לא התחיל"
  });
  console.log("Result:", result);
}
main();
