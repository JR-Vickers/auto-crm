import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TicketRow } from "./TicketRow";
import type { Database } from "@/integrations/supabase/types";

type Ticket = Database["public"]["Tables"]["tickets"]["Row"] & {
  assigned_worker?: {
    full_name: string | null;
  };
  customer?: {
    full_name: string | null;
  };
};

interface TicketTableProps {
  tickets: Ticket[];
  hasWorkerAccess: boolean;
  onAssignTicket: (ticketId: string) => void;
  onUpdateStatus: (ticketId: string, status: Database["public"]["Enums"]["ticket_status"]) => void;
  onRowClick: (ticketId: string) => void;
}

export function TicketTable({ 
  tickets, 
  hasWorkerAccess, 
  onAssignTicket, 
  onUpdateStatus, 
  onRowClick 
}: TicketTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Assigned To</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>SLA Status</TableHead>
          <TableHead>Deadline</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Last Updated</TableHead>
          {hasWorkerAccess && <TableHead>Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((ticket) => (
          <TicketRow
            key={ticket.id}
            ticket={ticket}
            hasWorkerAccess={hasWorkerAccess}
            onAssign={onAssignTicket}
            onUpdateStatus={onUpdateStatus}
            onRowClick={onRowClick}
          />
        ))}
      </TableBody>
    </Table>
  );
}