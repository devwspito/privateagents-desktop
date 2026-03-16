"use client"

import { useEffect, useState } from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

interface ThresholdSliderProps
  extends Omit<
    ComponentProps<typeof SliderPrimitive.Root>,
    "value" | "onChange"
  > {
  value?: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  formatValue?: (value: number) => string
  showValue?: boolean
  label?: string
}

export function ThresholdSlider({
  value: controlledValue,
  onChange,
  min = 0,
  max = 1000,
  step = 25,
  formatValue = defaultFormatValue,
  showValue = true,
  label,
  className,
  disabled,
  ...props
}: ThresholdSliderProps) {
  const [internalValue, setInternalValue] = useState<number>(
    controlledValue ?? min
  )

  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue)
    }
  }, [controlledValue])

  function handleChange(newValue: number[]) {
    const value = newValue[0]!
    setInternalValue(value)
    onChange?.(value)
  }

  return (
    <div
      data-slot="threshold-slider"
      className={cn("w-full space-y-3", className)}
    >
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <label className="text-sm font-medium text-foreground">
              {label}
            </label>
          )}
          {showValue && (
            <span className="text-sm font-semibold text-primary">
              {formatValue(internalValue)}
            </span>
          )}
        </div>
      )}
      <SliderPrimitive.Root
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          disabled && "cursor-not-allowed opacity-50"
        )}
        min={min}
        max={max}
        step={step}
        value={[internalValue]}
        onValueChange={handleChange}
        disabled={disabled}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-primary/20">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className={cn(
            "cursor-pointer block h-5 w-5 rounded-full border-2 border-primary/50 bg-background shadow-sm",
            "transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50",
            "hover:border-primary hover:scale-110"
          )}
        />
      </SliderPrimitive.Root>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  )
}

function defaultFormatValue(value: number): string {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}
