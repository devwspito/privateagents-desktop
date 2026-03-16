"use client"

import {
  AlertCircle,
  Briefcase,
  CreditCard,
  FileText,
  MessageSquare,
  MoreHorizontal,
} from "lucide-react"

import type { ApprovalType } from "@/lib/api/client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export type { ApprovalType }

export const APPROVAL_CATEGORIES: ApprovalType[] = [
  "payment",
  "expense",
  "contract",
  "document",
  "hiring",
  "action",
  "schedule",
  "communication",
  "data_access",
  "other",
]

export const approvalCategoryLabels: Record<ApprovalType, string> = {
  payment: "Payments",
  expense: "Expenses",
  contract: "Contracts",
  document: "Documents",
  hiring: "Hiring",
  action: "Actions",
  schedule: "Scheduling",
  communication: "Communications",
  data_access: "Data Access",
  other: "Other",
}

export const approvalCategoryDescriptions: Record<ApprovalType, string> = {
  payment: "Financial transactions and monetary actions",
  expense: "Expense reports and reimbursements",
  contract: "Contract signing and legal agreements",
  document: "Document creation and approvals",
  hiring: "Recruitment and employee onboarding",
  action: "General actions and operations",
  schedule: "Calendar and scheduling operations",
  communication: "External communications and messages",
  data_access: "Sensitive data access requests",
  other: "Uncategorized operations",
}

export const approvalCategoryIcons: Record<ApprovalType, React.ReactNode> = {
  payment: <CreditCard className="size-4 text-blue-500" />,
  expense: <CreditCard className="size-4 text-emerald-500" />,
  contract: <FileText className="size-4 text-purple-500" />,
  document: <FileText className="size-4 text-indigo-500" />,
  hiring: <Briefcase className="size-4 text-green-500" />,
  action: <AlertCircle className="size-4 text-orange-500" />,
  schedule: <AlertCircle className="size-4 text-yellow-500" />,
  communication: <MessageSquare className="size-4 text-cyan-500" />,
  data_access: <AlertCircle className="size-4 text-red-500" />,
  other: <MoreHorizontal className="size-4 text-gray-500" />,
}

interface ApprovalCategoryCheckboxesProps {
  value: ApprovalType[]
  onChange: (value: ApprovalType[]) => void
  disabled?: boolean
  className?: string
}

export function ApprovalCategoryCheckboxes({
  value,
  onChange,
  disabled = false,
  className,
}: ApprovalCategoryCheckboxesProps) {
  const handleToggle = (category: ApprovalType, checked: boolean) => {
    if (checked) {
      onChange([...value, category])
    } else {
      onChange(value.filter((c) => c !== category))
    }
  }

  return (
    <div className={className}>
      {APPROVAL_CATEGORIES.map((category) => (
        <div
          key={category}
          className="flex items-start space-x-3 py-2 first:pt-0 last:pb-0"
        >
          <Checkbox
            id={`category-${category}`}
            checked={value.includes(category)}
            onCheckedChange={(checked) =>
              handleToggle(category, checked === true)
            }
            disabled={disabled}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label
              htmlFor={`category-${category}`}
              className="flex items-center gap-2 cursor-pointer"
            >
              {approvalCategoryIcons[category]}
              <span>{approvalCategoryLabels[category]}</span>
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              {approvalCategoryDescriptions[category]}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
