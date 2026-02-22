"use client";

import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Upload,
  Loader2,
  Trash2,
  Plus,
  AlertTriangle,
  FileText,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { formatZAR, SA_VAT_RATE } from "@/lib/currency";
import { TRADE_CATEGORY_LABELS, type TradeCategory } from "@/types/common";
import type { Quotation } from "@/types/quotation";
import type {
  ExtractedQuotationData,
  ExtractedLineItem,
  ExtractionResponse,
} from "@/types/extraction";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const ACCEPTED_FILE_TYPES =
  ".pdf,.png,.jpg,.jpeg,.csv,.xls,.xlsx";
const ACCEPTED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const TRADE_CATEGORY_KEYS = Object.keys(
  TRADE_CATEGORY_LABELS
) as TradeCategory[];

const EMPTY_SUPPLIER = {
  supplierName: "",
  supplierContact: "",
  supplierEmail: "",
  supplierPhone: "",
  quotationNumber: "",
  quotationDate: "",
  validUntil: "",
  tradeCategory: "general_builder" as TradeCategory,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function isAcceptedFileType(file: File): boolean {
  if (ACCEPTED_MIME_TYPES.has(file.type)) return true;
  const ext = getFileExtension(file.name);
  return ["pdf", "png", "jpg", "jpeg", "csv", "xls", "xlsx"].includes(ext);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ExtractStep = "upload" | "processing" | "review";

type ExtractQuotationDialogProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingQuotationId?: string | null;
  onQuotationCreated?: (quotation: Quotation) => void;
  onQuotationUpdated?: (quotation: Quotation) => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ExtractQuotationDialog({
  projectId,
  open,
  onOpenChange,
  existingQuotationId,
  onQuotationCreated,
  onQuotationUpdated,
}: ExtractQuotationDialogProps) {
  // --- Step state ---
  const [step, setStep] = useState<ExtractStep>("upload");

  // --- Upload state ---
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Extraction state ---
  const [extractedData, setExtractedData] =
    useState<ExtractedQuotationData | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // --- Review editable state ---
  const [editedSupplier, setEditedSupplier] = useState({ ...EMPTY_SUPPLIER });
  const [editedLineItems, setEditedLineItems] = useState<ExtractedLineItem[]>(
    []
  );
  const [editedNotes, setEditedNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // ---------------------------------------------------------------------------
  // Reset everything when dialog opens/closes
  // ---------------------------------------------------------------------------

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        // Abort any in-flight request
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
      }
      if (nextOpen) {
        // Reset all state
        setStep("upload");
        setFile(null);
        setDragActive(false);
        setExtractedData(null);
        setEditedSupplier({ ...EMPTY_SUPPLIER });
        setEditedLineItems([]);
        setEditedNotes("");
        setSaving(false);
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange]
  );

  // ---------------------------------------------------------------------------
  // File handling
  // ---------------------------------------------------------------------------

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!isAcceptedFileType(selectedFile)) {
      toast.error(
        "Unsupported file type. Please upload a PDF, image, CSV, or Excel file."
      );
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error("File is too large. Maximum size is 20 MB.");
      return;
    }
    setFile(selectedFile);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!dragActive) setDragActive(true);
    },
    [dragActive]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFileSelect(selectedFile);
      }
      // Reset input value so the same file can be selected again
      e.target.value = "";
    },
    [handleFileSelect]
  );

  // ---------------------------------------------------------------------------
  // Extraction
  // ---------------------------------------------------------------------------

  const handleExtract = useCallback(async () => {
    if (!file) return;

    setStep("processing");
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `/api/projects/${projectId}/quotations/extract`,
        {
          method: "POST",
          body: formData,
          signal: controller.signal,
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Extraction failed" }));
        throw new Error(err.error ?? "Extraction failed");
      }

      const result: ExtractionResponse = await res.json();

      if (!result.success || !result.data) {
        throw new Error(result.error ?? "No data returned from extraction");
      }

      const data = result.data;
      setExtractedData(data);

      // Populate editable state from extracted data
      setEditedSupplier({
        supplierName: data.supplierName ?? "",
        supplierContact: data.supplierContact ?? "",
        supplierEmail: data.supplierEmail ?? "",
        supplierPhone: data.supplierPhone ?? "",
        quotationNumber: data.quotationNumber ?? "",
        quotationDate: data.quotationDate ?? "",
        validUntil: data.validUntil ?? "",
        tradeCategory: data.tradeCategory ?? "general_builder",
      });

      setEditedLineItems(
        data.lineItems.map((item) => ({ ...item }))
      );

      setEditedNotes(data.notes ?? "");
      setStep("review");
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        // User cancelled
        setStep("upload");
        return;
      }
      toast.error(
        err instanceof Error ? err.message : "Extraction failed"
      );
      setStep("upload");
    } finally {
      abortControllerRef.current = null;
    }
  }, [file, projectId]);

  const handleCancelExtraction = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setStep("upload");
  }, []);

  // ---------------------------------------------------------------------------
  // Line item editing
  // ---------------------------------------------------------------------------

  const updateLineItem = useCallback(
    (
      index: number,
      field: keyof ExtractedLineItem,
      value: string | number
    ) => {
      setEditedLineItems((prev) => {
        const updated = [...prev];
        const item = { ...updated[index] };

        if (field === "description" || field === "unit") {
          item[field] = value as string;
        } else {
          item[field] = Number(value) || 0;
        }

        // Auto-recalculate amount when qty or rate changes
        if (field === "quantity" || field === "unitRate") {
          item.amount = item.quantity * item.unitRate;
        }

        updated[index] = item;
        return updated;
      });
    },
    []
  );

  const deleteLineItem = useCallback((index: number) => {
    setEditedLineItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addLineItem = useCallback(() => {
    setEditedLineItems((prev) => [
      ...prev,
      {
        description: "",
        unit: "item",
        quantity: 1,
        unitRate: 0,
        amount: 0,
      },
    ]);
  }, []);

  // ---------------------------------------------------------------------------
  // Calculated values
  // ---------------------------------------------------------------------------

  const subtotal = editedLineItems.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const vatAmount = subtotal * SA_VAT_RATE;
  const totalInclVat = subtotal + vatAmount;

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------

  const isAddingToExisting = Boolean(existingQuotationId);

  const handleSave = useCallback(async () => {
    if (isAddingToExisting) {
      // Add line items to existing quotation
      if (editedLineItems.length === 0) {
        toast.error("Add at least one line item");
        return;
      }

      setSaving(true);
      try {
        const res = await fetch(
          `/api/projects/${projectId}/quotations`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "add_line_items",
              quotationId: existingQuotationId,
              lineItems: editedLineItems,
            }),
          }
        );

        if (!res.ok) {
          const err = await res
            .json()
            .catch(() => ({ error: "Failed to add line items" }));
          throw new Error(err.error ?? "Failed to add line items");
        }

        const quotation: Quotation = await res.json();
        toast.success("Line items added to quotation");
        onQuotationUpdated?.(quotation);
        handleOpenChange(false);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to add line items"
        );
      } finally {
        setSaving(false);
      }
    } else {
      // Create new quotation
      if (!editedSupplier.supplierName.trim()) {
        toast.error("Supplier name is required");
        return;
      }
      if (!editedSupplier.tradeCategory) {
        toast.error("Trade category is required");
        return;
      }

      setSaving(true);
      try {
        const res = await fetch(
          `/api/projects/${projectId}/quotations`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "create",
              data: {
                supplierName: editedSupplier.supplierName,
                supplierContact: editedSupplier.supplierContact,
                supplierEmail: editedSupplier.supplierEmail,
                supplierPhone: editedSupplier.supplierPhone,
                tradeCategory: editedSupplier.tradeCategory,
                quotationNumber: editedSupplier.quotationNumber,
                quotationDate:
                  editedSupplier.quotationDate ||
                  new Date().toISOString().split("T")[0],
                validUntil:
                  editedSupplier.validUntil ||
                  new Date().toISOString().split("T")[0],
                totalAmount: subtotal,
                vatAmount,
                notes: editedNotes,
                lineItems: editedLineItems,
              },
            }),
          }
        );

        if (!res.ok) {
          const err = await res
            .json()
            .catch(() => ({ error: "Failed to create quotation" }));
          throw new Error(err.error ?? "Failed to create quotation");
        }

        const quotation: Quotation = await res.json();
        toast.success("Quotation created from extracted data");
        onQuotationCreated?.(quotation);
        handleOpenChange(false);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to create quotation"
        );
      } finally {
        setSaving(false);
      }
    }
  }, [
    isAddingToExisting,
    existingQuotationId,
    editedLineItems,
    editedSupplier,
    editedNotes,
    subtotal,
    vatAmount,
    projectId,
    onQuotationCreated,
    onQuotationUpdated,
    handleOpenChange,
  ]);

  // ---------------------------------------------------------------------------
  // Supplier field updater
  // ---------------------------------------------------------------------------

  function updateSupplierField<K extends keyof typeof editedSupplier>(
    key: K,
    value: (typeof editedSupplier)[K]
  ) {
    setEditedSupplier((prev) => ({ ...prev, [key]: value }));
  }

  // ---------------------------------------------------------------------------
  // Confidence badge
  // ---------------------------------------------------------------------------

  function ConfidenceBadge({
    confidence,
  }: {
    confidence: "high" | "medium" | "low";
  }) {
    const variants: Record<
      typeof confidence,
      { className: string; label: string }
    > = {
      high: {
        className: "bg-green-100 text-green-800 hover:bg-green-100",
        label: "High Confidence",
      },
      medium: {
        className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
        label: "Medium Confidence",
      },
      low: {
        className: "bg-red-100 text-red-800 hover:bg-red-100",
        label: "Low Confidence",
      },
    };

    const v = variants[confidence];
    return (
      <Badge className={v.className}>
        <CheckCircle2 className="mr-1 h-3 w-3" />
        {v.label}
      </Badge>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Upload Step
  // ---------------------------------------------------------------------------

  function renderUploadStep() {
    return (
      <div className="space-y-6 py-4">
        {/* Drop zone */}
        <div
          className={`relative cursor-pointer border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={ACCEPTED_FILE_TYPES}
            onChange={handleInputChange}
          />

          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-muted p-3">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Drag and drop your document here
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                or click to browse files
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Supports PDF, PNG, JPG, CSV, XLS, XLSX (max 20 MB)
            </p>
          </div>
        </div>

        {/* Selected file */}
        {file && (
          <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExtract}
            disabled={!file}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Extract Costs
          </Button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Processing Step
  // ---------------------------------------------------------------------------

  function renderProcessingStep() {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <div className="text-center">
          <p className="text-sm font-medium">Analyzing document...</p>
          <p className="mt-1 text-xs text-muted-foreground">
            This may take a moment depending on the document size
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancelExtraction}
        >
          Cancel
        </Button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Review Step
  // ---------------------------------------------------------------------------

  function renderReviewStep() {
    if (!extractedData) return null;

    return (
      <div className="space-y-6 py-4">
        {/* Confidence badge */}
        <div className="flex items-center gap-3">
          <ConfidenceBadge confidence={extractedData.confidence} />
          <span className="text-xs text-muted-foreground">
            {extractedData.lineItems.length} line item
            {extractedData.lineItems.length !== 1 ? "s" : ""} extracted
          </span>
        </div>

        {/* Warnings */}
        {extractedData.warnings.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc pl-4 space-y-1">
                {extractedData.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Supplier Information (only when creating new) */}
        {!isAddingToExisting && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Supplier Information
            </h4>

            <div className="grid gap-4">
              {/* Supplier name */}
              <div className="grid gap-2">
                <Label htmlFor="ext-supplierName">Supplier Name *</Label>
                <Input
                  id="ext-supplierName"
                  value={editedSupplier.supplierName}
                  onChange={(e) =>
                    updateSupplierField("supplierName", e.target.value)
                  }
                  placeholder="Enter supplier name"
                />
              </div>

              {/* Contact */}
              <div className="grid gap-2">
                <Label htmlFor="ext-supplierContact">Contact Person</Label>
                <Input
                  id="ext-supplierContact"
                  value={editedSupplier.supplierContact}
                  onChange={(e) =>
                    updateSupplierField("supplierContact", e.target.value)
                  }
                  placeholder="Contact person name"
                />
              </div>

              {/* Email & phone */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ext-supplierEmail">Email</Label>
                  <Input
                    id="ext-supplierEmail"
                    type="email"
                    value={editedSupplier.supplierEmail}
                    onChange={(e) =>
                      updateSupplierField("supplierEmail", e.target.value)
                    }
                    placeholder="email@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ext-supplierPhone">Phone</Label>
                  <Input
                    id="ext-supplierPhone"
                    type="tel"
                    value={editedSupplier.supplierPhone}
                    onChange={(e) =>
                      updateSupplierField("supplierPhone", e.target.value)
                    }
                    placeholder="Phone number"
                  />
                </div>
              </div>

              {/* Quotation number */}
              <div className="grid gap-2">
                <Label htmlFor="ext-quotationNumber">Quotation Number</Label>
                <Input
                  id="ext-quotationNumber"
                  value={editedSupplier.quotationNumber}
                  onChange={(e) =>
                    updateSupplierField("quotationNumber", e.target.value)
                  }
                  placeholder="e.g. QUO-001"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ext-quotationDate">Quotation Date</Label>
                  <Input
                    id="ext-quotationDate"
                    type="date"
                    value={editedSupplier.quotationDate}
                    onChange={(e) =>
                      updateSupplierField("quotationDate", e.target.value)
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ext-validUntil">Valid Until</Label>
                  <Input
                    id="ext-validUntil"
                    type="date"
                    value={editedSupplier.validUntil}
                    onChange={(e) =>
                      updateSupplierField("validUntil", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Trade category */}
              <div className="grid gap-2">
                <Label>Trade Category *</Label>
                <Select
                  value={editedSupplier.tradeCategory}
                  onValueChange={(val) =>
                    updateSupplierField(
                      "tradeCategory",
                      val as TradeCategory
                    )
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
            </div>
          </div>
        )}

        {/* Line Items */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">
            Line Items
          </h4>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium w-10">#</th>
                  <th className="px-3 py-2 text-left font-medium min-w-[200px]">
                    Description
                  </th>
                  <th className="px-3 py-2 text-left font-medium w-24">
                    Unit
                  </th>
                  <th className="px-3 py-2 text-right font-medium w-20">
                    Qty
                  </th>
                  <th className="px-3 py-2 text-right font-medium w-28">
                    Rate
                  </th>
                  <th className="px-3 py-2 text-right font-medium w-28">
                    Amount
                  </th>
                  <th className="px-3 py-2 text-center font-medium w-12">
                    {/* Actions */}
                  </th>
                </tr>
              </thead>
              <tbody>
                {editedLineItems.map((item, index) => (
                  <tr
                    key={index}
                    className="group border-b last:border-b-0 hover:bg-muted/30"
                  >
                    <td className="px-3 py-2 text-muted-foreground">
                      {index + 1}
                    </td>
                    <td className="px-1 py-1">
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          updateLineItem(index, "description", e.target.value)
                        }
                        placeholder="Item description"
                        className="h-8 text-sm"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <Input
                        value={item.unit}
                        onChange={(e) =>
                          updateLineItem(index, "unit", e.target.value)
                        }
                        placeholder="item"
                        className="h-8 text-sm"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={item.quantity || ""}
                        onChange={(e) =>
                          updateLineItem(
                            index,
                            "quantity",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="h-8 text-sm text-right"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={item.unitRate || ""}
                        onChange={(e) =>
                          updateLineItem(
                            index,
                            "unitRate",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="h-8 text-sm text-right"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">
                      {formatZAR(item.amount)}
                    </td>
                    <td className="px-1 py-1 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                        onClick={() => deleteLineItem(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}

                {editedLineItems.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-8 text-center text-muted-foreground"
                    >
                      No line items. Click &quot;Add Row&quot; to add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={addLineItem}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Row
          </Button>
        </div>

        {/* Totals */}
        <div className="space-y-2 rounded-lg border bg-muted/30 px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium tabular-nums">
              {formatZAR(subtotal)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">VAT (15%)</span>
            <span className="tabular-nums">{formatZAR(vatAmount)}</span>
          </div>
          <div className="border-t pt-2 flex items-center justify-between text-sm">
            <span className="font-semibold">Total incl. VAT</span>
            <span className="font-semibold tabular-nums">
              {formatZAR(totalInclVat)}
            </span>
          </div>
        </div>

        {/* Notes */}
        <div className="grid gap-2">
          <Label htmlFor="ext-notes">Notes</Label>
          <Textarea
            id="ext-notes"
            value={editedNotes}
            onChange={(e) => setEditedNotes(e.target.value)}
            placeholder="Additional notes..."
            rows={3}
          />
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setStep("upload");
              setFile(null);
              setExtractedData(null);
            }}
            disabled={saving}
          >
            Back
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isAddingToExisting ? (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Line Items
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Save Quotation
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Dialog title per step
  // ---------------------------------------------------------------------------

  const stepTitles: Record<ExtractStep, string> = {
    upload: "Extract Quotation from Document",
    processing: "Extracting Costs",
    review: "Review Extracted Quotation",
  };

  const stepDescriptions: Record<ExtractStep, string> = {
    upload:
      "Upload a quotation document and AI will extract the costs and line items for you.",
    processing: "The document is being analyzed. Please wait...",
    review:
      "Review the extracted data below. You can edit any field before saving.",
  };

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={`max-h-[90vh] overflow-y-auto ${
          step === "review" ? "sm:max-w-4xl" : "sm:max-w-lg"
        }`}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {stepTitles[step]}
          </DialogTitle>
          <DialogDescription>{stepDescriptions[step]}</DialogDescription>
        </DialogHeader>

        {step === "upload" && renderUploadStep()}
        {step === "processing" && renderProcessingStep()}
        {step === "review" && renderReviewStep()}
      </DialogContent>
    </Dialog>
  );
}
