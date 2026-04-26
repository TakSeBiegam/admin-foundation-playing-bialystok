import { NextResponse } from "next/server";
import { marked } from "marked";
import { sanitizeStatuteHtml } from "@/lib/statute-rich-text-server";
import { convertImportedPlainTextToStatuteHtml } from "@/lib/statute-rich-text";

export const runtime = "nodejs";

const MAX_IMPORT_SIZE_BYTES = 10 * 1024 * 1024;
const markdownFileExtensions = [".md", ".markdown", ".mdown", ".mkd"];

type ImportSource = "markdown" | "pdf";

type ImportResult = {
  content: string;
  fileName: string;
  source: ImportSource;
};

function detectImportSource(file: File): ImportSource | null {
  const lowerCaseName = file.name.trim().toLowerCase();

  if (lowerCaseName.endsWith(".pdf") || file.type === "application/pdf") {
    return "pdf";
  }

  if (
    markdownFileExtensions.some((extension) =>
      lowerCaseName.endsWith(extension),
    ) ||
    file.type === "text/markdown" ||
    file.type === "text/x-markdown" ||
    file.type === "text/plain"
  ) {
    return "markdown";
  }

  return null;
}

async function parseMarkdownFile(file: File) {
  const markdown = await file.text();
  return await marked.parse(markdown, {
    breaks: true,
    gfm: true,
  });
}

async function parsePdfFile(file: File) {
  const { PDFParse } = await import("pdf-parse");
  const arrayBuffer = await file.arrayBuffer();
  const parsedPdf = new PDFParse(Buffer.from(arrayBuffer));

  return convertImportedPlainTextToStatuteHtml(
    (await parsedPdf.getText()).text,
  );
}

async function buildImportResult(file: File, source: ImportSource) {
  const rawContent =
    source === "pdf" ? await parsePdfFile(file) : await parseMarkdownFile(file);

  const content = sanitizeStatuteHtml(rawContent);

  return {
    content,
    fileName: file.name,
    source,
  } satisfies ImportResult;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Nie przesłano pliku do importu." },
        { status: 400 },
      );
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "Plik jest pusty." }, { status: 400 });
    }

    if (file.size > MAX_IMPORT_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Plik jest zbyt duży. Limit importu to 10 MB." },
        { status: 413 },
      );
    }

    const source = detectImportSource(file);
    if (!source) {
      return NextResponse.json(
        { error: "Obsługujemy tylko pliki PDF i Markdown." },
        { status: 400 },
      );
    }

    const result = await buildImportResult(file, source);

    if (!result.content) {
      return NextResponse.json(
        { error: "Nie udało się odczytać treści z wybranego pliku." },
        { status: 422 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Błąd importu pliku" },
      { status: 500 },
    );
  }
}
