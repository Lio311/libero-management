import { BRAND_CONFIG } from './src/lib/wc-config';
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

console.log("CK:", BRAND_CONFIG.libero.ck);
console.log("CS:", BRAND_CONFIG.libero.cs);
console.log("Auth:", Buffer.from(`${BRAND_CONFIG.libero.ck}:${BRAND_CONFIG.libero.cs}`).toString('base64'));
