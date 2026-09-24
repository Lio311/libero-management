const fs = require('fs');
let content = fs.readFileSync('src/app/team/team-client.tsx', 'utf8');

content = content.replace(
  `className="text-green-600 p-1.5 bg-green-50 rounded hover:bg-green-100"`,
  `className="text-green-400 p-1.5 bg-green-500/10 border border-green-500/20 rounded hover:bg-green-500/20"`
);
content = content.replace(
  `className="text-red-600 p-1.5 bg-red-50 rounded hover:bg-red-100"`,
  `className="text-red-400 p-1.5 bg-red-500/10 border border-red-500/20 rounded hover:bg-red-500/20"`
);

content = content.replace(
  `className="text-green-600 p-1 bg-green-50 rounded"`,
  `className="text-green-400 p-1 bg-green-500/10 border border-green-500/20 rounded hover:bg-green-500/20"`
);
content = content.replace(
  `className="text-red-600 p-1 bg-red-50 rounded"`,
  `className="text-red-400 p-1 bg-red-500/10 border border-red-500/20 rounded hover:bg-red-500/20"`
);

content = content.replace(
  `className="text-green-600 p-1 bg-green-50 rounded"`,
  `className="text-green-400 p-1 bg-green-500/10 border border-green-500/20 rounded hover:bg-green-500/20"`
);
content = content.replace(
  `className="text-red-600 p-1 bg-red-50 rounded"`,
  `className="text-red-400 p-1 bg-red-500/10 border border-red-500/20 rounded hover:bg-red-500/20"`
);

content = content.replace(
  `className="text-green-600 p-2 bg-green-50 rounded hover:bg-green-100"`,
  `className="text-green-400 p-2 bg-green-500/10 border border-green-500/20 rounded hover:bg-green-500/20"`
);
content = content.replace(
  `className="text-red-600 p-2 bg-red-50 rounded hover:bg-red-100"`,
  `className="text-red-400 p-2 bg-red-500/10 border border-red-500/20 rounded hover:bg-red-500/20"`
);

fs.writeFileSync('src/app/team/team-client.tsx', content);
