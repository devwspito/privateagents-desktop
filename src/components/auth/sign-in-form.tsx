"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/providers/auth-provider"
import { useForm } from "react-hook-form"
import { Building2 } from "lucide-react"

import type { LocaleType, SignInFormType } from "@/types"

import { hasEnabledOAuthProviders } from "@/data/oauth-links"

import { SignInSchema } from "@/schemas/sign-in-schema"

import { ensureLocalizedPathname } from "@/lib/i18n"
import { ensureRedirectPathname } from "@/lib/utils"

import { toast } from "@/hooks/use-toast"
import { ButtonLoading } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { SeparatorWithText } from "@/components/ui/separator"
import { OAuthLinks } from "./oauth-links"

interface CompanyInfo {
  id: string
  name: string
  slug: string
  logo_url: string | null
}

export function SignInForm() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)

  const companySlug = searchParams.get("company")

  // Fetch company info for branded sign-in
  useEffect(() => {
    if (!companySlug) return
    const API_URL = process.env["NEXT_PUBLIC_API_URL"] || "/api"
    fetch(`${API_URL}/auth/enterprise-by-slug/${companySlug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setCompanyInfo(data)
      })
      .catch(() => {})
  }, [companySlug])

  const redirectPathname =
    searchParams.get("redirectTo") ||
    process.env["NEXT_PUBLIC_HOME_PATHNAME"] ||
    "/"

  const form = useForm<SignInFormType>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const locale = params["lang"] as LocaleType
  const { isSubmitting } = form.formState
  const isDisabled = isSubmitting // Disable button if form is submitting

  const { signIn: doSignIn } = useAuth()

  async function onSubmit(data: SignInFormType) {
    const { email, password } = data

    try {
      await doSignIn(email, password)
      router.push(redirectPathname)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
        {companyInfo && (
          <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
            <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{companyInfo.name}</p>
              <p className="text-xs text-muted-foreground">Company workspace</p>
            </div>
          </div>
        )}
        <div className="grid grow gap-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href={ensureLocalizedPathname(
                      // Include redirect pathname if available, otherwise default to "/forgot-password"
                      redirectPathname
                        ? ensureRedirectPathname(
                            "/forgot-password",
                            redirectPathname
                          )
                        : "/forgot-password",
                      locale
                    )}
                    className="ms-auto inline-block text-sm underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <ButtonLoading isLoading={isSubmitting} disabled={isDisabled}>
          Sign In
        </ButtonLoading>
        <div className="-mt-4 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link
            href={ensureLocalizedPathname(
              // Include redirect pathname if available, otherwise default to "/register"
              redirectPathname
                ? ensureRedirectPathname("/register", redirectPathname)
                : "/register",
              locale
            )}
            className="underline"
          >
            Sign up
          </Link>
        </div>
        {hasEnabledOAuthProviders && (
          <>
            <SeparatorWithText>Or continue with</SeparatorWithText>
            <OAuthLinks />
          </>
        )}
      </form>
    </Form>
  )
}
