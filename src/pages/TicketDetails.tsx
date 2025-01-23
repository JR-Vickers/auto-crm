import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTemplates } from "@/hooks/useTemplates";
import { supabase } from "@/integrations/supabase/client";
import { TicketDetail } from "@/components/dashboard/TicketDetail";
import type { Database } from "@/integrations/supabase/types";

type TicketResponse = Database["public"]["Tables"]["tickets"]["Row"] & {
  assigned_worker: {
    full_name: string | null;
  } | null;
  customer: {
    full_name: string | null;
  } | null;
};

type Ticket = Omit<TicketResponse, 'assigned_worker' | 'customer'> & {
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

interface Attachment {
  id: string;
  filename: string;
  file_path: string;
  content_type: string;
  size_bytes: number;
  is_internal: boolean;
  created_at: string;
  user: {
    full_name: string | null;
  };
}

export default function TicketDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userId, isWorker, isAdmin } = useAuth();
  const hasWorkerAccess = isWorker || isAdmin;
  const { templates, saveTemplate, deleteTemplate } = useTemplates(userId);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTicketDetails();
    // Subscribe to realtime updates
    const ticketSubscription = supabase
      .channel('ticket-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            console.log('Received ticket update:', payload.new);
            setTicket(prev => {
              if (!prev) return null;
              return {
                ...prev,
                ...payload.new,
                // Preserve the nested objects that aren't included in the payload
                assigned_worker: prev.assigned_worker,
                customer: prev.customer,
              };
            });
          }
        }
      )
      .subscribe();

    const commentSubscription = supabase
      .channel('comment-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `ticket_id=eq.${id}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    const attachmentSubscription = supabase
      .channel('attachment-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attachments',
          filter: `ticket_id=eq.${id}`,
        },
        () => {
          fetchAttachments();
        }
      )
      .subscribe();

    return () => {
      ticketSubscription.unsubscribe();
      commentSubscription.unsubscribe();
      attachmentSubscription.unsubscribe();
    };
  }, [id]);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          *,
          assigned_worker:profiles!tickets_assigned_to_fkey(full_name),
          customer:profiles!tickets_customer_id_fkey(full_name)
        `)
        .eq('id', id)
        .single();

      if (ticketError) throw ticketError;
      if (!ticketData) throw new Error('Ticket not found');

      // Transform the response into our expected Ticket type
      const ticket: Ticket = {
        ...ticketData,
        assigned_worker: ticketData.assigned_worker as { full_name: string | null } | null,
        customer: ticketData.customer as { full_name: string | null } | null,
      };

      setTicket(ticket);
      await Promise.all([fetchComments(), fetchAttachments()]);
    } catch (error: any) {
      toast({
        title: "Error loading ticket",
        description: error.message,
        variant: "destructive",
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select(`
          *,
          user:user_id(full_name)
        `)
        .eq('ticket_id', id)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;
      setComments(comments || []);
    } catch (error: any) {
      toast({
        title: "Error loading comments",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchAttachments = async () => {
    try {
      // First get attachments
      const { data: attachments, error: attachmentsError } = await supabase
        .from('attachments')
        .select()
        .eq('ticket_id', id)
        .order('created_at', { ascending: true });

      if (attachmentsError) throw attachmentsError;
      if (!attachments) return;

      // Then get user details for each attachment
      const attachmentsWithUsers = await Promise.all(
        attachments.map(async (attachment) => {
          const { data: userData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', attachment.user_id)
            .single();

          return {
            id: attachment.id,
            filename: attachment.filename,
            file_path: attachment.file_path,
            content_type: attachment.content_type,
            size_bytes: attachment.size_bytes,
            is_internal: attachment.is_internal,
            created_at: attachment.created_at,
            user: {
              full_name: userData?.full_name || null
            }
          };
        })
      );

      setAttachments(attachmentsWithUsers);
    } catch (error: any) {
      toast({
        title: "Error loading attachments",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAssign = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ assigned_to: userId })
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ticket assigned to you",
      });
    } catch (error: any) {
      toast({
        title: "Error assigning ticket",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: Database["public"]["Enums"]["ticket_status"]) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status })
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Ticket status updated to ${status.replace(/_/g, ' ')}`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddComment = async (content: string, isInternal: boolean) => {
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          ticket_id: id,
          user_id: userId,
          content,
          is_internal: isInternal,
        });

      if (error) throw error;

      // Fetch comments after adding one
      await fetchComments();

      toast({
        title: "Success",
        description: "Comment added",
      });
    } catch (error: any) {
      toast({
        title: "Error adding comment",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUploadAttachment = async (files: FileList, isInternal: boolean) => {
    try {
      for (const file of Array.from(files)) {
        const filePath = `${id}/${crypto.randomUUID()}-${file.name}`;
        
        // Upload file to storage
        const { error: uploadError } = await supabase.storage
          .from('ticket-attachments')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Create attachment record
        const { error: attachmentError } = await supabase
          .from('attachments')
          .insert({
            ticket_id: id,
            user_id: userId,
            filename: file.name,
            file_path: filePath,
            content_type: file.type,
            size_bytes: file.size,
            is_internal: isInternal,
          });

        if (attachmentError) throw attachmentError;
      }

      toast({
        title: "Success",
        description: "Files uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error uploading files",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      // First fetch the attachment details including file_path
      const { data: attachment, error: fetchError } = await supabase
        .from('attachments')
        .select(`
          id,
          file_path,
          user_id
        `)
        .eq('id', attachmentId)
        .single();

      if (fetchError) throw fetchError;
      if (!attachment) throw new Error('Attachment not found');

      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('ticket-attachments')
        .remove([attachment.file_path]);

      if (storageError) throw storageError;

      // Delete attachment record
      const { error: deleteError } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachmentId);

      if (deleteError) throw deleteError;

      // Update local state
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));

      toast({
        title: "Success",
        description: "Attachment deleted",
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Error deleting attachment",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDownloadAttachment = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('ticket-attachments')
        .download(attachment.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Error downloading file",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSaveTemplate = async (template: { title: string; content: string }) => {
    await saveTemplate({
      ...template,
      user_id: userId,
    });
  };

  const handleUpdateCustomFields = async (fields: Record<string, any>) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ custom_fields: fields })
        .eq('id', id);

      if (error) throw error;

      // Update local state immediately
      setTicket(prev => prev ? { ...prev, custom_fields: fields } : null);

      toast({
        title: "Success",
        description: "Custom fields updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!ticket) {
    return <div>Ticket not found</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <TicketDetail
        ticket={ticket}
        comments={comments}
        attachments={attachments}
        hasWorkerAccess={hasWorkerAccess}
        onAssign={handleAssign}
        onUpdateStatus={handleUpdateStatus}
        onAddComment={handleAddComment}
        onUploadAttachment={handleUploadAttachment}
        onDeleteAttachment={handleDeleteAttachment}
        onDownloadAttachment={handleDownloadAttachment}
        templates={templates}
        onSaveTemplate={handleSaveTemplate}
        onDeleteTemplate={deleteTemplate}
        onUpdateCustomFields={handleUpdateCustomFields}
      />
    </div>
  );
}