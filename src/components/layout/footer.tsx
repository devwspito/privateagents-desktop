import { cn } from "@/lib/utils"

import { buttonVariants } from "@/components/ui/button"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-background border-t border-sidebar-border">
      <div className="container flex justify-center items-center p-4 md:px-6">
        <p className="text-xs text-muted-foreground md:text-sm">
          Private Agents © {currentYear}
        </p>
      </div>
    </footer>
  )
}
