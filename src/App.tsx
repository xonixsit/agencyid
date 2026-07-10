import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Strategist from "./pages/Strategist";
import Copywriter from "./pages/Copywriter";
import Campaigns from "./pages/Campaigns";
import Automations from "./pages/Automations";
import ConversionDesigner from "./pages/ConversionDesigner";
import GraphicDesigner from "./pages/GraphicDesigner";
import ProjectManager from "./pages/ProjectManager";
import ClientDetail from "./pages/ClientDetail";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const P = ({ children }: { children: React.ReactNode }) => <ProtectedRoute>{children}</ProtectedRoute>;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<P><Dashboard /></P>} />
            <Route path="/clients" element={<P><Clients /></P>} />
            <Route path="/clients/:id" element={<P><ClientDetail /></P>} />
            <Route path="/strategist" element={<P><Strategist /></P>} />
            <Route path="/copywriter" element={<P><Copywriter /></P>} />
            <Route path="/campaigns" element={<P><Campaigns /></P>} />
            <Route path="/automations" element={<P><Automations /></P>} />
            <Route path="/conversion-designer" element={<P><ConversionDesigner /></P>} />
            <Route path="/graphic-designer" element={<P><GraphicDesigner /></P>} />
            <Route path="/project-manager" element={<P><ProjectManager /></P>} />
            <Route path="/settings" element={<P><Settings /></P>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
