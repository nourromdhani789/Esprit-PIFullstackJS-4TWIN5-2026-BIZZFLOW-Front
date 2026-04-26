# BizFlow AI - Frontend

A modern React-based dashboard for business management and financial tracking. Features AI-powered tools, real-time analytics, and a beautiful responsive UI. Built on top of TailAdmin React template.

## 🚀 Features

### Dashboard & Analytics
- **Smart KPI Cards** - Gradient cards with sparkline trends and real-time metrics
- **Interactive Charts** - Revenue, expenses, and profit visualizations with Recharts
- **Recent Activity Feed** - Live activity tracking with clickable entries
- **Top Clients Analysis** - Revenue breakdown by client

### Financial Management
- **Invoice Management** - Create, edit, view, and generate PDF invoices
- **Quotes & Sales Orders** - Full sales workflow from quote to invoice
- **Expense Tracking** - Categorize expenses with receipt uploads
- **Payment Recording** - Track money in/out with cash management
- **Credit Notes** - Handle refunds and adjustments

### Inventory & Products
- **Product Catalog** - Manage storable and consumable products
- **Stock Management** - Real-time inventory with low stock alerts
- **Stock Movements** - Track all inventory changes
- **Purchase Orders** - Manage supplier orders

### AI-Powered Features
- **AI Scanner** - OCR document processing for invoices and receipts
- **AI Chatbot** - Floating assistant for natural language queries
- **AI Anomaly Detection** - Highlight unusual invoice patterns
- **AI Smart Auto-Fill** - Extract client info from pasted text
- **AI Email Validation** - Real-time email verification
- **AI Onboarding** - Interactive first-time user guide
- **Focus Mode** - AI-guided workflow assistance

### User Experience
- **Dark Mode** - Full dark theme with glowing AI effects
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Role-Based UI** - Interface adapts to user permissions
- **Real-time Notifications** - Toast notifications for actions
- **Drag & Drop** - File uploads and Kanban-style interactions

### Calendar & Scheduling
- **Full Calendar Integration** - Schedule events and view business activities
- **Activity Timeline** - Visual history of all business actions

## 🛠️ Tech Stack

- **Framework**: React 19.x
- **Build Tool**: Vite 6.x
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 4.x
- **Charts**: Recharts, ApexCharts
- **State Management**: React Context + Hooks
- **Routing**: React Router 7.x
- **HTTP Client**: Axios
- **Rich Text**: CKEditor 5
- **Calendar**: FullCalendar
- **PDF Export**: jsPDF + html2canvas
- **Drag & Drop**: react-dnd

## 📋 Prerequisites

- Node.js 22.x or higher
- Backend API running (see PI_TWIN5_BACK)

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd PI_TWIN5_FRONT
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# API URL
VITE_API_URL=http://localhost:3000

