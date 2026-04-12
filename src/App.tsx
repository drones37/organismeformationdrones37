import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import StudentsPage from "./pages/StudentsPage";
import StudentDetailPage from "./pages/StudentDetailPage";
import AttendancePage from "./pages/AttendancePage";
import FacturationPage from "./pages/FacturationPage";
import VeillePage from "./pages/VeillePage";
import PlanActionPage from "./pages/PlanActionPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/eleves" element={<StudentsPage />} />
            <Route path="/eleves/:id" element={<StudentDetailPage />} />
            <Route path="/emargement" element={<AttendancePage />} />
            <Route path="/facturation" element={<FacturationPage />} />
            <Route path="/veille" element={<VeillePage />} />
            <Route path="/plan-action" element={<PlanActionPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
