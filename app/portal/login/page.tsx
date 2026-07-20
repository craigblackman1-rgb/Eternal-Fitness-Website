"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import EternalFitnessLogo from "@/components/EternalFitnessLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HubCard, HubCardHeader } from "@/components/hub";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IconMail, IconCheckCircle, IconAlertTriangle } from "@/components/icons";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; devLink?: string; dryRun?: boolean }
  | { kind: "error"; message: string };

export default function PortalLoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [emailError, setEmailError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);

    // Client-side validation (server also validates; this is for immediate UX).
    if (!email.trim()) {
      setEmailError("Please enter your email address.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setEmailError("That doesn't look like a valid email address.");
      return;
    }

    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/portal/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ kind: "error", message: data.error ?? "Something went wrong. Please try again." });
        return;
      }
      setStatus({ kind: "sent", devLink: data.devLink, dryRun: data.dryRun });
    } catch {
      setStatus({ kind: "error", message: "Network error. Please try again." });
    }
  };

  return (
    <div className="hub-shell relative flex min-h-screen items-center justify-center bg-[var(--hub-canvas)] overflow-hidden">
      <a
        href="#portal-login-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-[var(--status-primary)] focus:shadow-md"
      >
        Skip to sign-in form
      </a>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-rose/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-teal/5 rounded-full blur-3xl" />
      </div>

      <HubCard className="relative w-full max-w-md shadow-md border-border/60">
        <div className="px-6 pt-8 pb-6 text-center">
          <div className="mx-auto mb-5 flex items-center justify-center">
            <EternalFitnessLogo variant="dark" size="lg" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Client Portal</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to view your documents and updates
          </p>
        </div>

        <div className="px-6 pb-8">
          <main id="portal-login-main">
            {status.kind === "sent" ? (
              <Alert className="border-[var(--status-success-border)] bg-[var(--status-success-bg)]">
                <IconCheckCircle className="h-5 w-5 text-[var(--status-success)]" aria-hidden="true" />
                <AlertTitle className="text-[var(--status-success)]">Check your email</AlertTitle>
                <AlertDescription className="text-foreground">
                  If an account exists for that address, we&rsquo;ve sent a sign-in link. The link
                  expires in 15 minutes and can only be used once. Check your spam folder if it
                  doesn&rsquo;t arrive.
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {status.kind === "error" && (
                  <Alert variant="destructive">
                    <IconAlertTriangle className="h-5 w-5" aria-hidden="true" />
                    <AlertDescription>{status.message}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="portal-email">Email address</Label>
                  <Input
                    id="portal-email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={emailError ? true : undefined}
                    aria-describedby={emailError ? "portal-email-error" : undefined}
                    className={emailError ? "border-[var(--status-danger)]" : undefined}
                  />
                  {emailError && (
                    <p id="portal-email-error" className="text-sm text-[var(--status-danger)]">
                      {emailError}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full min-h-11 rounded-full bg-rose hover:bg-rose/90 text-white text-base font-semibold"
                  disabled={status.kind === "sending"}
                >
                  <IconMail className="h-4 w-4 mr-2" aria-hidden="true" />
                  {status.kind === "sending" ? "Sending link..." : "Send me a sign-in link"}
                </Button>
              </form>
            )}

            {status.kind === "sent" && (
              <div className="mt-4 flex flex-col gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full min-h-11 rounded-full"
                  onClick={() => setStatus({ kind: "idle" })}
                >
                  Use a different email
                </Button>
                {status.dryRun && status.devLink && (
                  <p className="text-xs text-muted-foreground">
                    No email backend is configured, so the link was not sent. For review only:
                    <br />
                    <code className="break-all">{status.devLink}</code>
                  </p>
                )}
              </div>
            )}
          </main>
        </div>
      </HubCard>
    </div>
  );
}
