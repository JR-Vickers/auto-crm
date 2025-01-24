import { TagManager } from '@/components/dashboard/TagManager';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function AdminTagsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Tag Management</h1>
        <Button variant="outline" asChild>
          <Link to="/admin">Back to Admin Dashboard</Link>
        </Button>
      </div>
      <TagManager />
    </div>
  );
} 