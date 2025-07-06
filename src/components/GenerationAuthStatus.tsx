import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { AlertTriangle, UserCheck } from "lucide-react";

interface GenerationAuthStatusProps {
  hasApiKey: boolean;
}

export function GenerationAuthStatus({ hasApiKey }: GenerationAuthStatusProps) {
  if (hasApiKey) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-md">
        <UserCheck className="h-4 w-4" />
        <span>Using your API key for generation</span>
      </div>
    );
  }

  return (
    <>
      <SignedIn>
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-md">
          <UserCheck className="h-4 w-4" />
          <span>Signed in - you can generate exercises</span>
        </div>
      </SignedIn>
      <SignedOut>
        <div className="flex flex-col gap-3 p-4 border border-orange-200 bg-orange-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-orange-700">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Sign in required for exercise generation</span>
          </div>
          <p className="text-sm text-orange-600">
            To generate new exercises, you can either:
          </p>
          <ul className="text-sm text-orange-600 list-disc list-inside space-y-1 ml-2">
            <li>Sign in to your account (free)</li>
            <li>Or provide your own OpenAI/Anthropic API key in Settings</li>
          </ul>
          <div className="flex gap-2">
            <SignInButton mode="modal">
              <button className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
                Sign In
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>
    </>
  );
}
