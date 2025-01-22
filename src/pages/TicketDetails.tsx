import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

type Ticket = Database["public"]["Tables"]["tickets"]["Row"];
type Comment = Database["public"]["Tables"]["comments"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasWorkerAccess, loading: authLoading } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Profile | null>(null);
  const [assignedWorker, setAssignedWorker] = useState<Profile | null>(null);

  useEffect(() => {
    if (!authLoading && id) {
      fetchTicketDetails();
    }
  }, [id, authLoading]);

  const fetchTicketDetails = async () => {
    try {
      // Fetch ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single();

      if (ticketError) throw ticketError;
      setTicket(ticketData);

      // Fetch customer profile
      const { data: customerData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', ticketData.customer_id)
        .single();

      setCustomer(customerData);

      // Fetch assigned worker profile if exists
      if (ticketData.assigned_to) {
        const { data: workerData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', ticketData.assigned_to)
          .single();

        setAssignedWorker(workerData);
      }

      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;
      setComments(commentsData);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert([
          {
            ticket_id: id!,
            content: newComment,
            user_id: (await supabase.auth.getUser()).data.user!.id,
          },
        ]);

      if (error) throw error;

      setNewComment("");
      fetchTicketDetails();
      
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (status: Database["public"]["Enums"]["ticket_status"]) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      fetchTicketDetails();
      
      toast({
        title: "Success",
        description: "Ticket status updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAssignToMe = async () => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          assigned_to: (await supabase.auth.getUser()).data.user!.id,
          status: 'in_progress'
        })
        .eq('id', id);

      if (error) throw error;

      fetchTicketDetails();
      
      toast({
        title: "Success",
        description: "Ticket assigned successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Ticket not found</h1>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{ticket.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Opened by {customer?.full_name || 'Unknown'} • 
                  Priority: <span className="capitalize">{ticket.priority}</span>
                </p>
                {assignedWorker && (
                  <p className="text-sm text-muted-foreground">
                    Assigned to: {assignedWorker.full_name}
                  </p>
                )}
              </div>
              {hasWorkerAccess && (
                <div className="flex gap-4">
                  {!ticket.assigned_to && (
                    <Button onClick={handleAssignToMe}>
                      Assign to me
                    </Button>
                  )}
                  <Select
                    value={ticket.status}
                    onValueChange={(value) => handleStatusChange(value as Database["public"]["Enums"]["ticket_status"])}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="waiting_on_customer">Waiting on Customer</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{ticket.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="p-4 rounded-lg bg-muted/50">
                  <p className="whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}
              
              {ticket.status !== 'closed' && (
                <div className="space-y-4">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <Button onClick={handleSubmitComment}>
                    Add Comment
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}