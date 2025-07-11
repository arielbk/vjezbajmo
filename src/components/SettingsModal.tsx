"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { GenerationAuthStatus } from "@/components/GenerationAuthStatus";
import { useExercise } from "@/contexts/ExerciseContext";
import { userProgressManager } from "@/lib/user-progress";
import { Settings, Key, Eye, EyeOff, RefreshCw, AlertCircle, Trash2 } from "lucide-react";
import type { CefrLevel } from "@/types/exercise";
import { toast } from "sonner";

export function SettingsModal() {
  const { state, dispatch, regenerateAllExercises } = useExercise();
  const [tempApiKey, setTempApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [globalTheme, setGlobalTheme] = useState("");
  const [isClearing, setIsClearing] = useState(false);

  const handleSaveApiKey = () => {
    if (tempApiKey.trim()) {
      dispatch({ type: "SET_API_KEY", payload: tempApiKey.trim() });
      setIsEditing(false);
      setTempApiKey("");
      toast.success("API key saved successfully!");
    }
  };

  const handleClearApiKey = () => {
    dispatch({ type: "CLEAR_API_KEY" });
    setTempApiKey("");
    setIsEditing(true);
    toast.success("API key removed");
  };

  const handleProviderChange = (provider: "openai" | "anthropic") => {
    dispatch({ type: "SET_PROVIDER", payload: provider });
  };

  const handleCefrLevelChange = (level: CefrLevel) => {
    dispatch({ type: "SET_CEFR_LEVEL", payload: level });
    toast.success(`CEFR level changed to ${level}`);
  };

  const handleRegenerateAll = async () => {
    try {
      await regenerateAllExercises(globalTheme || undefined);
      setGlobalTheme("");
      setOpen(false);
      toast.success("All exercises regenerated successfully!");
    } catch (error) {
      console.error("Failed to regenerate exercises:", error);
      toast.error("Failed to regenerate exercises. Please try again.");
    }
  };

  const handleClearProgress = async () => {
    setIsClearing(true);

    try {
      userProgressManager.clearAllProgress();
      toast.success("Progress cleared successfully!");

      // Hide success message after 3 seconds
      setTimeout(() => {}, 3000);
    } catch (error) {
      console.error("Failed to clear progress:", error);
      toast.error("Failed to clear progress. Please try again.");
    } finally {
      setIsClearing(false);
    }
  };

  const getApiKeyPlaceholder = () => {
    return state.selectedProvider === "openai" ? "sk-..." : "sk-ant-...";
  };

  const getApiKeyLabel = () => {
    return state.selectedProvider === "openai" ? "OpenAI API Key" : "Anthropic API Key";
  };

  const getProviderDescription = () => {
    if (state.selectedProvider === "openai") {
      return "Get your API key from platform.openai.com";
    }
    return "Get your API key from console.anthropic.com";
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button variant="outline" size="sm" className="gap-1.5 shrink-0 min-w-0">
          <Settings className="h-4 w-4" />
          <span className="hidden min-[480px]:inline">Settings</span>
        </Button>
      }
      title="Settings"
      description="Configure your learning preferences and optionally provide your own API key for unlimited exercise generation."
    >
      <div className="space-y-6">
        {/* CEFR Level Selection */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">CEFR Level</h4>
          <div className="grid grid-cols-4 gap-2">
            {(["A1", "A2.1", "A2.2", "B1.1"] as CefrLevel[]).map((level) => (
              <Button
                key={level}
                variant={state.cefrLevel === level ? "default" : "outline"}
                size="sm"
                onClick={() => handleCefrLevelChange(level)}
              >
                {level}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Select your Croatian language level. This affects the difficulty of generated exercises.
          </p>
        </div>

        {/* Provider Selection */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">AI Provider</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={state.selectedProvider === "openai" ? "default" : "outline"}
              size="sm"
              onClick={() => handleProviderChange("openai")}
              className="justify-start"
            >
              OpenAI
            </Button>
            <Button
              variant={state.selectedProvider === "anthropic" ? "default" : "outline"}
              size="sm"
              onClick={() => handleProviderChange("anthropic")}
              className="justify-start"
            >
              Anthropic
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{getProviderDescription()}</p>
        </div>

        {/* Authentication Status */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Exercise Generation Access</h4>
          <GenerationAuthStatus hasApiKey={!!state.apiKey} />
        </div>

        {/* API Key Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Key className="h-4 w-4" />
            {getApiKeyLabel()} (Optional)
          </h4>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              You can use the app without providing an API key. Providing your own key enables unlimited exercise
              generation.
            </AlertDescription>
          </Alert>

          {state.apiKey && !isEditing ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 font-mono text-sm bg-muted px-3 py-2 rounded">
                  {showApiKey ? state.apiKey : "•".repeat(20) + state.apiKey.slice(-4)}
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowApiKey(!showApiKey)}>
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={handleClearApiKey}>
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder={getApiKeyPlaceholder()}
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveApiKey()}
                />
                <Button onClick={handleSaveApiKey} disabled={!tempApiKey.trim()} size="sm">
                  Save
                </Button>
                {state.apiKey && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                )}
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your API key is stored only in your browser and used exclusively to communicate with{" "}
                  {state.selectedProvider} servers.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        {/* Regenerate All Exercises */}
        <div className="space-y-3 pt-3 border-t">
          <h4 className="text-sm font-medium">Generate New Exercises</h4>
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Optional theme for all exercises..."
              value={globalTheme}
              onChange={(e) => setGlobalTheme(e.target.value)}
              disabled={state.isGenerating}
            />
            <Button onClick={handleRegenerateAll} disabled={state.isGenerating} className="w-full gap-2">
              <RefreshCw className={`h-4 w-4 ${state.isGenerating ? "animate-spin" : ""}`} />
              {state.isGenerating ? "Generating..." : "Regenerate All Exercises"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            This will generate new exercises for all categories using your selected AI provider and CEFR level.
          </p>
        </div>

        {/* Clear Progress */}
        <div className="space-y-3 pt-3 border-t">
          <h4 className="text-sm font-medium">Progress Management</h4>
          <div className="space-y-2">
            <Button
              onClick={handleClearProgress}
              variant="outline"
              className="w-full gap-2 text-destructive hover:text-destructive"
              disabled={isClearing}
            >
              <Trash2 className={`h-4 w-4 ${isClearing ? "animate-spin" : ""}`} />
              {isClearing ? "Clearing..." : "Clear Completed Exercises"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            This will reset your progress and allow you to see exercises you&apos;ve already completed.
          </p>
        </div>
      </div>
    </ResponsiveModal>
  );
}
