"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authService } from "@/services/auth";
import { apiService } from "@/services/api";
import ProtectedSidebar from "@/components/ProtectedSidebar";
import {
  Menu,
  Bell,
  Cpu,
  Database,
  CloudLightning,
  User as UserIcon,
  ChevronDown
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [health, setHealth] = useState<any>({
    database: "checking",
    gemini: "checking",
    status: "checking",
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Unprotected routes that should not render sidebar/navbar or require authentication
  const isUnprotectedRoute = pathname === "/" || pathname === "/auth-success";

  useEffect(() => {
    if (isUnprotectedRoute) {
      setIsAuthenticated(false);
      return;
    }

    const checkAuth = async () => {
      const token = authService.getToken();
      if (!token) {
        setIsAuthenticated(false);
        router.push("/");
        return;
      }
      try {
        const userProfile = await apiService.getProfile();
        setProfile(userProfile);
        setIsAuthenticated(true);
      } catch (e) {
        console.warn("Session authentication invalidated, logging out...", e);
        authService.logout();
        setIsAuthenticated(false);
        router.push("/");
      }
    };

    checkAuth();
  }, [pathname, isUnprotectedRoute, router]);

  useEffect(() => {
    const fetchHealth = async () => {
      const systemHealth = await apiService.getHealth();
      setHealth(systemHealth);
    };

    if (isAuthenticated && !isUnprotectedRoute) {
      fetchHealth();
      const interval = setInterval(fetchHealth, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, isUnprotectedRoute]);

  const getPageTitle = () => {
    const path = pathname.split("#")[0];
    switch (path) {
      case "/dashboard":
        return "Dashboard";
      case "/career-coach":
        return "AI Career Coach";
      case "/career-explorer":
        return "Career Explorer";
      case "/resume-builder":
        return "Resume Builder";
      case "/jobs":
        return "Job Matches";
      case "/roadmap":
        return "Learning Roadmap";
      case "/profile":
        return "My Profile";
      case "/settings":
        return "Settings";
      default:
        return "SainikNext AI";
    }
  };

  // If it's an unprotected route (like login page `/`), render children directly
  if (isUnprotectedRoute) {
    return <>{children}</>;
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center flex-col gap-4 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-gray-400 font-mono tracking-widest uppercase text-xs">Authenticating Session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden">
      {/* Desktop Sidebar (lg) */}
      <div className="hidden lg:block w-64 h-screen shrink-0">
        <ProtectedSidebar />
      </div>

      {/* Mobile Sidebar (Drawer) */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="absolute inset-0 bg-black"
            />
            {/* Drawer Content */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="relative z-10 w-64 h-full"
            >
              <ProtectedSidebar onClose={() => setIsMobileSidebarOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-20 border-b border-gray-900 bg-gray-950/40 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-4">
            {/* Hamburger Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-900 transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold tracking-tight">{getPageTitle()}</h2>
          </div>

          {/* Right Header Icons */}
          <div className="flex items-center gap-4">
            {/* Health / System Status Widgets */}
            <div className="hidden md:flex items-center gap-3 bg-gray-900/40 border border-gray-900 px-3.5 py-1.5 rounded-xl text-xs text-gray-400">
              <span className="font-semibold text-[10px] text-gray-500 uppercase tracking-widest mr-1">
                System Status:
              </span>
              <div className="flex items-center gap-1.5" title={`Gemini status: ${health.gemini}`}>
                <Cpu className={`w-3.5 h-3.5 ${health.gemini === "connected" || health.gemini === "healthy" ? "text-green-400" : "text-yellow-500"}`} />
                <span>AI</span>
              </div>
              <span className="w-px h-3 bg-gray-800" />
              <div className="flex items-center gap-1.5" title={`DB status: ${health.database}`}>
                <Database className={`w-3.5 h-3.5 ${health.database === "connected" || health.database === "healthy" ? "text-green-400" : "text-red-500"}`} />
                <span>DB</span>
              </div>
              <span className="w-px h-3 bg-gray-800" />
              <div className="flex items-center gap-1.5" title="Scheduler Status">
                <CloudLightning className="w-3.5 h-3.5 text-blue-400" />
                <span>Sync</span>
              </div>
            </div>

            {/* Notification Icon */}
            <button className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-900 transition-all relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-black" />
            </button>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-gray-900 transition-all border border-transparent hover:border-gray-800"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-green-500 to-blue-500 flex items-center justify-center font-bold text-white shadow shadow-green-500/10">
                  {profile?.name?.charAt(0) || <UserIcon className="w-4 h-4" />}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-gray-200 leading-none">
                    {profile?.name || "Veteran User"}
                  </p>
                  <p className="text-[10px] text-gray-500 leading-none mt-0.5 capitalize">
                    {profile?.army_role?.toLowerCase() || "veteran"}
                  </p>
                </div>
                <ChevronDown className="w-3 h-3 text-gray-500" />
              </button>

              <AnimatePresence>
                {isProfileDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-48 bg-gray-950 border border-gray-800 rounded-xl shadow-2xl z-40 p-1.5 overflow-hidden"
                    >
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          router.push("/profile");
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-900 rounded-lg transition"
                      >
                        My Profile
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          router.push("/settings");
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-900 rounded-lg transition"
                      >
                        Settings
                      </button>
                      <hr className="border-gray-900 my-1" />
                      <button
                        onClick={() => authService.logout()}
                        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 rounded-lg transition"
                      >
                        Logout
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Dynamic Nested Content */}
        <main className="flex-1 overflow-y-auto bg-black relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="h-full w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
