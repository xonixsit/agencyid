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
  const html = await marked.parse(content || "");

  const metaRows = Object.entries(meta)
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;font-family:monospace;vertical-align:top;white-space:nowrap;">${k}</td><td style="padding:4px 0;font-size:12px;color:#111;">${v}</td></tr>`,
    )
    .join("");

  const wrapper = document.createElement("div");
  wrapper.style.cssText = "padding:48px;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#111;background:#fff;width:780px;";
  wrapper.innerHTML = `
    <div style="border-bottom:2px solid #111;padding-bottom:16px;margin-bottom:24px;">
      <div style="font-size:11px;font-family:monospace;color:#22c55e;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">${agentLabel}</div>
      <h1 style="font-size:24px;font-weight:700;margin:0 0 6px 0;line-height:1.2;">${title}</h1>
      ${subtitle ? `<div style="font-size:13px;color:#666;">${subtitle}</div>` : ""}
    </div>
    ${metaRows ? `<table style="margin-bottom:24px;border-collapse:collapse;">${metaRows}</table>` : ""}
    <div class="md-body" style="font-size:13px;line-height:1.6;color:#222;">${html}</div>
    <style>
      .md-body h1{font-size:20px;margin:24px 0 12px;border-bottom:1px solid #ddd;padding-bottom:4px;}
      .md-body h2{font-size:17px;margin:20px 0 10px;color:#111;}
      .md-body h3{font-size:14px;margin:16px 0 8px;color:#333;text-transform:uppercase;letter-spacing:0.03em;}
      .md-body p{margin:0 0 10px;}
      .md-body ul,.md-body ol{margin:0 0 12px;padding-left:22px;}
      .md-body li{margin-bottom:4px;}
      .md-body strong{color:#000;}
      .md-body code{background:#f4f4f4;padding:1px 5px;border-radius:3px;font-size:12px;}
      .md-body pre{background:#f4f4f4;padding:12px;border-radius:4px;overflow:auto;font-size:11px;}
      .md-body blockquote{border-left:3px solid #22c55e;margin:12px 0;padding:4px 12px;color:#555;background:#f9f9f9;}
      .md-body table{border-collapse:collapse;margin:12px 0;width:100%;font-size:12px;}
      .md-body th,.md-body td{border:1px solid #ddd;padding:6px 10px;text-align:left;}
      .md-body th{background:#f4f4f4;}
      .md-body hr{border:none;border-top:1px solid #ddd;margin:18px 0;}
    </style>
  `;
  document.body.appendChild(wrapper);

  try {
    await html2pdf()
      .set({
        margin: [10, 10, 12, 10],
        filename: `${sanitizeFilename(agentLabel)}_${sanitizeFilename(title)}.pdf`,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      } as any)
      .from(wrapper)
      .save();
  } finally {
    document.body.removeChild(wrapper);
  }
}
