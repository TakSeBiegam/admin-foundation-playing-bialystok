import sanitizeHtml from "sanitize-html";
import { normalizeLegacyStatuteContent } from "@/lib/statute-rich-text";

const statuteAllowedTags = [
  "a",
  "blockquote",
  "br",
  "em",
  "h2",
  "h3",
  "h4",
  "li",
  "ol",
  "p",
  "strong",
  "u",
  "ul",
] as const;

const statuteIndentableTags = ["blockquote", "h2", "h3", "h4", "p"] as const;

export function sanitizeStatuteHtml(value: string) {
  const normalizedValue = normalizeLegacyStatuteContent(value);
  if (!normalizedValue) {
    return "";
  }

  return sanitizeHtml(normalizedValue, {
    allowedTags: [...statuteAllowedTags],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      ...Object.fromEntries(
        statuteIndentableTags.map((tagName) => [tagName, ["data-indent"]]),
      ),
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    disallowedTagsMode: "discard",
    transformTags: {
      b: "strong",
      div: "p",
      i: "em",
      a: (_tagName, attribs) => {
        const href = typeof attribs.href === "string" ? attribs.href : "";

        return {
          tagName: "a",
          attribs: (href
            ? {
                href,
                rel: "noopener noreferrer nofollow",
                target: "_blank",
              }
            : { href: "" }) as Record<string, string>,
        };
      },
    },
  }).trim();
}
