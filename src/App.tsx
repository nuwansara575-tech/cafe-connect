import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const Login = lazy(() => import("./pages/Login"));
const Redeem = lazy(() => import("./pages/Redeem"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Campaigns = lazy(() => import("./pages/admin/Campaigns"));
const Coupons = lazy(() => import("./pages/admin/Coupons"));
const GenerateQR = lazy(() => import("./pages/admin/GenerateQR"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const RedeemCoupon = lazy(() => import("./pages/admin/RedeemCoupon"));
const LoyaltyDashboard = lazy(() => import("./pages/admin/LoyaltyDashboard"));
const LoyaltyMembers = lazy(() => import("./pages/admin/LoyaltyMembers"));
const LoyaltyRewards = lazy(() => import("./pages/admin/LoyaltyRewards"));
const LoyaltyRedeem = lazy(() => import("./pages/admin/LoyaltyRedeem"));
const LoyaltyTransactions = lazy(() => import("./pages/admin/LoyaltyTransactions"));
const LoyaltyPointRules = lazy(() => import("./pages/admin/LoyaltyPointRules"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/promo/redeem" element={<Redeem />} />
              <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="campaigns" element={<Campaigns />} />
                <Route path="coupons" element={<Coupons />} />
                <Route path="generate" element={<GenerateQR />} />
                <Route path="redeem" element={<RedeemCoupon />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="loyalty" element={<LoyaltyDashboard />} />
                <Route path="loyalty/members" element={<LoyaltyMembers />} />
                <Route path="loyalty/rewards" element={<LoyaltyRewards />} />
                <Route path="loyalty/redeem" element={<LoyaltyRedeem />} />
                <Route path="loyalty/transactions" element={<LoyaltyTransactions />} />
                <Route path="loyalty/rules" element={<LoyaltyPointRules />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
