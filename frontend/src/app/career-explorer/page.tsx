"use client";

import React, { useEffect, useState } from "react";
import { apiService } from "@/services/api";
import { useRouter } from "next/navigation";
import {
  Compass,
  TrendingUp,
  Map,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Briefcase
} from "lucide-react";
import { motion } from "framer-motion";

// Requirement 9: TypeScript Interfaces
interface CareerMatch {
  title: string;
  score: number;
  category?: string;
  description?: string;
}

interface MatchResponse {
  success: boolean;
  matches: CareerMatch[];
  message?: string;
}

// Requirement 7: Custom EmptyState Component
function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-gray-950 border border-gray-900 rounded-2xl p-8 text-center text-gray-500 text-sm flex flex-col items-center justify-center gap-3 w-full">
      <Compass className="w-8 h-8 text-gray-700" />
      <div>
        <p className="font-bold text-gray-400">{title}</p>
        <p className="text-xs text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  );
}

export default function CareerExplorer() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [armyRole, setArmyRole] = useState("");
  const [skillsStr, setSkillsStr] = useState("");
  
  // Requirement 4: State initialization
  const [matches, setMatches] = useState<any>([]);
  
  const [selectedJob, setSelectedJob] = useState<CareerMatch | null>(null);
  const [skillGap, setSkillGap] = useState<any>(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [loadingGap, setLoadingGap] = useState(false);
  
  // Custom Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userProfile = await apiService.getProfile();
        setProfile(userProfile);
        setArmyRole(userProfile?.army_role || "");
        setSkillsStr(userProfile?.skills?.join(", ") || "");
        if (userProfile?.army_role) {
          fetchMatches(userProfile.army_role, userProfile.skills || []);
        }
      } catch (e) {
        console.error("Failed to load profile:", e);
      }
    };
    loadProfile();
  }, []);

  // Requirement 10: Wrapping in try/catch and managing error state & toast
  const fetchMatches = async (role: string, skills: string[]) => {
    setLoadingMatches(true);
    try {
      const results = await apiService.matchJobs(role, skills);
      
      // Requirement 8: Console debugging - Raw API response
      // Constructing response.data matching the instruction
      const response = { data: results };
      console.log("Raw API response:", response.data);

      setMatches(results || []);
      
      // Compute safe matches internally to select default job
      const currentSafeMatches = Array.isArray(results)
        ? results
        : Array.isArray(results?.matches)
          ? results.matches
          : [];

      if (currentSafeMatches.length > 0) {
        handleSelectJob(currentSafeMatches[0], skills);
      } else {
        setSelectedJob(null);
        setSkillGap(null);
      }
    } catch (e) {
      console.error(e);
      setMatches([]);
      setSelectedJob(null);
      setSkillGap(null);
      // Toast notification instead of crashing
      showToast("Unable to fetch career matches.");
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleSearch = () => {
    // Requirement 11: Array.isArray on split output
    const splitSkills = skillsStr.split(",");
    const skillList = Array.isArray(splitSkills) 
      ? splitSkills.map(s => s.trim()).filter(Boolean) 
      : [];
    fetchMatches(armyRole, skillList);
  };

  const handleSelectJob = async (job: CareerMatch, userSkills: string[]) => {
    setSelectedJob(job);
    setLoadingGap(true);
    try {
      const gap = await apiService.skillGap(userSkills, job.title);
      setSkillGap(gap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingGap(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!selectedJob || !skillGap) return;
    setRoadmapLoading(true);
    try {
      const roadmap = await apiService.generateRoadmap(selectedJob.title, skillGap);
      // Save roadmap payload in localStorage to render on roadmap page
      localStorage.setItem("generated_roadmap", JSON.stringify(roadmap));
      router.push("/roadmap");
    } catch (e) {
      console.error(e);
    } finally {
      setRoadmapLoading(false);
    }
  };

  // Requirement 5: Normalize data before rendering
  const safeMatches = Array.isArray(matches)
    ? matches
    : Array.isArray(matches?.matches)
      ? matches.matches
      : [];

  // Requirement 8: Console debugging - safeMatches
  console.log("Matches:", safeMatches);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-red-950 border border-red-500 text-red-200 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-bounce">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <span className="text-xs font-semibold tracking-wide">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-red-400 hover:text-red-200 ml-2 font-bold text-sm">×</button>
        </div>
      )}

      {/* Header */}
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">
          Career <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Explorer</span>
        </h1>
        <p className="text-gray-400 text-sm">
          Map your military assignments semantically to top corporate roles and analyze skill gaps.
        </p>
      </header>

      {/* Query Form */}
      <section className="bg-gray-950 border border-gray-900 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Military Role / Rank
            </label>
            <input
              type="text"
              value={armyRole}
              onChange={(e) => setArmyRole(e.target.value)}
              className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition text-gray-300"
              placeholder="e.g. Infantry Captain, Corps of Signals"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Current Skills (comma separated)
            </label>
            <input
              type="text"
              value={skillsStr}
              onChange={(e) => setSkillsStr(e.target.value)}
              className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition text-gray-300"
              placeholder="e.g. Leadership, Radio operations, Logistics"
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/10 flex items-center gap-2 transition"
          >
            <Search className="w-4 h-4" /> Run Vector Match
          </button>
        </div>
      </section>

      {/* Dual Panel (Matches & Skill Gap) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left matches list */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-400" /> Matched Civilian Roles
          </h2>

          {loadingMatches ? (
            <div className="bg-gray-950 border border-gray-900 rounded-2xl p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
            </div>
          ) : (() => {
            // Requirement 7: Before mapping check if empty and display EmptyState
            if (!safeMatches.length) {
              return (
                <EmptyState
                  title="No matching careers"
                  description="Try entering different military skills."
                />
              );
            }

            return (
              <div className="space-y-3">
                {/* Requirement 6: Use safeMatches.map */}
                {safeMatches.map((job: any, idx: number) => {
                  const isSelected = selectedJob?.title === job.title;
                  const splitSkills = skillsStr.split(",");
                  const skillList = Array.isArray(splitSkills) 
                    ? splitSkills.map(s => s.trim()).filter(Boolean) 
                    : [];

                  return (
                    <motion.div
                      key={idx}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectJob(job, skillList)}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                        isSelected
                          ? "bg-gradient-to-r from-emerald-950/20 to-teal-950/10 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.08)]"
                          : "bg-gray-950 border-gray-900 hover:border-gray-800"
                      }`}
                    >
                      <div>
                        <h4 className="font-bold text-sm text-white">{job.title}</h4>
                        <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-wider">
                          {job.category || "General Management"}
                        </p>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs bg-emerald-500/10 px-2.5 py-1 rounded-md text-emerald-400 font-medium border border-emerald-500/10">
                          {Math.round(job.score * 100)}% Match
                        </span>
                        <ArrowRight className={`w-4 h-4 transition ${isSelected ? "text-emerald-400 translate-x-1" : "text-gray-600"}`} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Right details & gap analysis panel */}
        <div id="skill-gap" className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-rose-400" /> Skill Gap Analysis
          </h2>

          {loadingGap ? (
            <div className="bg-gray-950 border border-gray-900 rounded-2xl p-16 flex items-center justify-center min-h-[300px]">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : !selectedJob ? (
            <div className="bg-gray-950 border border-gray-900 rounded-2xl p-16 text-center text-gray-500 text-sm flex flex-col items-center justify-center gap-3 min-h-[300px]">
              <Briefcase className="w-8 h-8 text-gray-700" />
              Select a matched role on the left to view skill gaps.
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gray-950 border border-gray-900 rounded-2xl p-8 space-y-6"
            >
              <div>
                <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full text-emerald-400 font-bold uppercase tracking-wider">
                  Target Position: {selectedJob.title}
                </span>
                <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                  {selectedJob.description || `Analyze matching capabilities for ${selectedJob.title} relative to military operations.`}
                </p>
              </div>

              {/* Matched Skills */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-500" /> Overlapping Skills ({skillGap?.overlap_skills?.length || 0})
                </h4>
                {Array.isArray(skillGap?.overlap_skills) && skillGap.overlap_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {/* Requirement 11: Guard skillGap.overlap_skills mapping */}
                    {skillGap.overlap_skills.map((skill: string, i: number) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-green-500/5 text-green-400 border border-green-500/10 text-xs rounded-lg font-medium capitalize"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No matching skills identified.</p>
                )}
              </div>

              {/* Missing Skills */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500" /> Skill Gaps Identified ({skillGap?.missing_skills?.length || 0})
                </h4>
                {Array.isArray(skillGap?.missing_skills) && skillGap.missing_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {/* Requirement 11: Guard skillGap.missing_skills mapping */}
                    {skillGap.missing_skills.map((skill: string, i: number) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-rose-500/5 text-rose-400 border border-rose-500/10 text-xs rounded-lg font-medium capitalize"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-green-400">All required skills met!</p>
                )}
              </div>

              {/* Action */}
              <div className="pt-6 border-t border-gray-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h5 className="font-bold text-sm">Close this Skill Gap</h5>
                  <p className="text-xs text-gray-500 mt-0.5">Let AI build a step-by-step roadmap to learn missing skills.</p>
                </div>
                <button
                  onClick={handleGenerateRoadmap}
                  disabled={roadmapLoading || !skillGap}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 transition"
                >
                  {roadmapLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating Map...
                    </>
                  ) : (
                    <>
                      <Map className="w-3.5 h-3.5" /> Generate Roadmap
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
