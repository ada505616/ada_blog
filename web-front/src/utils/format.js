export function formatDate(value, options = {}) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options
  }).format(new Date(value));
}

export function formatDateTime(value) {
  return formatDate(value, {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function groupArticlesByMonth(items = []) {
  const groups = new Map();

  for (const item of items) {
    const source = item.publishedAt || item.createdAt;
    const date = new Date(source);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(item);
  }

  return Array.from(groups.entries()).map(([key, articles]) => ({
    key,
    label: key.replace("-", " / "),
    articles
  }));
}

export function makeExcerpt(text, max = 120) {
  if (!text) {
    return "";
  }

  return text.length > max ? `${text.slice(0, max).trim()}...` : text;
}

export function slugify(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{Letter}\p{Number}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
