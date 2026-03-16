"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  endOfWeek as _endOfWeek,
  startOfWeek as _startOfWeek,
  eachDayOfInterval,
  format,
  subDays,
} from "date-fns"
import { useSession } from "@/providers/auth-provider"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Activity,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquare,
  RefreshCw,
  ThumbsUp,
  TrendingUp,
  XCircle,
  Zap,
  AlertCircle as _AlertCircle,
  Calendar as _Calendar,
  Filter as _Filter,
  Users as _Users,
} from "lucide-react"

import type { Agent, Task } from "@/lib/api/client"

import { api } from "@/lib/api"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs as _Tabs,
  TabsContent as _TabsContent,
  TabsList as _TabsList,
  TabsTrigger as _TabsTrigger,
} from "@/components/ui/tabs"

// Chart colors
const COLORS = {
  primary: "#3b82f6",
  success: "#22c55e",
  warning: "#eab308",
  danger: "#ef4444",
  info: "#06b6d4",
  purple: "#8b5cf6",
}

// Generate mock data for charts (in production, this would come from API)
function generateChartData(days: number) {
  const end = new Date()
  const start = subDays(end, days - 1)
  const dates = eachDayOfInterval({ start, end })

  return dates.map((date, _i) => {
    const completed = Math.floor(Math.random() * 30) + 10
    const pending = Math.floor(Math.random() * 15) + 5
    const failed = Math.floor(Math.random() * 5)
    const autoApproved = Math.floor(completed * (0.3 + Math.random() * 0.4))
    const humanApproved = completed - autoApproved

    return {
      date: format(date, "MMM dd"),
      fullDate: format(date, "yyyy-MM-dd"),
      completed,
      pending,
      failed,
      total: completed + pending + failed,
      autoApproved,
      humanApproved,
      approvalRate: Math.floor((autoApproved / (completed || 1)) * 100),
    }
  })
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [dateRange, setDateRange] = useState("7d")
  const [_chartType, _setChartType] = useState("area")

  const enterpriseId = session?.user?.enterprise_id

  // Generate chart data based on selected range
  const chartData = useMemo(() => {
    const days =
      dateRange === "7d"
        ? 7
        : dateRange === "14d"
          ? 14
          : dateRange === "30d"
            ? 30
            : 90
    return generateChartData(days)
  }, [dateRange])

  // Fetch all stats
  const {
    data: taskStats,
    isLoading: loadingTasks,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: ["tasks", "stats", enterpriseId],
    queryFn: () => api.getTaskStats(enterpriseId),
    enabled: !!enterpriseId,
    staleTime: 30000,
  })

  const {
    data: approvalStats,
    isLoading: loadingApprovals,
    refetch: refetchApprovals,
  } = useQuery({
    queryKey: ["approvals", "stats", enterpriseId],
    queryFn: () => api.getApprovalStats(enterpriseId),
    enabled: !!enterpriseId,
    staleTime: 30000,
  })

  const { data: agentsData, isLoading: loadingAgents } = useQuery({
    queryKey: ["agents", enterpriseId],
    queryFn: () => api.getAgents({ enterprise_id: enterpriseId }),
    enabled: !!enterpriseId,
  })

  const { data: tasksData, isLoading: _loadingRecentTasks } = useQuery({
    queryKey: ["tasks", enterpriseId, "recent"],
    queryFn: () => api.getTasks({ enterprise_id: enterpriseId }),
    enabled: !!enterpriseId,
    staleTime: 30000,
  })

  const agents = agentsData?.items || []
  const recentTasks = useMemo(() => (tasksData?.items || []).slice(0, 5), [tasksData])
  const activeAgents = useMemo(() => agents.filter((a: Agent) => a.enabled).length, [agents])

  // Pre-compute weekly chart summary to avoid repeated slice/reduce in JSX
  const weeklyChartData = useMemo(() => {
    const week = chartData.slice(-7)
    return {
      data: week,
      totalTasks: week.reduce((acc, d) => acc + d.total, 0),
      completed: week.reduce((acc, d) => acc + d.completed, 0),
      autoApproved: week.reduce((acc, d) => acc + d.autoApproved, 0),
      avgApprovalRate: Math.round(week.reduce((acc, d) => acc + d.approvalRate, 0) / 7),
    }
  }, [chartData])

  const handleRefresh = () => {
    refetchTasks()
    refetchApprovals()
  }

  const isLoading = loadingTasks || loadingApprovals || loadingAgents

  if (isLoading) {
    return (
      <div className="container p-6 flex justify-center items-center h-64">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  // Calculate metrics
  const autoApprovalRate = taskStats?.total
    ? ((taskStats.auto_approved ?? 0) / taskStats.total) * 100
    : 0
  const completionRate = taskStats?.total
    ? (taskStats.completed / taskStats.total) * 100
    : 0
  const avgResponseTime = approvalStats?.avg_response_minutes || 0

  return (
    <div className="container p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="size-6" />
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Real-time overview of your AI agents' performance
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="mr-2 size-4" />
          Refresh
        </Button>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Activity className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {taskStats?.pending || 0} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Completion Rate
            </CardTitle>
            <CheckCircle2 className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completionRate.toFixed(0)}%
            </div>
            <Progress value={completionRate} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Auto-Approved</CardTitle>
            <Zap className="size-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {autoApprovalRate.toFixed(0)}%
            </div>
            <Progress value={autoApprovalRate} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Clock className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgResponseTime < 60
                ? `${avgResponseTime.toFixed(0)} min`
                : `${(avgResponseTime / 60).toFixed(1)} hrs`}
            </div>
            <p className="text-xs text-muted-foreground">Human approval time</p>
          </CardContent>
        </Card>
      </div>

      {/* Second row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Approval Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ThumbsUp className="size-5" />
              Today's Approvals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pending</span>
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-yellow-800"
              >
                {approvalStats?.pending || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Approved Today
              </span>
              <Badge className="bg-green-100 text-green-800">
                {approvalStats?.approved_today || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Rejected Today
              </span>
              <Badge className="bg-red-100 text-red-800">
                {approvalStats?.rejected_today || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Agent Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="size-5" />
              Agent Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Total Agents
              </span>
              <span className="font-medium">{agents.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active</span>
              <Badge className="bg-green-100 text-green-800">
                {activeAgents}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Disabled</span>
              <Badge variant="secondary">{agents.length - activeAgents}</Badge>
            </div>
            <Progress value={(activeAgents / agents.length) * 100 || 0} />
          </CardContent>
        </Card>

        {/* Task Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="size-5" />
              Task Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-green-500" />
                <span className="text-sm">Completed</span>
              </div>
              <span className="font-medium">{taskStats?.completed || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-yellow-500" />
                <span className="text-sm">Pending</span>
              </div>
              <span className="font-medium">{taskStats?.pending || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-red-500" />
                <span className="text-sm">Failed</span>
              </div>
              <span className="font-medium">{taskStats?.failed || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-blue-500" />
                <span className="text-sm">Human Approved</span>
              </div>
              <span className="font-medium">
                {taskStats?.human_approved || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Tasks Over Time */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="size-5" />
                  Tasks Over Time
                </CardTitle>
                <CardDescription>
                  Daily task volume and completion
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">7 days</SelectItem>
                    <SelectItem value="14d">14 days</SelectItem>
                    <SelectItem value="30d">30 days</SelectItem>
                    <SelectItem value="90d">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stackId="1"
                  stroke={COLORS.success}
                  fill={COLORS.success}
                  fillOpacity={0.6}
                  name="Completed"
                />
                <Area
                  type="monotone"
                  dataKey="pending"
                  stackId="1"
                  stroke={COLORS.warning}
                  fill={COLORS.warning}
                  fillOpacity={0.6}
                  name="Pending"
                />
                <Area
                  type="monotone"
                  dataKey="failed"
                  stackId="1"
                  stroke={COLORS.danger}
                  fill={COLORS.danger}
                  fillOpacity={0.6}
                  name="Failed"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Approval Rate Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="size-5" />
              Auto-Approval Rate Trend
            </CardTitle>
            <CardDescription>
              Percentage of tasks auto-approved over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [
                    `${value}%`,
                    "Auto-Approval Rate",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="approvalRate"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  dot={{ fill: COLORS.primary, strokeWidth: 2 }}
                  name="Auto-Approval %"
                />
                {/* Target line at 80% */}
                <Line
                  type="monotone"
                  dataKey={() => 80}
                  stroke={COLORS.success}
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                  name="Target (80%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Task Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Distribution</CardTitle>
            <CardDescription>Current breakdown by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    {
                      name: "Completed",
                      value: taskStats?.completed || 0,
                      color: COLORS.success,
                    },
                    {
                      name: "Pending",
                      value: taskStats?.pending || 0,
                      color: COLORS.warning,
                    },
                    {
                      name: "Failed",
                      value: taskStats?.failed || 0,
                      color: COLORS.danger,
                    },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {[COLORS.success, COLORS.warning, COLORS.danger].map(
                    (color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    )
                  )}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Approval Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Approval Methods</CardTitle>
            <CardDescription>Auto vs Human approvals</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyChartData.data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  dataKey="date"
                  type="category"
                  tick={{ fontSize: 12 }}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="autoApproved"
                  stackId="a"
                  fill={COLORS.primary}
                  name="Auto"
                />
                <Bar
                  dataKey="humanApproved"
                  stackId="a"
                  fill={COLORS.purple}
                  name="Human"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Summary</CardTitle>
            <CardDescription>This week's performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Tasks</span>
                <span className="font-medium">
                  {weeklyChartData.totalTasks}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Completed</span>
                <span className="font-medium text-green-600">
                  {weeklyChartData.completed}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Auto-Approved</span>
                <span className="font-medium text-blue-600">
                  {weeklyChartData.autoApproved}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Avg. Approval Rate</span>
                <span className="font-medium">
                  {weeklyChartData.avgApprovalRate}%
                </span>
              </div>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 text-sm">
                {(chartData[chartData.length - 1]?.approvalRate ?? 0) >
                (chartData[chartData.length - 8]?.approvalRate ?? 0) ? (
                  <>
                    <ArrowUp className="size-4 text-green-600" />
                    <span className="text-green-600">
                      Trending up from last week
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="size-4 text-yellow-600" />
                    <span className="text-yellow-600">
                      Slightly down from last week
                    </span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="size-5" />
            Recent Tasks
          </CardTitle>
          <CardDescription>
            Latest task executions across all agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="mx-auto size-12 mb-2 opacity-50" />
              <p>No recent tasks</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTasks.map((task: Task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-10 items-center justify-center rounded-full ${
                        task.status === "completed"
                          ? "bg-green-100"
                          : task.status === "failed"
                            ? "bg-red-100"
                            : "bg-yellow-100"
                      }`}
                    >
                      {task.status === "completed" ? (
                        <CheckCircle2 className="size-5 text-green-600" />
                      ) : task.status === "failed" ? (
                        <XCircle className="size-5 text-red-600" />
                      ) : (
                        <Clock className="size-5 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium truncate max-w-md">
                        {task.title ||
                          task.input_text?.slice(0, 50) ||
                          "Untitled task"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {task.agent_id || "Unassigned"} •{" "}
                        {format(new Date(task.created_at), "p")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.requires_approval && (
                      <Badge
                        variant="outline"
                        className={
                          task.approval_status === "approved"
                            ? "border-green-200 text-green-700"
                            : task.approval_status === "rejected"
                              ? "border-red-200 text-red-700"
                              : "border-yellow-200 text-yellow-700"
                        }
                      >
                        {task.approval_status === "auto_approved"
                          ? "Auto"
                          : task.approval_status || "Pending"}
                      </Badge>
                    )}
                    <Badge
                      className={
                        task.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : task.status === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {task.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Autonomy Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="size-5" />
            Autonomy Progress
          </CardTitle>
          <CardDescription>
            Track your progress towards full agent autonomy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Auto-Approval Rate</span>
                <span className="text-sm text-muted-foreground">
                  {autoApprovalRate.toFixed(0)}% / 80% target
                </span>
              </div>
              <Progress value={(autoApprovalRate / 80) * 100} className="h-3" />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-lg border p-4">
                <p className="text-2xl font-bold text-yellow-600">PHASE 1</p>
                <p className="text-sm text-muted-foreground">Manual (100%)</p>
                <p className="text-xs mt-1">
                  {autoApprovalRate < 20 ? (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Current
                    </Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-800">
                      Complete
                    </Badge>
                  )}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-2xl font-bold text-blue-600">PHASE 2</p>
                <p className="text-sm text-muted-foreground">
                  Supervised (50%)
                </p>
                <p className="text-xs mt-1">
                  {autoApprovalRate >= 20 && autoApprovalRate < 50 ? (
                    <Badge className="bg-blue-100 text-blue-800">Current</Badge>
                  ) : autoApprovalRate >= 50 ? (
                    <Badge className="bg-green-100 text-green-800">
                      Complete
                    </Badge>
                  ) : (
                    <Badge variant="outline">Upcoming</Badge>
                  )}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-2xl font-bold text-green-600">PHASE 3</p>
                <p className="text-sm text-muted-foreground">Full (80%)</p>
                <p className="text-xs mt-1">
                  {autoApprovalRate >= 50 ? (
                    <Badge className="bg-green-100 text-green-800">
                      In Progress
                    </Badge>
                  ) : (
                    <Badge variant="outline">Upcoming</Badge>
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
