import re

with open('src/app/actions/scanner-actions.ts', 'r') as f:
    content = f.read()

# Fix imports
content = content.replace('import { calculateReward, RewardOutput } from "@/lib/reward-engine";', 'import { getOrCalculateOrderReward, RewardOutput } from "@/lib/reward-engine";')

# Fix usage in getOrderById
old_usage = "const reward = calculateReward(order, history);"
new_usage = "const reward = await getOrCalculateOrderReward(order, store, history);"

content = content.replace(old_usage, new_usage)

with open('src/app/actions/scanner-actions.ts', 'w') as f:
    f.write(content)
