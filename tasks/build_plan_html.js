/*
  Build a standalone HTML file from the markdown plan.
  - Input:  SJDC_Makerspace_Implementation_Plan.md
  - Output: SJDC_Makerspace_Implementation_Plan.html
  - Offline: the output HTML contains no external dependencies.
*/

const fs = require('fs');
const path = require('path');
const https = require('https');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const MD_PATH = path.join(ROOT, 'SJDC_Makerspace_Implementation_Plan.md');
const OUT_PATH = path.join(ROOT, 'SJDC_Makerspace_Implementation_Plan.html');
const DOCS_DIR = path.join(ROOT, 'docs');
const DOCS_INDEX_PATH = path.join(DOCS_DIR, 'index.html');

const MARKED_URL = 'https://unpkg.com/marked@12.0.2/marked.min.js';

function djb2Hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) + str.charCodeAt(i);
    h |= 0;
  }
  return (h >>> 0).toString(16);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchText(res.headers.location));
      }
      if (res.statusCode !== 200) {
        reject(new Error(`GET ${url} failed: ${res.statusCode}`));
        res.resume();
        return;
      }
      res.setEncoding('utf8');
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  const md = fs.readFileSync(MD_PATH, 'utf8');
  const mdHash = djb2Hash(md);

  const markedSrc = await fetchText(MARKED_URL);

  // Evaluate marked in a sandbox.
  const sandbox = {
    console,
    globalThis: {},
    self: {},
    window: {},
  };
  sandbox.self = sandbox.globalThis;
  sandbox.window = sandbox.globalThis;

  vm.createContext(sandbox);
  vm.runInContext(markedSrc, sandbox, { filename: 'marked.min.js' });

  const markedApi = sandbox.globalThis.marked;
  if (!markedApi) throw new Error('marked did not attach to globalThis');

  if (typeof markedApi.setOptions === 'function') {
    markedApi.setOptions({ gfm: true, breaks: false });
  } else if (typeof markedApi.options === 'function') {
    markedApi.options({ gfm: true, breaks: false });
  }

  const renderFn =
    (typeof markedApi.parse === 'function' && ((s) => markedApi.parse(s))) ||
    (typeof markedApi.marked === 'function' && ((s) => markedApi.marked(s))) ||
    (typeof markedApi === 'function' && ((s) => markedApi(s)));

  if (!renderFn) throw new Error('No marked render function found');

  const rendered = renderFn(md);

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>SJDC Makerspace - Implementation Plan</title>
    <style>
      :root {
        --bg: #f6f3ee;
        --paper: #ffffff;
        --ink: #1f2328;
        --muted: #5b6672;
        --rule: #e5e0d8;
        --accent: #0b4f6c;
        --shadow: 0 18px 50px rgba(0, 0, 0, 0.10);
        --radius: 14px;
      }

      * { box-sizing: border-box; }
      html, body { height: 100%; }

      body {
        margin: 0;
        color: var(--ink);
        background:
          radial-gradient(1100px 600px at 12% -10%, rgba(11, 79, 108, 0.16), transparent 60%),
          radial-gradient(900px 540px at 90% 0%, rgba(163, 75, 42, 0.12), transparent 55%),
          var(--bg);
        font-family: Georgia, "Times New Roman", Times, serif;
        line-height: 1.55;
      }

      a { color: var(--accent); text-decoration-thickness: 0.08em; text-underline-offset: 0.18em; }
      a:hover { text-decoration-thickness: 0.14em; }

      .wrap {
        max-width: 980px;
        margin: 0 auto;
        padding: 24px 16px 56px;
      }

      .topbar {
        display: flex;
        gap: 10px;
        align-items: center;
        justify-content: space-between;
        margin: 8px 0 14px;
      }

      .brand h1 {
        margin: 0;
        font-size: 18px;
        letter-spacing: 0.02em;
        font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
      }

      .meta {
        margin: 3px 0 0;
        font-size: 12px;
        color: var(--muted);
        font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
      }

      .actions {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }

      button {
        border: 1px solid rgba(31, 35, 40, 0.18);
        background: rgba(255, 255, 255, 0.68);
        color: var(--ink);
        padding: 8px 10px;
        border-radius: 10px;
        cursor: pointer;
        font-size: 13px;
        font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
        backdrop-filter: blur(8px);
      }

      button:hover { border-color: rgba(31, 35, 40, 0.35); }
      button:active { transform: translateY(1px); }

      .card {
        background: var(--paper);
        border: 1px solid rgba(31, 35, 40, 0.10);
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        overflow: hidden;
      }

      .content {
        padding: 28px 28px 34px;
      }

      .content > :first-child { margin-top: 0; }
      .content h1 { font-size: 34px; margin: 0 0 10px; letter-spacing: -0.02em; }
      .content h2 { font-size: 22px; margin: 26px 0 10px; }
      .content h3 { font-size: 18px; margin: 20px 0 8px; }
      .content hr { border: 0; border-top: 1px solid var(--rule); margin: 20px 0; }
      .content p { margin: 10px 0; }
      .content ul, .content ol { margin: 10px 0 12px 24px; padding: 0; }
      .content li { margin: 6px 0; }
      .content code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        font-size: 0.92em;
        background: #f4f6f8;
        padding: 0.12em 0.32em;
        border-radius: 6px;
        border: 1px solid rgba(31, 35, 40, 0.10);
      }
      .content pre code {
        display: block;
        padding: 12px 14px;
        overflow: auto;
      }
      .content table {
        width: 100%;
        border-collapse: collapse;
        margin: 12px 0 16px;
        font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
        font-size: 13px;
      }
      .content th, .content td {
        border: 1px solid rgba(31, 35, 40, 0.14);
        padding: 8px 10px;
        vertical-align: top;
      }
      .content th {
        background: rgba(31, 35, 40, 0.04);
        text-align: left;
      }

      /* Task list / checkboxes */
      .content input[type="checkbox"] {
        width: 16px;
        height: 16px;
        vertical-align: -2px;
        margin-right: 8px;
        accent-color: var(--accent);
      }
      .content li.task-item { list-style: none; margin-left: -20px; }
      .content li.task-item > label { cursor: pointer; }
      .content li.task-item.checked > label {
        color: var(--muted);
        text-decoration: line-through;
        text-decoration-thickness: 0.08em;
      }

      .heading-anchor {
        margin-left: 8px;
        font-size: 0.9em;
        opacity: 0.55;
        text-decoration: none;
      }
      .heading-anchor:hover { opacity: 1; }

      .footer {
        padding: 14px 28px;
        border-top: 1px solid var(--rule);
        display: flex;
        gap: 10px;
        justify-content: space-between;
        align-items: center;
        color: var(--muted);
        font-size: 12px;
        font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
      }

      details {
        margin-top: 14px;
      }
      details > summary {
        cursor: pointer;
        font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
        color: var(--accent);
      }
      pre.md {
        margin: 10px 0 0;
        padding: 14px 16px;
        border: 1px solid rgba(31, 35, 40, 0.12);
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.85);
        overflow: auto;
        white-space: pre-wrap;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        font-size: 12px;
        line-height: 1.45;
      }

      @media (max-width: 680px) {
        .content { padding: 20px 16px 26px; }
        .footer { padding: 12px 16px; }
        .content h1 { font-size: 28px; }
      }

      @media print {
        body { background: #fff; }
        .wrap { padding: 0; }
        .topbar, .actions, details { display: none !important; }
        .card { box-shadow: none; border: 0; border-radius: 0; }
        .content { padding: 0; }
        a { color: #000; text-decoration: none; }
        .heading-anchor { display: none; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="topbar">
        <div class="brand">
          <h1>SJDC Makerspace - Implementation Plan</h1>
          <p class="meta">Standalone (offline) HTML. Checkmarks save to this browser.</p>
        </div>
        <div class="actions">
          <button type="button" id="print">Print</button>
          <button type="button" id="reset">Reset checkmarks</button>
        </div>
      </div>

      <div class="card">
        <div class="content" id="content">
${rendered}
        </div>
        <div class="footer">
          <span>Saved locally in this browser</span>
          <span id="foot">Checklist key: ${mdHash}</span>
        </div>
      </div>

      <details>
        <summary>View source Markdown</summary>
        <pre class="md">${escapeHtml(md)}</pre>
      </details>
    </div>

    <script>
      (function () {
        var mdHash = ${JSON.stringify(mdHash)};
        var storageKey = "SJDC_Makerspace_Implementation_Plan:checkboxes:" + mdHash;

        function slugify(text) {
          return String(text)
            .toLowerCase()
            .replace(/&/g, "and")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        }

        function loadState() {
          try {
            var raw = localStorage.getItem(storageKey);
            if (!raw) return {};
            var parsed = JSON.parse(raw);
            return parsed && typeof parsed === "object" ? parsed : {};
          } catch (_) {
            return {};
          }
        }

        function saveState(state) {
          try {
            localStorage.setItem(storageKey, JSON.stringify(state));
          } catch (_) {}
        }

        var content = document.getElementById("content");

        // Add stable heading anchors
        (function addHeadingAnchors() {
          var used = Object.create(null);
          var headings = content.querySelectorAll("h1, h2, h3");
          for (var i = 0; i < headings.length; i++) {
            var h = headings[i];
            var base = slugify(h.textContent);
            if (!base) continue;
            var id = base;
            var n = 2;
            while (used[id]) {
              id = base + "-" + n;
              n++;
            }
            used[id] = true;
            if (!h.id) h.id = id;

            var a = document.createElement("a");
            a.className = "heading-anchor";
            a.href = "#" + h.id;
            a.textContent = "#";
            a.setAttribute("aria-label", "Link to section " + h.textContent);
            h.appendChild(a);
          }
        })();

        // Enable task list checkboxes rendered by marked
        var state = loadState();
        var boxes = content.querySelectorAll("input[type=checkbox]");
        var taskIndex = 0;
        for (var i = 0; i < boxes.length; i++) {
          var box = boxes[i];
          box.disabled = false;

          var li = box.closest("li");
          if (li) li.classList.add("task-item");

          var key = String(taskIndex);
          box.setAttribute("data-task-key", key);
          if (state[key] === true) box.checked = true;
          if (li && box.checked) li.classList.add("checked");

          (function attach(boxEl, liEl, k) {
            boxEl.addEventListener("change", function () {
              state[k] = !!boxEl.checked;
              saveState(state);
              if (liEl) {
                if (boxEl.checked) liEl.classList.add("checked");
                else liEl.classList.remove("checked");
              }
            });
          })(box, li, key);

          if (li && box.parentElement === li) {
            var label = document.createElement("label");
            li.insertBefore(label, box);
            label.appendChild(box);

            // Move only the immediate text/inline nodes into the label.
            // Do not swallow nested UL/OL (keeps structure valid and readable).
            while (label.nextSibling) {
              var n = label.nextSibling;
              if (n.nodeType === 1) {
                var tag = n.tagName;
                if (tag === "UL" || tag === "OL") break;
              }
              label.appendChild(n);
            }
          }

          taskIndex++;
        }

        document.getElementById("print").addEventListener("click", function () {
          window.print();
        });

        document.getElementById("reset").addEventListener("click", function () {
          try { localStorage.removeItem(storageKey); } catch (_) {}
          state = {};
          for (var j = 0; j < boxes.length; j++) {
            boxes[j].checked = false;
            var li = boxes[j].closest("li");
            if (li) li.classList.remove("checked");
          }
        });
      })();
    </script>
  </body>
</html>
`;

  fs.writeFileSync(OUT_PATH, html, 'utf8');

  fs.mkdirSync(DOCS_DIR, { recursive: true });
  fs.writeFileSync(DOCS_INDEX_PATH, html, 'utf8');
  fs.writeFileSync(path.join(DOCS_DIR, '.nojekyll'), '', 'utf8');

  console.log(`Wrote: ${path.relative(ROOT, OUT_PATH)}`);
  console.log(`Wrote: ${path.relative(ROOT, DOCS_INDEX_PATH)}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
