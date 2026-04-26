const htmlTagPattern = /<\s*\/?\s*[a-z][^>]*>/i;

const htmlEntityMap: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const orderedListLinePattern = /^\s*\d+[.)]\s+(.+)$/;
const unorderedListLinePattern = /^\s*[-*•]\s+(.+)$/;
const headingLinePattern =
  /^[A-ZĄĆĘŁŃÓŚŹŻ0-9][A-ZĄĆĘŁŃÓŚŹŻ0-9 ()/:.,-]{2,119}$/;

function normalizeImportedText(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/\f/g, "\n\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function renderImportedTextBlock(block: string) {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return "";
  }

  if (lines.every((line) => unorderedListLinePattern.test(line))) {
    return `<ul>${lines
      .map((line) => {
        const match = line.match(unorderedListLinePattern);
        return `<li>${escapeHtml(match?.[1] ?? line)}</li>`;
      })
      .join("")}</ul>`;
  }

  if (lines.every((line) => orderedListLinePattern.test(line))) {
    return `<ol>${lines
      .map((line) => {
        const match = line.match(orderedListLinePattern);
        return `<li>${escapeHtml(match?.[1] ?? line)}</li>`;
      })
      .join("")}</ol>`;
  }

  if (
    lines.length === 1 &&
    headingLinePattern.test(lines[0]) &&
    !/[.!?:;]$/.test(lines[0])
  ) {
    return `<h2>${escapeHtml(lines[0])}</h2>`;
  }

  return `<p>${lines.map(escapeHtml).join("<br />")}</p>`;
}

function decodeHtmlEntities(value: string) {
  return Object.entries(htmlEntityMap).reduce(
    (currentValue, [entity, replacement]) =>
      currentValue.replaceAll(entity, replacement),
    value,
  );
}

export function hasStatuteHtmlMarkup(value: string) {
  return htmlTagPattern.test(value);
}

export function convertPlainTextToStatuteHtml(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return "";
  }

  return trimmedValue
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export function convertImportedPlainTextToStatuteHtml(value: string) {
  const normalizedValue = normalizeImportedText(value);
  if (!normalizedValue) {
    return "";
  }

  return normalizedValue
    .split(/\n{2,}/)
    .map((block) => renderImportedTextBlock(block))
    .filter(Boolean)
    .join("");
}

export function normalizeLegacyStatuteContent(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return "";
  }

  return hasStatuteHtmlMarkup(trimmedValue)
    ? trimmedValue
    : convertPlainTextToStatuteHtml(trimmedValue);
}

export function stripStatuteHtml(value: string) {
  return decodeHtmlEntities(
    value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<li\b[^>]*>/gi, "- ")
      .replace(/<\/(p|div|li|h1|h2|h3|h4|blockquote|ul|ol)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s+/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );
}

export function isStatuteRichTextEmpty(value: string) {
  return stripStatuteHtml(value).trim().length === 0;
}