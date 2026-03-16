"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Loader2, Mail, Plus } from "lucide-react"

import {
  useCreateOAuthEmailAccount,
  useCreateWebmailAccount,
  useFinalizeOAuthEmail,
} from "@/lib/api/hooks"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const WebmailSchema = z.object({
  email_address: z.string().email("Invalid email address"),
  display_name: z.string().optional(),
  imap_host: z.string().min(1, "IMAP host is required"),
  imap_port: z.coerce.number().int().min(1).max(65535).default(993),
  smtp_host: z.string().min(1, "SMTP host is required"),
  smtp_port: z.coerce.number().int().min(1).max(65535).default(587),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  use_tls: z.boolean().default(true),
})

type WebmailFormData = z.infer<typeof WebmailSchema>

export function AddAccountDialog() {
  const [open, setOpen] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)

  const createWebmail = useCreateWebmailAccount()
  const createOAuth = useCreateOAuthEmailAccount()
  const finalizeOAuth = useFinalizeOAuthEmail()

  const form = useForm<WebmailFormData>({
    resolver: zodResolver(WebmailSchema),
    defaultValues: {
      email_address: "",
      display_name: "",
      imap_host: "",
      imap_port: 993,
      smtp_host: "",
      smtp_port: 587,
      username: "",
      password: "",
      use_tls: true,
    },
  })

  async function onWebmailSubmit(data: WebmailFormData) {
    try {
      await createWebmail.mutateAsync(data)
      toast.success("Webmail account added successfully")
      form.reset()
      setOpen(false)
    } catch {
      toast.error("Failed to add webmail account")
    }
  }

  async function handleOAuthConnect(provider: "gmail" | "outlook") {
    setOauthLoading(provider)
    try {
      const result = (await createOAuth.mutateAsync({
        provider,
        integration_id: provider,
      })) as { redirect_url: string; account_id: string }

      // Open OAuth redirect in new window
      const oauthWindow = window.open(
        result.redirect_url,
        "_blank",
        "width=600,height=700"
      )

      // Poll for OAuth completion
      const accountId = result.account_id
      const pollInterval = setInterval(async () => {
        try {
          await finalizeOAuth.mutateAsync(accountId)
          clearInterval(pollInterval)
          toast.success(
            `${provider === "gmail" ? "Gmail" : "Outlook"} account connected`
          )
          setOauthLoading(null)
          setOpen(false)
        } catch {
          // Still waiting — continue polling
        }
      }, 3000)

      // Stop polling after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval)
        setOauthLoading(null)
        if (oauthWindow && !oauthWindow.closed) {
          oauthWindow.close()
        }
      }, 120000)
    } catch {
      toast.error(`Failed to start ${provider} OAuth`)
      setOauthLoading(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full mt-2">
          <Plus className="h-4 w-4 me-1" />
          Add Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Email Account</DialogTitle>
          <DialogDescription>
            Connect a webmail, Gmail, or Outlook account.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="webmail">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="webmail">Webmail</TabsTrigger>
            <TabsTrigger value="gmail">Gmail</TabsTrigger>
            <TabsTrigger value="outlook">Outlook</TabsTrigger>
          </TabsList>

          <TabsContent value="webmail" className="space-y-4 mt-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onWebmailSubmit)}
                className="space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="email_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="you@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="display_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="imap_host"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IMAP Host</FormLabel>
                        <FormControl>
                          <Input placeholder="imap.example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="imap_port"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IMAP Port</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="smtp_host"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Host</FormLabel>
                        <FormControl>
                          <Input placeholder="smtp.example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="smtp_port"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Port</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="use_tls"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Use TLS</FormLabel>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createWebmail.isPending}
                >
                  {createWebmail.isPending && (
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  )}
                  Add Webmail Account
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="gmail" className="mt-4">
            <div className="flex flex-col items-center gap-4 py-8">
              <Mail className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                Connect your Gmail account using Google OAuth.
              </p>
              <Button
                onClick={() => handleOAuthConnect("gmail")}
                disabled={oauthLoading === "gmail"}
                className="w-full max-w-xs"
              >
                {oauthLoading === "gmail" ? (
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 me-2" />
                )}
                {oauthLoading === "gmail"
                  ? "Connecting..."
                  : "Connect with Google"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="outlook" className="mt-4">
            <div className="flex flex-col items-center gap-4 py-8">
              <Mail className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                Connect your Outlook account using Microsoft OAuth.
              </p>
              <Button
                onClick={() => handleOAuthConnect("outlook")}
                disabled={oauthLoading === "outlook"}
                className="w-full max-w-xs"
              >
                {oauthLoading === "outlook" ? (
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 me-2" />
                )}
                {oauthLoading === "outlook"
                  ? "Connecting..."
                  : "Connect with Microsoft"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
