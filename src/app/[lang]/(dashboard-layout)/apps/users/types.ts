export interface UserType {
  id: string
  name: string
  email: string
  avatar?: string
  status: "active" | "inactive" | "pending"
  role: string
  createdAt: Date
  updatedAt: Date
}

export interface UsersStateType {
  users: UserType[]
  selectedUsers: UserType[]
  currentPage: number
  totalPages: number
  totalUsers: number
  searchTerm: string
}

export interface UsersContextType {
  usersState: UsersStateType
  handleGetUsers: (currentPage: number) => void
  handleSearchUsers: (term: string, currentPage: number) => void
  handleToggleSelectUser: (user: UserType) => void
  handleToggleSelectAllUsers: () => void
  handleDeleteUser: (userId: string) => void
}

export type UsersActionType =
  | { type: "getUsers"; currentPage: number }
  | { type: "searchUsers"; term: string; currentPage: number }
  | { type: "toggleSelectUser"; user: UserType }
  | { type: "toggleSelectAllUsers" }
  | { type: "deleteUser"; userId: string }
