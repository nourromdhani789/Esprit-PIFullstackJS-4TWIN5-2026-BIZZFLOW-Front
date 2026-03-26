import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import ForgotPassword from "./pages/AuthPages/ForgotPassword";
import ResetPassword from "./pages/AuthPages/ResetPassword";
import VerifyEmail from "./pages/AuthPages/VerifyEmail";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import TeamInvitations from "./pages/TeamInvitations";
import AcceptInvitation from "./pages/AcceptInvitation";
import BusinessManagement from "./pages/BusinessManagement";
import InvoiceList from "./pages/InvoiceList";
import CreateInvoice from "./pages/CreateInvoice";
import InvoiceDetail from "./pages/InvoiceDetail";
import InvoiceScan from "./pages/InvoiceScan";
import ProductManagement from "./pages/ProductManagement";
import ExpenseList from "./pages/ExpenseList";
import UploadReceipt from "./pages/UploadReceipt";
import CreateExpense from "./pages/CreateExpense";

// Sprint 6 - Stock & Financial Management
import StockManagement from "./pages/StockManagement";
import StockMovement from "./pages/StockMovement";
import PurchaseOrders from "./pages/PurchaseOrders";
import Payments from "./pages/Payments";
import CreditNotes from "./pages/CreditNotes";
import StockTake from "./pages/StockTake";

// Wrapper component for protected dashboard routes
const DashboardLayout = () => (
  <ProtectedRoute>
    <AppLayout />
  </ProtectedRoute>
);

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Protected Dashboard Layout */}
          <Route element={<DashboardLayout />}>
            <Route index path="/" element={<Home />} />

            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />

            {/* Team Management - Visible to all for now */}
            <Route path="/team-invitations" element={<TeamInvitations />} />
            <Route path="/business-management" element={<BusinessManagement />} />

            {/* Sprint 3 - Invoice System */}
            <Route path="/invoices" element={<InvoiceList />} />
            <Route path="/invoices/create" element={<CreateInvoice />} />
            <Route path="/invoices/scan" element={<InvoiceScan />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
            <Route path="/products" element={<ProductManagement />} />

            {/* Sprint 4 - Expense Management */}
            <Route path="/expenses" element={<ExpenseList />} />
            <Route path="/expenses/create" element={<CreateExpense />} />
            <Route path="/expenses/upload" element={<UploadReceipt />} />

            {/* Sprint 6 - Stock & Financial Management */}
            <Route path="/stock" element={<StockManagement />} />
            <Route path="/stock-movements" element={<StockMovement />} />
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/stock-take" element={<StockTake />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/credit-notes" element={<CreditNotes />} />
          </Route>

          {/* Auth Layout - Public Routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/accept-invitation" element={<AcceptInvitation />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
