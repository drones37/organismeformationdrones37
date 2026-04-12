import { Outlet, useLocation } from "react-router-dom";
import AppSidebar from "./AppSidebar";

const AppLayout = () => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 ml-64 p-8">
        <Outlet key={location.pathname} />
      </main>
    </div>
  );
};

export default AppLayout;
