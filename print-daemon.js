const http = require('http');
const https = require('https');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// ==========================================
// הגדרות מערכת - לשנות לפי הצורך!
// ==========================================

// כתובת האתר שלך - יש להחליף לכתובת האמיתית! (למשל https://my-store.vercel.app)
const SITE_URL = 'https://libero-management.vercel.app'; 

// שם החנות
const STORE_NAME = 'libero';

// שם המדפסת כפי שמופיע בחלונות
const PRINTER_NAME = 'Godex EZ520'; 

// זמן בין בדיקות (באלפיות שניה - כרגע 5 שניות)
const POLL_INTERVAL_MS = 5000;

// נתיב לתוכנת PDFtoPrinter.exe (יש לשים אותה באותה תיקייה של הסקריפט)
const PDF_TO_PRINTER_EXE = path.join(__dirname, 'PDFtoPrinter.exe');

// ==========================================

async function fetchJSON(url, options = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch(e) {
            reject(e);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function downloadPDF(url, destPath) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    lib.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download PDF: HTTP ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

function printPDF(pdfPath) {
  return new Promise((resolve, reject) => {
    // הפעלת פקודת ההדפסה שקטה
    const cmd = `"${PDF_TO_PRINTER_EXE}" "${pdfPath}" "${PRINTER_NAME}"`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

async function markJobAsCompleted(jobId) {
  await fetchJSON(`${SITE_URL}/api/remote-print`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: jobId })
  });
}

async function checkPendingJobs() {
  try {
    const url = `${SITE_URL}/api/remote-print?store=${STORE_NAME}`;
    const response = await fetchJSON(url);
    
    if (response.jobs && response.jobs.length > 0) {
      console.log(`[${new Date().toLocaleTimeString()}] נמצאו ${response.jobs.length} עבודות הדפסה חדשות!`);
      
      for (const job of response.jobs) {
        const orderIdsParam = job.orderIds.join(',');
        console.log(`--> מעבד עבודה #${job.id} להזמנות: ${orderIdsParam}`);
        
        // יצירת כתובת ל-API של ה-PDF
        const pdfApiUrl = `${SITE_URL}/api/print-pdf?store=${STORE_NAME}&orderIds=${orderIdsParam}`;
        const tempPdfPath = path.join(__dirname, `job_${job.id}.pdf`);
        
        try {
          console.log(`    מוריד קובץ PDF...`);
          await downloadPDF(pdfApiUrl, tempPdfPath);
          
          console.log(`    שולח למדפסת ${PRINTER_NAME}...`);
          await printPDF(tempPdfPath);
          
          console.log(`    מסמן כהושלם בשרת...`);
          await markJobAsCompleted(job.id);
          
          console.log(`    עבודה #${job.id} הסתיימה בהצלחה!\n`);
          
          // מחיקת הקובץ הזמני
          setTimeout(() => fs.unlinkSync(tempPdfPath), 2000);
          
        } catch (jobError) {
          console.error(`    שגיאה בעבודה #${job.id}:`, jobError.message);
        }
      }
    }
  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString()}] שגיאה בבדיקת עבודות:`, err.message);
  }
}

console.log('==============================================');
console.log(' מאזין להדפסות מרחוק מתחיל לפעול...');
console.log(' כתובת האתר:', SITE_URL);
console.log(' מדפסת מוגדרת:', PRINTER_NAME);
console.log('==============================================');

setInterval(checkPendingJobs, POLL_INTERVAL_MS);
checkPendingJobs();
