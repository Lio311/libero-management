import re

with open('src/app/calendar-client.tsx', 'r') as f:
    content = f.read()

target = """           if (task.status !== 'בוצע' && isBefore(parsedDate, today)) {
              renderDate = today;
              isDelayed = true;
              delayMonths = differenceInMonths(today, parsedDate);
           }"""

replacement = """           if (task.status !== 'בוצע' && isBefore(parsedDate, today)) {
              renderDate = today;
              isDelayed = true;
              delayMonths = differenceInMonths(today, parsedDate);
           }
           
           if (renderDate.getDay() === 5) {
             renderDate = new Date(renderDate.getFullYear(), renderDate.getMonth(), renderDate.getDate() + 2);
           }"""

content = content.replace(target, replacement)

with open('src/app/calendar-client.tsx', 'w') as f:
    f.write(content)
