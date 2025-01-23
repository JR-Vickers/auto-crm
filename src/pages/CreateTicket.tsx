import { CreateTicketForm } from '@/components/dashboard/CreateTicketForm';

export default function CreateTicketPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Ticket</h1>
      <div className="max-w-2xl mx-auto">
        <CreateTicketForm />
      </div>
    </div>
  );
}