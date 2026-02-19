"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  PenTool,
  Upload,
  Trash2,
  FileImage,
  History,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import type { Drawing, DrawingCategory } from "@/types/drawing";
import { DRAWING_CATEGORY_LABELS } from "@/types/drawing";
import { formatDate } from "@/lib/dates";

const CATEGORIES: DrawingCategory[] = [
  "site_plan",
  "floor_plan",
  "elevation",
  "section",
  "detail",
  "structural",
  "electrical",
  "plumbing",
  "render_3d",
  "other",
];

export function DrawingsPageContent({
  projectId,
  initialDrawings,
}: {
  projectId: string;
  initialDrawings: Drawing[];
}) {
  const router = useRouter();
  const [drawings, setDrawings] = useState<Drawing[]>(initialDrawings);
  const [addOpen, setAddOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [uploading, setUploading] = useState(false);

  const filteredDrawings =
    activeTab === "all"
      ? drawings
      : drawings.filter((d) => d.category === activeTab);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/projects/${projectId}/drawings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          data: {
            title: formData.get("title"),
            drawingNumber: formData.get("drawingNumber"),
            category: formData.get("category"),
            description: formData.get("description"),
          },
        }),
      });
      const drawing = await res.json();
      setDrawings((prev) => [...prev, drawing]);
      setAddOpen(false);
      toast.success("Drawing created");
      router.refresh();
    } catch {
      toast.error("Failed to create drawing");
    }
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedDrawing) return;
    setUploading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("drawingId", selectedDrawing.id);

    try {
      await fetch(`/api/projects/${projectId}/drawings/upload`, {
        method: "POST",
        body: formData,
      });
      setUploadOpen(false);
      toast.success("Revision uploaded");
      router.refresh();
      // Refresh drawings list
      const res = await fetch(`/api/projects/${projectId}/drawings`);
      const updated = await res.json();
      setDrawings(updated);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(drawingId: string) {
    if (!confirm("Delete this drawing?")) return;
    try {
      await fetch(`/api/projects/${projectId}/drawings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", drawingId }),
      });
      setDrawings((prev) => prev.filter((d) => d.id !== drawingId));
      toast.success("Drawing deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Drawings & Renderings</h2>
          <p className="text-sm text-muted-foreground">
            Manage architectural drawings, plans, and 3D renderings
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Drawing
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Drawing</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Ground Floor Plan"
                  required
                />
              </div>
              <div>
                <Label htmlFor="drawingNumber">Drawing Number</Label>
                <Input
                  id="drawingNumber"
                  name="drawingNumber"
                  placeholder="e.g., A-001"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select name="category" required defaultValue="floor_plan">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {DRAWING_CATEGORY_LABELS[cat]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Optional description"
                  rows={2}
                />
              </div>
              <Button type="submit">Create Drawing</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all">
            All ({drawings.length})
          </TabsTrigger>
          {CATEGORIES.map((cat) => {
            const count = drawings.filter((d) => d.category === cat).length;
            if (count === 0) return null;
            return (
              <TabsTrigger key={cat} value={cat}>
                {DRAWING_CATEGORY_LABELS[cat]} ({count})
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredDrawings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
              <PenTool className="h-10 w-10 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No drawings</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add drawings to organize your project plans
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDrawings.map((drawing) => (
                <Card key={drawing.id} className="group relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {drawing.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {drawing.drawingNumber}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {DRAWING_CATEGORY_LABELS[drawing.category]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center rounded-lg border bg-muted/30 py-8">
                      <FileImage className="h-12 w-12 text-muted-foreground/40" />
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Current Revision
                        </span>
                        <span className="font-medium">
                          {drawing.currentRevision}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Revisions
                        </span>
                        <span>{drawing.revisions.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Updated</span>
                        <span>{formatDate(drawing.updatedAt)}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedDrawing(drawing);
                          setUploadOpen(true);
                        }}
                      >
                        <Upload className="mr-1 h-3 w-3" />
                        Upload
                      </Button>
                      {drawing.revisions.length > 0 && (
                        <Button variant="outline" size="sm">
                          <Eye className="mr-1 h-3 w-3" />
                          View
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(drawing.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Upload Revision Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Upload Revision — {selectedDrawing?.title}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                name="file"
                type="file"
                accept="image/*,.pdf,.dwg,.dxf"
                required
              />
            </div>
            <div>
              <Label htmlFor="revisionNumber">Revision Number</Label>
              <Input
                id="revisionNumber"
                name="revisionNumber"
                placeholder="e.g., Rev A"
                defaultValue={`Rev ${String.fromCharCode(65 + (selectedDrawing?.revisions.length || 0))}`}
                required
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Revision notes"
                rows={2}
              />
            </div>
            <Button type="submit" disabled={uploading}>
              {uploading ? "Uploading..." : "Upload Revision"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Version History */}
      {selectedDrawing && selectedDrawing.revisions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4" />
              Version History — {selectedDrawing.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedDrawing.revisions
                .slice()
                .reverse()
                .map((rev) => (
                  <div
                    key={rev.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{rev.revisionNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {rev.fileName} — {formatDate(rev.uploadedAt)}
                      </p>
                      {rev.notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {rev.notes}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">
                      {(rev.fileSize / 1024 / 1024).toFixed(1)} MB
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
