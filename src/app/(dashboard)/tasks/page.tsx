"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, FolderOpen, ExternalLink } from "lucide-react";
import { useAllTasks } from "@/hooks/use-all-tasks";
import type { TaskStatus, TaskPriority } from "@/types/prisma";

const statusColors: Record<TaskStatus, string> = {
  TODO: "bg-gray-100 text-gray-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  IN_REVIEW: "bg-purple-100 text-purple-800",
  BLOCKED: "bg-red-100 text-red-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const priorityColors: Record<TaskPriority, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

const TRANSACTION_STAGE_LABELS: Record<string, string> = {
  CONTRACT_NEGOTIATION: "Contract Negotiation",
  DUE_DILIGENCE: "Due Diligence",
  TITLE_SURVEY: "Title & Survey",
  FINANCING: "Financing",
  CLOSING: "Closing",
  POST_CLOSING: "Post-Closing",
  OTHER: "Other",
};

function TaskList({ status }: { status?: string }) {
  const { data: tasks, isLoading } = useAllTasks({ status });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        {status === "COMPLETED"
          ? "No completed tasks"
          : status === "TODO"
          ? "No pending tasks"
          : status === "IN_PROGRESS,IN_REVIEW"
          ? "No tasks in progress"
          : "No tasks found. Create a task in a deal to get started."}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`font-medium ${task.status === "COMPLETED" ? "line-through text-muted-foreground" : ""}`}>
                {task.title}
              </span>
              <Badge className={statusColors[task.status]} variant="secondary">
                {task.status.replace(/_/g, " ")}
              </Badge>
              <Badge className={priorityColors[task.priority]} variant="secondary">
                {task.priority}
              </Badge>
              {task.category && (
                <Badge variant="outline" className="text-xs">
                  <FolderOpen className="h-3 w-3 mr-1" />
                  {TRANSACTION_STAGE_LABELS[task.category] || task.category}
                </Badge>
              )}
            </div>
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                {task.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Link
                href={`/deals/${task.deal.id}`}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                {task.deal.name} ({task.deal.dealNumber})
              </Link>
              {task.dueDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
              {task.assignee && (
                <span className="flex items-center gap-1">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={task.assignee.avatar || undefined} />
                    <AvatarFallback className="text-[8px]">
                      {task.assignee.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {task.assignee.name}
                </span>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/deals/${task.deal.id}?tab=tasks`}>View</Link>
          </Button>
        </div>
      ))}
    </div>
  );
}

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Track and manage your due diligence tasks across all deals</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="todo">To Do</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Tasks</CardTitle>
              <CardDescription>View all tasks across all deals</CardDescription>
            </CardHeader>
            <CardContent>
              <TaskList />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="todo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>To Do</CardTitle>
              <CardDescription>Tasks that need to be started</CardDescription>
            </CardHeader>
            <CardContent>
              <TaskList status="TODO" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="in-progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>In Progress</CardTitle>
              <CardDescription>Tasks currently being worked on</CardDescription>
            </CardHeader>
            <CardContent>
              <TaskList status="IN_PROGRESS,IN_REVIEW" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed</CardTitle>
              <CardDescription>Tasks that have been finished</CardDescription>
            </CardHeader>
            <CardContent>
              <TaskList status="COMPLETED" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
