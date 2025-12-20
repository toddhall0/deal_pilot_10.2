"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DealStatusBadge } from "@/components/deals";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckSquare,
  FileText,
  Clock,
  DollarSign,
  MoreHorizontal,
  Pencil,
  Trash2,
  User,
  MapPin,
  StickyNote,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useDeal, useDealMutations } from "@/hooks/use-deals";
import { useToast } from "@/hooks/use-toast";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DealDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: deal, isLoading, error } = useDeal(id);
  const { deleteDeal } = useDealMutations();

  const handleDelete = async () => {
    try {
      await deleteDeal.mutateAsync(id);
      toast({
        title: "Deal deleted",
        description: "The deal has been successfully deleted.",
      });
      router.push("/deals");
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete deal",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <DealDetailSkeleton />;
  }

  if (error || !deal) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-muted-foreground mb-4">
          {error?.message || "Deal not found"}
        </p>
        <Button asChild>
          <Link href="/deals">Back to Deals</Link>
        </Button>
      </div>
    );
  }

  const location = [deal.propertyCity, deal.propertyState].filter(Boolean).join(", ");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/deals">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{deal.name}</h1>
              <DealStatusBadge status={deal.status} />
            </div>
            <p className="text-muted-foreground">
              {deal.dealNumber} · {deal.type?.replace(/_/g, " ")}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={"/deals/" + id + "/edit"}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Deal
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Deal
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deal._count?.tasks || 0}</div>
            <p className="text-xs text-muted-foreground">total tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deal._count?.documents || 0}</div>
            <p className="text-xs text-muted-foreground">uploaded files</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notes</CardTitle>
            <StickyNote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deal._count?.notes || 0}</div>
            <p className="text-xs text-muted-foreground">notes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(deal.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(deal.createdAt).getFullYear()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Deal Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Deal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="font-medium">{deal.client?.name || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Property Type</p>
                    <p className="font-medium">{deal.propertyType?.replace(/_/g, " ") || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{location || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium">
                      {new Date(deal.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {deal.propertyName && (
                  <div>
                    <p className="text-sm text-muted-foreground">Property Name</p>
                    <p className="font-medium">{deal.propertyName}</p>
                  </div>
                )}
                {deal.propertyAddress && (
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">
                      {deal.propertyAddress}
                      {deal.propertyCity && `, ${deal.propertyCity}`}
                      {deal.propertyState && `, ${deal.propertyState}`}
                      {deal.propertyZip && ` ${deal.propertyZip}`}
                    </p>
                  </div>
                )}
                {deal.propertyCounty && (
                  <div>
                    <p className="text-sm text-muted-foreground">County</p>
                    <p className="font-medium">{deal.propertyCounty}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {deal.acreage && (
                    <div>
                      <p className="text-sm text-muted-foreground">Acreage</p>
                      <p className="font-medium">{deal.acreage} acres</p>
                    </div>
                  )}
                  {deal.squareFootage && (
                    <div>
                      <p className="text-sm text-muted-foreground">Square Footage</p>
                      <p className="font-medium">{deal.squareFootage.toLocaleString()} sq ft</p>
                    </div>
                  )}
                </div>
                {!deal.propertyName && !deal.propertyAddress && (
                  <p className="text-sm text-muted-foreground">No property details added yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>Latest updates on this deal</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tasks</CardTitle>
                <CardDescription>Manage tasks for this deal</CardDescription>
              </div>
              <Button>Add Task</Button>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                No tasks yet. Create your first task to get started.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Documents</CardTitle>
                <CardDescription>Manage documents for this deal</CardDescription>
              </div>
              <Button>Upload Document</Button>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                No documents yet. Upload your first document to get started.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Notes</CardTitle>
                <CardDescription>Notes and comments for this deal</CardDescription>
              </div>
              <Button>Add Note</Button>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                No notes yet. Add your first note to get started.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
              <CardDescription>Key milestones and dates</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                No timeline milestones defined yet.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financials">
          <Card>
            <CardHeader>
              <CardTitle>Financials</CardTitle>
              <CardDescription>Financial details and projections</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                No financial information added yet.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deal.name}"? This action cannot be undone.
              All associated tasks, documents, and notes will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DealDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Skeleton className="h-10 w-96" />
      <Card>
        <CardContent className="py-8">
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
