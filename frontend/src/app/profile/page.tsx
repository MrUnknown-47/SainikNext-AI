"use client";

import React, { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import {
  User,
  Shield,
  Briefcase,
  Bot,
  Mail,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Lock
} from "lucide-react";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userProfile = await apiService.getProfile();
        setProfile(userProfile);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">
          Veteran <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Profile</span>
        </h1>
        <p className="text-gray-400 text-sm">
          Your verified service history, translated civilian competencies, and active credentials.
        </p>
      </header>

      {/* Main Profile Info Card */}
      <div className="bg-gray-950 border border-gray-900 rounded-2xl overflow-hidden shadow-2xl">
        {/* Banner with gradient accent */}
        <div className="h-32 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-black border-b border-gray-900/60 relative" />

        {/* Profile Details Area */}
        <div className="p-8 relative pt-0">
          {/* Avatar floating up */}
          <div className="absolute -top-12 left-8 w-24 h-24 rounded-2xl bg-gradient-to-tr from-green-500 to-blue-500 flex items-center justify-center font-bold text-white text-3xl shadow-xl shadow-black ring-4 ring-black">
            {profile?.name?.charAt(0) || <User className="w-8 h-8" />}
          </div>

          <div className="pl-32 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{profile?.name}</h2>
              <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-1 font-semibold uppercase tracking-wider">
                <Shield className="w-4 h-4 text-green-500" />
                <span>Rank: {profile?.army_role || "Officer"}</span>
              </div>
            </div>
            <span className="text-[10px] bg-green-500/10 border border-green-500/20 px-3.5 py-1.5 rounded-full text-green-400 font-bold uppercase tracking-wider h-fit">
              Active Duty Transition
            </span>
          </div>

          {/* Detailed Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 pt-8 border-t border-gray-900/60">
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" /> Contact Info & Credentials
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center border border-gray-800 text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Email address</p>
                    <p className="text-xs text-gray-300 font-semibold">{profile?.email || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center border border-gray-800 text-gray-400">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Commissioned branch</p>
                    <p className="text-xs text-gray-300 font-semibold">Indian Army (Regular Commission)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" /> Translated Competencies
              </h3>
              
              <div className="space-y-2">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-3">Verified Skills</p>
                {profile?.skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(profile.skills) && profile.skills.map((skill: string, i: number) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-gray-900 border border-gray-800 text-gray-300 text-xs rounded-lg font-medium capitalize flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No translated skills on record. Chat with the AI Career Coach to translate skills.</p>
                )}
              </div>
            </div>
          </div>

          {/* Service Log */}
          <div className="mt-8 pt-8 border-t border-gray-900/60 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-purple-400" /> Military Service Record & Logs
            </h3>
            <div className="bg-gray-900/40 border border-gray-900 p-5 rounded-2xl text-xs text-gray-400 leading-relaxed font-sans font-light">
              {profile?.experience || "No experience logs registered. The AI Career Coach parses, translates, and populates your service history logs dynamically as you chat."}
            </div>
          </div>

          {/* AI Sync Alert */}
          <div className="mt-8 bg-blue-950/10 border border-blue-900/30 p-5 rounded-2xl flex items-start gap-4">
            <Bot className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> Auto-Synced AI Profile
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed mt-1">
                Your profile updates automatically as you chat with our AI Career Coach. The AI translates operations logs, extracts corporate competencies, and updates your verified skill matrices without requiring manual form entry.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
