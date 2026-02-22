import { SettingsPageContent } from "@/components/settings/settings-page-content";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Application settings and preferences
        </p>
      </div>
      <SettingsPageContent />
    </div>
  );
}
