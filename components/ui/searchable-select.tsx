"use client"

import * as React from "react"
import { Check, ChevronDown, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

export type SelectOption<T extends string = string> = {
  value: T
  label: string
  /** Optional group label — items sharing the same group are rendered together. */
  group?: string
}

type SearchableSelectProps<T extends string = string> = {
  options: readonly SelectOption<T>[]
  value: T | ""
  onChange: (next: T | "") => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  /** When set, an "Other" item is appended that calls this callback with the
   * current input value typed in the search box. The chosen value is then
   * displayed verbatim in the trigger. Useful for unbounded fields like Company. */
  onSelectOther?: (typed: string) => void
  otherLabel?: string
  /** Compare values case-insensitively when checking selection. */
  className?: string
  triggerClassName?: string
  disabled?: boolean
  /** Width of the popover content. Defaults to matching the trigger. */
  contentWidth?: number | "trigger"
}

export function SearchableSelect<T extends string = string>({
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results.",
  onSelectOther,
  otherLabel = "Other",
  className,
  triggerClassName,
  disabled,
  contentWidth = "trigger",
}: SearchableSelectProps<T>) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  // Group options by their `group` field, preserving original order.
  const groupedOptions = React.useMemo(() => {
    const map = new Map<string, SelectOption<T>[]>()
    for (const opt of options) {
      const key = opt.group || ""
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(opt)
    }
    return Array.from(map.entries())
  }, [options])

  // Lookup label for the current value (handle free-text "Other" too).
  const currentLabel = React.useMemo(() => {
    if (!value) return ""
    const match = options.find((o) => o.value === value)
    return match ? match.label : value // Free-text fallback shows raw value
  }, [options, value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-lg border border-border bg-background px-3.5 text-left text-[14px] transition-colors hover:bg-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60",
            triggerClassName
          )}
        >
          <span className={cn("truncate", !currentLabel && "text-muted-foreground")}>
            {currentLabel || placeholder}
          </span>
          <ChevronDown className="ml-2 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("p-0", className)}
        style={
          contentWidth === "trigger"
            ? { width: "var(--radix-popover-trigger-width)" }
            : { width: contentWidth }
        }
        align="start"
      >
        <Command shouldFilter={true}>
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
            <CommandInput
              placeholder={searchPlaceholder}
              value={query}
              onValueChange={setQuery}
              className="h-10 border-0 px-0 text-[13px] focus:ring-0"
            />
          </div>
          <CommandList className="max-h-[280px]">
            <CommandEmpty className="py-6 text-center text-[12px] text-muted-foreground">
              {emptyText}
            </CommandEmpty>
            {groupedOptions.map(([group, items], gi) => (
              <React.Fragment key={group || `__${gi}`}>
                {gi > 0 && <CommandSeparator />}
                <CommandGroup heading={group || undefined}>
                  {items.map((opt) => (
                    <CommandItem
                      key={opt.value}
                      value={opt.label}
                      onSelect={() => {
                        onChange(opt.value)
                        setOpen(false)
                      }}
                      className="cursor-pointer text-[13px]"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-3.5 w-3.5",
                          value === opt.value ? "opacity-100 text-sage" : "opacity-0"
                        )}
                      />
                      <span className="truncate">{opt.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </React.Fragment>
            ))}

            {onSelectOther && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    value={`__other__ ${query}`}
                    onSelect={() => {
                      onSelectOther(query.trim())
                      setOpen(false)
                    }}
                    className="cursor-pointer text-[13px]"
                  >
                    <Check className="mr-2 h-3.5 w-3.5 opacity-0" />
                    <span>
                      {query.trim()
                        ? `${otherLabel}: "${query.trim()}"`
                        : otherLabel}
                    </span>
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
