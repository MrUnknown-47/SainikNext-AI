"use client";

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatBox from '@/components/ChatBox';
import RoadmapCard from '@/components/RoadmapCard';
import { apiService } from '@/services/api';

type ChatMessage = {
  role: 'user' | 'ai';
  content: string;
  data?: any;
  roadmapData?: any;
  roadmapLoading?: boolean;
  jobsData?: any[];
  jobsLoading?: boolean;
};

export default function CareerCoachPage() {
  const [history, setHistory] = useState<ChatMessage[]>([{
    role: 'ai',
    content: "Welcome! I'm your AI Career Coach. Tell me about your military experience."
  }]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (message: string) => {
    setHistory(prev => [...prev, { role: 'user', content: message }]);
    setLoading(true);

    try {
      const response = await apiService.careerCoach(message);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let isFirstChunk = true;
      let metadata: any = null;
      let accumulatedContent = "";

      // Add a placeholder message for the AI response
      setHistory(prev => [...prev, { role: 'ai', content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (isFirstChunk) {
              try {
                metadata = JSON.parse(dataStr);
                isFirstChunk = false;
                setHistory(prev => {
                  const next = [...prev];
                  const lastMsg = next[next.length - 1];
                  if (lastMsg && lastMsg.role === "ai") {
                    lastMsg.data = metadata;
                  }
                  return next;
                });
              } catch (e) {
                // If it fails to parse as JSON, treat it as text content
                accumulatedContent += dataStr;
                isFirstChunk = false;
                setHistory(prev => {
                  const next = [...prev];
                  const lastMsg = next[next.length - 1];
                  if (lastMsg && lastMsg.role === "ai") {
                    lastMsg.content = accumulatedContent;
                  }
                  return next;
                });
              }
            } else {
              accumulatedContent += dataStr;
              setHistory(prev => {
                const next = [...prev];
                const lastMsg = next[next.length - 1];
                if (lastMsg && lastMsg.role === "ai") {
                  lastMsg.content = accumulatedContent;
                }
                return next;
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error reading stream:", error);
      setHistory(prev => [...prev, { role: 'ai', content: "Our backend systems failed to respond over local development endpoints." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRoadmap = async (msgIndex: number, targetJob: string, skillGap: any) => {
    // Set loading state on the specific message
    setHistory(prev => {
      const newHistory = [...prev];
      newHistory[msgIndex].roadmapLoading = true;
      return newHistory;
    });

    try {
      const roadmap = await apiService.generateRoadmap(targetJob, skillGap);
      setHistory(prev => {
        const newHistory = [...prev];
        newHistory[msgIndex].roadmapData = roadmap;
        newHistory[msgIndex].roadmapLoading = false;
        return newHistory;
      });
    } catch (e) {
      setHistory(prev => {
        const newHistory = [...prev];
        newHistory[msgIndex].roadmapLoading = false;
        return newHistory;
      });
    }
  };

  const handleLoadJobs = async (msgIndex: number, targetJob: string) => {
    setHistory(prev => {
      const newHistory = [...prev];
      const msg = newHistory[msgIndex];
      if (msg) {
        msg.jobsLoading = true;
      }
      return newHistory;
    });

    try {
      const jobs = await apiService.getJobs(targetJob);
      setHistory(prev => {
        const newHistory = [...prev];
        const msg = newHistory[msgIndex];
        if (msg) {
          msg.jobsData = jobs;
          msg.jobsLoading = false;
        }
        return newHistory;
      });
    } catch (e) {
      setHistory(prev => {
        const newHistory = [...prev];
        const msg = newHistory[msgIndex];
        if (msg) {
          msg.jobsLoading = false;
        }
        return newHistory;
      });
    }
  };

  const handleEvaluateResume = async (msgIndex: number, jobIndex: number, resumeText: string, jobDesc: string) => {
    // Basic fallback parsing inference if empty strictly over string
    if (!resumeText) resumeText = "Experienced professional seeking opportunities.";

    setHistory(prev => {
      const newHistory = [...prev];
      const job = newHistory[msgIndex]?.jobsData?.[jobIndex];
      if (job && !job.evaluationLoading) {
        job.evaluationLoading = true;
      }
      return newHistory;
    });

    try {
      const result = await apiService.matchResume(resumeText, jobDesc);
      setHistory(prev => {
        const newHistory = [...prev];
        const job = newHistory[msgIndex]?.jobsData?.[jobIndex];
        if (job) {
          job.evaluationData = result;
          job.evaluationLoading = false;
        }
        return newHistory;
      });
    } catch (e) {
      setHistory(prev => {
        const newHistory = [...prev];
        const job = newHistory[msgIndex]?.jobsData?.[jobIndex];
        if (job) {
          job.evaluationLoading = false;
        }
        return newHistory;
      });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* <Sidebar /> */}
      <main className="ml-64 flex-1 flex flex-col h-screen overflow-hidden">

        {/* Header */}
        <div className="p-8 border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl z-10 shadow-lg">
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500 inline-block">AI Career Coach</h1>
          <p className="text-gray-400 mt-2 text-sm">Interactive guidance converting service history into corporate placement.</p>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth pb-32">
          {Array.isArray(history) && history.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-6 shadow-2xl ${msg.role === 'user' ? 'bg-gradient-to-br from-blue-700 to-indigo-800 text-white rounded-br-none border border-blue-500/30' : 'bg-gray-900 border border-gray-800 rounded-bl-none'}`}>
                <p className="text-sm md:text-base leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>

                {/* Dynamically render structured payload if present */}
                {msg.data && msg.data.career_matches?.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-800">
                    <h4 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600 uppercase tracking-widest text-xs mb-4">Top AI Matches</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.isArray(msg.data.career_matches) && msg.data.career_matches.map((job: any, i: number) => (
                        <div key={i} className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex flex-col justify-between items-start gap-4 hover:border-gray-700 transition">
                          <span className="font-bold text-gray-200 text-sm">{job.title}</span>
                          <span className="text-xs bg-green-500/10 px-3 py-1.5 rounded-md text-green-400 font-medium border border-green-500/20 w-fit">{(job.score * 100).toFixed(0)}% Semantic Match</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {msg.data && msg.data.skill_gap && msg.data.skill_gap.missing_skills?.length > 0 && (
                  <div className="mt-6 bg-red-950/20 border border-red-900/50 p-5 rounded-xl">
                    <h4 className="font-bold text-red-500 text-xs uppercase tracking-widest mb-4">Skill Gaps Evaluated</h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(msg.data.skill_gap.missing_skills) && msg.data.skill_gap.missing_skills.map((skill: string, i: number) => (
                        <span key={i} className="px-2.5 py-1.5 bg-red-500/10 text-red-400 text-xs rounded-md border border-red-500/20 font-medium capitalize">{skill}</span>
                      ))}
                    </div>

                    {!msg.roadmapData && (
                      <div className="mt-4 bg-blue-950/20 border border-blue-800 p-4 rounded-xl">
                        <p className="text-sm text-blue-300 font-medium mb-3">
                          <span className="font-bold">AI Recommendation:</span> You're close to this role. Generate a step-by-step roadmap?
                        </p>
                        <button
                          onClick={() => handleGenerateRoadmap(idx, msg.data.skill_gap.target_job, msg.data.skill_gap)}
                          disabled={msg.roadmapLoading}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 px-5 rounded-lg shadow-md transition-all flex items-center gap-2 w-fit disabled:opacity-50"
                        >
                          {msg.roadmapLoading ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Generating Map...
                            </>
                          ) : (
                            <>
                              🗺️ Generate Roadmap
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {msg.roadmapData && (
                  <div className="flex flex-col">
                    <RoadmapCard data={msg.roadmapData} />

                    {!msg.jobsData && (
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => handleLoadJobs(idx, msg.roadmapData.target_role)}
                          disabled={msg.jobsLoading}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-5 rounded-lg shadow-md transition-all flex items-center gap-2 w-fit disabled:opacity-50"
                        >
                          {msg.jobsLoading ? "Loading Jobs..." : "💼 View Jobs"}
                        </button>
                      </div>
                    )}

                    {msg.jobsData && msg.jobsData.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-gray-800">
                        <h4 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600 uppercase tracking-widest text-xs mb-4 flex items-center gap-2">💼 Open Positions</h4>
                        <div className="space-y-3">
                          {Array.isArray(msg.jobsData) && msg.jobsData.map((job: any, j: number) => (
                            <div key={j} className="bg-gray-900 border border-emerald-500/20 p-4 rounded-xl flex flex-col justify-between items-start hover:border-emerald-500/50 transition-all shadow-lg shadow-emerald-500/5 gap-3">
                              <div className="flex justify-between items-center w-full">
                                <div>
                                  <h5 className="font-bold text-gray-200 text-sm flex items-center gap-2">
                                    {job.title}
                                    {job.score && <span className="text-xs bg-emerald-500/10 px-2 py-0.5 rounded text-emerald-400 border border-emerald-500/20 font-bold ml-2">{(job.score * 100).toFixed(0)}% Match</span>}
                                  </h5>
                                  <p className="text-gray-400 text-xs mt-2 font-medium tracking-wide">{job.company} • {job.location}</p>
                                </div>
                                <button
                                  onClick={() => handleEvaluateResume(idx, j, msg.data?.translation?.civilian_summary || msg.content || "Expert seeking transition", `${job.title} at ${job.company}`)}
                                  className="text-xs px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-500/20 transition-colors font-bold disabled:opacity-50"
                                  disabled={job.evaluationLoading}
                                >
                                  {job.evaluationLoading ? "Evaluating..." : "Evaluate Fit"}
                                </button>
                              </div>

                              {job.evaluationData && (
                                <div className="w-full bg-black/40 border border-gray-800 rounded-lg p-3 mt-1">
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-gray-400">Match Score: <span className="text-gray-200">{job.evaluationData.match_score}%</span></span>
                                    <div className="flex items-center">
                                      {job.evaluationData.match_score >= 80 ? (
                                        <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-1 rounded border border-green-500/20 font-bold tracking-wide">🟢 Strong Fit</span>
                                      ) : job.evaluationData.match_score >= 60 ? (
                                        <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded border border-yellow-500/20 font-bold tracking-wide">🟡 Moderate Fit</span>
                                      ) : (
                                        <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-1 rounded border border-red-500/20 font-bold tracking-wide">🔴 Needs Improvement</span>
                                      )}
                                    </div>
                                  </div>
                                  {job.evaluationData.missing_keywords && job.evaluationData.missing_keywords.length > 0 && (
                                    <div className="mt-2 bg-gray-950/50 p-2.5 rounded-lg border border-gray-800/50">
                                      <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-1.5 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>Improve:</span>
                                      <ul className="flex flex-col gap-1 pl-1">
                                        {Array.isArray(job.evaluationData.missing_keywords) && job.evaluationData.missing_keywords.map((kw: string, k_idx: number) => (
                                          <li key={k_idx} className="text-[11px] text-gray-300 font-medium flex items-center gap-2">
                                            <span className="text-gray-600 font-bold">•</span> <span className="capitalize">{kw}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {msg.jobsData && msg.jobsData.length === 0 && (
                      <p className="text-sm text-gray-400 mt-4 italic">No matching jobs found locally.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl rounded-bl-none shadow-2xl flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-8 pb-10 bg-gradient-to-t from-black via-black to-transparent absolute bottom-0 left-64 right-0">
          <ChatBox onSend={handleSend} loading={loading} />
        </div>

      </main>
    </div>
  );
}
