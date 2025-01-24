import { CustomFieldManager } from "@/components/dashboard/CustomFieldManager";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function CustomFieldsPage() {
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Custom Fields</h1>
        <Button variant="outline" asChild>
          <Link to="/admin">Back to Admin Dashboard</Link>
        </Button>
      </div>
      <CustomFieldManager />
    </div>
  );
} 