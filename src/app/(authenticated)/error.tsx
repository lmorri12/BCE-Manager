"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function AuthenticatedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="p-6">
      <Card className="max-w-xl mx-auto">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-[var(--destructive)]/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-[var(--destructive)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Something went wrong</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              We couldn&apos;t load this page. The issue has been logged.
            </p>
          </div>
          {error.message && (
            <p className="text-xs text-[var(--muted-foreground)] font-mono bg-[var(--muted)] rounded px-3 py-2 break-all">
              {error.message}
            </p>
          )}
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button onClick={reset} variant="default">
              <RotateCw className="h-4 w-4 mr-2" />
              Try again
            </Button>
            <Link href="/">
              <Button variant="outline">
                <Home className="h-4 w-4 mr-2" />
                Go home
              </Button>
            </Link>
          </div>
          {error.digest && (
            <p className="text-[10px] text-[var(--muted-foreground)] font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
