import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Clock, Link as LinkIcon, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type CustomerTicket = Database["public"]["Tables"]["tickets"]["Row"] & {
  assigned_worker: {
    full_name: string | null;
  } | null;
};

type TimelineEvent = {
  id: string;
  type: 'ticket_created' | 'ticket_closed' | 'comment_added';
  timestamp: string;
  title: string;
  description: string;
  ticketId: string;
};

interface CustomerHistoryProps {
  customerId: string;
  currentTicketId: string;
}

export function CustomerHistory({ customerId, currentTicketId }: CustomerHistoryProps) {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<CustomerTicket[]>([]);
  const [relatedTickets, setRelatedTickets] = useState<CustomerTicket[]>([]);
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

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
        .neq('id', currentTicketId)
        .order('created_at', { ascending: false });

      if (ticketError) throw ticketError;
      setTickets(ticketData || []);

      // Fetch related tickets (tickets with similar titles or tags)
      if (ticketData && ticketData.length > 0) {
        const currentTicket = await supabase
          .from('tickets')
          .select('title, tags')
          .eq('id', currentTicketId)
          .single();

        if (currentTicket.data) {
          const { data: related, error: relatedError } = await supabase
            .from('tickets')
            .select(`
              *,
              assigned_worker:profiles!tickets_assigned_to_fkey(full_name)
            `)
            .neq('id', currentTicketId)
            .neq('customer_id', customerId)
            .or(`title.ilike.%${currentTicket.data.title}%,tags.cs.{${currentTicket.data.tags?.join(',')}}`)
            .limit(5);

          if (!relatedError && related) {
            setRelatedTickets(related);
          }
        }
      }

      // Build timeline
      const timelineEvents: TimelineEvent[] = [];
      
      // Add ticket events
      ticketData?.forEach(ticket => {
        timelineEvents.push({
          id: `ticket-created-${ticket.id}`,
          type: 'ticket_created',
          timestamp: ticket.created_at,
          title: 'Ticket Created',
          description: ticket.title,
          ticketId: ticket.id
        });
        
        if (ticket.status === 'closed') {
          timelineEvents.push({
            id: `ticket-closed-${ticket.id}`,
            type: 'ticket_closed',
            timestamp: ticket.updated_at,
            title: 'Ticket Closed',
            description: ticket.title,
            ticketId: ticket.id
          });
        }
      });

      // Add comment events
      const { data: comments } = await supabase
        .from('comments')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(10);

      comments?.forEach(comment => {
        timelineEvents.push({
          id: `comment-${comment.id}`,
          type: 'comment_added',
          timestamp: comment.created_at,
          title: 'Comment Added',
          description: comment.content.substring(0, 100) + '...',
          ticketId: comment.ticket_id
        });
      });

      // Sort timeline by timestamp
      timelineEvents.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setTimeline(timelineEvents);

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
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="related">Related Tickets ({relatedTickets.length})</TabsTrigger>
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
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Total Tickets</h4>
                  <p>{tickets.length + 1}</p> {/* +1 for current ticket */}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Open Tickets</h4>
                  <p>{tickets.filter(t => t.status !== 'closed').length + (currentTicketId ? 1 : 0)}</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tickets">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <Link to={`/tickets/${ticket.id}`} key={ticket.id}>
                    <Card className="hover:bg-muted/50 transition-colors">
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
                  </Link>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="timeline">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {timeline.map((event) => (
                  <Link to={`/tickets/${event.ticketId}`} key={event.id}>
                    <Card className="hover:bg-muted/50 transition-colors">
                      <CardHeader className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="mt-1">
                            {event.type === 'ticket_created' && <LinkIcon className="h-4 w-4" />}
                            {event.type === 'ticket_closed' && <Clock className="h-4 w-4" />}
                            {event.type === 'comment_added' && <Activity className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{event.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {event.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(event.timestamp), 'PPp')}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="related">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {relatedTickets.map((ticket) => (
                  <Link to={`/tickets/${ticket.id}`} key={ticket.id}>
                    <Card className="hover:bg-muted/50 transition-colors">
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
                  </Link>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 