import json

with open('vercel.json', 'r') as f:
    data = json.load(f)

if 'crons' not in data:
    data['crons'] = []

# check if it already exists
exists = any(c.get('path') == '/api/cron/calculate-rewards' for c in data['crons'])
if not exists:
    data['crons'].append({
        "path": "/api/cron/calculate-rewards",
        "schedule": "*/10 * * * *"
    })

with open('vercel.json', 'w') as f:
    json.dump(data, f, indent=2)

