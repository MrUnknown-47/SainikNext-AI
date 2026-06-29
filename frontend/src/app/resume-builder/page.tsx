"use client";

import React, { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import {
  FileText,
  Loader2,
  Sparkles,
  CheckCircle,
  FileCheck,
  UserCheck,
  Download,
  ClipboardList
} from "lucide-react";
import { motion } from "framer-motion";

export default function ResumeBuilder() {
  const [profile, setProfile] = useState<any>(null);
  const [milExperience, setMilExperience] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  
  // Generating state
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [resumeData, setResumeData] = useState<any>(null);
  
  // Matching state
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [matchData, setMatchData] = useState<any>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userProfile = await apiService.getProfile();
        setProfile(userProfile);
        setMilExperience(userProfile?.experience || "");
      } catch (e) {
        console.error(e);
      }
    };
    loadProfile();
  }, []);

  const handleGenerate = async () => {
    setLoadingGenerate(true);
    setMatchData(null); // clear previous match data
    try {
      const response = await apiService.generateResume(milExperience);
      setResumeData(response.resume || response);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingGenerate(false);
    }
  };

  const handleMatchResume = async () => {
    if (!resumeData || !jobDescription) return;
    setLoadingMatch(true);
    
    // Stringify resume to pass
    const resumeText = `
Title: ${resumeData.job_title}
Summary: ${resumeData.summary}
Experience: ${resumeData.bullet_points?.join("\n")}
`;

    try {
      const response = await apiService.matchResume(resumeText, jobDescription);
      setMatchData(response.match || response);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMatch(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">
          Resume <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-500">Builder</span>
        </h1>
        <p className="text-gray-400 text-sm">
          Convert raw military operations logs into clean, corporate-ready professional resumes.
        </p>
      </header>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Input panel */}
        <section className="space-y-6">
          <div className="bg-gray-950 border border-gray-900 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-purple-400" /> Military Logs & Experience
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Describe your deployments, command assignments, equipment oversight, or personnel management. Include operational metrics where possible.
            </p>
            <textarea
              value={milExperience}
              onChange={(e) => setMilExperience(e.target.value)}
              rows={8}
              className="w-full bg-black border border-gray-800 rounded-xl p-4 text-sm focus:outline-none focus:border-purple-500 transition font-sans text-gray-300 leading-relaxed"
              placeholder="e.g. Served as Company Commander in Jammu and Kashmir. Managed 120 soldiers, supervised logistics pipelines, conducted daily risk assessments, and drafted patrol schedules."
            />
            <div className="flex justify-end pt-2">
              <button
                onClick={handleGenerate}
                disabled={loadingGenerate || !milExperience.trim()}
                className="px-5 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-500/10 flex items-center gap-2 transition"
              >
                {loadingGenerate ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Translating Jargon...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Draft Civilian CV
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Fit evaluation section */}
          {resumeData && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-950 border border-gray-900 rounded-2xl p-6 space-y-4"
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-violet-400" /> Job Fit Matcher
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Paste a target job posting description to analyze how well this translated resume matches its demands.
              </p>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={6}
                className="w-full bg-black border border-gray-800 rounded-xl p-4 text-sm focus:outline-none focus:border-purple-500 transition text-gray-300 leading-relaxed"
                placeholder="Paste the target job description here..."
              />
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleMatchResume}
                  disabled={loadingMatch || !jobDescription.trim()}
                  className="px-5 py-3 bg-violet-700 hover:bg-violet-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-violet-500/10 flex items-center gap-2 transition"
                >
                  {loadingMatch ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Evaluating Fit...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" /> Evaluate Resume Fit
                    </>
                  )}
                </button>
              </div>

              {/* Match Result Display */}
              {matchData && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 p-5 rounded-xl border bg-gray-900/40 border-gray-800 space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Match score</span>
                    <span className={`text-sm font-black ${matchData.score >= 0.7 ? "text-green-400" : "text-yellow-400"}`}>
                      {Math.round(matchData.score * 100)}% Match
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-gray-950 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-1.5 rounded-full ${matchData.score >= 0.7 ? "bg-green-500" : "bg-yellow-500"}`}
                      style={{ width: `${Math.round(matchData.score * 100)}%` }}
                    />
                  </div>
                  {matchData.strengths && (
                    <div className="pt-2">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Core Strengths</p>
                      <ul className="list-disc list-inside text-xs text-gray-400 mt-1 space-y-1">
                        {Array.isArray(matchData.strengths) && matchData.strengths.slice(0, 3).map((strength: string, i: number) => (
                          <li key={i}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {matchData.improvements && (
                    <div className="pt-2">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Recommended Improvements</p>
                      <ul className="list-disc list-inside text-xs text-gray-400 mt-1 space-y-1">
                        {Array.isArray(matchData.improvements) && matchData.improvements.slice(0, 3).map((imp: string, i: number) => (
                          <li key={i}>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </section>

        {/* Right Output panel (Styled Preview) */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" /> Resume Preview
          </h2>

          {!resumeData ? (
            <div className="bg-gray-950 border border-gray-900 border-dashed rounded-2xl p-16 text-center text-gray-500 text-sm flex flex-col items-center justify-center gap-4 min-h-[400px]">
              <FileText className="w-12 h-12 text-gray-800" />
              <div>
                <p className="font-bold text-gray-400">No draft created yet</p>
                <p className="text-xs text-gray-600 mt-1">Provide your military details on the left and hit draft.</p>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white text-gray-900 rounded-2xl p-8 shadow-2xl space-y-6 min-h-[500px] font-sans relative"
            >
              {/* Profile details */}
              <div className="border-b border-gray-200 pb-5">
                <h2 className="text-2xl font-bold tracking-tight text-gray-950 uppercase">{profile?.name}</h2>
                <h4 className="text-xs font-bold text-purple-600 tracking-wider uppercase mt-1">
                  {resumeData.job_title || "Project Manager / Operations Specialist"}
                </h4>
                <p className="text-xs text-gray-500 mt-1">{profile?.email || "officer@sainiknext.com"}</p>
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <h3 className="text-xs font-black text-gray-950 uppercase tracking-widest border-b border-gray-100 pb-1">
                  Professional Summary
                </h3>
                <p className="text-xs text-gray-700 leading-relaxed font-light">
                  {resumeData.summary}
                </p>
              </div>

              {/* Core Experience */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-gray-950 uppercase tracking-widest border-b border-gray-100 pb-1">
                  Civilian Accomplishments & Work History
                </h3>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline text-xs font-bold text-gray-900">
                    <span>Operations Director (Military equivalent)</span>
                    <span className="text-[10px] text-gray-500">Honourable Service</span>
                  </div>
                  <ul className="list-disc pl-5 text-xs text-gray-700 space-y-1.5 mt-2 font-light leading-relaxed">
                    {Array.isArray(resumeData.bullet_points) && resumeData.bullet_points.map((bullet: string, i: number) => (
                      <li key={i}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <h3 className="text-xs font-black text-gray-950 uppercase tracking-widest border-b border-gray-100 pb-1">
                  Key Competencies
                </h3>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {Array.isArray(profile?.skills) && profile.skills.map((skill: string, i: number) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-gray-100 border border-gray-200 text-gray-800 text-[10px] rounded font-semibold uppercase tracking-wider"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Float Download */}
              <button 
                onClick={() => window.print()}
                className="absolute top-4 right-4 bg-gray-900 hover:bg-gray-800 text-white rounded-lg p-2 shadow flex items-center gap-1.5 text-xs font-semibold"
                title="Download / Print PDF"
              >
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
            </motion.div>
          )}
        </section>
      </div>
    </div>
  );
}
