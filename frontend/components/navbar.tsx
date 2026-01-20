"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { OrionLogo } from "./orion-logo"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { LogOut, Database, Pencil, User } from "lucide-react"

interface NavbarProps {
  userEmail?: string
  onLogout?: () => void
}

export function Navbar({ userEmail, onLogout }: NavbarProps) {
  const pathname = usePathname()

  // Don't show navbar on login/signup pages
  if (pathname === "/login" || pathname === "/signup") return null

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/datasets" className="flex items-center gap-3 group">
          <OrionLogo className="w-8 h-8 text-primary transition-transform group-hover:scale-110" />
          <span className="text-xl font-semibold text-foreground tracking-tight">Orion</span>
        </Link>

        {/* Navigation + User Menu */}
        <nav className="flex items-center gap-1">
          {/* Datasets Tab */}
          <Link href="/datasets">
            <Button
              variant="ghost"
              size="sm"
              className={cn("gap-2", pathname === "/datasets" && "bg-primary/10 text-primary")}
            >
              <Database className="w-4 h-4" />
              Datasets
            </Button>
          </Link>

          {/* Annotate Tab */}
          <Link href="/annotate">
            <Button
              variant="ghost"
              size="sm"
              className={cn("gap-2", pathname === "/annotate" && "bg-primary/10 text-primary")}
            >
              <Pencil className="w-4 h-4" />
              Annotate
            </Button>
          </Link>

          {/* Divider */}
          <div className="w-px h-6 bg-border mx-2" />

          {/* User Menu */}
          {userEmail && onLogout ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                  <User className="w-4 h-4" />
                  <span className="max-w-[150px] truncate">{userEmail}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                <DropdownMenuItem 
                  onClick={onLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}