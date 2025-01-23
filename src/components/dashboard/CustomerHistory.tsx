import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type CustomerTicket = Database["public"]["Tables"]["tickets"]["Row"] & {
  assigned_worker: {
    full_name: string | null;
  } | null;
};

interface CustomerHistoryProps {
  customerId: string;
  currentTicketId: string;
}

export function CustomerHistory({ customerId, currentTicketId }: CustomerHistoryProps) {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<CustomerTicket[]>([]);
  const [customerProfile, setCustomerProfile] = useState<any>(null);

  useEffect(() => {
    fetchCustomerHistory();
  }, [customerId]);

  const fetchCustomerHistory = async () => {
    try {
      setLoading(true);
      
      // Fetch customer profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', customerId)
        .single();
      
      if (profileError) throw profileError;
      setCustomerProfile(profile);

      // Fetch all tickets for this customer
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          *,
          assigned_worker:profiles!tickets_assigned_to_fkey(full_name)
        `)
        .eq('customer_id', customerId)
        .neq('id', currentTicketId) // Exclude current ticket
        .order('created_at', { ascending: false });

      if (ticketError) throw ticketError;
      setTickets(ticketData || []);
    } catch (error) {
      console.error('Error fetching customer history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer History</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="profile">
          <TabsList className="mb-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="tickets">Previous Tickets ({tickets.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            {customerProfile && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Name</h4>
                  <p>{customerProfile.full_name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                  <p>{customerProfile.email}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Member Since</h4>
                  <p>{format(new Date(customerProfile.created_at), 'PPP')}</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tickets">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <Card key={ticket.id}>
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{ticket.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(ticket.created_at), 'PPp')}
                          </p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {ticket.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Assigned to: </span>
                        {ticket.assigned_worker?.full_name || 'Unassigned'}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 