import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import CreateTicket from "@/pages/CreateTicket";
import TicketDetails from "@/pages/TicketDetails";
import Admin from "@/pages/Admin";
import AdminTags from "@/pages/admin/Tags";
import { Toaster } from "@/components/ui/toaster";
import AdminCustomFieldsPage from "@/pages/admin/CustomFields";
import AnalyticsDashboard from "@/pages/admin/Analytics";
import Settings from "@/pages/admin/Settings";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tickets/new" element={<CreateTicket />} />
        <Route path="/tickets/:id" element={<TicketDetails />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/tags" element={<AdminTags />} />
        <Route path="/admin/custom-fields" element={<AdminCustomFieldsPage />} />
        <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
        <Route path="/admin/settings" element={<Settings />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;