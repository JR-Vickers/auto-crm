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

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userId, isWorker, isAdmin } = useAuth();
  const hasWorkerAccess = isWorker || isAdmin;
  const { templates, saveTemplate, deleteTemplate } = useTemplates(userId);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
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
            setTicket((prev) => prev ? { ...prev, ...payload.new } : null);
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

    return () => {
      ticketSubscription.unsubscribe();
      commentSubscription.unsubscribe();
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
      await fetchComments();
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
        hasWorkerAccess={hasWorkerAccess}
        onAssign={handleAssign}
        onUpdateStatus={handleUpdateStatus}
        onAddComment={handleAddComment}
        templates={templates}
        onSaveTemplate={saveTemplate}
        onDeleteTemplate={deleteTemplate}
      />
    </div>
  );
} 