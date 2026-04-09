import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/strategist" element={<Strategist />} />
          <Route path="/copywriter" element={<Copywriter />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/automations" element={<Automations />} />
          <Route path="/conversion-designer" element={<ConversionDesigner />} />
          <Route path="/graphic-designer" element={<GraphicDesigner />} />
          <Route path="/project-manager" element={<ProjectManager />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
