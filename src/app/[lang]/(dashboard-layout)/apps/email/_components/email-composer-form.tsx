"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { ListRestart, MoreVertical, Send } from "lucide-react"

import type { EmailComposerFormType } from "../types"

import { EmailComposerSchema } from "../_schemas/email-composer-schema"

import { useSendEmail } from "@/lib/api/hooks"

import { useEmailContext } from "../_hooks/use-email-context"
import { Button, ButtonLoading } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Editor } from "@/components/ui/editor"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Toggle } from "@/components/ui/toggle"

export function EmailComposerForm() {
  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<string>("")
  const { accounts } = useEmailContext()
  const sendEmail = useSendEmail()
  const router = useRouter()

  const activeAccounts = accounts.filter((a) => a.status === "active")

  const form = useForm<EmailComposerFormType>({
    resolver: zodResolver(EmailComposerSchema),
    defaultValues: {
      to: "",
      cc: "",
      bcc: "",
      subject: "",
      content: "",
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(data: EmailComposerFormType) {
    const accountId = selectedAccountId || activeAccounts[0]?.id
    if (!accountId) {
      toast.error("No email account configured. Add an account first.")
      return
    }

    try {
      await sendEmail.mutateAsync({
        account_id: accountId,
        to: [data.to],
        cc: data.cc ? [data.cc] : undefined,
        bcc: data.bcc ? [data.bcc] : undefined,
        subject: data.subject,
        body_html: data.content,
      })
      toast.success("Email sent successfully")
      form.reset()
      router.back()
    } catch {
      toast.error("Failed to send email")
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="h-full flex flex-col justify-between gap-3"
      >
        <div className="px-3 space-y-2">
          {activeAccounts.length > 1 && (
            <Select
              value={selectedAccountId}
              onValueChange={setSelectedAccountId}
            >
              <SelectTrigger>
                <SelectValue placeholder="From account..." />
              </SelectTrigger>
              <SelectContent>
                {activeAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: account.color || "#6b7280" }}
                      />
                      {account.email_address}
                      <span className="text-xs text-muted-foreground capitalize">
                        ({account.provider})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="flex items-center justify-between gap-2">
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem className="grow space-y-0">
                  <FormControl>
                    <Input type="email" placeholder="To" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-2">
              <Toggle
                pressed={showCc}
                onPressedChange={() => setShowCc(!showCc)}
              >
                Cc
              </Toggle>
              <Separator orientation="vertical" className="h-4" />
              <Toggle
                pressed={showBcc}
                onPressedChange={() => setShowBcc(!showBcc)}
              >
                Bcc
              </Toggle>
            </div>
          </div>
          {showCc && (
            <FormField
              control={form.control}
              name="cc"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="email" placeholder="Cc" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {showBcc && (
            <FormField
              control={form.control}
              name="bcc"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="email" placeholder="Bcc" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="text" placeholder="Subject" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <Editor
                    placeholder="Write your message here..."
                    onValueChange={field.onChange}
                    className="h-[12.5rem]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-between items-center p-3 border-t border-border">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem>Save as draft</DropdownMenuItem>
                <DropdownMenuItem>Add label</DropdownMenuItem>
                <DropdownMenuItem>Plain text mode</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              type="reset"
              variant="ghost"
              size="icon"
              onClick={() => form.reset()}
            >
              <ListRestart className="h-4 w-4" />
            </Button>
          </div>

          <ButtonLoading
            isLoading={isSubmitting || sendEmail.isPending}
            size="icon"
            icon={Send}
            iconClassName="me-0"
            loadingIconClassName="me-0"
          />
        </div>
      </form>
    </Form>
  )
}
