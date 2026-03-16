"use client"

import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/providers/auth-provider"
import { useForm } from "react-hook-form"
import { z } from "zod"

import type { LocaleType, RegisterFormType } from "@/types"

import { hasEnabledOAuthProviders } from "@/data/oauth-links"

import { RegisterSchema } from "@/schemas/register-schema"

import api from "@/lib/api/client"
import { API_BASE } from "@/lib/api-config"
import { useInvitationInfo } from "@/lib/api/hooks"
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

// Invitation-mode schema (no company name, email is pre-filled)
const InviteAcceptSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, { message: "First Name must contain at least 2 characters." })
    .max(50, { message: "First Name must contain at most 50 characters." }),
  lastName: z
    .string()
    .trim()
    .min(2, { message: "Last Name must contain at least 2 characters." })
    .max(50, { message: "Last Name must contain at most 50 characters." }),
  password: z.string().min(12, {
    message: "Password must contain at least 12 characters",
  }),
})

type InviteAcceptFormType = z.infer<typeof InviteAcceptSchema>

export function RegisterForm() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()

  const locale = params["lang"] as LocaleType
  const redirectPathname = searchParams.get("redirectTo")
  const inviteToken = searchParams.get("invite")

  // Fetch invitation info if invite token is present
  const {
    data: invitationInfo,
    isLoading: isLoadingInvite,
    error: inviteError,
  } = useInvitationInfo(inviteToken)

  const isInviteMode = !!inviteToken

  // Normal registration form
  const signupForm = useForm<RegisterFormType>({
    resolver: zodResolver(RegisterSchema),
  })

  // Invite acceptance form
  const inviteForm = useForm<InviteAcceptFormType>({
    resolver: zodResolver(InviteAcceptSchema),
  })

  const form = isInviteMode ? inviteForm : signupForm
  const { isSubmitting, isDirty } = form.formState
  const isDisabled = isSubmitting || !isDirty

  const { signIn: doSignIn } = useAuth()

  async function onSignupSubmit(data: RegisterFormType) {
    const { firstName, lastName, companyName, email, password } = data

    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          company_name: companyName,
          email,
          password,
        }),
      })

      const responseData = await res.json()

      if (res.status >= 400) {
        throw new Error(responseData.detail || "Registration failed")
      }

      // Auto-login after signup
      await doSignIn(email, password)

      toast({ title: "Welcome!" })
      router.push(
        redirectPathname || process.env["NEXT_PUBLIC_HOME_PATHNAME"] || "/"
      )
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  async function onInviteSubmit(data: InviteAcceptFormType) {
    if (!inviteToken || !invitationInfo) return

    try {
      await api.acceptInvitation({
        token: inviteToken,
        name: `${data.firstName} ${data.lastName}`,
        password: data.password,
      })

      // Auto-login after invite acceptance
      await doSignIn(invitationInfo.email, data.password)

      toast({ title: `Welcome to ${invitationInfo.enterprise_name}!` })
      router.push(process.env["NEXT_PUBLIC_HOME_PATHNAME"] || "/")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  // Invitation mode — loading state
  if (isInviteMode && isLoadingInvite) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    )
  }

  // Invitation mode — error state
  if (isInviteMode && (inviteError || !invitationInfo)) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="text-destructive text-lg font-semibold">
          Invalid Invitation
        </div>
        <p className="text-sm text-muted-foreground">
          This invitation link is invalid, has expired, or has already been
          used.
        </p>
        <Link
          href={ensureLocalizedPathname("/sign-in", locale)}
          className="text-sm underline"
        >
          Go to Sign In
        </Link>
      </div>
    )
  }

  // Invitation mode — form
  if (isInviteMode && invitationInfo) {
    return (
      <div className="grid gap-6">
        {/* Enterprise branding */}
        <div className="text-center space-y-2 pb-2">
          {!!(invitationInfo as unknown as Record<string, unknown>)["enterprise_logo_url"] && (
            <img
              src={(invitationInfo as unknown as Record<string, unknown>)["enterprise_logo_url"] as string}
              alt={invitationInfo.enterprise_name}
              className="h-12 mx-auto mb-2"
            />
          )}
          <p className="text-lg font-semibold">
            {invitationInfo.enterprise_name}
          </p>
          <p className="text-sm text-muted-foreground">
            You&apos;ve been invited to join as{" "}
            <strong>{invitationInfo.role}</strong>
          </p>
        </div>

        <Form {...inviteForm}>
          <form
            onSubmit={inviteForm.handleSubmit(onInviteSubmit)}
            className="grid gap-4"
          >
            {/* Email (readonly) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={invitationInfo.email}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={inviteForm.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={inviteForm.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={inviteForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Minimum 12 characters"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ButtonLoading isLoading={isSubmitting} disabled={isDisabled}>
              Join {invitationInfo.enterprise_name}
            </ButtonLoading>
          </form>
        </Form>

        <div className="text-center text-sm">
          Already have an account?{" "}
          <Link
            href={ensureLocalizedPathname("/sign-in", locale)}
            className="underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  // Normal signup form
  return (
    <Form {...signupForm}>
      <form
        onSubmit={signupForm.handleSubmit(onSignupSubmit)}
        className="grid gap-6"
      >
        <div className="grid gap-2">
          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={signupForm.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={signupForm.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={signupForm.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="Acme Corp" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={signupForm.control}
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
            control={signupForm.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <ButtonLoading isLoading={isSubmitting} disabled={isDisabled}>
          Create Account
        </ButtonLoading>
        <div className="-mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link
            href={ensureLocalizedPathname(
              redirectPathname
                ? ensureRedirectPathname("/sign-in", redirectPathname)
                : "/sign-in",
              locale
            )}
            className="underline"
          >
            Sign in
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
