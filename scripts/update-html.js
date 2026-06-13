/**
 * update-html.js — 扫描 md/ 目录下所有 .md 文件，
 * 转换为 HTML 并生成自包含的 index.html（多 Tab + 侧边栏 TOC）
 *
 * 用法: node scripts/update-html.js
 * 前置: npm install marked  （已安装过则跳过）
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Marked } from "../node_modules/marked/lib/marked.esm.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MD_DIR = path.join(ROOT, "md");
const OUT_FILE = path.join(MD_DIR, "index.html");

function addHeadingIds(html) {
  return html.replace(/<(h[1-4])(.*?)>(.*?)<\/\1>/g, (m, tag, attrs, content) => {
    const text = content.replace(/<[^>]+>/g, "");
    const id = text.toLowerCase().replace(/[^\w\u4e00-\u9fff\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/(^-|-$)/g, "");
    return "<" + tag + ' id="' + id + '">' + content + "</" + tag + ">";
  });
}

function extractToc(md) {
  const lines = md.split("\n"), toc = [];
  for (const line of lines) {
    const m = line.match(/^(#{1,4})\s+(.+)$/);
    if (m) {
      const lv = m[1].length;
      const raw = m[2];
      const title = raw.replace(/\*\*(.+?)\*\*/g, "$1").replace(/`(.+?)`/g, "$1");
      const id = title.toLowerCase().replace(/[^\w\u4e00-\u9fff\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/(^-|-$)/g, "");
      toc.push({ level: lv, title, id });
    }
  }
  return toc;
}

function renderToc(items) {
  return items.map((item) => {
    const indent = 16 + (item.level - 1) * 16;
    return "<a href=\"#" + item.id + "\" class=\"ti tl" + item.level + "\" style=\"padding-left:" + indent + "px\">" + item.title + "</a>";
  }).join("\n");
}

const marked = new Marked();
marked.use({ gfm: true, breaks: false });

const allFiles = fs.readdirSync(MD_DIR);
const mdFiles = allFiles.filter((f) => f.endsWith(".md") && f !== "index.html").sort();

if (mdFiles.length === 0) { console.error("No .md files found"); process.exit(1); }

function tabName(f) {
  const map = {
    'embedded-knowledge-map.md': '知识图谱',
    'embedded-lab-guide.md': '动手实验室',
    'embedded-product-guide.md': '产品经理指南',
  'embedded-cases.md': '案例拆解',
  'interview-prep.md': '面试指南',
  };
  return map[f] || f.replace(/\\\.md$/, '').replace(/^\\d+[-_]?/, '').replace(/[-_]/g, ' ');
}
  return f.replace(/\.md$/, "").replace(/^\d+[-_]?/, "").replace(/[-_]/g, " ");
}

const docs = [];
for (const f of mdFiles) {
  const raw = fs.readFileSync(path.join(MD_DIR, f), "utf8");
  const html = addHeadingIds(await marked.parse(raw));
  docs.push({ file: f, name: tabName(f), html, toc: extractToc(raw) });
}

const CSS = "*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Noto Sans SC\",sans-serif;color:#1e293b;background:#f8fafc;line-height:1.7;font-size:15px}.hd{position:fixed;top:0;left:0;right:0;height:56px;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;padding:0 24px;z-index:100;gap:12px}.hd h1{font-size:16px;font-weight:600;color:#1e293b;flex-shrink:0}.tb{display:flex;gap:4px;margin-left:16px;flex:1;overflow-x:auto;flex-wrap:nowrap}.tb button{padding:8px 18px;border:none;background:transparent;cursor:pointer;font-size:13px;border-radius:6px;color:#64748b;font-weight:500;transition:.15s;white-space:nowrap;flex-shrink:0}.tb button:hover{background:#f1f5f9;color:#334155}.tb button.on{background:#eff6ff;color:#2563eb;font-weight:600}.tc{position:fixed;top:56px;left:0;bottom:0;width:280px;background:#fff;border-right:1px solid #e2e8f0;overflow-y:auto;padding:16px 0;transition:transform .2s;z-index:50}.tc.h{transform:translateX(-100%)}.ti{display:block;padding:6px 16px;font-size:13px;color:#475569;text-decoration:none;border-left:2px solid transparent;transition:.1s;line-height:1.5;cursor:pointer}.ti:hover{color:#2563eb;background:#eff6ff;border-left-color:#3b82f6}.ti.on{color:#2563eb;font-weight:500;border-left-color:#2563eb;background:#eff6ff}.tl2{font-weight:500;color:#1e293b;font-size:13px}.tl3{font-size:12.5px}.tl4{font-size:12px;color:#94a3b8}.mn{margin-top:56px;margin-left:280px;padding:40px 48px 80px;max-width:900px;transition:margin-left .2s}.mn.fl{margin-left:auto;max-width:800px;margin-right:auto}.pn{display:none}.pn.on{display:block}.ct h1{font-size:28px;font-weight:700;color:#0f172a;margin:0 0 8px;padding-bottom:12px;border-bottom:1px solid #e2e8f0;line-height:1.3}.ct h2{font-size:22px;font-weight:600;color:#0f172a;margin:40px 0 12px;padding-bottom:8px;border-bottom:1px solid #e2e8f0;line-height:1.3}.ct h2:first-child{margin-top:0}.ct h3{font-size:18px;font-weight:600;color:#1e293b;margin:28px 0 10px;line-height:1.4}.ct h4{font-size:16px;font-weight:600;color:#334155;margin:20px 0 8px}.ct p{margin:0 0 14px;color:#334155}.ct strong{color:#0f172a;font-weight:600}.ct a{color:#2563eb;text-decoration:underline}.ct a:hover{opacity:.8}.ct ul,.ct ol{margin:0 0 14px;padding-left:24px}.ct li{margin-bottom:6px}.ct blockquote{margin:16px 0;padding:12px 20px;border-left:4px solid #3b82f6;background:#eff6ff;border-radius:0 8px 8px 0;color:#334155;font-size:14px}.ct blockquote strong{color:#1e293b}.ct code{font-family:\"SF Mono\",\"Fira Code\",Consolas,monospace;font-size:13px;background:#f1f5f9;padding:2px 6px;border-radius:4px;color:#1e293b}.ct pre{margin:16px 0;padding:16px 20px;background:#1e293b;border-radius:8px;overflow-x:auto;font-size:13px;line-height:1.5}.ct pre code{background:transparent;padding:0;color:#e2e8f0;font-size:13px}.ct table{width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;display:block;overflow-x:auto}.ct th{padding:10px 14px;text-align:left;font-weight:600;color:#334155;border-bottom:2px solid #cbd5e1;white-space:nowrap;background:#f1f5f9}.ct td{padding:10px 14px;border-bottom:1px solid #e2e8f0;color:#334155}.ct tr:hover td{background:#f8fafc}.ct hr{border:none;border-top:1px solid #e2e8f0;margin:32px 0}@media(max-width:768px){.tc{transform:translateX(-100%)}.mn{margin-left:0;padding:24px 16px 60px}.hd{padding:0 12px}.tb{margin-left:8px}.tb button{padding:6px 10px;font-size:12px}.ct h1{font-size:24px}.ct h2{font-size:19px}}.tc::-webkit-scrollbar{width:4px}.tc::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:2px}";

