import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ClientList } from "@/components/clients/ClientList";
import { ClientForm } from "@/components/clients/ClientForm";

export default function Clients() {
  const [showForm, setShowForm] = useState(false);

  return (
    <AppLayout>
      <div className="space-y-6 animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Clients
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage client profiles and onboarding data
            </p>
          </div>
          <Button variant="glow" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            New Client
          </Button>
        </div>

        {showForm && (
          <ClientForm onClose={() => setShowForm(false)} />
        )}

        <ClientList />
      </div>
    </AppLayout>
  );
}
