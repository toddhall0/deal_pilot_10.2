import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Generate and view transaction reports</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:bg-muted/50">
          <CardHeader>
            <CardTitle>Deal Summary</CardTitle>
            <CardDescription>Overview of all deals and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View a comprehensive summary of all transactions including value, status, and key
              dates.
            </p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50">
          <CardHeader>
            <CardTitle>Task Report</CardTitle>
            <CardDescription>Due diligence task completion status</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Track task completion rates, overdue items, and team performance.
            </p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50">
          <CardHeader>
            <CardTitle>Financial Report</CardTitle>
            <CardDescription>Financial tracking and analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View deal values, fees, and financial projections across your portfolio.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
