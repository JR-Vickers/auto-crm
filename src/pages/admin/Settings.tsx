import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

type TicketStatus = Database["public"]["Enums"]["ticket_status"];
type TicketPriority = Database["public"]["Enums"]["ticket_priority"];

interface SystemSettings {
  businessHours: {
    [key: string]: { start: string; end: string } | null;
  };
  slaDeadlines: {
    [key in TicketPriority]: string;
  };
  ticketDefaults: {
    status: TicketStatus;
    priority: TicketPriority;
  };
  notifications: {
    ticket_created: boolean;
    ticket_updated: boolean;
    sla_warning: boolean;
    sla_breach: boolean;
    ticket_assigned: boolean;
  };
}

interface SystemSettingRow {
  id: string;
  category: string;
  key: string;
  value: any;
  updated_at: string;
  updated_by: string | null;
}

export default function Settings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_settings')
        .select('*') as { data: SystemSettingRow[] | null; error: any };

      if (error) throw error;

      if (!data) {
        setSettings({
          businessHours: {
            monday: { start: "09:00", end: "17:00" },
            tuesday: { start: "09:00", end: "17:00" },
            wednesday: { start: "09:00", end: "17:00" },
            thursday: { start: "09:00", end: "17:00" },
            friday: { start: "09:00", end: "17:00" },
            saturday: null,
            sunday: null,
          },
          slaDeadlines: {
            urgent: "4 hours",
            high: "8 hours",
            medium: "24 hours",
            low: "48 hours",
          },
          ticketDefaults: {
            status: "open",
            priority: "medium",
          },
          notifications: {
            ticket_created: true,
            ticket_updated: true,
            sla_warning: true,
            sla_breach: true,
            ticket_assigned: true,
          },
        });
        return;
      }

      const businessHours = data.find(s => s.category === 'business_hours' && s.key === 'schedule')?.value || {};
      const slaDeadlines = data.find(s => s.category === 'sla' && s.key === 'deadlines')?.value || {};
      const ticketDefaults = data.find(s => s.category === 'tickets' && s.key === 'defaults')?.value || {};
      const notifications = data.find(s => s.category === 'notifications' && s.key === 'email_preferences')?.value || {};

      setSettings({
        businessHours,
        slaDeadlines,
        ticketDefaults,
        notifications,
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

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);

      const updates = [
        {
          category: 'business_hours',
          key: 'schedule',
          value: settings.businessHours,
        },
        {
          category: 'sla',
          key: 'deadlines',
          value: settings.slaDeadlines,
        },
        {
          category: 'tickets',
          key: 'defaults',
          value: settings.ticketDefaults,
        },
        {
          category: 'notifications',
          key: 'email_preferences',
          value: settings.notifications,
        },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('system_settings')
          .upsert(update, { onConflict: 'category,key' }) as { error: any };

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateBusinessHours = (day: string, field: 'start' | 'end', value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      businessHours: {
        ...settings.businessHours,
        [day]: {
          ...settings.businessHours[day],
          [field]: value,
        },
      },
    });
  };

  const updateSLA = (priority: TicketPriority, value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      slaDeadlines: {
        ...settings.slaDeadlines,
        [priority]: value,
      },
    });
  };

  const updateTicketDefaults = (field: keyof SystemSettings['ticketDefaults'], value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      ticketDefaults: {
        ...settings.ticketDefaults,
        [field]: value,
      },
    });
  };

  const updateNotification = (key: keyof SystemSettings['notifications'], value: boolean) => {
    if (!settings) return;
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: value,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!settings) return null;

  // Sort days in correct order
  const orderedDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const orderedPriorities: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">System Settings</h1>
        <div className="flex gap-2">
          <Button variant="default" onClick={saveSettings} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin">Back to Admin Dashboard</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Business Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {orderedDays.map((day) => (
                <div key={day} className="grid grid-cols-3 gap-4 items-center">
                  <Label className="capitalize">{day}</Label>
                  <Input
                    type="time"
                    value={settings.businessHours[day]?.start || ""}
                    onChange={(e) => updateBusinessHours(day, 'start', e.target.value)}
                  />
                  <Input
                    type="time"
                    value={settings.businessHours[day]?.end || ""}
                    onChange={(e) => updateBusinessHours(day, 'end', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SLA Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {orderedPriorities.map((priority) => (
                <div key={priority} className="grid grid-cols-2 gap-4 items-center">
                  <Label className="capitalize">{priority}</Label>
                  <Input
                    placeholder="e.g., 4 hours"
                    value={settings.slaDeadlines[priority]}
                    onChange={(e) => updateSLA(priority, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Default Ticket Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4 items-center">
                <Label>Default Status</Label>
                <Select
                  value={settings.ticketDefaults.status}
                  onValueChange={(value) => updateTicketDefaults('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="waiting_on_customer">Waiting on Customer</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4 items-center">
                <Label>Default Priority</Label>
                <Select
                  value={settings.ticketDefaults.priority}
                  onValueChange={(value) => updateTicketDefaults('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {Object.entries(settings.notifications).map(([key, enabled]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="capitalize">{key.replace(/_/g, ' ')}</Label>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) => 
                      updateNotification(key as keyof SystemSettings['notifications'], checked)
                    }
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 