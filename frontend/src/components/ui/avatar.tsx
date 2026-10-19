import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const avatarVariants = cva(
  "inline-flex size-12 shrink-0 select-none items-center cursor-pointer justify-center rounded-full text-base font-bold uppercase",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground",
        secondary: "border border-primary bg-secondary text-rose-900",
        disable: "bg-badge text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
)

function getInitials(text?: string) {
  const words = text?.trim().split(/\s+/).filter(Boolean) ?? []
  if (words.length === 0) return "UN"
  if (words.length === 1) return Array.from(words[0]).slice(0, 2).join("")
  return words.slice(0, 2).map((word) => Array.from(word)[0]).join("")
}

function Avatar({
  text,
  variant = "primary",
  className,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof avatarVariants> & { text?: string }) {
  return (
    <span
      data-slot="avatar"
      role="img"
      aria-label={text ?? "ไม่ระบุผู้ใช้"}
      className={cn(avatarVariants({ variant }), className)}
      {...props}
    >
      {getInitials(text)}
    </span>
  )
}

export { Avatar, avatarVariants }
export default Avatar
