import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import AuthPage from "@/pages/AuthPage";
import ClientHome from "@/pages/client/ClientHome";
import ClientSession from "@/pages/client/ClientSession";
import ClientHabits from "@/pages/client/ClientHabits";
import ClientArticles from "@/pages/client/ClientArticles";
import ClientArticle from "@/pages/client/ClientArticle";
import CoachDashboard from "@/pages/coach/CoachDashboard";
import CoachClient from "@/pages/coach/CoachClient";
import CoachBuilder from "@/pages/coach/CoachBuilder";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Routes client */}
            <Route path="/client/home" element={
              <ProtectedRoute allowedRoles={["spotif.ve"]}>
                <ClientHome />
              </ProtectedRoute>
            } />
            <Route path="/client/program" element={<Navigate to="/client/home" replace />} />
            <Route path="/client/session/:sessionId" element={
              <ProtectedRoute allowedRoles={["spotif.ve"]}>
                <ClientSession />
              </ProtectedRoute>
            } />
            <Route path="/client/habits" element={
              <ProtectedRoute allowedRoles={["spotif.ve"]}>
                <ClientHabits />
              </ProtectedRoute>
            } />
            <Route path="/client/articles" element={
              <ProtectedRoute allowedRoles={["spotif.ve"]}>
                <ClientArticles />
              </ProtectedRoute>
            } />
            <Route path="/client/articles/:slug" element={
              <ProtectedRoute allowedRoles={["spotif.ve"]}>
                <ClientArticle />
              </ProtectedRoute>
            } />

            {/* Routes coach */}
            <Route path="/coach/dashboard" element={
              <ProtectedRoute allowedRoles={["coach"]}>
                <CoachDashboard />
              </ProtectedRoute>
            } />
            <Route path="/coach/client/:id" element={
              <ProtectedRoute allowedRoles={["coach"]}>
                <CoachClient />
              </ProtectedRoute>
            } />
            <Route path="/coach/builder/:clientId" element={
              <ProtectedRoute allowedRoles={["coach"]}>
                <CoachBuilder />
              </ProtectedRoute>
            } />

            {/* Redirection racine vers auth */}
            <Route path="/" element={<Navigate to="/auth" replace />} />
            
            {/* Catch-all pour 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;