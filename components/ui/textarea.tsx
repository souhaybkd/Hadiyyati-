import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-design-button border border-design-gray-300 bg-background px-4 py-3 text-design-body transition-design placeholder:text-design-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-design-primary focus-visible:ring-offset-2 focus-visible:border-design-primary disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea } 