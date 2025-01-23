import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Template = Database["public"]["Tables"]["response_templates"]["Row"];

export function useTemplates(userId: string) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchTemplates();
    }
  }, [userId]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('response_templates')
        .select('*')
        .eq('user_id', userId)
        .order('title', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading templates",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async (template: Omit<Template, "id" | "created_at" | "updated_at">) => {
    try {
      const { error } = await supabase
        .from('response_templates')
        .insert(template);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template saved",
      });

      await fetchTemplates();
    } catch (error: any) {
      toast({
        title: "Error saving template",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('response_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template deleted",
      });

      await fetchTemplates();
    } catch (error: any) {
      toast({
        title: "Error deleting template",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    templates,
    loading,
    saveTemplate,
    deleteTemplate,
  };
} 