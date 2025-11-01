"use client";

import * as React from "react";
import { cn } from "./utils";

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

function Switch({ className, checked, onCheckedChange, onChange, ...props }: SwitchProps) {
  return (
    <label className="inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => {
          onChange?.(e);
          onCheckedChange?.(e.target.checked);
        }}
        {...props}
      />
      <div
        className={cn(
          "relative w-8 h-[1.15rem] rounded-full transition-colors",
          "peer-checked:bg-red-600 peer-unchecked:bg-gray-300",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-red-600/50",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          className
        )}
      >
        <div
          className={cn(
            "absolute top-[1px] left-[1px] bg-white w-4 h-4 rounded-full transition-transform",
            "peer-checked:translate-x-[calc(100%-2px)] peer-unchecked:translate-x-0"
          )}
        />
      </div>
    </label>
  );
}

export { Switch };