# App
VITE_APP_NAME=BizFlow AI
```

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

## 🏗️ Project Structure

```
src/
├── components/
│   ├── ai/              # AI components (Chatbot, Onboarding, Badges)
│   ├── common/          # Shared components (Breadcrumb, Meta)
│   ├── form/            # Form inputs and fields
│   ├── ui/              # UI components (Button, Table, Charts)
│   └── ...              # Other component categories
├── context/             # React contexts (AuthContext)
├── contexts/            # Additional contexts (BusinessContext, FocusModeContext)
├── hooks/               # Custom React hooks
├── icons/               # SVG icon components
├── layout/              # Layout components (AppLayout, Sidebar, Header)
├── pages/               # Page components
│   ├── Admin/           # Admin dashboard pages
│   ├── AuthPages/       # Signin, Signup, ForgotPassword
│   ├── Charts/          # Chart pages
│   ├── Dashboard/       # Home dashboard
│   ├── Forms/           # Form elements showcase
│   ├── Tables/          # Table showcase
│   ├── UiElements/      # UI component showcase
│   └── ...              # Main app pages
├── services/            # API service functions
├── styles/              # Global styles and animations
├── config/              # App configuration
├── App.tsx              # Main app component
└── main.tsx             # Entry point
```

## 🔐 Authentication Flow

1. User signs in via `/auth/signin`
2. JWT token stored in localStorage
3. AuthContext manages user state
4. ProtectedRoute guards secure pages
5. Role-based access control for features

## 🎨 Key Components

### AI Components
```
components/ai/
├── AIChatbotWidget.tsx    # Floating chatbot
├── AIChatbotButton.tsx    # Chat toggle button
├── AIOnboarding.tsx       # First-time guide
├── AIBadge.tsx            # AI indicator badges
├── AIActionButtons.tsx    # AI text enhancement buttons
└── AILoading.tsx          # AI loading states
```

### Dashboard Components
```
components/ui/
├── report-generator/      # AI report generator
├── chart/                 # Chart components
├── table/                 # Data tables
├── button/                # Button variants
└── modal/                 # Modal dialogs
```

### Layout Components
```
layout/
├── AppLayout.tsx          # Main app wrapper
├── AppSidebar.tsx         # Navigation sidebar with role-based menus
├── AppHeader.tsx          # Top header with search/notifications
└── SidebarWidget.tsx      # Sidebar promotional widget
```

## 📊 Pages Overview

### Main Business Pages
- **Home** - Dashboard with KPIs, charts, recent activity
- **InvoiceList/CreateInvoice/InvoiceDetail** - Full invoice workflow
- **QuoteList/CreateQuote** - Quote management
- **SalesOrderList/CreateSalesOrder** - Order processing
- **ProductManagement** - Product catalog
- **ClientList/ClientProfile** - CRM functionality
- **SupplierList/SupplierProfile** - Supplier management
- **StockManagement** - Inventory tracking
- **ExpenseList/CreateExpense** - Expense tracking
- **Payments** - Cash flow management
- **CreditNotes** - Credit note handling
- **AIScanner** - OCR document processing

### Admin Pages
- **AdminDashboard** - Platform overview
- **AdminUsers** - User management
- **AdminBusinesses** - Business management
- **AdminActivityLogs** - Platform activity
- **AdminSettings** - System configuration

### Auth Pages
- **SignIn** - Login page
- **SignUp** - Registration
- **ForgotPassword** - Password reset request
- **ResetPassword** - Password reset confirmation
- **VerifyEmail** - Email verification

## 🎯 Role-Based Access

Routes and UI elements are controlled by roles:

```typescript
// Role hierarchy
PLATFORM_ADMIN > BUSINESS_OWNER > BUSINESS_ADMIN > ACCOUNTANT > TEAM_MEMBER

// Usage in routing
<FinancialRoute>  // Owner, Admin, Accountant
<ManagerRoute>    // Owner, Admin
<AdminRoute>      // Platform Admin only
<BusinessRoute>   // All business roles
```

## 🌙 Dark Mode

Toggle between light and dark themes:
- Automatic system preference detection
- Manual toggle in user menu
- Persistent preference storage
- Glowing effects on AI badges in dark mode

## 📱 Responsive Design

Breakpoints:
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

Sidebar behavior:
- Desktop: Collapsible sidebar (90px - 290px)
- Mobile: Slide-out drawer

## 🧪 Testing

```bash
# Lint code
npm run lint

# Preview production build
npm run preview
```

## 🎨 Customization

### Tailwind Config
Colors and theme values are defined in `index.css` using CSS variables.

### Adding New Pages
1. Create component in `src/pages/`
2. Add route in `App.tsx`
3. Add to menu config if needed
4. Wrap with appropriate route guard

### API Integration
1. Add service function in `src/services/`
2. Use in component with `useEffect` or mutations
3. Handle loading and error states

## 📦 Deployment

### Static Hosting
```bash
npm run build
# Deploy dist/ folder to Netlify, Vercel, or S3
```

### Environment Variables for Production
```env
VITE_API_URL=https://api.bizflow.ai
```

## 🔗 Integration with Backend

Ensure the backend is running and CORS is configured:
```typescript
// Backend main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});
```

## 📚 Based on TailAdmin

This project is built on the [TailAdmin React](https://tailadmin.com) free template, which provides:
- Modern dashboard layouts
- Reusable UI components
- Tailwind CSS styling foundation

## 📝 License

UNLICENSED - Private software

## 🤝 Support

For support, email support@bizflow.ai or create an issue in the repository.

---

Built with ❤️ using React, Vite, and Tailwind CSS

