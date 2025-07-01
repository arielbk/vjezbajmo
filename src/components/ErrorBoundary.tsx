"use client";

import React from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error?: Error; retry: () => void }> = ({ error, retry }) => {
  const isNetworkError =
    error?.message.toLowerCase().includes("network") || error?.message.toLowerCase().includes("fetch");

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>

      <Alert className="mb-4 max-w-md">
        <AlertDescription>
          {isNetworkError
            ? "We're having trouble connecting to our servers. Please check your internet connection and try again."
            : "An unexpected error occurred. Don't worry, your progress is saved."}
        </AlertDescription>
      </Alert>

      {error && process.env.NODE_ENV === "development" && (
        <details className="mb-4 max-w-md">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">Technical details</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">{error.stack}</pre>
        </details>
      )}

      <div className="flex gap-2">
        <Button onClick={retry} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </div>
    </div>
  );
};

export default ErrorBoundary;
