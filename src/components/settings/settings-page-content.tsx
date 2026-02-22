"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Key,
  Loader2,
  Save,
  Zap,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import type { MaskedAppSettings } from "@/types/settings";

export function SettingsPageContent() {
  const [settings, setSettings] = useState<MaskedAppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Key input
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [keyDirty, setKeyDirty] = useState(false);

  // Test connection
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to load settings");
      const data: MaskedAppSettings = await res.json();
      setSettings(data);
      setApiKey("");
      setKeyDirty(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load settings"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveKey() {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }
    setSaving(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", anthropicApiKey: apiKey }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        setApiKey("");
        setKeyDirty(false);
        setShowKey(false);
        toast.success("API key saved successfully");
      } else {
        throw new Error(data.error || "Failed to save");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save API key"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleClearKey() {
    setSaving(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", anthropicApiKey: "" }),
      });
      if (!res.ok) throw new Error("Failed to clear key");
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        setApiKey("");
        setKeyDirty(false);
        setShowKey(false);
        toast.success("API key removed");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to clear API key"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_connection" }),
      });
      if (!res.ok) throw new Error("Test request failed");
      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.success
          ? data.message
          : data.error || "Connection failed",
      });
      if (data.success) {
        toast.success("Connection successful!");
      } else {
        toast.error(data.error || "Connection failed");
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Connection test failed";
      setTestResult({ success: false, message: msg });
      toast.error(msg);
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* Integration Keys                                                   */}
      {/* ----------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Integration Keys</CardTitle>
              <CardDescription>
                Configure API keys for AI-powered features like document cost
                extraction
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Anthropic API Key */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">
                  Anthropic API Key
                </Label>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Required for AI-powered quotation document extraction
                </p>
              </div>
              {settings?.hasApiKey && (
                <Badge
                  variant="outline"
                  className="border-green-200 bg-green-50 text-green-700"
                >
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Configured
                </Badge>
              )}
            </div>

            {/* Current key display */}
            {settings?.hasApiKey && !keyDirty && (
              <div className="flex items-center gap-3 rounded-md border bg-muted/50 px-3 py-2.5">
                <span className="font-mono text-sm text-muted-foreground">
                  {settings.anthropicApiKey}
                </span>
              </div>
            )}

            {/* Key input */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setKeyDirty(true);
                    setTestResult(null);
                  }}
                  placeholder={
                    settings?.hasApiKey
                      ? "Enter new key to replace..."
                      : "sk-ant-api03-..."
                  }
                  className="pr-10 font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <Button
                onClick={handleSaveKey}
                disabled={saving || !apiKey.trim()}
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
            </div>

            {/* Help text */}
            <p className="text-xs text-muted-foreground">
              Get your API key from{" "}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
              >
                console.anthropic.com
                <ExternalLink className="h-3 w-3" />
              </a>
              . Your key is stored securely on the server and never sent to the
              browser.
            </p>

            {settings?.hasApiKey && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleClearKey}
                disabled={saving}
              >
                Remove API Key
              </Button>
            )}
          </div>

          <Separator />

          {/* ----------------------------------------------------------------- */}
          {/* Test Connection                                                    */}
          {/* ----------------------------------------------------------------- */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Test Connection</Label>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Verify that your API key is valid and can connect to Anthropic
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing || (!settings?.hasApiKey && !apiKey.trim())}
              >
                {testing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-4 w-4" />
                )}
                {testing ? "Testing..." : "Test Connection"}
              </Button>

              {testResult && (
                <div
                  className={`flex items-center gap-2 text-sm ${
                    testResult.success ? "text-green-700" : "text-red-600"
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>

            {testResult && !testResult.success && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{testResult.message}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
