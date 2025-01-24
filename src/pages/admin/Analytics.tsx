import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BarChart, LineChart } from "@/components/ui/chart";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

type TicketStatus = Database["public"]["Enums"]["ticket_status"];
type TicketPriority = Database["public"]["Enums"]["ticket_priority"];

interface AnalyticsData {
  ticketStats: {
    total: number;
    open: number;
    closed: number;
    avgResolutionTime: number;
  };
  ticketsByPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  ticketsByStatus: {
    [K in TicketStatus]: number;
  };
  ticketTrends: {
    date: string;
    count: number;
  }[];
  responseMetrics: {
    avgFirstResponseTime: number;
    avgResolutionTime: number;
    slaComplianceRate: number;
  };
}

export default function AnalyticsDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch basic ticket stats
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select(`
          *,
          comments (
            created_at,
            is_internal
          )
        `);

      if (ticketsError) throw ticketsError;

      // Calculate ticket stats
      const ticketStats = {
        total: tickets.length,
        open: tickets.filter(t => t.status !== 'closed').length,
        closed: tickets.filter(t => t.status === 'closed').length,
        avgResolutionTime: tickets
          .filter(t => t.status === 'closed' && t.closed_at)
          .reduce((acc, t) => {
            const created = new Date(t.created_at).getTime();
            const closed = new Date(t.closed_at!).getTime();
            return acc + (closed - created);
          }, 0) / (tickets.filter(t => t.status === 'closed' && t.closed_at).length || 1) / (1000 * 60 * 60), // Convert to hours
      };

      // Calculate average first response time
      const ticketsWithResponses = tickets.filter(t => 
        t.comments?.some(c => !c.is_internal)
      );

      const avgFirstResponseTime = ticketsWithResponses.reduce((acc, ticket) => {
        const firstPublicComment = ticket.comments
          ?.filter(c => !c.is_internal)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];

        if (!firstPublicComment) return acc;

        const created = new Date(ticket.created_at).getTime();
        const firstResponse = new Date(firstPublicComment.created_at).getTime();
        return acc + (firstResponse - created);
      }, 0) / (ticketsWithResponses.length || 1) / (1000 * 60 * 60); // Convert to hours

      // Calculate SLA compliance
      const slaTarget = 24; // 24 hours
      const now = new Date().getTime();
      const ticketsWithinSLA = tickets.filter(ticket => {
        const created = new Date(ticket.created_at).getTime();
        
        if (ticket.status === 'closed' && ticket.closed_at) {
          // For closed tickets, check resolution time against SLA
          const closed = new Date(ticket.closed_at).getTime();
          return (closed - created) / (1000 * 60 * 60) <= slaTarget;
        } else {
          // For open tickets, check current time against SLA
          return (now - created) / (1000 * 60 * 60) <= slaTarget;
        }
      });

      const slaComplianceRate = Math.round((ticketsWithinSLA.length / tickets.length) * 100);

      // Calculate tickets by priority
      const ticketsByPriority = {
        urgent: tickets.filter(t => t.priority === 'urgent').length,
        high: tickets.filter(t => t.priority === 'high').length,
        medium: tickets.filter(t => t.priority === 'medium').length,
        low: tickets.filter(t => t.priority === 'low').length,
      };

      // Calculate tickets by status
      const ticketsByStatus = {
        open: tickets.filter(t => t.status === 'open').length,
        in_progress: tickets.filter(t => t.status === 'in_progress').length,
        waiting_on_customer: tickets.filter(t => t.status === 'waiting_on_customer').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
        closed: tickets.filter(t => t.status === 'closed').length,
      } as { [K in TicketStatus]: number };

      // Calculate ticket trends (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const ticketTrends = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        return {
          date: dateStr,
          count: tickets.filter(t => t.created_at.startsWith(dateStr)).length,
        };
      }).reverse();

      // Calculate response metrics
      const responseMetrics = {
        avgFirstResponseTime,
        avgResolutionTime: ticketStats.avgResolutionTime,
        slaComplianceRate,
      };

      setData({
        ticketStats,
        ticketsByPriority,
        ticketsByStatus,
        ticketTrends,
        responseMetrics,
      });

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <Button variant="outline" asChild>
          <Link to="/admin">Back to Admin Dashboard</Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.ticketStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {data.ticketStats.open} open, {data.ticketStats.closed} closed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.responseMetrics.avgResolutionTime.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">
              For closed tickets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">First Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.responseMetrics.avgFirstResponseTime.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">
              Average time to first response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.responseMetrics.slaComplianceRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Of tickets meeting SLA
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Tickets by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={[
                { name: "Urgent", value: data.ticketsByPriority.urgent },
                { name: "High", value: data.ticketsByPriority.high },
                { name: "Medium", value: data.ticketsByPriority.medium },
                { name: "Low", value: data.ticketsByPriority.low },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tickets by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={[
                { name: "Open", value: data.ticketsByStatus.open },
                { name: "In Progress", value: data.ticketsByStatus.in_progress },
                { name: "Waiting", value: data.ticketsByStatus.waiting_on_customer },
                { name: "Resolved", value: data.ticketsByStatus.resolved },
                { name: "Closed", value: data.ticketsByStatus.closed },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Volume Trend (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart
            data={data.ticketTrends.map(t => ({
              name: t.date,
              value: t.count,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
} 