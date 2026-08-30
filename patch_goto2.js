const fs = require('fs');
const file = 'src/app/shipping-scanner/scanner-list-client.tsx';
let code = fs.readFileSync(file, 'utf8');

const t1 = `<button 
              onClick={() => router.push("?store=libero")}
              className={\`flex-1 sm:flex-none px-2 sm:px-6 py-2.5 rounded-lg font-medium transition-all \${store === "libero" ? "bg-blue-600 shadow-sm text-white" : "text-muted-foreground hover:text-foreground"}\`}
            >
              ליברו
            </button>`;
const r1 = `<Link 
              href="?store=libero" prefetch={true} scroll={false}
              className={\`flex-1 sm:flex-none text-center px-2 sm:px-6 py-2.5 rounded-lg font-medium transition-all \${store === "libero" ? "bg-blue-600 shadow-sm text-white" : "text-muted-foreground hover:text-foreground"}\`}
            >
              ליברו
            </Link>`;
            
const t2 = `<button 
              onClick={() => router.push("?store=velour")}
              className={\`flex-1 sm:flex-none px-2 sm:px-6 py-2.5 rounded-lg font-medium transition-all \${store === "velour" ? "bg-blue-600 shadow-sm text-white" : "text-muted-foreground hover:text-foreground"}\`}
            >
              וולור
            </button>`;
const r2 = `<Link 
              href="?store=velour" prefetch={true} scroll={false}
              className={\`flex-1 sm:flex-none text-center px-2 sm:px-6 py-2.5 rounded-lg font-medium transition-all \${store === "velour" ? "bg-blue-600 shadow-sm text-white" : "text-muted-foreground hover:text-foreground"}\`}
            >
              וולור
            </Link>`;
            
const t3 = `<button 
              onClick={() => router.push("?store=labura")}
              className={\`flex-1 sm:flex-none px-2 sm:px-6 py-2.5 rounded-lg font-medium transition-all \${store === "labura" ? "bg-blue-600 shadow-sm text-white" : "text-muted-foreground hover:text-foreground"}\`}
            >
              לה בורה
            </button>`;
const r3 = `<Link 
              href="?store=labura" prefetch={true} scroll={false}
              className={\`flex-1 sm:flex-none text-center px-2 sm:px-6 py-2.5 rounded-lg font-medium transition-all \${store === "labura" ? "bg-blue-600 shadow-sm text-white" : "text-muted-foreground hover:text-foreground"}\`}
            >
              לה בורה
            </Link>`;

code = code.replace(t1, r1).replace(t2, r2).replace(t3, r3);
fs.writeFileSync(file, code);
