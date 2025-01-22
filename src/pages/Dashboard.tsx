import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Settings } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { format } from "date-fns";

type Ticket = Database["public"]["Tables"]["tickets"]["Row"] & {
  assigned_worker?: {
    full_name: string | null;
  };
  customer?: {
    full_name: string | null;
  };
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isCustomer, hasWorkerAccess, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      fetchTickets();
    }
  }, [authLoading]);

  const fetchTickets = async () => {
    try {
      let query = supabase
        .from('tickets')
        .select(`
          *,
          assigned_worker:profiles!tickets_assigned_to_fkey(full_name),
          customer:profiles!tickets_customer_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (isCustomer) {
        query = query.eq('customer_id', (await supabase.auth.getUser()).data.user?.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      setTickets(data || []);
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

  const handleAssignTicket = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          assigned_to: (await supabase.auth.getUser()).data.user?.id,
          status: 'in_progress'
        })
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ticket assigned successfully",
      });

      fetchTickets();
    } catch (error: any) {
      toast({
        title: "Error",
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
        description: "Ticket status updated successfully",
      });

      fetchTickets();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const getPriorityClass = (priority: Database["public"]["Enums"]["ticket_priority"]) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 font-semibold';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      default:
        return 'text-green-600';
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              {isCustomer ? "Manage your support tickets" : "Manage customer support tickets"}
            </p>
          </div>
          <div className="flex gap-4">
            {isCustomer && (
              <Button onClick={() => navigate('/tickets/new')}>
                <Plus className="h-4 w-4 mr-2" />
                New Ticket
              </Button>
            )}
            {isAdmin && (
              <Button variant="outline" onClick={() => navigate('/admin')}>
                <Settings className="h-4 w-4 mr-2" />
                Admin Panel
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Updated</TableHead>
                  {hasWorkerAccess && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                    <TableCell>{ticket.title}</TableCell>
                    <TableCell>{ticket.customer?.full_name || 'Unknown'}</TableCell>
                    <TableCell>{ticket.assigned_worker?.full_name || 'Unassigned'}</TableCell>
                    <TableCell className="capitalize">{ticket.status.replace(/_/g, ' ')}</TableCell>
                    <TableCell className={getPriorityClass(ticket.priority)}>
                      {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                    </TableCell>
                    <TableCell>{format(new Date(ticket.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{format(new Date(ticket.updated_at), 'MMM d, yyyy')}</TableCell>
                    {hasWorkerAccess && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2">
                          {!ticket.assigned_to && (
                            <Button size="sm" onClick={() => handleAssignTicket(ticket.id)}>
                              Assign to me
                            </Button>
                          )}
                          {ticket.status !== 'closed' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUpdateStatus(ticket.id, 'closed')}
                            >
                              Close
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}