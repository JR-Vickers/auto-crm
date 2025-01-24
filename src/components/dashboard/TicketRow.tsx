import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import { SLAStatus, getPriorityClass } from "./SLAStatus";
import type { Database } from "@/integrations/supabase/types";

type Ticket = Database["public"]["Tables"]["tickets"]["Row"] & {
  assigned_worker?: {
    full_name: string | null;
  };
  customer?: {
    full_name: string | null;
  };
};

interface TicketRowProps {
  ticket: Ticket;
  hasWorkerAccess: boolean;
  isSelected: boolean;
  onAssign: (ticketId: string) => void;
  onUpdateStatus: (ticketId: string, status: Database["public"]["Enums"]["ticket_status"]) => void;
  onArchive: (ticketId: string) => void;
  onRowClick: (ticketId: string) => void;
  onSelectionChange: (ticketId: string, isSelected: boolean) => void;
}

export function TicketRow({ 
  ticket, 
  hasWorkerAccess, 
  isSelected,
  onAssign, 
  onUpdateStatus,
  onArchive,
  onRowClick,
  onSelectionChange
}: TicketRowProps) {
  return (
    <TableRow 
      key={ticket.id} 
      className={`cursor-pointer hover:bg-muted/50 ${isSelected ? 'bg-muted' : ''}`}
      onClick={() => onRowClick(ticket.id)}
    >
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelectionChange(ticket.id, !!checked)}
        />
      </TableCell>
      <TableCell>{ticket.title}</TableCell>
      <TableCell>{ticket.customer?.full_name || 'Unknown'}</TableCell>
      <TableCell>{ticket.assigned_worker?.full_name || 'Unassigned'}</TableCell>
      <TableCell className="capitalize">{ticket.status.replace(/_/g, ' ')}</TableCell>
      <TableCell className={getPriorityClass(ticket.priority)}>
        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
      </TableCell>
      <TableCell><SLAStatus deadline={ticket.sla_deadline} /></TableCell>
      <TableCell>
        {ticket.sla_deadline ? (
          <span title={format(new Date(ticket.sla_deadline), 'PPpp')}>
            {formatDistanceToNow(new Date(ticket.sla_deadline), { addSuffix: true })}
          </span>
        ) : 'Not set'}
      </TableCell>
      <TableCell>{format(new Date(ticket.created_at), 'MMM d, yyyy')}</TableCell>
      <TableCell>{format(new Date(ticket.updated_at), 'MMM d, yyyy')}</TableCell>
      {hasWorkerAccess && (
        <TableCell onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-2">
            {!ticket.assigned_to && (
              <Button size="sm" onClick={() => onAssign(ticket.id)}>
                Assign to me
              </Button>
            )}
            {ticket.status === 'closed' ? (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onArchive(ticket.id)}
              >
                Archive
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onUpdateStatus(ticket.id, 'closed')}
              >
                Close
              </Button>
            )}
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}