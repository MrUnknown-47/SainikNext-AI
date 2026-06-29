"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth";
import { apiService } from "@/services/api";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = authService.getToken();
      if (!token) {
        setIsAuthenticated(false);
        return;
      }
      try {
        await apiService.getProfile();
        setIsAuthenticated(true);
        router.push("/dashboard");
      } catch (e) {
        console.warn("Session authentication invalidated natively, redirecting to login.", e);
        authService.logout();
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, [router]);

  if (isAuthenticated === null || isAuthenticated === true) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center flex-col gap-4 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="text-gray-400 font-mono tracking-widest uppercase text-xs">Redirecting to Dashboard...</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
      <h1 className="text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500 mb-8 tracking-tight">
        SainikNext AI
      </h1>
      <p className="mb-12 text-xl text-gray-400 text-center max-w-2xl leading-relaxed font-sans font-light">
        The premier AI pipeline translating military experience into scalable civilian careers effortlessly.
      </p>
      <button
        onClick={authService.login}
        className="px-8 py-4 bg-white text-black font-bold rounded-xl shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] transition-all flex items-center gap-4 hover:scale-105 hover:bg-gray-100"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Sign in with Google
      </button>
    </main>
  );
}