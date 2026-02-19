"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  DollarSign,
  GanttChart,
  PenTool,
  BarChart3,
  Settings,
} from "lucide-react";

const PROJECT_TABS = [
  { label: "Overview", suffix: "", icon: LayoutDashboard },
  { label: "Bill of Materials", suffix: "/bom", icon: ClipboardList },
  { label: "Quotations", suffix: "/quotations", icon: FileText },
  { label: "Costs", suffix: "/costs", icon: DollarSign },
  { label: "Timeline", suffix: "/timeline", icon: GanttChart },
  { label: "Drawings", suffix: "/drawings", icon: PenTool },
  { label: "Reports", suffix: "/reports", icon: BarChart3 },
  { label: "Settings", suffix: "/settings", icon: Settings },
];

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const basePath = `/projects/${projectId}`;

  return (
    <nav className="flex gap-1 overflow-x-auto border-b pb-px">
      {PROJECT_TABS.map((tab) => {
        const href = `${basePath}${tab.suffix}`;
        const isActive =
          tab.suffix === ""
            ? pathname === basePath
            : pathname.startsWith(href);
        return (
          <Link
            key={tab.suffix}
            href={href}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
