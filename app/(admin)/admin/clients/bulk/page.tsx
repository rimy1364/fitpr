"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Upload, Download, ArrowLeft, CheckCircle2, XCircle, Loader2 } from "lucide-react";

type ParsedRow = Record<string, string>;
type ResultRow = { name: string; status: "created" | "skipped"; reason?: string };

const COLUMNS = ["name", "email", "password", "phone", "quarterlyFee", "goal"];
const SAMPLE_ROW = ["John Doe", "john@example.com", "password123", "9876543210", "3000", "WEIGHT_LOSS"];

function downloadTemplate() {
  const csv = [COLUMNS.join(","), SAMPLE_ROW.join(",")].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "clients_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row: ParsedRow = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return row;
  });
}

export default function BulkUploadClientsPage() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [summary, setSummary] = useState<{ created: number; skipped: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target?.result as string);
      if (parsed.length === 0) {
        toast({ variant: "destructive", title: "Empty or invalid CSV" });
        return;
      }
      setRows(parsed);
      setResults(null);
      setSummary(null);
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (rows.length === 0) return;
    setIsUploading(true);
    try {
      const res = await fetch("/api/admin/clients/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ variant: "destructive", title: "Upload failed", description: data.error });
        return;
      }
      setResults(data.results);
      setSummary(data.summary);
      toast({ title: `Done: ${data.summary.created} created, ${data.summary.skipped} skipped` });
    } catch {
      toast({ variant: "destructive", title: "Upload failed", description: "Something went wrong." });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/clients"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Bulk Upload Clients</h1>
          <p className="text-muted-foreground text-sm">Upload a CSV file to add multiple clients at once.</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Instructions</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Download the template CSV, fill in your client data, then upload it here.</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>name</strong> — Full name (required, min 2 chars)</li>
            <li><strong>email</strong> — Unique email address (required)</li>
            <li><strong>password</strong> — Login password (required, min 8 chars)</li>
            <li><strong>phone</strong> — Phone number (optional)</li>
            <li><strong>quarterlyFee</strong> — Quarterly fee in ₹ (optional, integer)</li>
            <li><strong>goal</strong> — One of: WEIGHT_LOSS, MUSCLE_GAIN, TRANSFORMATION, FITNESS (optional)</li>
          </ul>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" /> Download Template
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Upload CSV</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Click to select a CSV file</p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </div>

          {rows.length > 0 && !results && (
            <div className="space-y-3">
              <p className="text-sm font-medium">{rows.length} rows parsed — preview:</p>
              <div className="rounded-md border overflow-x-auto max-h-72 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {COLUMNS.map((c) => <TableHead key={c}>{c}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 10).map((row, i) => (
                      <TableRow key={i}>
                        {COLUMNS.map((c) => <TableCell key={c} className="text-xs">{row[c] ?? ""}</TableCell>)}
                      </TableRow>
                    ))}
                    {rows.length > 10 && (
                      <TableRow>
                        <TableCell colSpan={COLUMNS.length} className="text-center text-xs text-muted-foreground py-2">
                          …and {rows.length - 10} more rows
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading…</> : <><Upload className="h-4 w-4 mr-2" /> Upload {rows.length} Clients</>}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {results && summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              Results
              <span className="text-sm font-normal text-muted-foreground">
                {summary.created} created · {summary.skipped} skipped
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> {summary.created} created
              </div>
              <div className="flex items-center gap-2 text-sm text-red-500">
                <XCircle className="h-4 w-4" /> {summary.skipped} skipped
              </div>
            </div>
            <div className="rounded-md border overflow-x-auto max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm font-medium">{r.name}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === "created" ? "success" : "secondary"}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.reason ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/admin/clients">View All Clients</Link>
              </Button>
              <Button variant="outline" onClick={() => { setRows([]); setResults(null); setSummary(null); if (fileRef.current) fileRef.current.value = ""; }}>
                Upload Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
