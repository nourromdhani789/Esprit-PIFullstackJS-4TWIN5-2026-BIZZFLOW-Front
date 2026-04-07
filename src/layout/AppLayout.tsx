import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import { FocusModeIndicator } from "../components/ui/focus-mode/FocusModeIndicator";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <FocusModeIndicator />
      <div className="min-h-screen xl:flex">
        <div>
          <AppSidebar />
          <Backdrop />
        </div>
        <div
          style={{ backgroundColor: 'var(--color-background, #f9fafb)' }}
          className={`flex-1 transition-all duration-300 ease-in-out ${
            isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
          } ${isMobileOpen ? "ml-0" : ""}`}
        >
          <AppHeader />
          <main id="main-content" role="main" tabIndex={-1} className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
