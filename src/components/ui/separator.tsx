"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils/utils"

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      decorative={decorative}
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      orientation={orientation}
      className={cn(
        "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        className
      )}
      {...props}
    />
  )
}

export { Separator }
