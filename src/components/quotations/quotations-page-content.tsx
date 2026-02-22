"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  FileText,
  Trash2,
  Check,
  X,
  Upload,
  ArrowLeftRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import type { Quotation, QuotationStatus, CreateQuotationInput } from "@/types/quotation";
import { QUOTATION_STATUS_LABELS } from "@/types/quotation";
import { TRADE_CATEGORY_LABELS, type TradeCategory } from "@/types/common";
import { formatZAR } from "@/lib/currency";
import { formatDate } from "@/lib/dates";
import { ExtractQuotationDialog } from "./extract-quotation-dialog";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_BADGE_VARIANT: Record<
  QuotationStatus,
  { className: string }
> = {
  received: { className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  under_review: { className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  accepted: { className: "bg-green-100 text-green-800 hover:bg-green-100" },
  rejected: { className: "bg-red-100 text-red-800 hover:bg-red-100" },
  expired: { className: "bg-gray-100 text-gray-600 hover:bg-gray-100" },
  superseded: { className: "bg-purple-100 text-purple-800 hover:bg-purple-100" },
};

const TRADE_CATEGORY_KEYS = Object.keys(TRADE_CATEGORY_LABELS) as TradeCategory[];
const STATUS_KEYS = Object.keys(QUOTATION_STATUS_LABELS) as QuotationStatus[];

const EMPTY_FORM: CreateQuotationInput & { id?: string } = {
  supplierName: "",
  supplierContact: "",
  supplierEmail: "",
  supplierPhone: "",
  tradeCategory: "general_builder",
  quotationNumber: "",
  quotationDate: "",
  validUntil: "",
  totalAmount: 0,
  notes: "",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: QuotationStatus }) {
  return (
    <Badge className={STATUS_BADGE_VARIANT[status].className}>
      {QUOTATION_STATUS_LABELS[status]}
    </Badge>
  );
}

function TradeBadge({ trade }: { trade: TradeCategory }) {
  return (
    <Badge variant="outline">{TRADE_CATEGORY_LABELS[trade]}</Badge>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface QuotationsPageContentProps {
  projectId: string;
  initialQuotations: Quotation[];
}

export function QuotationsPageContent({
  projectId,
  initialQuotations,
}: QuotationsPageContentProps) {
  const router = useRouter();

  // --- Data state ---
  const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);

  // --- Filter state ---
  const [filterTrade, setFilterTrade] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // --- Dialog state ---
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateQuotationInput & { id?: string }>({ ...EMPTY_FORM });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Detail / file upload state ---
  const [detailQuotation, setDetailQuotation] = useState<Quotation | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // --- Comparison state ---
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [compareOpen, setCompareOpen] = useState(false);

  // --- Extraction dialog state ---
  const [extractDialogOpen, setExtractDialogOpen] = useState(false);
  const [extractForQuotationId, setExtractForQuotationId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Filtered list
  // ---------------------------------------------------------------------------

  const filteredQuotations = quotations.filter((q) => {
    if (filterTrade !== "all" && q.tradeCategory !== filterTrade) return false;
    if (filterStatus !== "all" && q.status !== filterStatus) return false;
    return true;
  });

  // ---------------------------------------------------------------------------
  // API helpers
  // ---------------------------------------------------------------------------

  async function apiCall(body: Record<string, unknown>) {
    const res = await fetch(`/api/projects/${projectId}/quotations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(err.error ?? "Request failed");
    }
    return res.json();
  }

  // ---------------------------------------------------------------------------
  // CRUD handlers
  // ---------------------------------------------------------------------------

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const { id, ...data } = formData;
      if (id) {
        // Update existing
        const result = await apiCall({
          action: "update",
          quotationId: id,
          updates: data,
        });
        setQuotations((prev) =>
          prev.map((q) => (q.id === id ? { ...q, ...result.quotation ?? data } : q))
        );
        toast.success("Quotation updated");
      } else {
        // Create new
        const result = await apiCall({
          action: "create",
          data,
        });
        if (result.quotation) {
          setQuotations((prev) => [...prev, result.quotation]);
        }
        toast.success("Quotation created");
      }
      setDialogOpen(false);
      setFormData({ ...EMPTY_FORM });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(quotationId: string) {
    try {
      await apiCall({ action: "delete", quotationId });
      setQuotations((prev) => prev.filter((q) => q.id !== quotationId));
      toast.success("Quotation deleted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  async function handleStatusChange(
    quotationId: string,
    status: QuotationStatus,
    extra: Record<string, unknown> = {}
  ) {
    try {
      const updates = { status, ...extra };
      const result = await apiCall({
        action: "update",
        quotationId,
        updates,
      });
      setQuotations((prev) =>
        prev.map((q) =>
          q.id === quotationId ? { ...q, ...result.quotation ?? updates } : q
        )
      );
      toast.success(`Quotation ${QUOTATION_STATUS_LABELS[status].toLowerCase()}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Status update failed");
    }
  }

  async function handleFileUpload(file: File, quotationId: string) {
    setUploadingFile(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("quotationId", quotationId);
      const res = await fetch(`/api/projects/${projectId}/quotations/upload`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error ?? "Upload failed");
      }
      const result = await res.json();
      // Update the quotation's files list locally
      setQuotations((prev) =>
        prev.map((q) => {
          if (q.id !== quotationId) return q;
          const newFile = result.file;
          return newFile
            ? { ...q, files: [...q.files, newFile] }
            : q;
        })
      );
      // Also update detail view if open
      if (detailQuotation?.id === quotationId && result.file) {
        setDetailQuotation((prev) =>
          prev ? { ...prev, files: [...prev.files, result.file] } : prev
        );
      }
      toast.success("File uploaded");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingFile(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Edit helpers
  // ---------------------------------------------------------------------------

  function openCreateDialog() {
    setFormData({ ...EMPTY_FORM });
    setDialogOpen(true);
  }

  function openEditDialog(q: Quotation) {
    setFormData({
      id: q.id,
      supplierName: q.supplierName,
      supplierContact: q.supplierContact,
      supplierEmail: q.supplierEmail,
      supplierPhone: q.supplierPhone,
      tradeCategory: q.tradeCategory,
      quotationNumber: q.quotationNumber,
      quotationDate: q.quotationDate,
      validUntil: q.validUntil,
      totalAmount: q.totalAmount,
      notes: q.notes,
    });
    setDialogOpen(true);
  }

  function openDetail(q: Quotation) {
    setDetailQuotation(q);
    setDetailOpen(true);
  }

  // ---------------------------------------------------------------------------
  // Comparison helpers
  // ---------------------------------------------------------------------------

  function toggleCompareId(id: string) {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= 4) {
          toast.error("You can compare up to 4 quotations at a time");
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  }

  function openComparison() {
    if (compareIds.size < 2) {
      toast.error("Select at least 2 quotations to compare");
      return;
    }
    setCompareOpen(true);
  }

  const comparedQuotations = quotations.filter((q) => compareIds.has(q.id));

  // ---------------------------------------------------------------------------
  // Form field updater
  // ---------------------------------------------------------------------------

  function updateField<K extends keyof typeof formData>(
    key: K,
    value: (typeof formData)[K]
  ) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* Header                                                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Quotations</h2>
        <div className="flex items-center gap-2">
          {compareMode ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCompareMode(false);
                  setCompareIds(new Set());
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={openComparison}>
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Compare ({compareIds.size})
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCompareMode(true)}
                disabled={quotations.length < 2}
              >
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Compare
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setExtractForQuotationId(null);
                  setExtractDialogOpen(true);
                }}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Import from Document
              </Button>
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Quotation
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Filter bar                                                        */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="w-52">
          <Select value={filterTrade} onValueChange={setFilterTrade}>
            <SelectTrigger>
              <SelectValue placeholder="All trades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trades</SelectItem>
              {TRADE_CATEGORY_KEYS.map((key) => (
                <SelectItem key={key} value={key}>
                  {TRADE_CATEGORY_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-52">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUS_KEYS.map((key) => (
                <SelectItem key={key} value={key}>
                  {QUOTATION_STATUS_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(filterTrade !== "all" || filterStatus !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterTrade("all");
              setFilterStatus("all");
            }}
          >
            Clear filters
          </Button>
        )}

        <span className="ml-auto text-sm text-muted-foreground">
          {filteredQuotations.length} of {quotations.length} quotation
          {quotations.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Quotation cards                                                   */}
      {/* ----------------------------------------------------------------- */}
      {filteredQuotations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">
              No quotations found
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {quotations.length > 0
                ? "Try adjusting your filters."
                : "Add your first quotation to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredQuotations.map((q) => (
            <Card
              key={q.id}
              className={
                compareMode && compareIds.has(q.id)
                  ? "ring-2 ring-primary"
                  : undefined
              }
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate text-base">
                      {q.supplierName}
                    </CardTitle>
                    {q.quotationNumber && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        #{q.quotationNumber}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={q.status} />
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <TradeBadge trade={q.tradeCategory} />
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total</span>
                    <p className="font-semibold">{formatZAR(q.totalAmount)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date</span>
                    <p>{formatDate(q.quotationDate)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valid until</span>
                    <p>{formatDate(q.validUntil)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Files</span>
                    <p>{q.files.length}</p>
                  </div>
                </div>

                <Separator />

                {compareMode ? (
                  <Button
                    variant={compareIds.has(q.id) ? "default" : "outline"}
                    size="sm"
                    className="w-full"
                    onClick={() => toggleCompareId(q.id)}
                  >
                    {compareIds.has(q.id) ? "Selected" : "Select to compare"}
                  </Button>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetail(q)}
                    >
                      <FileText className="mr-1 h-3.5 w-3.5" />
                      View / Edit
                    </Button>
                    {q.status !== "accepted" && q.status !== "rejected" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-700 hover:bg-green-50 hover:text-green-800"
                          onClick={() =>
                            handleStatusChange(q.id, "accepted", {
                              acceptedDate: new Date().toISOString(),
                            })
                          }
                        >
                          <Check className="mr-1 h-3.5 w-3.5" />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-700 hover:bg-red-50 hover:text-red-800"
                          onClick={() =>
                            handleStatusChange(q.id, "rejected")
                          }
                        >
                          <X className="mr-1 h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto text-destructive hover:text-destructive"
                      onClick={() => handleDelete(q.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Add / Edit Dialog                                                 */}
      {/* ----------------------------------------------------------------- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {formData.id ? "Edit Quotation" : "Add Quotation"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Supplier name */}
            <div className="grid gap-2">
              <Label htmlFor="supplierName">Supplier Name *</Label>
              <Input
                id="supplierName"
                value={formData.supplierName}
                onChange={(e) => updateField("supplierName", e.target.value)}
                placeholder="Enter supplier name"
              />
            </div>

            {/* Supplier contact */}
            <div className="grid gap-2">
              <Label htmlFor="supplierContact">Contact Person</Label>
              <Input
                id="supplierContact"
                value={formData.supplierContact ?? ""}
                onChange={(e) => updateField("supplierContact", e.target.value)}
                placeholder="Contact person name"
              />
            </div>

            {/* Supplier email & phone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="supplierEmail">Email</Label>
                <Input
                  id="supplierEmail"
                  type="email"
                  value={formData.supplierEmail ?? ""}
                  onChange={(e) =>
                    updateField("supplierEmail", e.target.value)
                  }
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="supplierPhone">Phone</Label>
                <Input
                  id="supplierPhone"
                  type="tel"
                  value={formData.supplierPhone ?? ""}
                  onChange={(e) =>
                    updateField("supplierPhone", e.target.value)
                  }
                  placeholder="Phone number"
                />
              </div>
            </div>

            {/* Trade category */}
            <div className="grid gap-2">
              <Label>Trade Category *</Label>
              <Select
                value={formData.tradeCategory}
                onValueChange={(val) =>
                  updateField("tradeCategory", val as TradeCategory)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRADE_CATEGORY_KEYS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {TRADE_CATEGORY_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quotation number */}
            <div className="grid gap-2">
              <Label htmlFor="quotationNumber">Quotation Number</Label>
              <Input
                id="quotationNumber"
                value={formData.quotationNumber ?? ""}
                onChange={(e) =>
                  updateField("quotationNumber", e.target.value)
                }
                placeholder="e.g. QUO-001"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quotationDate">Quotation Date *</Label>
                <Input
                  id="quotationDate"
                  type="date"
                  value={formData.quotationDate}
                  onChange={(e) =>
                    updateField("quotationDate", e.target.value)
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="validUntil">Valid Until *</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => updateField("validUntil", e.target.value)}
                />
              </div>
            </div>

            {/* Total amount */}
            <div className="grid gap-2">
              <Label htmlFor="totalAmount">Total Amount (ZAR) *</Label>
              <Input
                id="totalAmount"
                type="number"
                min={0}
                step={0.01}
                value={formData.totalAmount || ""}
                onChange={(e) =>
                  updateField("totalAmount", parseFloat(e.target.value) || 0)
                }
                placeholder="0.00"
              />
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes ?? ""}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                !formData.supplierName.trim() ||
                !formData.quotationDate ||
                !formData.validUntil ||
                !formData.totalAmount
              }
            >
              {isSubmitting
                ? "Saving..."
                : formData.id
                  ? "Update Quotation"
                  : "Create Quotation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ----------------------------------------------------------------- */}
      {/* Detail / Edit Dialog (View + File Upload)                         */}
      {/* ----------------------------------------------------------------- */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {detailQuotation && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="truncate">{detailQuotation.supplierName}</span>
                  <StatusBadge status={detailQuotation.status} />
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Supplier info */}
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-muted-foreground">
                    Supplier Details
                  </h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Contact</span>
                      <p>{detailQuotation.supplierContact || "---"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email</span>
                      <p>{detailQuotation.supplierEmail || "---"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone</span>
                      <p>{detailQuotation.supplierPhone || "---"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Trade</span>
                      <p>
                        <TradeBadge trade={detailQuotation.tradeCategory} />
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Quotation info */}
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-muted-foreground">
                    Quotation Details
                  </h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Number</span>
                      <p>{detailQuotation.quotationNumber || "---"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date</span>
                      <p>{formatDate(detailQuotation.quotationDate)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Valid Until</span>
                      <p>{formatDate(detailQuotation.validUntil)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Total (excl. VAT)
                      </span>
                      <p className="font-semibold">
                        {formatZAR(detailQuotation.totalAmount)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">VAT</span>
                      <p>{formatZAR(detailQuotation.vatAmount)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Total (incl. VAT)
                      </span>
                      <p className="font-semibold">
                        {formatZAR(detailQuotation.totalInclVat)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {detailQuotation.notes && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-muted-foreground">
                        Notes
                      </h4>
                      <p className="whitespace-pre-wrap text-sm">
                        {detailQuotation.notes}
                      </p>
                    </div>
                  </>
                )}

                <Separator />

                {/* Files section */}
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-muted-foreground">
                    Files ({detailQuotation.files.length})
                  </h4>

                  {detailQuotation.files.length > 0 && (
                    <ul className="mb-3 space-y-1">
                      {detailQuotation.files.map((f) => (
                        <li
                          key={f.id}
                          className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="flex-1 truncate">{f.fileName}</span>
                          <span className="text-xs text-muted-foreground">
                            {(f.fileSize / 1024).toFixed(1)} KB
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file, detailQuotation.id);
                          }
                          e.target.value = "";
                        }}
                        disabled={uploadingFile}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={uploadingFile}
                        asChild
                      >
                        <span>
                          <Upload className="mr-1 h-3.5 w-3.5" />
                          {uploadingFile ? "Uploading..." : "Upload File"}
                        </span>
                      </Button>
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDetailOpen(false);
                        setExtractForQuotationId(detailQuotation.id);
                        setExtractDialogOpen(true);
                      }}
                    >
                      <Sparkles className="mr-1 h-3.5 w-3.5" />
                      Import Costs from Document
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDetailOpen(false);
                      openEditDialog(detailQuotation);
                    }}
                  >
                    Edit Quotation
                  </Button>
                  {detailQuotation.status !== "accepted" &&
                    detailQuotation.status !== "rejected" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            handleStatusChange(
                              detailQuotation.id,
                              "accepted",
                              { acceptedDate: new Date().toISOString() }
                            );
                            setDetailOpen(false);
                          }}
                        >
                          <Check className="mr-1 h-3.5 w-3.5" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            handleStatusChange(
                              detailQuotation.id,
                              "rejected"
                            );
                            setDetailOpen(false);
                          }}
                        >
                          <X className="mr-1 h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </>
                    )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-destructive hover:text-destructive"
                    onClick={() => {
                      handleDelete(detailQuotation.id);
                      setDetailOpen(false);
                    }}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ----------------------------------------------------------------- */}
      {/* Comparison Dialog                                                  */}
      {/* ----------------------------------------------------------------- */}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Compare Quotations ({comparedQuotations.length})
            </DialogTitle>
          </DialogHeader>

          {comparedQuotations.length >= 2 && (
            <div className="overflow-x-auto py-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">Field</TableHead>
                    {comparedQuotations.map((q) => (
                      <TableHead key={q.id}>{q.supplierName}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      Quotation Number
                    </TableCell>
                    {comparedQuotations.map((q) => (
                      <TableCell key={q.id}>
                        {q.quotationNumber || "---"}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Trade</TableCell>
                    {comparedQuotations.map((q) => (
                      <TableCell key={q.id}>
                        <TradeBadge trade={q.tradeCategory} />
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      Total (excl. VAT)
                    </TableCell>
                    {comparedQuotations.map((q) => (
                      <TableCell key={q.id} className="font-semibold">
                        {formatZAR(q.totalAmount)}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">VAT</TableCell>
                    {comparedQuotations.map((q) => (
                      <TableCell key={q.id}>
                        {formatZAR(q.vatAmount)}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      Total (incl. VAT)
                    </TableCell>
                    {comparedQuotations.map((q) => (
                      <TableCell key={q.id} className="font-semibold">
                        {formatZAR(q.totalInclVat)}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      Quotation Date
                    </TableCell>
                    {comparedQuotations.map((q) => (
                      <TableCell key={q.id}>
                        {formatDate(q.quotationDate)}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Valid Until</TableCell>
                    {comparedQuotations.map((q) => (
                      <TableCell key={q.id}>
                        {formatDate(q.validUntil)}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Status</TableCell>
                    {comparedQuotations.map((q) => (
                      <TableCell key={q.id}>
                        <StatusBadge status={q.status} />
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Contact</TableCell>
                    {comparedQuotations.map((q) => (
                      <TableCell key={q.id}>
                        {q.supplierContact || "---"}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Email</TableCell>
                    {comparedQuotations.map((q) => (
                      <TableCell key={q.id}>
                        {q.supplierEmail || "---"}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Files</TableCell>
                    {comparedQuotations.map((q) => (
                      <TableCell key={q.id}>{q.files.length}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Notes</TableCell>
                    {comparedQuotations.map((q) => (
                      <TableCell key={q.id} className="max-w-[200px]">
                        <p className="truncate">{q.notes || "---"}</p>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setCompareOpen(false);
                setCompareMode(false);
                setCompareIds(new Set());
              }}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ----------------------------------------------------------------- */}
      {/* AI Extraction Dialog                                               */}
      {/* ----------------------------------------------------------------- */}
      <ExtractQuotationDialog
        projectId={projectId}
        open={extractDialogOpen}
        onOpenChange={(open) => {
          setExtractDialogOpen(open);
          if (!open) setExtractForQuotationId(null);
        }}
        existingQuotationId={extractForQuotationId}
        onQuotationCreated={(quotation) => {
          setQuotations((prev) => [...prev, quotation]);
          router.refresh();
        }}
        onQuotationUpdated={(quotation) => {
          setQuotations((prev) =>
            prev.map((q) => (q.id === quotation.id ? quotation : q))
          );
          router.refresh();
        }}
      />
    </div>
  );
}
