// @ts-ignore - no types
import html2pdf from "html2pdf.js";
import { marked } from "marked";

function sanitizeFilename(s: string) {
  return (s || "output").replace(/[^a-z0-9-_]+/gi, "_").slice(0, 60);
}

export async function downloadOutputPdf(opts: {
  title: string;
  subtitle?: string;
  meta?: Record<string, string | undefined | null>;
  content: string;
  agentLabel: string;
}) {
  const { title, subtitle, meta = {}, content, agentLabel } = opts;
  marked.setOptions({ gfm: true, breaks: false });
  const html = await marked.parse(content || "");
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const metaRows = Object.entries({ ...meta, Date: dateStr, Version: "v1.0" })
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><th>${k}</th><td>${v}</td></tr>`,
    )
    .join("");

  const wrapper = document.createElement("div");
  wrapper.style.cssText =
    "width:780px;background:#fff;color:#111;font-family:Georgia,'Times New Roman',serif;";
  wrapper.innerHTML = `
    <div class="doc">
      <header class="doc-head">
        <div class="brand">
          <span class="brand-mark"></span>
          <span class="brand-name">${agentLabel}</span>
        </div>
        <h1>${title}</h1>
        ${subtitle ? `<div class="sub">${subtitle}</div>` : ""}
      </header>

      ${metaRows ? `<table class="meta">${metaRows}</table>` : ""}

      <div class="md-body">${html}</div>

      <footer class="doc-foot">
        <span>${agentLabel} — ${title}</span>
        <span>Confidential · Prepared ${dateStr}</span>
      </footer>
    </div>
    <style>
      .doc{padding:52px 56px;}
      .doc-head{border-bottom:3px double #111;padding-bottom:18px;margin-bottom:22px;}
      .brand{display:flex;align-items:center;gap:8px;margin-bottom:10px;}
      .brand-mark{display:inline-block;width:10px;height:10px;background:#16a34a;border-radius:2px;}
      .brand-name{font-family:'Courier New',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#16a34a;}
      .doc-head h1{font-size:26px;line-height:1.2;margin:0 0 6px;font-weight:700;letter-spacing:-0.01em;}
      .doc-head .sub{font-size:13px;color:#555;font-style:italic;}
      table.meta{border-collapse:collapse;width:100%;margin:0 0 28px;font-family:Helvetica,Arial,sans-serif;}
      table.meta th{width:150px;text-align:left;padding:6px 12px 6px 0;font-size:9.5px;letter-spacing:.09em;text-transform:uppercase;color:#777;font-weight:600;border-bottom:1px solid #eee;vertical-align:top;}
      table.meta td{padding:6px 0;font-size:12px;color:#111;border-bottom:1px solid #eee;}
      .md-body{font-size:12.5px;line-height:1.65;color:#1a1a1a;}
      .md-body h1{font-size:19px;margin:26px 0 12px;padding-bottom:5px;border-bottom:1px solid #111;font-weight:700;page-break-after:avoid;}
      .md-body h2{font-size:15.5px;margin:24px 0 10px;padding-left:10px;border-left:3px solid #16a34a;font-weight:700;page-break-after:avoid;}
      .md-body h3{font-size:11px;margin:18px 0 6px;font-family:Helvetica,Arial,sans-serif;text-transform:uppercase;letter-spacing:.1em;color:#16a34a;page-break-after:avoid;}
      .md-body h4{font-size:12.5px;margin:14px 0 5px;font-weight:700;}
      .md-body p{margin:0 0 10px;}
      .md-body ul,.md-body ol{margin:0 0 12px;padding-left:22px;}
      .md-body li{margin-bottom:5px;}
      .md-body strong{color:#000;}
      .md-body code{background:#f3f4f6;padding:1px 5px;border-radius:3px;font-family:'Courier New',monospace;font-size:11px;}
      .md-body pre{background:#f7f7f7;border:1px solid #e5e5e5;padding:12px;border-radius:4px;overflow:auto;font-size:10.5px;page-break-inside:avoid;}
      .md-body blockquote{border-left:3px solid #16a34a;background:#f4faf6;margin:14px 0;padding:8px 14px;color:#333;font-style:italic;page-break-inside:avoid;}
      .md-body table{border-collapse:collapse;margin:14px 0;width:100%;font-family:Helvetica,Arial,sans-serif;font-size:11px;page-break-inside:avoid;}
      .md-body th,.md-body td{border:1px solid #d8d8d8;padding:7px 10px;text-align:left;vertical-align:top;}
      .md-body th{background:#f1f3f2;font-size:9.5px;text-transform:uppercase;letter-spacing:.06em;color:#444;}
      .md-body tbody tr:nth-child(even){background:#fafafa;}
      .md-body hr{border:none;border-top:1px solid #ddd;margin:20px 0;}
      .doc-foot{margin-top:34px;padding-top:10px;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-family:Helvetica,Arial,sans-serif;font-size:9px;color:#999;letter-spacing:.04em;}
    </style>
  `;
  document.body.appendChild(wrapper);

  try {
    await html2pdf()
      .set({
        margin: [10, 8, 12, 8],
        filename: `${sanitizeFilename(agentLabel)}_${sanitizeFilename(title)}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "avoid-all"] },
      } as any)
      .from(wrapper)
      .save();
  } finally {
    document.body.removeChild(wrapper);
  }
}
