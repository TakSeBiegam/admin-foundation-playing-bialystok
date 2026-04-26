"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { Input } from "@/app/components/ui/input";
import { cn } from "@/lib/utils";

export type AutocompleteOption = {
  value: string;
  label: string;
  description?: string;
  keywords?: string[];
};

type AutocompleteInputProps = {
  id: string;
  value: string;
  options: AutocompleteOption[];
  placeholder?: string;
  emptyText?: string;
  maxItems?: number;
  disabled?: boolean;
  className?: string;
  onChange: (value: string) => void;
};

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

export default function AutocompleteInput({
  id,
  value,
  options,
  placeholder,
  emptyText = "Brak podpowiedzi dla tej frazy.",
  maxItems = 8,
  disabled,
  className,
  onChange,
}: AutocompleteInputProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredOptions = useMemo(() => {
    const query = normalizeSearchValue(value);
    const seenValues = new Set<string>();

    return options
      .filter((option) => {
        const searchableParts = [
          option.label,
          option.value,
          option.description ?? "",
          ...(option.keywords ?? []),
        ]
          .join(" ")
          .toLowerCase();

        return query === "" || searchableParts.includes(query);
      })
      .filter((option) => {
        const normalizedValue = normalizeSearchValue(option.value);
        if (seenValues.has(normalizedValue)) {
          return false;
        }

        seenValues.add(normalizedValue);
        return true;
      })
      .slice(0, maxItems);
  }, [maxItems, options, value]);

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <div className="relative">
        <Input
          id={id}
          value={value}
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          className="pr-9"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
      </div>

      {open && !disabled ? (
        <div className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#171717] p-2 shadow-[0_20px_40px_rgba(0,0,0,0.35)]">
          {filteredOptions.length > 0 ? (
            <div className="space-y-1">
              {filteredOptions.map((option) => {
                const selected =
                  normalizeSearchValue(value) ===
                  normalizeSearchValue(option.value);

                return (
                  <button
                    key={`${option.value}-${option.label}`}
                    type="button"
                    className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/6"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-white">
                        {option.label}
                      </p>
                      {option.description ? (
                        <p className="mt-0.5 text-xs leading-relaxed text-white/45">
                          {option.description}
                        </p>
                      ) : null}
                    </div>
                    {selected ? (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-3 py-4 text-sm text-white/45">{emptyText}</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
