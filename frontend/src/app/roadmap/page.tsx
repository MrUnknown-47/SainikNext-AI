"use client";

import React, { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import {
  Map,
  CheckCircle2,
  Circle,
  Loader2,
  Compass,
  ArrowRight,
  TrendingUp,
  Bookmark,
  Award
} from "lucide-react";
import { motion } from "framer-motion";

export default function RoadmapPage() {
  const [profile, setProfile] = useState<any>(null);
  const [targetJob, setTargetJob] = useState("");
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<any>(null);
  
  // Track step completion states locally
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const loadProfileAndRoadmap = async () => {
      try {
        const userProfile = await apiService.getProfile();
        setProfile(userProfile);
        
        // 1. First, check if there's a cached generated roadmap from Career Explorer page
        const cached = localStorage.getItem("generated_roadmap");
        if (cached) {
          try {
            const data = JSON.parse(cached);
            setRoadmap(data.roadmap || data);
            setTargetJob((data.roadmap || data).target_job || "");
            return;
          } catch (e) {
            console.error("Failed to parse cached roadmap", e);
          }
        }
        
        // 2. Otherwise generate a default roadmap based on their matches
        if (userProfile?.army_role) {
          const defaultTarget = "Operations Manager";
          setTargetJob(defaultTarget);
          handleGenerate(defaultTarget, userProfile);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadProfileAndRoadmap();
  }, []);

  const handleGenerate = async (target?: string, userProfile?: any) => {
    const finalTarget = target || targetJob;
    const finalProfile = userProfile || profile;
    if (!finalTarget.trim() || !finalProfile) return;

    setLoading(true);
    try {
      // Fetch skill gap first
      const gap = await apiService.skillGap(finalProfile.skills || [], finalTarget);
      // Generate roadmap
      const response = await apiService.generateRoadmap(finalTarget, gap);
      const data = response.roadmap || response;
      setRoadmap(data);
      localStorage.setItem("generated_roadmap", JSON.stringify(data));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (idx: number) => {
    setCompletedSteps(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const getCompletionPercentage = () => {
    if (!roadmap?.steps || roadmap.steps.length === 0) return 0;
    const completedCount = Object.values(completedSteps).filter(Boolean).length;
    return Math.round((completedCount / roadmap.steps.length) * 100);
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">
          Learning <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Roadmap</span>
        </h1>
        <p className="text-gray-400 text-sm">
          A step-by-step career path mapping military capabilities to target corporate certifications and skillsets.
        </p>
      </header>

      {/* Target Setup */}
      <section className="bg-gray-950 border border-gray-900 rounded-2xl p-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
            Target Corporate Job Position
          </label>
          <input
            type="text"
            value={targetJob}
            onChange={(e) => setTargetJob(e.target.value)}
            className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition text-gray-300"
            placeholder="e.g. Operations Manager, Project Manager, Scrum Master..."
          />
        </div>
        <button
          onClick={() => handleGenerate()}
          disabled={loading || !targetJob.trim()}
          className="w-full sm:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 transition self-end h-[46px]"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Building Pathway...
            </>
          ) : (
            <>
              🗺️ Rebuild Roadmap
            </>
          )}
        </button>
      </section>

      {/* Main Roadmap Display */}
      {loading ? (
        <div className="bg-gray-950 border border-gray-900 rounded-2xl p-16 flex flex-col items-center justify-center gap-4 min-h-[400px]">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-gray-400 text-xs font-mono uppercase tracking-widest">Compiling Learning Milestones...</p>
        </div>
      ) : !roadmap ? (
        <div className="bg-gray-950 border border-gray-900 rounded-2xl p-16 text-center text-gray-500 text-sm flex flex-col items-center justify-center gap-4 min-h-[400px]">
          <Map className="w-12 h-12 text-gray-800" />
          <div>
            <p className="font-bold text-gray-400">No roadmap generated yet</p>
            <p className="text-xs text-gray-600 mt-1">Specify your target job above and click build to generate your career track.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Timeline details */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" /> Learning Path Milestones
            </h3>

            {/* Vertical timeline steps */}
            <div className="relative pl-8 border-l border-gray-900 ml-4 space-y-8 py-2">
              {Array.isArray(roadmap.steps) && roadmap.steps.map((step: any, idx: number) => {
                const title = step.title || `Milestone ${idx + 1}: ${step.skill || "Skill Acquisition"}`;
                const description = step.description || `Complete training modules in ${step.skill || "target area"}.`;
                const timeline = step.timeline || step.duration || "2-3 Weeks";
                const cert = step.certification || step.recommended_cert;
                const isCompleted = !!completedSteps[idx];

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative group"
                  >
                    {/* Check icon placeholder on timeline line */}
                    <div
                      onClick={() => toggleStep(idx)}
                      className={`absolute -left-12 top-1 w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer transition-all duration-300 ${
                        isCompleted
                          ? "bg-green-500 border-green-400 text-white shadow-lg shadow-green-500/20"
                          : "bg-black border-gray-800 text-gray-500 hover:border-amber-500 hover:text-amber-400"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </div>

                    <div className="bg-gray-950 border border-gray-900 hover:border-gray-800 p-5 rounded-2xl space-y-3 transition">
                      <div className="flex justify-between items-start gap-4">
                        <h4 className={`font-bold text-sm leading-snug transition-colors ${isCompleted ? "text-gray-500 line-through" : "text-white"}`}>
                          {title}
                        </h4>
                        <span className="text-[10px] bg-gray-900 border border-gray-800 px-2 py-1 rounded text-gray-400 font-semibold shrink-0">
                          {timeline}
                        </span>
                      </div>

                      <p className={`text-xs leading-relaxed transition ${isCompleted ? "text-gray-600" : "text-gray-400"}`}>
                        {description}
                      </p>

                      {cert && (
                        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400/90 pt-1">
                          <Award className="w-3.5 h-3.5" />
                          <span>Recommended: {cert}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Right side summary cards */}
          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
              Roadmap Progress
            </h3>

            <div className="bg-gray-950 border border-gray-900 p-6 rounded-2xl space-y-6">
              <div className="text-center py-4">
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Estimated completion</p>
                <h3 className="text-5xl font-black text-white mt-2">{getCompletionPercentage()}%</h3>
                <p className="text-xs text-gray-400 mt-2">
                  {Object.values(completedSteps).filter(Boolean).length} of {roadmap.steps?.length || 0} milestones checked.
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getCompletionPercentage()}%` }}
                />
              </div>

              <div className="border-t border-gray-900 pt-4 space-y-3.5">
                <div className="flex items-start gap-2.5 text-xs text-gray-400 leading-normal">
                  <Bookmark className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Mark items complete on the timeline once you acquire the knowledge or certs.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
