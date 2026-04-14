import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import StoreInitializer from "@/components/StoreInitializer";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import StudentsPage from "./pages/StudentsPage";
import StudentDetailPage from "./pages/StudentDetailPage";
import AttendancePage from "./pages/AttendancePage";
import FacturationPage from "./pages/FacturationPage";
import VeillePage from "./pages/VeillePage";
import PlanActionPage from "./pages/PlanActionPage";
import ProceduresPage from "./pages/ProceduresPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <StoreInitializer>
                    <AppLayout />
                  </StoreInitializer>
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/eleves" element={<StudentsPage />} />
              <Route path="/eleves/:id" element={<StudentDetailPage />} />
              <Route path="/emargement" element={<AttendancePage />} />
              <Route path="/facturation" element={<FacturationPage />} />
              <Route path="/procedures" element={<ProceduresPage />} />
              <Route path="/veille" element={<VeillePage />} />
              <Route path="/plan-action" element={<PlanActionPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
