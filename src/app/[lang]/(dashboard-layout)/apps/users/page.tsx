import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InvitationsTable } from "./_components/invitations-table"
import { UsersTable } from "./_components/users-table"
import { InviteUserDialog } from "@/components/users"

export default function UsersPage() {
  return (
    <div className="container p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users Management</h1>
          <p className="text-muted-foreground">
            Manage your organization users and invitations.
          </p>
        </div>
        <InviteUserDialog />
      </div>
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UsersTable />
        </TabsContent>
        <TabsContent value="invitations">
          <InvitationsTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}
