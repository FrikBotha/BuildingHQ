"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import type { BOMData, BOMItem, BOMCategory, BOMUnit } from "@/types/bom";
import {
  BOM_CATEGORY_LABELS,
  BOM_CATEGORY_ORDER,
  BOM_UNIT_LABELS,
} from "@/types/bom";
import { formatZAR, formatNumber } from "@/lib/currency";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return crypto.randomUUID();
}

function getNextItemNumber(items: BOMItem[], category: BOMCategory): string {
  const prefixMap: Record<BOMCategory, string> = {
    preliminaries: "P",
    foundations: "F",
    structural: "S",
    roofing: "R",
    plumbing: "PL",
    electrical: "E",
    finishes_internal: "FI",
    finishes_external: "FE",
    external_works: "EW",
    provisional_sums: "PS",
  };
  const prefix = prefixMap[category];
  const categoryItems = items.filter((i) => i.category === category);
  const maxNum = categoryItems.reduce((max, item) => {
    const match = item.itemNumber.match(/(\d+)$/);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 0);
  return `${prefix}-${String(maxNum + 1).padStart(3, "0")}`;
}

function computeSubtotals(items: BOMItem[]): Record<BOMCategory, number> {
  const subtotals = {} as Record<BOMCategory, number>;
  for (const cat of BOM_CATEGORY_ORDER) {
    subtotals[cat] = 0;
  }
  for (const item of items) {
    subtotals[item.category] += item.quantity * item.rate;
  }
  return subtotals;
}

function computeGrandTotal(subtotals: Record<BOMCategory, number>): number {
  return Object.values(subtotals).reduce((sum, v) => sum + v, 0);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface AddItemRowProps {
  category: BOMCategory;
  onAdd: (item: BOMItem) => void;
}

function AddItemRow({ category, onAdd }: AddItemRowProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState<BOMUnit>("item");
  const [quantity, setQuantity] = useState("1");
  const [rate, setRate] = useState("0");

  const handleSubmit = () => {
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }
    const qty = parseFloat(quantity) || 0;
    const rt = parseFloat(rate) || 0;
    const newItem: BOMItem = {
      id: generateId(),
      category,
      itemNumber: "", // Will be assigned by caller
      description: description.trim(),
      unit,
      quantity: qty,
      rate: rt,
      amount: qty * rt,
      isStandard: false,
      notes: "",
      linkedQuotationIds: [],
    };
    onAdd(newItem);
    setDescription("");
    setUnit("item");
    setQuantity("1");
    setRate("0");
    setIsAdding(false);
  };

  if (!isAdding) {
    return (
      <TableRow>
        <TableCell colSpan={7}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Item
          </Button>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow className="bg-muted/30">
      <TableCell className="w-[80px]">
        <Badge variant="outline" className="text-xs">
          New
        </Badge>
      </TableCell>
      <TableCell>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Item description"
          className="h-8 text-sm"
          autoFocus
        />
      </TableCell>
      <TableCell className="w-[120px]">
        <Select value={unit} onValueChange={(v) => setUnit(v as BOMUnit)}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(BOM_UNIT_LABELS) as BOMUnit[]).map((u) => (
              <SelectItem key={u} value={u}>
                {BOM_UNIT_LABELS[u]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="w-[100px]">
        <Input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="h-8 text-sm text-right"
          min={0}
          step="any"
        />
      </TableCell>
      <TableCell className="w-[120px]">
        <Input
          type="number"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          className="h-8 text-sm text-right"
          min={0}
          step="any"
        />
      </TableCell>
      <TableCell className="w-[120px] text-right text-sm text-muted-foreground">
        {formatZAR((parseFloat(quantity) || 0) * (parseFloat(rate) || 0))}
      </TableCell>
      <TableCell className="w-[80px]">
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={handleSubmit} className="h-8 px-2 text-xs">
            Save
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(false)}
            className="h-8 px-2 text-xs text-muted-foreground"
          >
            Cancel
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

interface BOMItemRowProps {
  item: BOMItem;
  onUpdate: (itemId: string, updates: Partial<BOMItem>) => void;
  onDelete: (itemId: string) => void;
  isLoading: boolean;
}

function BOMItemRow({ item, onUpdate, onDelete, isLoading }: BOMItemRowProps) {
  const [localQty, setLocalQty] = useState(String(item.quantity));
  const [localRate, setLocalRate] = useState(String(item.rate));

  const handleQtyBlur = () => {
    const parsed = parseFloat(localQty);
    if (isNaN(parsed) || parsed === item.quantity) {
      setLocalQty(String(item.quantity));
      return;
    }
    onUpdate(item.id, { quantity: parsed, amount: parsed * item.rate });
  };

  const handleRateBlur = () => {
    const parsed = parseFloat(localRate);
    if (isNaN(parsed) || parsed === item.rate) {
      setLocalRate(String(item.rate));
      return;
    }
    onUpdate(item.id, { rate: parsed, amount: item.quantity * parsed });
  };

  const handleQtyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleRateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  const displayQty = parseFloat(localQty) || 0;
  const displayRate = parseFloat(localRate) || 0;
  const computedAmount = displayQty * displayRate;

  return (
    <TableRow className="group">
      <TableCell className="w-[80px] text-sm text-muted-foreground font-mono">
        {item.itemNumber}
      </TableCell>
      <TableCell className="text-sm">
        <div className="flex items-center gap-2">
          {item.description}
          {item.isStandard && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              NHBRC
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="w-[120px] text-sm text-muted-foreground">
        {BOM_UNIT_LABELS[item.unit]}
      </TableCell>
      <TableCell className="w-[100px]">
        <Input
          type="number"
          value={localQty}
          onChange={(e) => setLocalQty(e.target.value)}
          onBlur={handleQtyBlur}
          onKeyDown={handleQtyKeyDown}
          className="h-8 text-sm text-right"
          min={0}
          step="any"
          disabled={isLoading}
        />
      </TableCell>
      <TableCell className="w-[120px]">
        <Input
          type="number"
          value={localRate}
          onChange={(e) => setLocalRate(e.target.value)}
          onBlur={handleRateBlur}
          onKeyDown={handleRateKeyDown}
          className="h-8 text-sm text-right"
          min={0}
          step="any"
          disabled={isLoading}
        />
      </TableCell>
      <TableCell className="w-[120px] text-right text-sm font-medium">
        {formatZAR(computedAmount)}
      </TableCell>
      <TableCell className="w-[80px]">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(item.id)}
          disabled={isLoading}
          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

interface CategorySectionProps {
  category: BOMCategory;
  items: BOMItem[];
  subtotal: number;
  onUpdate: (itemId: string, updates: Partial<BOMItem>) => void;
  onDelete: (itemId: string) => void;
  onAdd: (item: BOMItem) => void;
  isLoading: boolean;
}

function CategorySection({
  category,
  items,
  subtotal,
  onUpdate,
  onDelete,
  onAdd,
  isLoading,
}: CategorySectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-semibold text-sm">
            {BOM_CATEGORY_LABELS[category]}
          </span>
          <Badge variant="outline" className="text-xs ml-1">
            {items.length} {items.length === 1 ? "item" : "items"}
          </Badge>
        </div>
        <span className="font-semibold text-sm">{formatZAR(subtotal)}</span>
      </button>

      {!collapsed && (
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="w-[80px]">Item #</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[120px]">Unit</TableHead>
              <TableHead className="w-[100px] text-right">Qty</TableHead>
              <TableHead className="w-[120px] text-right">Rate (ZAR)</TableHead>
              <TableHead className="w-[120px] text-right">Amount</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <BOMItemRow
                key={item.id}
                item={item}
                onUpdate={onUpdate}
                onDelete={onDelete}
                isLoading={isLoading}
              />
            ))}
            <AddItemRow category={category} onAdd={onAdd} />
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface BOMPageContentProps {
  projectId: string;
  initialBom: BOMData | null;
}

export default function BOMPageContent({
  projectId,
  initialBom,
}: BOMPageContentProps) {
  const router = useRouter();
  const [bom, setBom] = useState<BOMData | null>(initialBom);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // ------- Derived state -------
  const items = bom?.items ?? [];
  const subtotals = bom ? bom.subtotalsByCategory : computeSubtotals([]);
  const grandTotal = bom ? bom.grandTotal : 0;
  const vatRate = bom?.vatRate ?? 0.15;
  const vatAmount = grandTotal * vatRate;
  const grandTotalInclVat = bom ? bom.grandTotalInclVat : 0;

  // ------- API helpers -------
  const apiUrl = `/api/projects/${projectId}/bom`;

  const handleInitialize = useCallback(async () => {
    setIsInitializing(true);
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "initialize" }),
      });
      if (!res.ok) throw new Error("Failed to initialize BOM");
      const data: BOMData = await res.json();
      setBom(data);
      toast.success("BOM initialized from NHBRC template");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to initialize BOM"
      );
    } finally {
      setIsInitializing(false);
    }
  }, [apiUrl, router]);

  const handleUpdate = useCallback(
    async (itemId: string, updates: Partial<BOMItem>) => {
      if (!bom) return;

      // Optimistic update
      const prevBom = bom;
      const updatedItems = bom.items.map((item) => {
        if (item.id !== itemId) return item;
        const merged = { ...item, ...updates };
        merged.amount = merged.quantity * merged.rate;
        return merged;
      });
      const newSubtotals = computeSubtotals(updatedItems);
      const newGrandTotal = computeGrandTotal(newSubtotals);
      setBom({
        ...bom,
        items: updatedItems,
        subtotalsByCategory: newSubtotals,
        grandTotal: newGrandTotal,
        grandTotalInclVat: newGrandTotal * (1 + bom.vatRate),
      });

      setIsLoading(true);
      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "update", itemId, updates }),
        });
        if (!res.ok) throw new Error("Failed to update item");
        const data: BOMData = await res.json();
        setBom(data);
      } catch (err) {
        setBom(prevBom);
        toast.error(
          err instanceof Error ? err.message : "Failed to update item"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [bom, apiUrl]
  );

  const handleAdd = useCallback(
    async (newItem: BOMItem) => {
      if (!bom) return;

      // Assign proper item number
      const itemNumber = getNextItemNumber(bom.items, newItem.category);
      const itemWithNumber = { ...newItem, itemNumber };

      setIsLoading(true);
      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "add", item: itemWithNumber }),
        });
        if (!res.ok) throw new Error("Failed to add item");
        const data: BOMData = await res.json();
        setBom(data);
        toast.success("Item added");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to add item"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [bom, apiUrl]
  );

  const handleDelete = useCallback(
    async (itemId: string) => {
      if (!bom) return;

      const prevBom = bom;
      // Optimistic removal
      const updatedItems = bom.items.filter((i) => i.id !== itemId);
      const newSubtotals = computeSubtotals(updatedItems);
      const newGrandTotal = computeGrandTotal(newSubtotals);
      setBom({
        ...bom,
        items: updatedItems,
        subtotalsByCategory: newSubtotals,
        grandTotal: newGrandTotal,
        grandTotalInclVat: newGrandTotal * (1 + bom.vatRate),
      });

      setIsLoading(true);
      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", itemId }),
        });
        if (!res.ok) throw new Error("Failed to delete item");
        const data: BOMData = await res.json();
        setBom(data);
        toast.success("Item removed");
      } catch (err) {
        setBom(prevBom);
        toast.error(
          err instanceof Error ? err.message : "Failed to delete item"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [bom, apiUrl]
  );

  // ------- Empty state -------
  if (!bom) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <ClipboardList className="h-7 w-7 text-muted-foreground" />
            </div>
            <CardTitle>No Bill of Materials</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Initialize a comprehensive BOM based on the NHBRC (National Home
              Builders Registration Council) standard template for residential
              construction in South Africa.
            </p>
            <Button
              onClick={handleInitialize}
              disabled={isInitializing}
              className="w-full"
            >
              {isInitializing ? (
                <>Initializing...</>
              ) : (
                <>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Initialize from NHBRC Template
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ------- Group items by category -------
  const itemsByCategory: Record<BOMCategory, BOMItem[]> = {} as Record<
    BOMCategory,
    BOMItem[]
  >;
  for (const cat of BOM_CATEGORY_ORDER) {
    itemsByCategory[cat] = [];
  }
  for (const item of items) {
    if (itemsByCategory[item.category]) {
      itemsByCategory[item.category].push(item);
    }
  }

  // ------- Populated state -------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Bill of Materials
          </h2>
          <p className="text-sm text-muted-foreground">
            {items.length} items across {BOM_CATEGORY_ORDER.filter((c) => itemsByCategory[c].length > 0).length} categories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Category sections */}
      <div className="space-y-4">
        {BOM_CATEGORY_ORDER.map((category) => {
          const catItems = itemsByCategory[category];
          // Show all categories even if empty, so user can add items
          return (
            <CategorySection
              key={category}
              category={category}
              items={catItems}
              subtotal={subtotals[category]}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onAdd={handleAdd}
              isLoading={isLoading}
            />
          );
        })}
      </div>

      <Separator />

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cost Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Subtotals by category */}
            {BOM_CATEGORY_ORDER.map((category) => {
              const catSubtotal = subtotals[category];
              if (catSubtotal === 0) return null;
              return (
                <div
                  key={category}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    {BOM_CATEGORY_LABELS[category]}
                  </span>
                  <span>{formatZAR(catSubtotal)}</span>
                </div>
              );
            })}

            <Separator />

            {/* Grand total excl VAT */}
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Grand Total (excl. VAT)</span>
              <span>{formatZAR(grandTotal)}</span>
            </div>

            {/* VAT */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                VAT ({formatNumber(vatRate * 100, 0)}%)
              </span>
              <span>{formatZAR(vatAmount)}</span>
            </div>

            <Separator />

            {/* Grand total incl VAT */}
            <div className="flex items-center justify-between text-base font-bold">
              <span>Grand Total (incl. VAT)</span>
              <span className="text-lg">{formatZAR(grandTotalInclVat)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
