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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/admin/custom-fields">
          <Card className="p-6 hover:bg-accent/50 transition-colors">
            <h2 className="text-xl font-semibold mb-2">Custom Fields</h2>
            <p className="text-muted-foreground">
              Manage custom fields for tickets
            </p>
          </Card>
        </Link>

        <Link to="/admin/tags">
          <Card className="p-6 hover:bg-accent/50 transition-colors">
            <h2 className="text-xl font-semibold mb-2">Tags</h2>
            <p className="text-muted-foreground">
              Manage ticket tags and categories
            </p>
          </Card>
        </Link>

        <Link to="/admin/users">
          <Card className="p-6 hover:bg-accent/50 transition-colors">
            <h2 className="text-xl font-semibold mb-2">Users</h2>
            <p className="text-muted-foreground">
              Manage user accounts and permissions
            </p>
          </Card>
        </Link>

        <Link to="/admin/settings">
          <Card className="p-6 hover:bg-accent/50 transition-colors">
            <h2 className="text-xl font-semibold mb-2">Settings</h2>
            <p className="text-muted-foreground">
              Configure system settings
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default Admin;