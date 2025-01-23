import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { TicketTable } from "@/components/dashboard/TicketTable";
import { QueueFilters, type FilterState } from "@/components/dashboard/QueueFilters";
import { BulkActions } from "@/components/dashboard/BulkActions";

type Ticket = Database["public"]["Tables"]["tickets"]["Row"] & {
  assigned_worker?: {
    full_name: string | null;
  };
  customer?: {
    full_name: string | null;
  };
};

const defaultFilters: FilterState = {
  search: "",
  status: "all",
  priority: "all",
  assignee: "all",
  sortBy: "created_at",
  sortOrder: "desc"
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isCustomer, hasWorkerAccess, loading: authLoading, userId } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);

  // Set up real-time subscription
  useEffect(() => {
    if (!authLoading) {
      const channel = supabase
        .channel('tickets')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tickets'
          },
          () => {
            fetchTickets();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [authLoading]);

  // Fetch tickets when filters change
  useEffect(() => {
    if (!authLoading) {
      fetchTickets();
    }
  }, [authLoading, filters]);

  const fetchTickets = async () => {
    try {
      let query = supabase
        .from('tickets')
        .select(`
          *,
          assigned_worker:profiles!tickets_assigned_to_fkey(full_name),
          customer:profiles!tickets_customer_id_fkey(full_name)
        `);

      // Apply filters
      if (isCustomer) {
        query = query.eq('customer_id', userId);
      } else if (filters.assignee === 'me') {
        query = query.eq('assigned_to', userId);
      } else if (filters.assignee === 'unassigned') {
        query = query.is('assigned_to', null);
      }

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply sorting
      query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });

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
          assigned_to: userId,
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

  const handleBulkStatusChange = async (status: Database["public"]["Enums"]["ticket_status"]) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status })
        .in('id', selectedTickets);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tickets updated successfully",
      });

      setSelectedTickets([]);
      fetchTickets();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleBulkAssign = async () => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          assigned_to: userId,
          status: 'in_progress'
        })
        .in('id', selectedTickets);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tickets assigned successfully",
      });

      setSelectedTickets([]);
      fetchTickets();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSelectionChange = (ticketId: string, isSelected: boolean) => {
    setSelectedTickets(prev => 
      isSelected 
        ? [...prev, ticketId]
        : prev.filter(id => id !== ticketId)
    );
  };

  const handleSelectAll = (isSelected: boolean) => {
    setSelectedTickets(isSelected ? tickets.map(t => t.id) : []);
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <DashboardHeader />
        
        <Card>
          <CardHeader>
            <CardTitle>Tickets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <QueueFilters
              filters={filters}
              onFilterChange={setFilters}
              onResetFilters={() => setFilters(defaultFilters)}
            />

            {hasWorkerAccess && (
              <BulkActions
                selectedTickets={selectedTickets}
                onBulkStatusChange={handleBulkStatusChange}
                onBulkAssign={handleBulkAssign}
                onClearSelection={() => setSelectedTickets([])}
              />
            )}

            <TicketTable
              tickets={tickets}
              hasWorkerAccess={hasWorkerAccess}
              selectedTickets={selectedTickets}
              onAssignTicket={handleAssignTicket}
              onUpdateStatus={handleUpdateStatus}
              onRowClick={(id) => navigate(`/tickets/${id}`)}
              onSelectionChange={handleSelectionChange}
              onSelectAll={handleSelectAll}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}