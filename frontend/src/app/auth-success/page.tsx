"use client";
import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/services/auth";

function AuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      authService.setToken(token);
    }
    // Instantly reroute user into the active authentication boundaries directly navigating state
    router.push("/dashboard");
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-gray-400 font-mono tracking-widest uppercase">Authenticating...</p>
    </div>
  );
}

export default function AuthSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-400 font-mono tracking-widest uppercase">Loading...</p>
      </div>
    }>
      <AuthSuccessContent />
    </Suspense>
  );
}
