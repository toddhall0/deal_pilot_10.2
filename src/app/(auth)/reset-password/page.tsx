import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { FolderKanban } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <>
      <div className="flex flex-col items-center space-y-2 text-center">
        <FolderKanban className="h-12 w-12" />
        <h1 className="text-2xl font-bold">Deal Pilot</h1>
        <p className="text-sm text-muted-foreground">
          Transaction Management & Due Diligence Platform
        </p>
      </div>
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Reset password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
        </CardContent>
      </Card>
    </>
  );
}
