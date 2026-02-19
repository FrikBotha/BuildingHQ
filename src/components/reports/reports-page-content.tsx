"use client";

import { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Printer, FileText, BarChart3, GanttChart } from "lucide-react";
import type { Project } from "@/types/project";
import type { BOMData } from "@/types/bom";
import type { Quotation } from "@/types/quotation";
import type { CostSummary } from "@/types/cost";
import type { TimelineData } from "@/types/timeline";
import { BOM_CATEGORY_LABELS, type BOMCategory } from "@/types/bom";
import { QUOTATION_STATUS_LABELS } from "@/types/quotation";
import { TRADE_CATEGORY_LABELS } from "@/types/common";
import { PHASE_STATUS_LABELS } from "@/types/timeline";
import { formatZAR } from "@/lib/currency";
import { formatDate } from "@/lib/dates";
import { PROJECT_STATUS_LABELS } from "@/types/project";

export function ReportsPageContent({
  project,
  bom,
  quotations,
  costSummary,
  timeline,
}: {
  project: Project;
  bom: BOMData | null;
  quotations: Quotation[];
  costSummary: CostSummary | null;
  timeline: TimelineData | null;
}) {
  const [activeTab, setActiveTab] = useState("qs-summary");
  const reportRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Reports</h2>
          <p className="text-sm text-muted-foreground">
            Generate professional QS reports
          </p>
        </div>
        <Button onClick={handlePrint} variant="outline">
          <Printer className="mr-2 h-4 w-4" />
          Print Report
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="qs-summary" className="gap-2">
            <FileText className="h-4 w-4" />
            QS Summary
          </TabsTrigger>
          <TabsTrigger value="cost-report" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Cost Report
          </TabsTrigger>
          <TabsTrigger value="timeline-report" className="gap-2">
            <GanttChart className="h-4 w-4" />
            Timeline Report
          </TabsTrigger>
        </TabsList>

        {/* QS Summary Report */}
        <TabsContent value="qs-summary">
          <div ref={reportRef} className="space-y-6 print:space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quantity Surveyor Summary Report</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Generated {formatDate(new Date().toISOString())}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Project Info */}
                <div>
                  <h3 className="font-semibold mb-2">Project Information</h3>
                  <div className="grid gap-2 sm:grid-cols-2 text-sm">
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Project</span>
                      <span className="font-medium">{project.name}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-medium">
                        {PROJECT_STATUS_LABELS[project.projectStatus]}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Address</span>
                      <span className="font-medium">
                        {project.address || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Erf Number</span>
                      <span className="font-medium">
                        {project.erfNumber || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">
                        Building Size
                      </span>
                      <span className="font-medium">
                        {project.buildingSize
                          ? `${project.buildingSize} m²`
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">
                        NHBRC Number
                      </span>
                      <span className="font-medium">
                        {project.nhbrcEnrolmentNumber || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* BOM Summary */}
                <div>
                  <h3 className="font-semibold mb-2">
                    Bill of Materials Summary
                  </h3>
                  {bom ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(bom.subtotalsByCategory)
                          .filter(([, amount]) => amount > 0)
                          .map(([category, amount]) => (
                            <TableRow key={category}>
                              <TableCell>
                                {
                                  BOM_CATEGORY_LABELS[
                                    category as BOMCategory
                                  ]
                                }
                              </TableCell>
                              <TableCell className="text-right">
                                {formatZAR(amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        <TableRow className="font-bold">
                          <TableCell>Subtotal (excl. VAT)</TableCell>
                          <TableCell className="text-right">
                            {formatZAR(bom.grandTotal)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>VAT (15%)</TableCell>
                          <TableCell className="text-right">
                            {formatZAR(bom.grandTotalInclVat - bom.grandTotal)}
                          </TableCell>
                        </TableRow>
                        <TableRow className="font-bold text-lg">
                          <TableCell>Total (incl. VAT)</TableCell>
                          <TableCell className="text-right">
                            {formatZAR(bom.grandTotalInclVat)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      BOM not yet initialized
                    </p>
                  )}
                </div>

                <Separator />

                {/* Quotations Summary */}
                <div>
                  <h3 className="font-semibold mb-2">Quotation Summary</h3>
                  {quotations.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Supplier</TableHead>
                          <TableHead>Trade</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">
                            Amount (excl. VAT)
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {quotations.map((q) => (
                          <TableRow key={q.id}>
                            <TableCell>{q.supplierName}</TableCell>
                            <TableCell>
                              {TRADE_CATEGORY_LABELS[q.tradeCategory]}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {QUOTATION_STATUS_LABELS[q.status]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatZAR(q.totalAmount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No quotations yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cost Report */}
        <TabsContent value="cost-report">
          <Card>
            <CardHeader>
              <CardTitle>Cost Report</CardTitle>
              <p className="text-sm text-muted-foreground">
                Generated {formatDate(new Date().toISOString())}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {costSummary ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">
                        Total Budget
                      </p>
                      <p className="text-xl font-bold">
                        {formatZAR(costSummary.totalBudget)}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">
                        Budget + Contingency
                      </p>
                      <p className="text-xl font-bold">
                        {formatZAR(costSummary.budgetInclContingency)}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">
                        Total Quoted
                      </p>
                      <p className="text-xl font-bold">
                        {formatZAR(costSummary.totalQuoted)}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Variance</p>
                      <p
                        className={`text-xl font-bold ${costSummary.totalVariance >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {formatZAR(costSummary.totalVariance)}
                      </p>
                    </div>
                  </div>

                  {costSummary.entriesByTrade.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">
                        Breakdown by Trade
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Trade</TableHead>
                            <TableHead className="text-right">
                              Quoted
                            </TableHead>
                            <TableHead className="text-right">
                              Actual
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {costSummary.entriesByTrade.map((entry) => (
                            <TableRow key={entry.tradeCategory}>
                              <TableCell>
                                {TRADE_CATEGORY_LABELS[entry.tradeCategory]}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatZAR(entry.quotedAmount)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatZAR(entry.actualAmount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold mb-2">Contingency</h3>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Contingency Rate
                        </span>
                        <span>{costSummary.contingencyPercent}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Contingency Amount
                        </span>
                        <span>{formatZAR(costSummary.contingencyAmount)}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">
                  Cost data not yet available. Set up your BOM and accept
                  quotations to generate cost reports.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Report */}
        <TabsContent value="timeline-report">
          <Card>
            <CardHeader>
              <CardTitle>Timeline Status Report</CardTitle>
              <p className="text-sm text-muted-foreground">
                Generated {formatDate(new Date().toISOString())}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {timeline ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">
                        Total Phases
                      </p>
                      <p className="text-xl font-bold">
                        {timeline.phases.length}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">
                        Completed
                      </p>
                      <p className="text-xl font-bold text-green-600">
                        {
                          timeline.phases.filter(
                            (p) => p.status === "completed"
                          ).length
                        }
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Delayed</p>
                      <p className="text-xl font-bold text-red-600">
                        {
                          timeline.phases.filter((p) => p.status === "delayed")
                            .length
                        }
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Phase Status</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Phase</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Start</TableHead>
                          <TableHead>End</TableHead>
                          <TableHead className="text-right">
                            Complete
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {timeline.phases.map((phase) => (
                          <TableRow key={phase.id}>
                            <TableCell className="font-medium">
                              {phase.name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {PHASE_STATUS_LABELS[phase.status]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatDate(phase.startDate)}
                            </TableCell>
                            <TableCell>{formatDate(phase.endDate)}</TableCell>
                            <TableCell className="text-right">
                              {phase.percentComplete}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {timeline.milestones.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Milestones</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Milestone</TableHead>
                            <TableHead>Target Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {timeline.milestones.map((ms) => (
                            <TableRow key={ms.id}>
                              <TableCell>{ms.name}</TableCell>
                              <TableCell>
                                {formatDate(ms.targetDate)}
                              </TableCell>
                              <TableCell>
                                {ms.isCompleted ? (
                                  <Badge className="bg-green-100 text-green-800">
                                    Completed {formatDate(ms.completedDate)}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">Pending</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">
                  Timeline not yet set up. Initialize your project timeline to
                  generate this report.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
