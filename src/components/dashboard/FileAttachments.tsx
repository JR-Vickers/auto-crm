import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileIcon, PaperclipIcon, TrashIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { formatBytes } from "@/lib/utils";

interface Attachment {
  id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  is_internal: boolean;
  created_at: string;
  user: {
    full_name: string | null;
  };
}

interface FileAttachmentsProps {
  attachments: Attachment[];
  hasWorkerAccess: boolean;
  onUpload: (files: FileList, isInternal: boolean) => Promise<void>;
  onDelete: (attachmentId: string) => Promise<void>;
  onDownload: (attachment: Attachment) => Promise<void>;
}

export function FileAttachments({
  attachments,
  hasWorkerAccess,
  onUpload,
  onDelete,
  onDownload,
}: FileAttachmentsProps) {
  const [isInternalUpload, setIsInternalUpload] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      await onUpload(e.dataTransfer.files, isInternalUpload);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      await onUpload(e.target.files, isInternalUpload);
      e.target.value = ""; // Reset input
    }
  };

  return (
    <Card>
      <CardHeader className="p-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Attachments
          </CardTitle>
          {hasWorkerAccess && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsInternalUpload(!isInternalUpload)}
                className={isInternalUpload ? "bg-yellow-100" : ""}
              >
                {isInternalUpload ? (
                  <EyeOffIcon className="h-4 w-4 mr-2" />
                ) : (
                  <EyeIcon className="h-4 w-4 mr-2" />
                )}
                {isInternalUpload ? "Internal" : "Public"}
              </Button>
              <label>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <PaperclipIcon className="h-4 w-4 mr-2" />
                    Attach Files
                  </span>
                </Button>
              </label>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div
          className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-muted"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {attachments.length === 0 ? (
            <div className="text-center text-muted-foreground">
              {isDragging ? "Drop files here" : "No attachments yet"}
            </div>
          ) : (
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    attachment.is_internal ? "bg-yellow-50" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileIcon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{attachment.filename}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatBytes(attachment.size_bytes)} • Uploaded by{" "}
                        {attachment.user.full_name}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDownload(attachment)}
                    >
                      Download
                    </Button>
                    {hasWorkerAccess && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(attachment.id)}
                      >
                        <TrashIcon className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 