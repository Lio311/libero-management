async function run() {
  const url = "https://members.lionwheel.com/tasks/print_public_label.pdf?public_id=JFPEXNZ5ER";
  const res = await fetch(url);
  let html = await res.text();
  
  // Inject the polyfill
  html = html.replace('<head>', `<head>
  <script>
    Object.defineProperty(navigator, 'userAgent', {
      get: function () { return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'; }
    });
    // Lionwheel might also check maxTouchPoints or platform
    Object.defineProperty(navigator, 'platform', { get: function() { return 'Win32'; } });
    Object.defineProperty(navigator, 'maxTouchPoints', { get: function() { return 0; } });
  </script>
  <base href="https://members.lionwheel.com/">
  `);

  const fs = require('fs');
  fs.writeFileSync('public/test-lionwheel.html', html);
  console.log("Wrote to public/test-lionwheel.html");
}
run();
