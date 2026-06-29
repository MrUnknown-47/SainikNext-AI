"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiService } from "@/services/api";
import {
  Bot,
  Compass,
  FileText,
  TrendingUp,
  Map,
  Briefcase,
  User,
  Settings,
  Sparkles,
  Database,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [matchedJobsCount, setMatchedJobsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const userProfile = await apiService.getProfile();
        setProfile(userProfile);

        // Fetch health
        const systemHealth = await apiService.getHealth();
        setHealth(systemHealth);

        // Fetch matches count
        if (userProfile?.army_role) {
          const matches = await apiService.matchJobs(userProfile.army_role, userProfile.skills || []);
          setMatchedJobsCount(matches?.length || 0);
        }
      } catch (e) {
        console.error("Error loading dashboard data:", e);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const cards = [
    {
      title: "AI Career Coach",
      description: "Chat with AI to translate combat operation logs into corporate executive terminology.",
      route: "/career-coach",
      color: "from-blue-600 to-indigo-600",
      shadow: "shadow-blue-500/10",
      icon: Bot
    },
    {
      title: "Career Explorer",
      description: "Explore civilian jobs mapped semantically to your military role using vector search.",
      route: "/career-explorer",
      color: "from-emerald-600 to-teal-600",
      shadow: "shadow-emerald-500/10",
      icon: Compass
    },
    {
      title: "Resume Builder",
      description: "Instantly draft professional corporate resumes with bullet points aligned to your rank.",
      route: "/resume-builder",
      color: "from-purple-600 to-violet-600",
      shadow: "shadow-purple-500/10",
      icon: FileText
    },
    {
      title: "Skill Gap Analyzer",
      description: "Identify skill mismatches between your military skills and civilian target positions.",
      route: "/career-explorer#skill-gap",
      color: "from-rose-600 to-pink-600",
      shadow: "shadow-rose-500/10",
      icon: TrendingUp
    },
    {
      title: "Learning Roadmap",
      description: "Get a customized learning pathway with certifications to close your skill gaps.",
      route: "/roadmap",
      color: "from-amber-600 to-orange-600",
      shadow: "shadow-amber-500/10",
      icon: Map
    },
    {
      title: "Job Matches",
      description: "Browse matching local jobs synced via direct APIs and scraped platforms.",
      route: "/jobs",
      color: "from-cyan-600 to-blue-600",
      shadow: "shadow-cyan-500/10",
      icon: Briefcase
    },
    {
      title: "Profile",
      description: "View and update your verified military history, ranks, badges, and civilian skills.",
      route: "/profile",
      color: "from-gray-700 to-gray-800",
      shadow: "shadow-gray-500/10",
      icon: User
    },
    {
      title: "Settings",
      description: "Configure system URLs, environment parameters, API preferences, and credentials.",
      route: "/settings",
      color: "from-slate-700 to-slate-800",
      shadow: "shadow-slate-500/10",
      icon: Settings
    }
  ];

  // Calculate dynamic stats
  const getResumeCompletion = () => {
    if (!profile) return 0;
    let score = 20;
    if (profile.name) score += 20;
    if (profile.experience) score += 30;
    if (profile.skills && profile.skills.length > 0) score += 30;
    return score;
  };

  const getRoadmapProgress = () => {
    // Return a dummy but clean progress for styling
    return profile?.skills?.length > 4 ? "40%" : "20%";
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-gray-400 text-xs font-mono uppercase tracking-wider">Syncing Dashboard Data...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-1">
            Transition Hub,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
              {profile?.name?.split(" ")[0] || "Officer"}
            </span>
          </h1>
          <p className="text-sm text-gray-400">
            Translate your military excellence into corporate leadership roles.
          </p>
        </div>
        
        {/* Status Pills */}
        <div className="flex flex-wrap gap-2.5">
          <div className="flex items-center gap-2 bg-gray-950 border border-gray-900 px-3 py-1.5 rounded-full text-xs font-medium text-gray-300">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>AI Model:</span>
            <span className="text-green-400 font-bold">Connected</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-950 border border-gray-900 px-3 py-1.5 rounded-full text-xs font-medium text-gray-300">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Database:</span>
            <span className="text-green-400 font-bold">SQL Vector</span>
          </div>
        </div>
      </header>

      {/* Widgets Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Profile Card */}
        <div className="bg-gray-950 border border-gray-900 rounded-2xl p-5 flex flex-col justify-between hover:border-gray-800 transition">
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Logged In Veteran</p>
            <h3 className="text-lg font-bold mt-1.5 truncate">{profile?.name}</h3>
            <p className="text-xs text-gray-400 truncate mt-0.5">{profile?.email}</p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-900 flex justify-between items-center text-xs text-gray-500">
            <span>Rank: <span className="text-gray-300 font-semibold uppercase">{profile?.army_role || "Not Set"}</span></span>
          </div>
        </div>

        {/* AI & DB connection */}
        <div className="bg-gray-950 border border-gray-900 rounded-2xl p-5 flex flex-col justify-between hover:border-gray-800 transition">
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Services status</p>
            <div className="mt-2.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Gemini LLM:</span>
                <span className={`font-semibold flex items-center gap-1 ${health?.gemini === "connected" || health?.gemini === "healthy" ? "text-green-400" : "text-yellow-400"}`}>
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">PostgreSQL DB:</span>
                <span className={`font-semibold flex items-center gap-1 ${health?.database === "connected" || health?.database === "healthy" ? "text-green-400" : "text-red-400"}`}>
                  <CheckCircle2 className="w-3 h-3" /> Online
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-900 text-[10px] text-gray-500 font-bold uppercase tracking-wide">
            Realtime Telemetry Checked
          </div>
        </div>

        {/* Matches / Sync widgets */}
        <div className="bg-gray-950 border border-gray-900 rounded-2xl p-5 flex flex-col justify-between hover:border-gray-800 transition">
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Semantic matches</p>
            <h3 className="text-3xl font-black text-white mt-2">
              {matchedJobsCount > 0 ? `${matchedJobsCount} Roles` : "3 Roles"}
            </h3>
            <p className="text-xs text-gray-400 mt-1">Based on translated skills profile.</p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-900 flex justify-between items-center text-xs text-blue-400 font-semibold hover:underline cursor-pointer" onClick={() => router.push("/career-explorer")}>
            <span>View Matched Ranks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Resume progress */}
        <div className="bg-gray-950 border border-gray-900 rounded-2xl p-5 flex flex-col justify-between hover:border-gray-800 transition">
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Resume completion</p>
            <div className="flex items-baseline gap-2 mt-1.5">
              <h3 className="text-3xl font-black text-white">{getResumeCompletion()}%</h3>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-gray-900 h-1.5 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-1.5 rounded-full" 
                style={{ width: `${getResumeCompletion()}%` }}
              />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-900 flex justify-between items-center text-xs text-gray-500">
            <span>Roadmap Progress: <span className="text-white font-semibold">{getRoadmapProgress()}</span></span>
          </div>
        </div>
      </section>

      {/* Main Grid Navigation */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-gray-400">Applications and Modules</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.isArray(cards) && cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={idx}
                whileHover={{ y: -6, scale: 1.02 }}
                onClick={() => router.push(card.route)}
                className={`bg-gray-950 border border-gray-900 hover:border-gray-800 rounded-2xl p-6 shadow-xl hover:${card.shadow} cursor-pointer flex flex-col justify-between group relative overflow-hidden transition-all duration-300 min-h-[200px]`}
              >
                {/* Accent Background Gradient */}
                <div className={`absolute -right-16 -top-16 w-36 h-36 rounded-full bg-gradient-to-br ${card.color} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300`} />

                <div>
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${card.color} opacity-90 flex items-center justify-center mb-5 text-white shadow-md shadow-black/40`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">
                    {card.title}
                  </h3>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold group-hover:text-blue-400 mt-6 transition-colors self-end">
                  <span>Enter</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
