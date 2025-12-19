import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/forms/login-form";
import { FolderKanban } from "lucide-react";

export default function LoginPage() {
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
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex justify-center py-4">Loading...</div>}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>

      {/* Development test credentials */}
      <Card className="mt-4 border-dashed border-yellow-500/50 bg-yellow-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-yellow-600">Test Credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="font-medium">Admin:</span>
            <span className="font-mono">admin@dealpilot.com / Admin123!</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Attorney:</span>
            <span className="font-mono">john.smith@dealpilot.com / Attorney123!</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Client:</span>
            <span className="font-mono">mike.johnson@acmecorp.com / Client123!</span>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