const tabs = docs.map((d, i) => "<button" + (i === 0 ? " class=on" : "") + " data-t=" + i + " onclick=\"st(" + i + ')\">📄 ' + d.name + "</button>").join("");
const tocSections = docs.map((d, i) => "<div id=t" + i + " class=ts" + (i === 0 ? "" : " style=display:none") + ">" + renderToc(d.toc) + "</div>").join("\n");
const panes = docs.map((d, i) => "<div id=p" + i + " class=\"pn" + (i === 0 ? " on" : "") + "\"><div class=ct>" + d.html + "</div></div>").join("\n");

const html = "<!DOCTYPE html>\n<html lang=zh-CN>\n<head>\n<meta charset=UTF-8>\n<meta name=viewport content=\"width=device-width,initial-scale=1\">\n<title>嵌入式学习资料</title>\n<style>" + CSS + "</style>\n</head>\n<body>\n<header class=hd>\n<h1>嵌入式学习资料</h1>\n<div class=tb>" + tabs + "</div>\n</header>\n<nav class=tc id=s>\n" + tocSections + "\n</nav>\n<main class=mn id=m>\n" + panes + "\n</main>\n<script>\nvar zt=0;\nfunction st(t){zt=t;document.querySelectorAll(\".tb button\").forEach(function(x){x.classList.toggle(\"on\",parseInt(x.dataset.t)===t)});document.querySelectorAll(\".pn\").forEach(function(x){x.classList.toggle(\"on\",x.id===\"p\"+t)});document.querySelectorAll(\"#s>div\").forEach(function(x){x.style.display=x.id===\"t\"+t?\"\":\"none\"});window.scrollTo(0,0);ua()}\ndocument.querySelectorAll(\".ti\").forEach(function(a){a.addEventListener(\"click\",function(e){e.preventDefault();var id=this.getAttribute(\"href\").slice(1);var el=document.getElementById(id);if(el)el.scrollIntoView({behavior:\"smooth\",block:\"start\"});document.querySelectorAll(\".ti\").forEach(function(t){t.classList.remove(\"on\")});this.classList.add(\"on\")})});\nfunction ua(){var p=document.querySelector(\".pn.on\");if(!p)return;var h=p.querySelectorAll(\"h2,h3,h4\");var its=document.querySelectorAll(\"#t\"+zt+\" .ti\");var ci=\"\";for(var i=0;i<h.length;i++){var r=h[i].getBoundingClientRect();if(r.top<=140)ci=h[i].id}its.forEach(function(t){t.classList.toggle(\"on\",t.getAttribute(\"href\")===\"#\"+ci)})};var st2;window.addEventListener(\"scroll\",function(){clearTimeout(st2);st2=setTimeout(ua,120)});\n</script>\n</body>\n</html>";

fs.writeFileSync(OUT_FILE, html, "utf8");
console.log("✅ 已生成 " + OUT_FILE);
console.log("   - 包含 " + docs.length + " 个文档");
console.log("   - 大小: " + (html.length / 1024).toFixed(1) + " KB");
docs.forEach((d) => console.log("   - 📄 " + d.file + "  →  \"" + d.name + "\" (" + d.toc.length + " 个章节)"));
console.log("💡 下次新增 .md 文件后，运行: node scripts/update-html.js");
