import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { FocusModeProvider } from "./contexts/FocusModeContext";
import ProtectedRoute, { AdminRoute, BusinessRoute, ManagerRoute, FinancialRoute } from "./components/ProtectedRoute";
import { AIOnboarding } from "./components/ai/AIOnboarding";
import { AIChatbotButton } from "./components/ai/AIChatbotButton";
import AIChatbotWidget from "./components/ai/AIChatbotWidget";

// Import AI animations CSS
import "./styles/ai-animations.css";

// Auth Pages
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import ForgotPassword from "./pages/AuthPages/ForgotPassword";
import ResetPassword from "./pages/AuthPages/ResetPassword";
import VerifyEmail from "./pages/AuthPages/VerifyEmail";

// Error Pages
import NotFound from "./pages/OtherPage/NotFound";
import Unauthorized from "./pages/OtherPage/Unauthorized";

// Layout
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";

// ============================================
// PLATFORM ADMIN PAGES (Only for PLATFORM_ADMIN)
// ============================================
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/Admin/AdminUsers";
import AdminBusinesses from "./pages/Admin/AdminBusinesses";
import AdminActivityLogs from "./pages/Admin/AdminActivityLogs";
import AdminSettings from "./pages/Admin/AdminSettings";

// ============================================
// BUSINESS DASHBOARD (All business roles)
// ============================================
import Home from "./pages/Dashboard/Home";
import UserProfiles from "./pages/UserProfiles";

// ============================================
// TEAM & BUSINESS MANAGEMENT (Owner & Admin only)
// ============================================
import TeamInvitations from "./pages/TeamInvitations";
import AcceptInvitation from "./pages/AcceptInvitation";
import BusinessManagement from "./pages/BusinessManagement";

// ============================================
// DOCUMENTS & INVOICES (Owner, Admin, Accountant)
// ============================================
import InvoiceList from "./pages/InvoiceList";
import CreateInvoice from "./pages/CreateInvoice";
import InvoiceDetail from "./pages/InvoiceDetail";
import QuoteList from "./pages/QuoteList";
import CreateQuote from "./pages/CreateQuote";
import QuoteDetail from "./pages/QuoteDetail";
import SalesOrderList from "./pages/SalesOrderList";
import CreateSalesOrder from "./pages/CreateSalesOrder";
import SalesOrderDetail from "./pages/SalesOrderDetail";
import AIScanner from "./pages/AIScanner";

// ============================================
// INVENTORY (All business roles)
// ============================================
import ProductManagement from "./pages/ProductManagement";
import ClientList from "./pages/ClientList";
import ClientProfile from "./pages/ClientProfile";
import SupplierList from "./pages/SupplierList";
import SupplierProfile from "./pages/SupplierProfile";

// ============================================
// STOCK (Owner, Admin, Accountant)
// ============================================
import StockManagement from "./pages/StockManagement";
import StockMovement from "./pages/StockMovement";
import PurchaseOrders from "./pages/PurchaseOrders";
import StockTake from "./pages/StockTake";

// ============================================
// FINANCIAL (Owner, Admin, Accountant)
// ============================================
import ExpenseList from "./pages/ExpenseList";
import UploadReceipt from "./pages/UploadReceipt";
import CreateExpense from "./pages/CreateExpense";
import Payments from "./pages/Payments";
import CreditNotes from "./pages/CreditNotes";
import AuditLogs from "./pages/AuditLogs";
import ReportGenerator from "./pages/ReportGenerator";

// ============================================
// OTHER
// ============================================
import ActivityLog from "./pages/ActivityLog";
import Notifications from "./pages/Notifications";
import Calendar from "./pages/Calendar";
import Blank from "./pages/Blank";

// UI Elements & Charts
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";

// Wrapper component for protected routes with layout
const ProtectedLayout = () => (
  <ProtectedRoute>
    <AppLayout />
  </ProtectedRoute>
);

// Home redirect component - redirects based on user role
const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/signin" replace />;
  
  const isAdmin = user.roleId === 'PLATFORM_ADMIN';
  return <Navigate to={isAdmin ? '/admin/dashboard' : '/dashboard'} replace />;
};

