"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, Shield } from "lucide-react";
import type { CostSummary } from "@/types/cost";
import { TRADE_CATEGORY_LABELS } from "@/types/common";
import { formatZAR } from "@/lib/currency";

interface CostsPageContentProps {
  projectId: string;
  costSummary: CostSummary | null;
}

export function CostsPageContent({ projectId, costSummary }: CostsPageContentProps) {
  if (!costSummary) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cost Tracking</h1>
          <p className="text-muted-foreground">
            Track budgets, quotations, and actual costs across trades
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              Set up your Bill of Materials and accept quotations to see cost tracking.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    totalBudget,
    contingencyAmount,
    budgetInclContingency,
    totalQuoted,
    totalActual,
    totalVariance,
    contingencyPercent,
    entriesByTrade,
  } = costSummary;

  const varianceIsPositive = totalVariance >= 0;

  // Calculate contingency usage: if over budget, contingency is being consumed
  const overBudget = totalQuoted > totalBudget ? totalQuoted - totalBudget : 0;
  const contingencyUsed = Math.min(overBudget, contingencyAmount);
  const contingencyRemaining = contingencyAmount - contingencyUsed;
  const contingencyUsedPercent =
    contingencyAmount > 0 ? (contingencyUsed / contingencyAmount) * 100 : 0;

  // Determine the maximum budget entry for scaling the visual bars
  const maxBudget = Math.max(...entriesByTrade.map((e) => e.budgetAmount), 1);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cost Tracking</h1>
        <p className="text-muted-foreground">
          Track budgets, quotations, and actual costs across trades
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Budget */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Budget
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatZAR(budgetInclContingency)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Incl. {formatZAR(contingencyAmount)} contingency ({contingencyPercent}%)
            </p>
          </CardContent>
        </Card>

        {/* Total Quoted */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Quoted
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatZAR(totalQuoted)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From accepted quotations
            </p>
          </CardContent>
        </Card>

        {/* Variance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Variance
            </CardTitle>
            {varianceIsPositive ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                varianceIsPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {varianceIsPositive ? "+" : ""}
              {formatZAR(totalVariance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Budget minus quoted
            </p>
          </CardContent>
        </Card>

        {/* Contingency Remaining */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contingency Remaining
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatZAR(contingencyRemaining)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              of {formatZAR(contingencyAmount)} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown by Trade</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Trade Category</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Quoted</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead className="text-right w-[100px]">Variance %</TableHead>
                <TableHead className="w-[140px]">Ratio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entriesByTrade.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                    No cost entries available.
                  </TableCell>
                </TableRow>
              ) : (
                entriesByTrade.map((entry) => {
                  const ratio =
                    entry.budgetAmount > 0
                      ? Math.min((entry.quotedAmount / entry.budgetAmount) * 100, 100)
                      : 0;
                  const isOverBudget = entry.variance < 0;

                  return (
                    <TableRow key={entry.tradeCategory}>
                      <TableCell className="font-medium">
                        {TRADE_CATEGORY_LABELS[entry.tradeCategory]}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatZAR(entry.budgetAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatZAR(entry.quotedAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatZAR(entry.actualAmount)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          isOverBudget ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {entry.variance >= 0 ? "+" : ""}
                        {formatZAR(entry.variance)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={isOverBudget ? "destructive" : "secondary"}
                          className="font-mono"
                        >
                          {entry.variancePercent >= 0 ? "+" : ""}
                          {entry.variancePercent.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isOverBudget ? "bg-red-500" : "bg-green-500"
                              }`}
                              style={{ width: `${ratio}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Visual Budget Breakdown - Horizontal Stacked Bars */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Allocation by Trade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {entriesByTrade
            .filter((entry) => entry.budgetAmount > 0)
            .sort((a, b) => b.budgetAmount - a.budgetAmount)
            .map((entry) => {
              const budgetPercent = (entry.budgetAmount / totalBudget) * 100;
              const quotedPercent =
                entry.budgetAmount > 0
                  ? (entry.quotedAmount / entry.budgetAmount) * 100
                  : 0;

              return (
                <div key={entry.tradeCategory} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {TRADE_CATEGORY_LABELS[entry.tradeCategory]}
                    </span>
                    <span className="text-muted-foreground">
                      {formatZAR(entry.budgetAmount)} ({budgetPercent.toFixed(1)}% of budget)
                    </span>
                  </div>
                  <div className="relative h-6 w-full rounded bg-muted overflow-hidden">
                    {/* Budget bar (full width relative to max) */}
                    <div
                      className="absolute inset-y-0 left-0 rounded bg-blue-200"
                      style={{ width: `${(entry.budgetAmount / maxBudget) * 100}%` }}
                    />
                    {/* Quoted bar overlaid */}
                    <div
                      className={`absolute inset-y-0 left-0 rounded ${
                        entry.quotedAmount > entry.budgetAmount
                          ? "bg-red-400"
                          : "bg-blue-500"
                      }`}
                      style={{
                        width: `${
                          (Math.min(entry.quotedAmount, entry.budgetAmount) / maxBudget) * 100
                        }%`,
                      }}
                    />
                    {/* Label */}
                    <div className="absolute inset-0 flex items-center px-2">
                      <span className="text-xs font-medium text-white drop-shadow-sm">
                        {formatZAR(entry.quotedAmount)} quoted
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          {entriesByTrade.filter((e) => e.budgetAmount > 0).length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No budget entries to display.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Contingency Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Contingency Fund</CardTitle>
          <Shield className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Total Contingency</p>
              <p className="text-lg font-semibold">{formatZAR(contingencyAmount)}</p>
              <p className="text-xs text-muted-foreground">
                {contingencyPercent}% of base budget
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Used</p>
              <p className="text-lg font-semibold text-orange-600">
                {formatZAR(contingencyUsed)}
              </p>
              <p className="text-xs text-muted-foreground">
                Applied to over-budget trades
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p
                className={`text-lg font-semibold ${
                  contingencyRemaining > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatZAR(contingencyRemaining)}
              </p>
              <p className="text-xs text-muted-foreground">Available for overruns</p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Contingency usage</span>
              <span className="font-medium">{contingencyUsedPercent.toFixed(1)}%</span>
            </div>
            <Progress value={contingencyUsedPercent} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
