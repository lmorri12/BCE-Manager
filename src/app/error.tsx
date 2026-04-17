"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function RootError({
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <div className="max-w-md w-full rounded-lg border border-[var(--border)] bg-[var(--card)] p-8 text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-full bg-[var(--destructive)]/10 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-[var(--destructive)]">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        </div>
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          An unexpected error occurred. Please try again.
        </p>
        {error.message && (
          <p className="text-xs text-[var(--muted-foreground)] font-mono bg-[var(--muted)] rounded px-3 py-2 break-all">
            {error.message}
          </p>
        )}
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center h-10 px-4 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:bg-[var(--primary)]/90"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center h-10 px-4 rounded-md border border-[var(--border)] text-sm font-medium hover:bg-[var(--muted)]"
          >
            Go home
          </Link>
        </div>
        {error.digest && (
          <p className="text-[10px] text-[var(--muted-foreground)] font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
