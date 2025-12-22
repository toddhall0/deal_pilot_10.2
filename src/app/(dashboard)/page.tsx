import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, Users, CheckSquare, TrendingUp, Calendar, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

async function getDashboardData() {
  const [
    activeDeals,
    totalClients,
    pendingTaskCount,
    recentDeals,
    upcomingMilestones,
    pendingTasks,
  ] = await Promise.all([
    prisma.deal.count({
      where: { status: { in: ["ACTIVE", "IN_DUE_DILIGENCE", "UNDER_CONTRACT", "PENDING_CLOSING"] } },
    }),
    prisma.client.count(),
    prisma.task.count({
      where: { status: { in: ["TODO", "IN_PROGRESS", "IN_REVIEW"] } },
    }),
    prisma.deal.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { name: true } },
        _count: { select: { tasks: true, documents: true } },
      },
    }),
    prisma.milestone.findMany({
      where: {
        status: { in: ["PENDING", "IN_PROGRESS"] },
        dueDate: { gte: new Date() },
      },
      take: 5,
      orderBy: { dueDate: "asc" },
      include: {
        timeline: {
          include: {
            deal: { select: { name: true, dealNumber: true } },
          },
        },
      },
    }),
    prisma.task.findMany({
      where: { status: { in: ["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED"] } },
      take: 5,
      orderBy: [
        { dueDate: "asc" },
        { priority: "desc" },
        { createdAt: "desc" },
      ],
      include: {
        deal: { select: { id: true, name: true, dealNumber: true } },
        assignee: { select: { name: true } },
      },
    }),
  ]);

  // Calculate total deal value from financials
  const financials = await prisma.dealFinancials.aggregate({
    _sum: { contractPrice: true },
  });
  const totalDealValue = financials._sum.contractPrice?.toNumber() || 0;

  return {
    activeDeals,
    totalClients,
    pendingTaskCount,
    totalDealValue,
    recentDeals,
    upcomingMilestones,
    pendingTasks,
  };
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case "ACTIVE":
    case "IN_DUE_DILIGENCE":
      return "bg-blue-100 text-blue-800";
    case "PENDING_CLOSING":
      return "bg-yellow-100 text-yellow-800";
    case "CLOSED":
      return "bg-green-100 text-green-800";
    case "TERMINATED":
    case "ON_HOLD":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getTaskStatusColor(status: string): string {
  switch (status) {
    case "TODO":
      return "bg-gray-100 text-gray-800";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800";
    case "IN_REVIEW":
      return "bg-purple-100 text-purple-800";
    case "BLOCKED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case "URGENT":
      return "bg-red-100 text-red-800";
    case "HIGH":
      return "bg-orange-100 text-orange-800";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name}. Here&apos;s an overview of your transactions.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeDeals}</div>
            <p className="text-xs text-muted-foreground">
              {data.activeDeals === 1 ? "1 deal in progress" : `${data.activeDeals} deals in progress`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              {data.totalClients === 1 ? "1 client" : `${data.totalClients} clients`}
            </p>
          </CardContent>
        </Card>
        <Link href="/tasks">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.pendingTaskCount}</div>
              <p className="text-xs text-muted-foreground">
                {data.pendingTaskCount === 1 ? "1 task pending" : `${data.pendingTaskCount} tasks pending`}
              </p>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deal Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalDealValue)}</div>
            <p className="text-xs text-muted-foreground">Total contract value</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Deals</CardTitle>
            <CardDescription>Your most recent transaction activities</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentDeals.length > 0 ? (
              <div className="space-y-4">
                {data.recentDeals.map((deal) => (
                  <Link key={deal.id} href={`/deals/${deal.id}`} className="block">
                    <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0 hover:bg-muted/50 rounded p-2 -m-2 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{deal.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {deal.client.name} · {deal.dealNumber}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(deal.status)}`}>
                          {deal.status.replace(/_/g, " ")}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {deal._count.tasks} tasks
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                No deals to display. Create your first deal to get started.
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
            <CardDescription>Important dates and milestones</CardDescription>
          </CardHeader>
          <CardContent>
            {data.upcomingMilestones.length > 0 ? (
              <div className="space-y-4">
                {data.upcomingMilestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-center gap-3 border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100">
                      <Calendar className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{milestone.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {milestone.timeline.deal.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-orange-600">
                        {formatDistanceToNow(milestone.dueDate, { addSuffix: true })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {milestone.dueDate.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                No upcoming deadlines
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Tasks Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pending Tasks</CardTitle>
            <CardDescription>Tasks requiring attention across all deals</CardDescription>
          </div>
          <Link href="/tasks" className="text-sm text-primary hover:underline">
            View all tasks
          </Link>
        </CardHeader>
        <CardContent>
          {data.pendingTasks.length > 0 ? (
            <div className="space-y-3">
              {data.pendingTasks.map((task) => (
                <Link key={task.id} href={`/deals/${task.deal.id}?tab=tasks`} className="block">
                  <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0 hover:bg-muted/50 rounded p-2 -m-2 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {task.deal.name} · {task.deal.dealNumber}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getTaskStatusColor(task.status)} variant="secondary">
                        {task.status.replace(/_/g, " ")}
                      </Badge>
                      <Badge className={getPriorityColor(task.priority)} variant="secondary">
                        {task.priority}
                      </Badge>
                      {task.dueDate && (
                        <span className="text-xs text-muted-foreground">
                          Due {formatDistanceToNow(task.dueDate, { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex h-[100px] items-center justify-center text-muted-foreground">
              No pending tasks. Great job!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
