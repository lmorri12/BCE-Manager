"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Paperclip, Upload, X, Download } from "lucide-react";

type Attachment = {
  id: string;
  fileName: string;
  fileType: string;
  fileTypeOther: string | null;
  fileSize: number;
  createdAt: string;
};

const FILE_TYPES = [
  { value: "MARKETING_MATERIALS", label: "Marketing Materials" },
  { value: "THEATRE_RENTAL_FORM", label: "Theatre Rental Form" },
  { value: "CONTRACT", label: "Contract" },
  { value: "TECH_SPEC", label: "Tech Spec" },
  { value: "OTHER", label: "Other" },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getTypeLabel(fileType: string, fileTypeOther: string | null): string {
  if (fileType === "OTHER" && fileTypeOther) return fileTypeOther;
  return FILE_TYPES.find((t) => t.value === fileType)?.label || fileType;
}

export function BookingAttachments({
  bookingId,
  attachments,
  onUpdate,
}: {
  bookingId: string;
  attachments: Attachment[];
  onUpdate: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [fileType, setFileType] = useState("MARKETING_MATERIALS");
  const [fileTypeOther, setFileTypeOther] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);

    const fd = new FormData();
    fd.append("file", selectedFile);
    fd.append("fileType", fileType);
    if (fileType === "OTHER") fd.append("fileTypeOther", fileTypeOther);

    await fetch(`/api/bookings/${bookingId}/attachments`, {
      method: "POST",
      body: fd,
    });

    setUploading(false);
    setSelectedFile(null);
    setFileType("MARKETING_MATERIALS");
    setFileTypeOther("");
    onUpdate();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this attachment?")) return;
    await fetch(`/api/bookings/${bookingId}/attachments/${id}`, {
      method: "DELETE",
    });
    onUpdate();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-5 w-5" />
          Attachments ({attachments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {attachments.length > 0 ? (
          <div className="space-y-2">
            {attachments.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {getTypeLabel(a.fileType, a.fileTypeOther)}
                  </Badge>
                  <span className="font-medium truncate">{a.fileName}</span>
                  <span className="text-xs text-[var(--muted-foreground)] shrink-0">
                    {formatFileSize(a.fileSize)}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)] shrink-0">
                    {new Date(a.createdAt).toLocaleDateString("en-GB")}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={`/api/bookings/${bookingId}/attachments/${a.id}`}
                    download
                    className="inline-flex items-center justify-center rounded-md h-8 w-8 hover:bg-[var(--muted)]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDelete(a.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted-foreground)]">
            No attachments yet.
          </p>
        )}

        <div className="border-t pt-4 space-y-3">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-1">
              <label className="text-xs font-medium">Type</label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="flex h-10 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              >
                {FILE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            {fileType === "OTHER" && (
              <div className="space-y-1">
                <label className="text-xs font-medium">Describe</label>
                <Input
                  value={fileTypeOther}
                  onChange={(e) => setFileTypeOther(e.target.value)}
                  placeholder="File type description"
                />
              </div>
            )}
            <div className="flex-1 space-y-1 min-w-[200px]">
              <label className="text-xs font-medium">File</label>
              <Input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading || (fileType === "OTHER" && !fileTypeOther.trim())}
            >
              <Upload className="mr-1 h-4 w-4" />
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
