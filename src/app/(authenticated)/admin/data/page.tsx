"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileSpreadsheet } from "lucide-react";

export default function DataPage() {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    window.open("/api/admin/export", "_blank");
  }

  async function handleImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    const text = await file.text();

    const res = await fetch("/api/admin/import", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: text,
    });

    const result = await res.json();
    setImporting(false);

    if (res.ok) {
      setImportResult(result);
    } else {
      setImportResult({ created: 0, errors: [result.error || "Import failed"] });
    }

    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Data Management</h1>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Bookings
          </CardTitle>
          <CardDescription>
            Download all bookings as a CSV file for backup or external processing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
        </CardContent>
      </Card>

      {/* Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Bookings
          </CardTitle>
          <CardDescription>
            Upload a CSV file to bulk-create bookings. The CSV must have at minimum a &quot;Booker Name&quot; column.
            Supported columns: Event Name, Booker Name, Booker Email, Booker Phone, Event Date (YYYY-MM-DD),
            Event Time (HH:MM), Doors Open, Charge Model (STRAIGHT_HIRE / BOX_OFFICE_SPLIT / INTERNAL),
            Status, Tech Required (Yes/No), Bar Required, FoH Required, Tech Requirements, Ticket Price, Box Office Split %.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <Button onClick={handleImport} disabled={importing}>
              {importing ? "Importing..." : "Import CSV"}
            </Button>
          </div>

          {importResult && (
            <div
              className={`rounded-md p-3 text-sm ${
                importResult.errors.length > 0
                  ? "bg-amber-50 border border-amber-200"
                  : "bg-green-50 border border-green-200"
              }`}
            >
              <p className="font-medium">
                {importResult.created} booking{importResult.created !== 1 ? "s" : ""} imported
                {importResult.errors.length > 0 &&
                  `, ${importResult.errors.length} error${importResult.errors.length !== 1 ? "s" : ""}`}
              </p>
              {importResult.errors.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-amber-700">
                  {importResult.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
