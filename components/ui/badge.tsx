import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-design focus:outline-none focus:ring-2 focus:ring-design-primary focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-design-gray-200 text-design-text-heading hover:bg-design-gray-300",
        secondary:
          "border-transparent bg-design-secondary text-white hover:bg-[#d4880e]",
        primary:
          "border-transparent bg-design-primary text-white hover:bg-[#5939d3]",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-design-text-heading border border-design-gray-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants } 