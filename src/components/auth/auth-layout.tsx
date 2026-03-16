"use client"

import _Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"

import type { DictionaryType } from "@/lib/get-dictionary"
import type { LocaleType } from "@/types"
import type { ComponentProps } from "react"

import { ensureLocalizedPathname } from "@/lib/i18n"
import { cn } from "@/lib/utils"

import { LanguageDropdown } from "../language-dropdown"

interface AuthProps extends ComponentProps<"div"> {
  imgSrc?: string
  imgClassName?: string
  dictionary: DictionaryType
}

export function Auth({
  className,
  children,
  imgSrc,
  imgClassName,
  dictionary,
  ...props
}: AuthProps) {
  const params = useParams()
  const locale = params["lang"] as LocaleType

  return (
    <section
      className={cn(
        "container min-h-screen w-full flex justify-between px-0",
        className
      )}
      {...props}
    >
      <div className="flex-1 relative grid">
        <div className="absolute top-0 inset-x-0 flex justify-between items-center px-4 py-2.5">
          <Link
            href={ensureLocalizedPathname("/", locale)}
            className="flex items-center gap-2 text-foreground font-black z-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M12 8V4H8" />
              <rect width="16" height="12" x="4" y="8" rx="2" />
              <path d="M2 14h2" />
              <path d="M20 14h2" />
              <path d="M15 13v2" />
              <path d="M9 13v2" />
            </svg>
            <span>Private Agents</span>
          </Link>
          <LanguageDropdown dictionary={dictionary} />
        </div>
        <div className="max-w-[28rem] w-full m-auto px-6 py-12 space-y-6">
          {children}
        </div>
      </div>
      {imgSrc && <AuthImage imgSrc={imgSrc} className={cn("", imgClassName)} />}
    </section>
  )
}

interface AuthImageProps extends ComponentProps<"div"> {
  imgSrc?: string
}

export function AuthImage({ className, ...props }: AuthImageProps) {
  return (
    <div
      className={cn(
        "basis-1/2 relative hidden min-h-screen md:flex md:flex-col md:items-center md:justify-center",
        "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900",
        className
      )}
      {...props}
    >
      {/* Decorative grid */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[40rem] h-[40rem] bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center text-white px-12">
        <div className="flex justify-center mb-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-20 w-20 text-purple-300"
          >
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M2 14h2" />
            <path d="M20 14h2" />
            <path d="M15 13v2" />
            <path d="M9 13v2" />
          </svg>
        </div>
        <h2 className="text-4xl font-bold mb-4">Private Agents</h2>
        <p className="text-xl text-purple-200 max-w-md mx-auto">
          Agentes IA autónomos con control humano. 100% on-premise.
        </p>
        <div className="mt-8 flex justify-center gap-4 text-sm text-purple-300">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Multi-tenant
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Human-in-loop
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            500+ integrations
          </span>
        </div>
      </div>
    </div>
  )
}

export function AuthHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("space-y-2 text-center", className)} {...props} />
}

export function AuthTitle({ className, ...props }: ComponentProps<"h1">) {
  return (
    <h1
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    />
  )
}

export function AuthDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
}

export function AuthForm({ className, ...props }: ComponentProps<"div">) {
  return <div className={className} {...props} />
}

export function AuthFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("grid gap-6", className)} {...props} />
}
