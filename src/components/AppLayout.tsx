import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";

const AppLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <main id="app-content" className="flex-1 ml-64 min-w-0 h-screen overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
