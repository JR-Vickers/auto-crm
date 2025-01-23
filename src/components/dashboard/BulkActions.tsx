import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";
import { useState } from "react";

interface BulkActionsProps {
  selectedTickets: string[];
  onBulkStatusChange: (status: Database["public"]["Enums"]["ticket_status"]) => void;
  onBulkAssign: () => void;
  onClearSelection: () => void;
}

export function BulkActions({ 
  selectedTickets, 
  onBulkStatusChange,
  onBulkAssign,
  onClearSelection
}: BulkActionsProps) {
  const [status, setStatus] = useState<Database["public"]["Enums"]["ticket_status"]>("open");

  if (selectedTickets.length === 0) return null;

  return (
    <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
      <span className="text-sm font-medium">
        {selectedTickets.length} ticket{selectedTickets.length === 1 ? "" : "s"} selected
      </span>

      <Select
        value={status}
        onValueChange={(value) => setStatus(value as Database["public"]["Enums"]["ticket_status"])}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Change status to" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="waiting_on_customer">Waiting on Customer</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
        </SelectContent>
      </Select>

      <Button 
        variant="secondary"
        onClick={() => onBulkStatusChange(status)}
      >
        Update Status
      </Button>

      <Button 
        variant="secondary"
        onClick={onBulkAssign}
      >
        Assign to Me
      </Button>

      <Button 
        variant="ghost"
        onClick={onClearSelection}
      >
        Clear Selection
      </Button>
    </div>
  );
} 