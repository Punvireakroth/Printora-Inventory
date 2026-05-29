"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const EMPTY_VALUE = "__field_select_empty__";

export type FieldSelectOption = {
  value: string;
  label: string;
};

type FieldSelectProps = {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: FieldSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  size?: "sm" | "default";
  "aria-invalid"?: boolean;
};

function toSelectValue (value: string): string {
  return value === "" ? EMPTY_VALUE : value;
}

function fromSelectValue (value: string | null): string {
  if (value === null || value === EMPTY_VALUE) {
    return "";
  }
  return value;
}

export function FieldSelect ({
  id,
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  className,
  triggerClassName,
  size = "default",
  "aria-invalid": ariaInvalid,
}: FieldSelectProps) {
  const items = Object.fromEntries(
    options.map((option) => [
      toSelectValue(option.value),
      option.label,
    ]),
  );

  return (
    <div className={cn("w-full", className)}>
      <Select
        disabled={disabled}
        items={items}
        onValueChange={(nextValue) => {
          onValueChange(fromSelectValue(nextValue));
        }}
        value={toSelectValue(value)}
      >
        <SelectTrigger
          aria-invalid={ariaInvalid}
          className={triggerClassName}
          id={id}
          size={size}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent align="start">
          {options.map((option) => (
            <SelectItem
              key={toSelectValue(option.value)}
              value={toSelectValue(option.value)}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
