import { NextResponse } from 'next/server';

export async function GET() {
  const code = `const puppeteer = require('puppeteer');
const http = require('http');
const https = require('https');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://libero-management.vercel.app'; 
const PRINTER_MINI = 'Godex Mini Perfume'; 
const PRINTER_DELIVERY = 'Godex delivery EZ520';

const STORE_NAME = 'libero';
const POLL_INTERVAL_MS = 5000;
const PDF_TO_PRINTER_EXE = path.join(__dirname, 'PDFtoPrinter.exe');

const PDFS_DIR = path.join(__dirname, 'jobs');
if (!fs.existsSync(PDFS_DIR)) {
  fs.mkdirSync(PDFS_DIR);
}

async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); } catch(e) { reject(e); }
        } else {
          reject(new Error(\`HTTP \${res.statusCode}: \${data}\`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function markJobAsCompleted(jobId) {
  return new Promise((resolve, reject) => {
    const url = \`\${SITE_URL}/api/remote-print\`;
    const lib = url.startsWith('https') ? https : http;
    const options = {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    };
    const req = lib.request(url, options, (res) => {
      res.on('data', () => {});
      res.on('end', resolve);
    });
    req.on('error', reject);
    req.write(JSON.stringify({ id: jobId }));
    req.end();
  });
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const lib = url.startsWith('https') ? https : http;
    const request = lib.get(url, function(response) {
      if (response.statusCode >= 400) {
         return reject(new Error("Failed to download PDF, status code: " + response.statusCode));
      }
      if (response.statusCode === 301 || response.statusCode === 302) {
         return resolve(downloadFile(response.headers.location, dest));
      }
      response.pipe(file);
      file.on('finish', function() {
        file.close(resolve);
      });
    }).on('error', function(err) {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function startDaemon() {
  console.log('Starting headless browser...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  let currentResolve = null;
  await page.exposeFunction('onPdfGeneratedBase64', (b64) => {
    if (currentResolve) currentResolve(b64);
  });
  
  page.on('console', msg => console.log('    [Browser Console]', msg.text()));

  async function checkPendingJobs() {
    try {
      const url = \`\${SITE_URL}/api/remote-print?store=\${STORE_NAME}\`;
      const response = await fetchJSON(url);
      
      if (response.jobs && response.jobs.length > 0) {
        console.log(\`[\${new Date().toLocaleTimeString()}] Found \${response.jobs.length} new print jobs!\`);
        
        for (const job of response.jobs) {
          const orderIdsParam = job.orderIds.join(',');
          
          if (job.jobType === 'shipping-label') {
            console.log(\`--> Processing SHIPPING LABEL job #\${job.id} for orders: \${orderIdsParam}\`);
            const tempPdfPath = path.join(PDFS_DIR, \`delivery_\${job.id}.pdf\`);
            const labelUrl = job.metadata?.url;
            
            if (labelUrl) {
              try {
                console.log(\`    Fetching pure PDF from server for shipping label...\`);
                const proxyUrl = \`\${SITE_URL}/api/lionwheel/proxy-pdf?url=\${encodeURIComponent(labelUrl)}\`;
                
                await new Promise((resolve, reject) => {
                  const lib = proxyUrl.startsWith('https') ? https : http;
                  lib.get(proxyUrl, (res) => {
                    if (res.statusCode !== 200) {
                      reject(new Error(\`Failed to download PDF. Status code: \${res.statusCode}\`));
                      return;
                    }
                    const fileStream = fs.createWriteStream(tempPdfPath);
                    res.pipe(fileStream);
                    fileStream.on('finish', () => {
                      fileStream.close();
                      resolve();
                    });
                    fileStream.on('error', reject);
                  }).on('error', reject);
                });
                
                console.log(\`    Sending to delivery printer \${PRINTER_DELIVERY}...\`);
                const cmd = \`"\${PDF_TO_PRINTER_EXE}" "\${tempPdfPath}" "\${PRINTER_DELIVERY}"\`;
                await new Promise((res, rej) => exec(cmd, (err) => err ? rej(err) : res()));
                
                console.log(\`    Marking as completed on server...\`);
                await markJobAsCompleted(job.id);
                
                console.log(\`    Shipping Label Job #\${job.id} completed successfully!\\n\`);
                setTimeout(() => { if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath); }, 2000);
              } catch (jobError) {
                console.error(\`    Error processing job #\${job.id}:\`, jobError.message);
              }
            } else {
               console.error(\`    No URL found for shipping label job #\${job.id}\`);
            }
          } else {
               console.error(\`    No URL found for shipping label job #\${job.id}\`);
            }
          } else {
            // Default: mini-perfume
            console.log(\`--> Processing MINI PERFUME job #\${job.id} for orders: \${orderIdsParam}\`);
            const targetUrl = \`\${SITE_URL}/shipping-scanner/bulk-mini-perfume?store=\${STORE_NAME}&orderIds=\${orderIdsParam}\`;
            
            try {
              console.log(\`    Generating PDF...\`);
              
              const pdfB64 = await new Promise(async (resolve, reject) => {
                currentResolve = resolve;
                try {
                  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => console.log('    [Page Goto]', e.message));
                  
                  let waitTime = 0;
                  const interval = setInterval(() => {
                    waitTime += 1000;
                    if (!currentResolve) {
                      clearInterval(interval);
                      return;
                    }
                    if (waitTime > 30000) {
                      clearInterval(interval);
                      reject(new Error("Timeout waiting for PDF generation"));
                    }
                  }, 1000);
                } catch(e) {
                  reject(e);
                }
              });
              
              if (!pdfB64) {
                console.log("    No mini perfumes found in this order (or empty labels). Skipping print.");
                await markJobAsCompleted(job.id);
                continue;
              }
              
              const tempPdfPath = path.join(PDFS_DIR, \`job_\${job.id}.pdf\`);
              const base64Data = pdfB64.replace(/^data:application\\/pdf.*?;base64,/, "");
              fs.writeFileSync(tempPdfPath, base64Data, 'base64');
              
              console.log(\`    Sending to printer \${PRINTER_MINI}...\`);
              const cmd = \`"\${PDF_TO_PRINTER_EXE}" "\${tempPdfPath}" "\${PRINTER_MINI}"\`;
              await new Promise((res, rej) => exec(cmd, (err) => err ? rej(err) : res()));
              
              console.log(\`    Marking as completed on server...\`);
              await markJobAsCompleted(job.id);
              
              console.log(\`    Job #\${job.id} completed successfully!\\n\`);
              
              setTimeout(() => { if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath); }, 2000);
            } catch (jobError) {
              console.error(\`    Error processing job #\${job.id}:\`, jobError.message);
            }
          }
        }
      }
    } catch (err) {
      if (!err.message.includes('ECONNREFUSED')) {
        console.error(\`[\${new Date().toLocaleTimeString()}] Error checking jobs:\`, err.message);
      }
    }
    
    setTimeout(checkPendingJobs, POLL_INTERVAL_MS);
  }

  console.log('==============================================');
  console.log(' Remote Print Daemon is ready and listening!');
  console.log(' Site URL:', SITE_URL);
  console.log(' Mini Perfume Printer:', PRINTER_MINI);
  console.log(' Delivery Label Printer:', PRINTER_DELIVERY);
  console.log(' PDFs Directory:', PDFS_DIR);
  console.log('==============================================');
  
  checkPendingJobs();
}

startDaemon().catch(console.error);
`;

  return new NextResponse(code, {
    headers: {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*'
    },
  });
}