export default function App() {
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Show AI onboarding on first visit
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("bizflow_ai_onboarding_seen");
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  return (
    <AuthProvider>
      <FocusModeProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            {/* Home redirect - redirects to appropriate dashboard */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomeRedirect />
                </ProtectedRoute>
              }
            />

          {/* ============================================
              PLATFORM ADMIN ROUTES (PLATFORM_ADMIN ONLY)
              ============================================ */}
          <Route element={<ProtectedLayout />}>
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/businesses"
              element={
                <AdminRoute>
                  <AdminBusinesses />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/activity"
              element={
                <AdminRoute>
                  <AdminActivityLogs />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <AdminRoute>
                  <AdminSettings />
                </AdminRoute>
              }
            />
          </Route>

          {/* ============================================
              BUSINESS USER ROUTES (All business roles)
              ============================================ */}
          <Route element={<ProtectedLayout />}>
            {/* Dashboard - All business roles */}
            <Route
              path="/dashboard"
              element={
                <BusinessRoute>
                  <Home />
                </BusinessRoute>
              }
            />

            {/* Profile - All business roles */}
            <Route
              path="/profile"
              element={
                <BusinessRoute>
                  <UserProfiles />
                </BusinessRoute>
              }
            />

            {/* Team & Business Management - Owner & Admin only */}
            <Route
              path="/team-invitations"
              element={
                <ManagerRoute>
                  <TeamInvitations />
                </ManagerRoute>
              }
            />
            <Route
              path="/business-management"
              element={
                <ManagerRoute>
                  <BusinessManagement />
                </ManagerRoute>
              }
            />

            {/* Documents - Owner, Admin, Accountant */}
            <Route
              path="/ai-scanner"
              element={
                <FinancialRoute>
                  <AIScanner />
                </FinancialRoute>
              }
            />
            <Route
              path="/invoices"
              element={
                <FinancialRoute>
                  <InvoiceList />
                </FinancialRoute>
              }
            />
            <Route
              path="/invoices/create"
              element={
                <FinancialRoute>
                  <CreateInvoice />
                </FinancialRoute>
              }
            />
            <Route
              path="/invoices/:id"
              element={
                <FinancialRoute>
                  <InvoiceDetail />
                </FinancialRoute>
              }
            />
            <Route
              path="/quotes"
              element={
                <FinancialRoute>
                  <QuoteList />
                </FinancialRoute>
              }
            />
            <Route
              path="/quotes/new"
              element={
                <FinancialRoute>
                  <CreateQuote />
                </FinancialRoute>
              }
            />
            <Route
              path="/quotes/:id"
              element={
                <FinancialRoute>
                  <QuoteDetail />
                </FinancialRoute>
              }
            />
            <Route
              path="/sales-orders"
              element={
                <FinancialRoute>
                  <SalesOrderList />
                </FinancialRoute>
              }
            />
            <Route
              path="/sales-orders/new"
              element={
                <FinancialRoute>
                  <CreateSalesOrder />
                </FinancialRoute>
              }
            />
            <Route
              path="/sales-orders/:id"
              element={
                <FinancialRoute>
                  <SalesOrderDetail />
                </FinancialRoute>
              }
            />

            {/* Inventory - All business roles */}
            <Route
              path="/products"
              element={
                <BusinessRoute>
                  <ProductManagement />
                </BusinessRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <BusinessRoute>
                  <ClientList />
                </BusinessRoute>
              }
            />
            <Route
              path="/clients/:id"
              element={
                <BusinessRoute>
                  <ClientProfile />
                </BusinessRoute>
              }
            />
            <Route
              path="/suppliers"
              element={
                <BusinessRoute>
                  <SupplierList />
                </BusinessRoute>
              }
            />
            <Route
              path="/suppliers/:id"
              element={
                <BusinessRoute>
                  <SupplierProfile />
                </BusinessRoute>
              }
            />

            {/* Stock - Owner, Admin, Accountant */}
            <Route
              path="/stock"
              element={
                <FinancialRoute>
                  <StockManagement />
                </FinancialRoute>
              }
            />
            <Route
              path="/stock-movements"
              element={
                <FinancialRoute>
                  <StockMovement />
                </FinancialRoute>
              }
            />
            <Route
              path="/purchase-orders"
              element={
                <FinancialRoute>
                  <PurchaseOrders />
                </FinancialRoute>
              }
            />
            <Route
              path="/stock-take"
              element={
                <FinancialRoute>
                  <StockTake />
                </FinancialRoute>
              }
            />

            {/* Financial - Owner, Admin, Accountant */}
            <Route
              path="/expenses"
              element={
                <FinancialRoute>
                  <ExpenseList />
                </FinancialRoute>
              }
            />
            <Route
              path="/expenses/create"
              element={
                <FinancialRoute>
                  <CreateExpense />
                </FinancialRoute>
              }
            />
            <Route
              path="/expenses/upload"
              element={
                <FinancialRoute>
                  <UploadReceipt />
                </FinancialRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <FinancialRoute>
                  <Payments />
                </FinancialRoute>
              }
            />
            <Route
              path="/credit-notes"
              element={
                <FinancialRoute>
                  <CreditNotes />
                </FinancialRoute>
              }
            />
            <Route
              path="/audit-logs"
              element={
                <ManagerRoute>
                  <AuditLogs />
                </ManagerRoute>
              }
            />

            {/* Report Generator - Financial roles */}
            <Route
              path="/report-generator"
              element={
                <FinancialRoute>
                  <ReportGenerator />
                </FinancialRoute>
              }
            />

            {/* Other Pages - All business roles */}
            <Route
              path="/activity"
              element={
                <BusinessRoute>
                  <ActivityLog />
                </BusinessRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <BusinessRoute>
                  <Notifications />
                </BusinessRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <BusinessRoute>
                  <Calendar />
                </BusinessRoute>
              }
            />

            {/* UI Elements & Charts (accessible to all) */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
            <Route path="/basic-tables" element={<BasicTables />} />
            <Route path="/form-elements" element={<FormElements />} />
            <Route path="/blank" element={<Blank />} />
          </Route>

          {/* ============================================
              PUBLIC ROUTES
              ============================================ */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/accept-invitation" element={<AcceptInvitation />} />

          {/* ============================================
              ERROR PAGES
              ============================================ */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        
        {/* AI Onboarding Modal */}
        <AIOnboarding 
          isOpen={showOnboarding} 
          onClose={() => setShowOnboarding(false)} 
        />
        
        {/* AI Chatbot - conditionally shown */}
        {chatbotOpen && (
          <AIChatbotWidget isOpen={true} onClose={() => setChatbotOpen(false)} />
        )}
        
        {/* AI Chatbot Floating Button */}
        <AIChatbotButton
          isOpen={chatbotOpen}
          onClick={() => setChatbotOpen(!chatbotOpen)}
        />
      </Router>
      </FocusModeProvider>
    </AuthProvider>
  );
}
