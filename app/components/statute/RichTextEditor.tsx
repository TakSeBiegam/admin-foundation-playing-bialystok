"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bold,
  FileUp,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Quote,
  Underline,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";
import {
  isStatuteRichTextEmpty,
  normalizeLegacyStatuteContent,
} from "@/lib/statute-rich-text";
import type { ToastData } from "@/app/components/Toast";

const indentableBlockSelector = "p, h2, h3, h4, blockquote";
const maxIndentLevel = 6;

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  onToast?: (message: string, type?: ToastData["type"]) => void;
};

type ImportedStatutePayload = {
  content?: string;
  fileName?: string;
  source?: "markdown" | "pdf";
  error?: string;
};

type ToolbarButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
};

function ToolbarButton({
  label,
  onClick,
  disabled,
  children,
  className,
}: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "h-8 w-8 rounded-lg border border-white/10 bg-white/4 text-white/80 hover:bg-white/10 hover:text-white",
        className,
      )}
    >
      {children}
    </Button>
  );
}

export default function RichTextEditor({
  value,
  onChange,
  disabled = false,
  placeholder = "Wklej lub wpisz treść regulaminu",
  onToast,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const normalizedValue = normalizeLegacyStatuteContent(value);
    if (editor.innerHTML !== normalizedValue) {
      editor.innerHTML = normalizedValue;
    }
  }, [value]);

  function syncEditorValue() {
    const nextValue = editorRef.current?.innerHTML ?? "";

    if (isStatuteRichTextEmpty(nextValue)) {
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
      onChange("");
      return;
    }

    onChange(nextValue);
  }

  function focusEditor() {
    editorRef.current?.focus();
  }

  function resetFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function runCommand(command: string, commandValue?: string) {
    if (disabled) {
      return;
    }

    focusEditor();
    document.execCommand(command, false, commandValue);
    syncEditorValue();
  }

  function getSelectionParentElement() {
    const selection = window.getSelection();
    const anchorNode = selection?.anchorNode;

    if (!anchorNode) {
      return null;
    }

    return anchorNode instanceof HTMLElement
      ? anchorNode
      : anchorNode.parentElement;
  }

  function getActiveIndentableBlock() {
    return getSelectionParentElement()?.closest(
      indentableBlockSelector,
    ) as HTMLElement | null;
  }

  function getActiveListItem() {
    return getSelectionParentElement()?.closest("li") as HTMLElement | null;
  }

  function getBlockIndentLevel(block: HTMLElement) {
    const rawValue = Number.parseInt(block.dataset.indent ?? "0", 10);
    if (!Number.isFinite(rawValue) || rawValue < 0) {
      return 0;
    }

    return Math.min(rawValue, maxIndentLevel);
  }

  function setBlockIndentLevel(block: HTMLElement, nextIndentLevel: number) {
    const normalizedIndentLevel = Math.max(
      0,
      Math.min(nextIndentLevel, maxIndentLevel),
    );

    if (normalizedIndentLevel === 0) {
      delete block.dataset.indent;
    } else {
      block.dataset.indent = String(normalizedIndentLevel);
    }

    syncEditorValue();
  }

  function changeCurrentIndent(direction: 1 | -1) {
    if (disabled) {
      return;
    }

    focusEditor();

    if (getActiveListItem()) {
      runCommand(direction > 0 ? "indent" : "outdent");
      return;
    }

    const activeBlock = getActiveIndentableBlock();
    if (!activeBlock) {
      if (direction > 0) {
        runCommand("insertHTML", "&nbsp;&nbsp;&nbsp;&nbsp;");
      }
      return;
    }

    setBlockIndentLevel(
      activeBlock,
      getBlockIndentLevel(activeBlock) + direction,
    );
  }

  function setEditorContent(nextValue: string) {
    if (editorRef.current) {
      editorRef.current.innerHTML = nextValue;
    }

    onChange(nextValue);
    focusEditor();
  }

  async function importFile(file: File) {
    if (disabled || isImporting) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsImporting(true);

    try {
      const response = await fetch("/api/statute/import", {
        method: "POST",
        body: formData,
      });

      const payload = (await response
        .json()
        .catch(() => null)) as ImportedStatutePayload | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Nie udało się zaimportować pliku.");
      }

      const importedContent =
        typeof payload?.content === "string" ? payload.content : "";

      if (!importedContent) {
        throw new Error("Zaimportowany plik nie zawiera treści do wstawienia.");
      }

      setEditorContent(importedContent);

      const importLabel =
        payload?.source === "pdf" ? "plik PDF" : "plik Markdown";

      onToast?.(
        `Wczytano ${importLabel}${payload?.fileName ? `: ${payload.fileName}` : ""}.`,
        "success",
      );
    } catch (error) {
      onToast?.(
        (error as Error).message || "Nie udało się zaimportować pliku.",
        "error",
      );
    } finally {
      setIsImporting(false);
      setIsDraggingFile(false);
      resetFileInput();
    }
  }

  function handleFileSelection(fileList: FileList | null) {
    const firstFile = fileList?.[0];
    if (!firstFile) {
      return;
    }

    void importFile(firstFile);
  }

  function handleTabKey(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab" || disabled) {
      return;
    }

    event.preventDefault();
    changeCurrentIndent(event.shiftKey ? -1 : 1);
  }

  const isEmpty = isStatuteRichTextEmpty(value);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5">
      <div className="flex flex-wrap gap-2 border-b border-white/10 px-3 py-3">
        <ToolbarButton
          label="Pogrubienie"
          onClick={() => runCommand("bold")}
          disabled={disabled}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Kursywa"
          onClick={() => runCommand("italic")}
          disabled={disabled}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Podkreślenie"
          onClick={() => runCommand("underline")}
          disabled={disabled}
        >
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Nagłówek 2"
          onClick={() => runCommand("formatBlock", "<h2>")}
          disabled={disabled}
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Nagłówek 3"
          onClick={() => runCommand("formatBlock", "<h3>")}
          disabled={disabled}
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Lista wypunktowana"
          onClick={() => runCommand("insertUnorderedList")}
          disabled={disabled}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Lista numerowana"
          onClick={() => runCommand("insertOrderedList")}
          disabled={disabled}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Cytat"
          onClick={() => runCommand("formatBlock", "<blockquote>")}
          disabled={disabled}
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <Button
          type="button"
          variant="ghost"
          onClick={() => runCommand("formatBlock", "<p>")}
          disabled={disabled}
          className="h-8 rounded-lg border border-white/10 bg-white/4 px-3 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white"
        >
          Akapit
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={() => changeCurrentIndent(1)}
          disabled={disabled}
          className="h-8 rounded-lg border border-white/10 bg-white/4 px-3 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white"
        >
          Wcięcie
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => changeCurrentIndent(-1)}
          disabled={disabled}
          className="h-8 rounded-lg border border-white/10 bg-white/4 px-3 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white"
        >
          Usuń wcięcie
        </Button>
        <div className="ml-auto flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.mdown,.mkd,.txt,application/pdf,text/markdown,text/x-markdown,text/plain"
            onChange={(event) => handleFileSelection(event.target.files)}
            className="hidden"
            disabled={disabled || isImporting}
          />
          <Button
            type="button"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isImporting}
            className="h-8 rounded-lg border border-white/10 bg-white/4 px-3 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white"
          >
            <FileUp className="mr-2 h-4 w-4" />
            {isImporting ? "Importowanie..." : "Importuj PDF / Markdown"}
          </Button>
        </div>
      </div>

      <div className="border-b border-white/10 px-4 py-2 text-xs text-white/50">
        `Tab` zwiększa wcięcie bieżącego akapitu albo zagnieżdża element listy.
        `Shift+Tab` cofa wcięcie. Możesz też przeciągnąć tutaj plik PDF albo
        Markdown i wstawić go bez zapisu pliku.
      </div>

      <div
        className={cn(
          "relative min-h-55 transition-colors",
          isDraggingFile && "bg-brand-yellow/6",
        )}
        onDragOver={(event) => {
          if (disabled) {
            return;
          }

          event.preventDefault();
          setIsDraggingFile(true);
        }}
        onDragLeave={(event) => {
          if (
            !event.currentTarget.contains(event.relatedTarget as Node | null)
          ) {
            setIsDraggingFile(false);
          }
        }}
        onDrop={(event) => {
          if (disabled) {
            return;
          }

          event.preventDefault();
          setIsDraggingFile(false);
          handleFileSelection(event.dataTransfer.files);
        }}
      >
        {isEmpty && !isFocused ? (
          <div className="pointer-events-none absolute left-4 top-3 text-sm text-white/35">
            {placeholder}
          </div>
        ) : null}

        <div
          ref={editorRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={syncEditorValue}
          onBlur={() => {
            setIsFocused(false);
            syncEditorValue();
          }}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleTabKey}
          className={cn(
            "statute-rich-text min-h-55 px-4 py-3 text-sm text-white outline-none",
            "**:data-[indent='1']:ml-6 **:data-[indent='2']:ml-12 **:data-[indent='3']:ml-18 **:data-[indent='4']:ml-24 **:data-[indent='5']:ml-30 **:data-[indent='6']:ml-36",
            "[&_a]:text-brand-yellow [&_a]:underline [&_a]:underline-offset-2",
            "[&_blockquote]:border-l-2 [&_blockquote]:border-brand-yellow/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-white/75",
            "[&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-white",
            "[&_h3]:mt-5 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-white",
            "[&_li]:mt-1.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:min-h-6 [&_p]:leading-7 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-6",
            disabled && "cursor-not-allowed opacity-70",
          )}
        />

        {isDraggingFile ? (
          <div className="pointer-events-none absolute inset-3 rounded-lg border border-dashed border-brand-yellow/45 bg-black/50 px-4 py-3 text-sm text-white/80">
            Upuść PDF albo Markdown, a treść zostanie automatycznie wstawiona do
            edytora.
          </div>
        ) : null}
      </div>
    </div>
  );
}
