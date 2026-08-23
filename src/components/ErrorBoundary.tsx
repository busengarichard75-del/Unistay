"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Phone } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: error.message };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("❌ ErrorBoundary caught:", error, errorInfo);
    // Here you can also send to a logging service like Sentry later
  }

  handleRetry = () => {
    window.location.reload();
  };

  handleContact = () => {
    window.open("mailto:unistayzm2@gmail.com?subject=Error%20Report");
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isNetworkError = this.state.error?.message?.includes("network") ||
                             this.state.error?.message?.includes("offline") ||
                             this.state.error?.message?.includes("fetch");

      const isFirestoreError = this.state.error?.message?.includes("Firestore") ||
                               this.state.error?.message?.includes("firestore");

      let userMessage = "Something went wrong. We've logged the issue and will look into it.";
      if (isNetworkError) {
        userMessage = "You appear to be offline or having network issues. Please check your internet connection and try again.";
      } else if (isFirestoreError) {
        userMessage = "We're having trouble connecting to our servers. Please try again in a few moments.";
      } else if (this.state.error?.message?.includes("404") || this.state.error?.message?.includes("not found")) {
        userMessage = "The page you're looking for doesn't exist or has been removed.";
      } else if (this.state.error?.message?.includes("permission")) {
        userMessage = "You don't have permission to view this page. Please log in.";
      }

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle size={28} />
              <h2 className="text-xl font-bold">Something went wrong</h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{userMessage}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 rounded-full bg-[var(--nexora-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--nexora-primary-hover)] transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
              <button
                onClick={this.handleContact}
                className="flex-1 rounded-full bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <Phone size={16} />
                Contact Support
              </button>
            </div>
            <p className="mt-4 text-xs text-gray-400 text-center">
              Error: {this.state.error?.message?.slice(0, 80)}...
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}