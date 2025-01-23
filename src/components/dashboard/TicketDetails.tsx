import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TagSelect } from '@/components/dashboard/TagSelect';
import { PriorityBadge } from '@/components/dashboard/PriorityBadge';
import type { Database } from '@/integrations/supabase/types';
import type { Priority } from '@/types';

type Ticket = Database['public']['Tables']['tickets']['Row'];

export function TicketDetails({ ticketId }: { ticketId: string }) {
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTicket, setEditedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  const loadTicket = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (error) throw error;
      setTicket(data);
      setEditedTicket(data);
    } catch (err) {
      console.error('Error loading ticket:', err);
      toast.error('Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTicket = async () => {
    if (!editedTicket) return;

    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          title: editedTicket.title,
          description: editedTicket.description,
          priority: editedTicket.priority,
          category: editedTicket.category,
          customer_id: editedTicket.customer_id,
          assigned_to: editedTicket.assigned_to,
          tags: editedTicket.tags,
          custom_fields: editedTicket.custom_fields,
        })
        .eq('id', ticketId);

      if (error) throw error;

      setTicket(editedTicket);
      setIsEditing(false);
      toast.success('Ticket updated successfully');
    } catch (err) {
      console.error('Error updating ticket:', err);
      toast.error('Failed to update ticket');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!ticket || !editedTicket) {
    return <div>Ticket not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Ticket Details</h2>
        <Button
          variant="outline"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </Button>
      </div>

      {isEditing ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={editedTicket.title}
              onChange={(e) => setEditedTicket({ ...editedTicket, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={editedTicket.description}
              onChange={(e) => setEditedTicket({ ...editedTicket, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={editedTicket.priority}
              onValueChange={(value) => setEditedTicket({ ...editedTicket, priority: value as Priority })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <TagSelect
              selectedTags={editedTicket.tags || []}
              onTagsChange={(tags) => setEditedTicket({ ...editedTicket, tags })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={editedTicket.category || ''}
              onChange={(e) => setEditedTicket({ ...editedTicket, category: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_id">Customer ID</Label>
            <Input
              id="customer_id"
              value={editedTicket.customer_id || ''}
              onChange={(e) => setEditedTicket({ ...editedTicket, customer_id: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assigned To</Label>
            <Input
              id="assigned_to"
              value={editedTicket.assigned_to || ''}
              onChange={(e) => setEditedTicket({ ...editedTicket, assigned_to: e.target.value })}
            />
          </div>

          <Button onClick={handleUpdateTicket} className="w-full">
            Save Changes
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Title</Label>
            <div className="text-lg">{ticket.title}</div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <div className="whitespace-pre-wrap">{ticket.description}</div>
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <div>
              <PriorityBadge priority={ticket.priority} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <TagSelect
              selectedTags={ticket.tags || []}
              onTagsChange={(tags) => {
                setEditedTicket({ ...ticket, tags });
                handleUpdateTicket();
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <div>{ticket.category || 'Not set'}</div>
          </div>

          <div className="space-y-2">
            <Label>Customer ID</Label>
            <div>{ticket.customer_id || 'Not set'}</div>
          </div>

          <div className="space-y-2">
            <Label>Assigned To</Label>
            <div>{ticket.assigned_to || 'Unassigned'}</div>
          </div>
        </div>
      )}
    </div>
  );
} 