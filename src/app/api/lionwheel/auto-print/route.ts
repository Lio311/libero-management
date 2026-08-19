import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    const res = await fetch(targetUrl);
    let html = await res.text();

    const scriptInjection = `
      <script>
        // Spoof desktop environment to force Lionwheel to generate the label automatically
        Object.defineProperty(navigator, 'userAgent', {
          get: function () { return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'; }
        });
        Object.defineProperty(navigator, 'platform', { get: function() { return 'Win32'; } });
        Object.defineProperty(navigator, 'maxTouchPoints', { get: function() { return 0; } });

        // On mobile, force-triggering a download of the blob might be better
        // The Lionwheel script creates an iframe or embed with the blob URL.
        const observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
              if (node.tagName === 'IFRAME' || node.tagName === 'EMBED' || node.tagName === 'OBJECT') {
                const src = node.src || node.data;
                if (src && src.startsWith('blob:')) {
                  console.log("Found PDF blob:", src);
                  // Create a native anchor tag to force download
                  const a = document.createElement('a');
                  a.href = src;
                  a.download = 'lionwheel_label.pdf';
                  a.style.display = 'none';
                  document.body.appendChild(a);
                  a.click();
                  
                  // Also replace the page content with a friendly message
                  document.body.innerHTML = '<div style="font-family:sans-serif; text-align:center; margin-top:50px; direction:rtl;"><h2>הלייבל ירד אוטומטית!</h2><p>ניתן לפתוח אותו מההתראות ולהדפיס.</p></div>';
                  observer.disconnect();
                }
              }
            }
          }
        });
        
        document.addEventListener('DOMContentLoaded', () => {
          observer.observe(document.body, { childList: true, subtree: true });
        });
      </script>
      <base href="https://members.lionwheel.com/">
    `;

    html = html.replace('<head>', '<head>' + scriptInjection);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error in auto-print proxy:', error);
    return new NextResponse('Error fetching label', { status: 500 });
  }
}
