import type { AppSettings, MaskedAppSettings } from "@/types/settings";
import { readJsonFile, writeJsonFile } from "./store";

const SETTINGS_PATH = "settings.json";

const DEFAULT_SETTINGS: AppSettings = {
  anthropicApiKey: "",
  updatedAt: new Date().toISOString(),
};

export async function getSettings(): Promise<AppSettings> {
  const settings = await readJsonFile<AppSettings>(SETTINGS_PATH);
  return settings ?? { ...DEFAULT_SETTINGS };
}

export async function getMaskedSettings(): Promise<MaskedAppSettings> {
  const settings = await getSettings();
  return {
    anthropicApiKey: maskApiKey(settings.anthropicApiKey),
    hasApiKey: !!settings.anthropicApiKey,
    updatedAt: settings.updatedAt,
  };
}

export async function updateSettings(
  updates: Partial<AppSettings>
): Promise<AppSettings> {
  const current = await getSettings();
  const updated: AppSettings = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await writeJsonFile(SETTINGS_PATH, updated);
  return updated;
}

/**
 * Returns the Anthropic API key, checking the stored settings first,
 * then falling back to the environment variable.
 */
export async function getAnthropicApiKey(): Promise<string | undefined> {
  const settings = await getSettings();
  if (settings.anthropicApiKey) {
    return settings.anthropicApiKey;
  }
  return process.env.ANTHROPIC_API_KEY || undefined;
}

/** Mask an API key for display: show first 7 chars + last 4, mask the rest */
function maskApiKey(key: string): string {
  if (!key) return "";
  if (key.length <= 12) return "••••••••••••";
  const prefix = key.slice(0, 7);
  const suffix = key.slice(-4);
  return `${prefix}${"•".repeat(8)}${suffix}`;
}
