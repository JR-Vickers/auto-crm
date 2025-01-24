import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomFieldManager } from "@/components/dashboard/CustomFieldManager";
import { Settings, Tags, Database, BarChart2, Users } from "lucide-react";

type Profile = {
  id: string;
  role: 'customer' | 'worker' | 'admin';
  full_name: string | null;
  email?: string;
};

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("custom-fields");

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/dashboard');
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive",
      });
    } else {
      fetchUsers();
    }
  }, [authLoading, isAdmin, navigate]);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(profiles || []);
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

  const updateUserRole = async (userId: string, newRole: 'customer' | 'worker' | 'admin') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));

      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button variant="outline" asChild>
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card 
          className="p-6 hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() => navigate('/admin/custom-fields')}
        >
          <div className="flex items-center gap-4">
            <Database className="h-8 w-8 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">Custom Fields</h2>
              <p className="text-muted-foreground">Manage custom fields for tickets</p>
            </div>
          </div>
        </Card>

        <Card 
          className="p-6 hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() => navigate('/admin/tags')}
        >
          <div className="flex items-center gap-4">
            <Tags className="h-8 w-8 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">Tags</h2>
              <p className="text-muted-foreground">Manage ticket tags and categories</p>
            </div>
          </div>
        </Card>

        <Card 
          className="p-6 hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() => navigate('/admin/analytics')}
        >
          <div className="flex items-center gap-4">
            <BarChart2 className="h-8 w-8 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">Analytics</h2>
              <p className="text-muted-foreground">View ticket and performance metrics</p>
            </div>
          </div>
        </Card>

        <Card 
          className="p-6 hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() => navigate('/admin/users')}
        >
          <div className="flex items-center gap-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">Users</h2>
              <p className="text-muted-foreground">Manage user accounts and permissions</p>
            </div>
          </div>
        </Card>

        <Card 
          className="p-6 hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() => navigate('/admin/settings')}
        >
          <div className="flex items-center gap-4">
            <Settings className="h-8 w-8 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">Settings</h2>
              <p className="text-muted-foreground">Configure system settings and preferences</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Admin;