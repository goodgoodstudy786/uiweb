import type { EditorOutput, EditorBlock } from "./types";

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderParagraph(data: Record<string, unknown>): string {
  const text = String(data.text || "");
  return `<p>${text}</p>`;
}

function renderHeader(data: Record<string, unknown>): string {
  const text = String(data.text || "");
  const level = Number(data.level) || 2;
  const clampedLevel = Math.max(2, Math.min(4, level));
  return `<h${clampedLevel}>${text}</h${clampedLevel}>`;
}

function renderImage(data: Record<string, unknown>): string {
  const url = String(data.file?.url || data.url || "");
  const caption = String(data.caption || "");
  if (!url) return "";
  
  let html = `<figure class="editor-image">`;
  html += `<img src="${escapeHtml(url)}" alt="${escapeHtml(caption)}" loading="lazy" />`;
  if (caption) {
    html += `<figcaption>${caption}</figcaption>`;
  }
  html += `</figure>`;
  return html;
}

function renderList(data: Record<string, unknown>): string {
  const items = (data.items as string[]) || [];
  if (!items.length) return "";
  
  const style = data.style === "ordered" ? "ol" : "ul";
  const listItems = items.map((item) => `<li>${item}</li>`).join("");
  return `<${style}>${listItems}</${style}>`;
}

function renderQuote(data: Record<string, unknown>): string {
  const text = String(data.text || "");
  const caption = String(data.caption || "");
  
  let html = `<blockquote class="editor-quote">`;
  html += `<p>${text}</p>`;
  if (caption) {
    html += `<cite>${caption}</cite>`;
  }
  html += `</blockquote>`;
  return html;
}

function renderDelimiter(): string {
  return `<div class="editor-delimiter">•••</div>`;
}

function renderBlock(block: EditorBlock): string {
  switch (block.type) {
    case "paragraph":
      return renderParagraph(block.data);
    case "header":
      return renderHeader(block.data);
    case "image":
      return renderImage(block.data);
    case "list":
      return renderList(block.data);
    case "quote":
      return renderQuote(block.data);
    case "delimiter":
      return renderDelimiter();
    default:
      return "";
  }
}

export function renderEditorContent(content: EditorOutput | null): string {
  if (!content || !content.blocks || !content.blocks.length) {
    return "";
  }
  
  return content.blocks
    .map((block) => renderBlock(block))
    .filter((html) => html.length > 0)
    .join("");
}
