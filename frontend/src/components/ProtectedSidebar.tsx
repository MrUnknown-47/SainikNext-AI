"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authService } from "@/services/auth";
import {
  LayoutDashboard,
  Bot,
  Briefcase,
  FileText,
  Compass,
  TrendingUp,
  Map,
  User,
  Settings,
  LogOut,
  Shield,
  X
} from "lucide-react";

interface SidebarProps {
  onClose?: () => void;
}

export default function ProtectedSidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Career Coach", path: "/career-coach", icon: Bot },
    { name: "Job Matches", path: "/jobs", icon: Briefcase },
    { name: "Resume Builder", path: "/resume-builder", icon: FileText },
    { name: "Career Explorer", path: "/career-explorer", icon: Compass },
    { name: "Learning Roadmap", path: "/roadmap", icon: Map },
    { name: "Profile", path: "/profile", icon: User },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 h-full bg-gray-950/80 backdrop-blur-xl border-r border-gray-900 flex flex-col p-6 text-white relative">
      {/* Mobile Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Brand Logo */}
      <div className="flex items-center gap-3 mb-8 mt-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-500 to-blue-500 flex items-center justify-center shadow-lg shadow-green-500/20">
          <span className="font-extrabold text-white text-xl">S</span>
        </div>
        <div>
          <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 tracking-tight leading-none">
            SainikNext
          </h1>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
            Veteran AI Hub
          </span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto pr-1">
        {Array.isArray(navItems) && navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.path.split("#")[0]) && item.path !== "/dashboard";

          return (
            <Link
              key={item.name}
              href={item.path}
              onClick={onClose}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm tracking-wide ${
                isActive
                  ? "bg-gradient-to-r from-blue-600/10 to-indigo-600/5 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)] font-semibold"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-900/40 border border-transparent"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-gray-400"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile and Signout */}
      <div className="mt-auto pt-6 border-t border-gray-900/60 flex flex-col gap-4">
        <button
          onClick={() => authService.logout()}
          className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 transition-all duration-300 text-sm font-medium"
        >
          <LogOut className="w-4 h-4 text-gray-400" />
          Logout
        </button>

        <div className="p-3.5 rounded-xl bg-gray-900/40 border border-gray-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-green-500" />
          <span className="text-[10px] text-gray-500 leading-relaxed font-bold tracking-wider uppercase">
            Secured Connection
          </span>
        </div>
      </div>
    </aside>
  );
}
