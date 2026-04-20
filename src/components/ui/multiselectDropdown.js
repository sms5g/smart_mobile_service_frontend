"use client"

import React, { useState } from "react"
import { ArrowDownWideNarrow, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"

export function MultiSelect({
  options = [],
  value = [],
  onChange,
  placeholder = "Select options",
  valueKey = "_id",
  labelKey = "brand_name",
  disabledKey = "disabled",
  disabledLabel = "Unavailable",
}) {
  const [open, setOpen] = useState(false)

  const toggleOption = (selectedValue, isDisabled = false) => {
    if (!onChange) return
    if (isDisabled && !value.includes(selectedValue)) return

    if (value.includes(selectedValue)) {
      onChange(value.filter((v) => v !== selectedValue))
    } else {
      onChange([...value, selectedValue])
    }
  }

  const selectedLabels = options
    .filter((item) => value.includes(String(item[valueKey])))
    .map((item) => item[labelKey])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className="w-full h-9 justify-between"
        >
          <span className="truncate">
            {selectedLabels.length > 0
              ? selectedLabels.join(", ")
              : placeholder}
          </span>

          <ArrowDownWideNarrow className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup className="max-h-60 overflow-y-auto">
            {options.map((item) => {
              const itemValue = String(item[valueKey])
              const itemLabel =
                item[labelKey] || item.name || item.brand_name || item.model_name || "Unknown"
              const isSelected = value.includes(itemValue)
              const isDisabled = Boolean(item[disabledKey])
              const commandDisabled = isDisabled && !isSelected

              return (
                <CommandItem
                  key={itemValue}
                  disabled={commandDisabled}
                  onSelect={() => toggleOption(itemValue, isDisabled)}
                  className={cn(
                    "flex justify-between",
                    isDisabled ? "opacity-50" : ""
                  )}
                >
                  <span className="text-xs font-semibold">{itemLabel}</span>

                  {isDisabled ? (
                    <span className="ml-auto mr-2 text-[10px] font-medium text-muted-foreground">
                      {disabledLabel}
                    </span>
                  ) : null}

                  <Check
                    className={cn(
                      "h-4 w-4",
                      isSelected ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              )
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
