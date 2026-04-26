function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderTableCell(cell, tag) {
  return `<${tag}>${cell || ""}</${tag}>`;
}

export function editorDataToHtml(data) {
  const blocks = data?.blocks || [];

  return blocks
    .map((block) => {
      if (block.type === "paragraph") {
        return `<p>${block.data?.text || ""}</p>`;
      }

      if (block.type === "header") {
        const level = Math.min(Math.max(Number(block.data?.level || 2), 2), 4);
        return `<h${level}>${block.data?.text || ""}</h${level}>`;
      }

      if (block.type === "list") {
        const tag = block.data?.style === "ordered" ? "ol" : "ul";
        const items = (block.data?.items || [])
          .map((item) => `<li>${typeof item === "string" ? item : item?.content || ""}</li>`)
          .join("");
        return `<${tag}>${items}</${tag}>`;
      }

      if (block.type === "image") {
        const url = block.data?.file?.url || "";
        const caption = block.data?.caption || "";
        return `<figure><img src="${escapeHtml(url)}" alt="${escapeHtml(caption)}" />${caption ? `<figcaption>${caption}</figcaption>` : ""}</figure>`;
      }

      if (block.type === "code") {
        return `<div class="code-wrap"><pre><code>${escapeHtml(block.data?.code || "")}</code></pre></div>`;
      }

      if (block.type === "table") {
        const rows = Array.isArray(block.data?.content) ? block.data.content : [];

        if (!rows.length) {
          return "";
        }

        const [headerRow, ...bodyRows] = rows;
        const withHeadings = Boolean(block.data?.withHeadings);
        const thead = withHeadings
          ? `<thead><tr>${(headerRow || []).map((cell) => renderTableCell(cell, "th")).join("")}</tr></thead>`
          : "";
        const tableRows = withHeadings ? bodyRows : rows;
        const tbody = tableRows.length
          ? `<tbody>${tableRows
              .map((row) => `<tr>${(row || []).map((cell) => renderTableCell(cell, "td")).join("")}</tr>`)
              .join("")}</tbody>`
          : "";

        return `<div class="table-wrap"><table>${thead}${tbody}</table></div>`;
      }

      return "";
    })
    .join("");
}

export function editorDataToText(data) {
  const blocks = data?.blocks || [];

  return blocks
    .map((block) => {
      if (block.type === "list") {
        return (block.data?.items || [])
          .map((item) => (typeof item === "string" ? item : item?.content || ""))
          .join(" ");
      }

      if (block.type === "image") {
        return block.data?.caption || "";
      }

      if (block.type === "code") {
        return block.data?.code || "";
      }

      if (block.type === "table") {
        return (block.data?.content || [])
          .flat()
          .filter(Boolean)
          .join(" ");
      }

      return block.data?.text || "";
    })
    .filter(Boolean)
    .join("\n");
}

export function normalizeEditorData(value) {
  if (!value) {
    return {
      time: Date.now(),
      blocks: []
    };
  }

  return value;
}
