const SITE_NAME = "Ada Blog";
const DEFAULT_DESCRIPTION = "记录技术、项目与长期积累。";
const DEFAULT_IMAGE = new URL("../assets/logo.png", import.meta.url).href;

function buildTitle(title) {
  if (!title) {
    return SITE_NAME;
  }

  return title === SITE_NAME ? SITE_NAME : `${title} | ${SITE_NAME}`;
}

function upsertMeta(selector, attributeName, attributeValue, content) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

export function setHead({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = "website"
} = {}) {
  const resolvedTitle = buildTitle(title);
  const resolvedDescription = description || DEFAULT_DESCRIPTION;
  const resolvedImage = image || DEFAULT_IMAGE;
  const resolvedUrl = url || window.location.href;

  document.title = resolvedTitle;

  upsertMeta('meta[name="description"]', "name", "description", resolvedDescription);
  upsertMeta('meta[property="og:title"]', "property", "og:title", resolvedTitle);
  upsertMeta('meta[property="og:description"]', "property", "og:description", resolvedDescription);
  upsertMeta('meta[property="og:image"]', "property", "og:image", resolvedImage);
  upsertMeta('meta[property="og:url"]', "property", "og:url", resolvedUrl);
  upsertMeta('meta[property="og:type"]', "property", "og:type", type);
  upsertMeta('meta[property="og:site_name"]', "property", "og:site_name", SITE_NAME);
  upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
  upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", resolvedTitle);
  upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", resolvedDescription);
  upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", resolvedImage);
}

export { DEFAULT_DESCRIPTION, SITE_NAME };
