import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
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
  selectedTickets: string[];
  onAssignTicket: (ticketId: string) => void;
  onUpdateStatus: (ticketId: string, status: Database["public"]["Enums"]["ticket_status"]) => void;
  onRowClick: (ticketId: string) => void;
  onSelectionChange: (ticketId: string, isSelected: boolean) => void;
  onSelectAll: (isSelected: boolean) => void;
}

export function TicketTable({ 
  tickets, 
  hasWorkerAccess, 
  selectedTickets,
  onAssignTicket, 
  onUpdateStatus, 
  onRowClick,
  onSelectionChange,
  onSelectAll
}: TicketTableProps) {
  const allSelected = tickets.length > 0 && selectedTickets.length === tickets.length;
  const someSelected = selectedTickets.length > 0 && selectedTickets.length < tickets.length;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              onCheckedChange={(checked) => onSelectAll(!!checked)}
            />
          </TableHead>
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
            isSelected={selectedTickets.includes(ticket.id)}
            onAssign={onAssignTicket}
            onUpdateStatus={onUpdateStatus}
            onRowClick={onRowClick}
            onSelectionChange={onSelectionChange}
          />
        ))}
      </TableBody>
    </Table>
  );
}