import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { SLAStatus, getPriorityClass } from "./SLAStatus";
import { QuickResponseTemplates } from "./QuickResponseTemplates";
import { FileAttachments } from "./FileAttachments";
import { CustomerHistory } from "./CustomerHistory";
import { EyeIcon, EyeOffIcon, LockIcon } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";

type Ticket = Database["public"]["Tables"]["tickets"]["Row"] & {
  assigned_worker: {
    full_name: string | null;
  } | null;
  customer: {
    full_name: string | null;
  } | null;
};

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: {
    full_name: string | null;
  };
  is_internal: boolean;
}

interface Template {
  id: string;
  title: string;
  content: string;
}

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

interface TicketDetailProps {
  ticket: Ticket;
  comments: Comment[];
  attachments: Attachment[];
  hasWorkerAccess: boolean;
  onAssign: (ticketId: string) => void;
  onUpdateStatus: (ticketId: string, status: Database["public"]["Enums"]["ticket_status"]) => void;
  onAddComment: (content: string, isInternal: boolean) => void;
  onUploadAttachment: (files: FileList, isInternal: boolean) => Promise<void>;
  onDeleteAttachment: (attachmentId: string) => Promise<void>;
  onDownloadAttachment: (attachment: Attachment) => Promise<void>;
  templates: Template[];
  onSaveTemplate: (template: Omit<Template, "id">) => void;
  onDeleteTemplate: (id: string) => void;
}

export function TicketDetail({ 
  ticket, 
  comments,
  attachments,
  hasWorkerAccess,
  onAssign,
  onUpdateStatus,
  onAddComment,
  onUploadAttachment,
  onDeleteAttachment,
  onDownloadAttachment,
  templates,
  onSaveTemplate,
  onDeleteTemplate
}: TicketDetailProps) {
  const [newComment, setNewComment] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [showInternalNotes, setShowInternalNotes] = useState(true);
  const navigate = useNavigate();

  const filteredComments = showInternalNotes 
    ? comments 
    : comments.filter(comment => !comment.is_internal);

  return (
    <div className="space-y-6">
      {/* Ticket Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{ticket.title}</h1>
          <div className="flex gap-2 mt-2 text-sm text-muted-foreground">
            <span>Created {format(new Date(ticket.created_at), 'PPp')}</span>
            <span>•</span>
            <span>Last updated {format(new Date(ticket.updated_at), 'PPp')}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {hasWorkerAccess && !ticket.assigned_to && (
            <Button onClick={() => onAssign(ticket.id)}>
              Assign to me
            </Button>
          )}
          {hasWorkerAccess && ticket.status !== 'closed' && (
            <Button 
              variant="destructive"
              onClick={() => onUpdateStatus(ticket.id, 'closed')}
            >
              Close Ticket
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>

      {/* Ticket Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Badge variant="outline" className="capitalize">
              {ticket.status.replace(/_/g, ' ')}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Priority</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <span className={getPriorityClass(ticket.priority)}>
              {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assigned To</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {ticket.assigned_worker?.full_name || 'Unassigned'}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">SLA Status</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <SLAStatus deadline={ticket.sla_deadline} />
          </CardContent>
        </Card>
      </div>

      {/* Ticket Description */}
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">Description</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div dangerouslySetInnerHTML={{ __html: ticket.description }} />
        </CardContent>
      </Card>

      {/* Customer History */}
      {hasWorkerAccess && ticket.customer_id && (
        <CustomerHistory 
          customerId={ticket.customer_id} 
          currentTicketId={ticket.id} 
        />
      )}

      {/* File Attachments - only show for workers */}
      {hasWorkerAccess && (
        <FileAttachments
          attachments={attachments}
          hasWorkerAccess={hasWorkerAccess}
          onUpload={onUploadAttachment}
          onDelete={onDeleteAttachment}
          onDownload={onDownloadAttachment}
        />
      )}

      {/* Comments */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Comments</h2>
          {hasWorkerAccess && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInternalNotes(!showInternalNotes)}
              className="gap-2"
            >
              {showInternalNotes ? (
                <>
                  <EyeOffIcon className="h-4 w-4" />
                  Hide Internal Notes
                </>
              ) : (
                <>
                  <EyeIcon className="h-4 w-4" />
                  Show Internal Notes
                </>
              )}
            </Button>
          )}
        </div>
        
        {/* Comment List */}
        <div className="space-y-4">
          {filteredComments.map((comment) => (
            <Card 
              key={comment.id} 
              className={comment.is_internal ? 'border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20 dark:border-yellow-900' : ''}
            >
              <CardHeader className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{comment.user.full_name}</div>
                    {comment.is_internal && (
                      <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-950 gap-1 text-xs">
                        <LockIcon className="h-3 w-3" />
                        Internal Note
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(comment.created_at), 'PPp')}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div dangerouslySetInnerHTML={{ __html: comment.content }} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* New Comment */}
        <Card>
          <CardHeader className="p-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Add Comment
              </CardTitle>
              <div className="flex gap-2">
                {hasWorkerAccess && (
                  <>
                    <QuickResponseTemplates
                      templates={templates}
                      onSelect={setNewComment}
                      onSave={onSaveTemplate}
                      onDelete={onDeleteTemplate}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsInternalComment(!isInternalComment)}
                      className={`gap-2 ${isInternalComment ? 'bg-yellow-100 dark:bg-yellow-950' : ''}`}
                    >
                      {isInternalComment ? (
                        <>
                          <LockIcon className="h-4 w-4" />
                          Internal Note
                        </>
                      ) : (
                        'Public Comment'
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <RichTextEditor
              content={newComment}
              onChange={setNewComment}
              placeholder={isInternalComment ? "Write an internal note..." : "Write a comment..."}
            />
            <div className="mt-4 flex justify-end">
              <Button 
                onClick={() => {
                  onAddComment(newComment, isInternalComment);
                  setNewComment("");
                }}
                disabled={!newComment.trim()}
              >
                {isInternalComment ? 'Add Internal Note' : 'Add Comment'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 