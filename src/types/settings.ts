export type AppSettings = {
  anthropicApiKey: string;
  updatedAt: string;
};

/** Settings returned to the client with sensitive values masked */
export type MaskedAppSettings = {
  anthropicApiKey: string; // masked, e.g. "sk-ant-...••••••••"
  hasApiKey: boolean;
  updatedAt: string;
};
