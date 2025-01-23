import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type TicketPriority = Database["public"]["Enums"]["ticket_priority"];

interface SLAStatusProps {
  deadline: string | null;
}

export function SLAStatus({ deadline }: SLAStatusProps) {
  if (!deadline) return null;
  
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const hoursRemaining = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursRemaining < 0) {
    return <span className="text-red-600 font-semibold">Overdue</span>;
  } else if (hoursRemaining < 4) {
    return <span className="text-orange-600 font-semibold">Critical</span>;
  } else if (hoursRemaining < 8) {
    return <span className="text-yellow-600">Approaching</span>;
  }
  return <span className="text-green-600">On Track</span>;
}

export function getPriorityClass(priority: TicketPriority) {
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
}