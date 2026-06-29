import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';

type RoadmapData = {
  target_role: string;
  current_skills: string[];
  missing_skills: string[];
  learning_path: { step: string; duration: string }[];
  estimated_timeline: string;
};

export default function RoadmapCard({ data }: { data: RoadmapData }) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState<boolean>(true);

  useEffect(() => {
    if (data?.target_role) {
      apiService.getJobs(data.target_role).then(setJobs).catch(console.error).finally(() => setLoadingJobs(false));
    }
  }, [data]);
  if (!data) return null;

  return (
    <div className="mt-6 bg-gradient-to-br from-indigo-950 to-gray-900 border border-indigo-500/30 p-6 rounded-2xl shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
      
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-400/30 shadow-lg shadow-indigo-500/10">
          <span className="text-2xl">🗺️</span>
        </div>
        <div>
          <h3 className="font-extrabold text-white text-xl">{data.target_role} Action Plan</h3>
          <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mt-1">{data.estimated_timeline} Est. Timeline</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-black/40 p-5 rounded-xl border border-gray-800 shadow-inner">
          <h4 className="text-xs uppercase tracking-widest text-green-500 mb-3 font-bold flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-green-500"></span> Current Skills
          </h4>
          <div className="flex flex-wrap gap-2">
            {Array.isArray(data.current_skills) && data.current_skills.map((skill, idx) => (
              <span key={idx} className="text-xs px-2.5 py-1.5 bg-green-500/10 text-green-300 rounded-md border border-green-500/20 font-medium">{skill}</span>
            ))}
          </div>
        </div>
        <div className="bg-black/40 p-5 rounded-xl border border-gray-800 shadow-inner">
          <h4 className="text-xs uppercase tracking-widest text-red-500 mb-3 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span> Missing Skills
          </h4>
          <div className="flex flex-wrap gap-2">
            {Array.isArray(data.missing_skills) && data.missing_skills.map((skill, idx) => (
              <span key={idx} className="text-xs px-2.5 py-1.5 bg-red-500/10 text-red-400 rounded-md border border-red-500/20 font-medium">{skill}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-black/40 p-6 rounded-xl border border-gray-800 relative z-10">
        <h4 className="text-sm font-bold text-gray-200 mb-5 tracking-wider flex items-center gap-2 uppercase">
           <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
           Learning Path Schedule
        </h4>
        <div className="space-y-4">
          {Array.isArray(data.learning_path) && data.learning_path.map((step, idx) => (
            <div key={idx} className="flex gap-4 items-start group">
              <div className="mt-1 flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-400/50 flex items-center justify-center relative z-10 group-hover:scale-110 group-hover:bg-indigo-500/40 transition-all shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                </div>
                {idx !== data.learning_path.length - 1 && <div className="w-px h-full bg-gradient-to-b from-indigo-500/50 to-transparent absolute top-8 bottom-0"></div>}
              </div>
              <div className="flex-1 bg-gray-900/60 p-4 rounded-xl border border-gray-800/80 group-hover:border-indigo-500/40 transition-colors shadow-sm">
                <p className="text-sm text-gray-200 font-medium leading-relaxed">{step.step}</p>
                <p className="text-xs text-indigo-400 mt-2 font-bold uppercase tracking-wider">{step.duration}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 bg-black/40 p-6 rounded-xl border border-gray-800">
        <h4 className="text-sm font-bold text-gray-200 mb-5 tracking-wider flex items-center gap-2 uppercase">
           <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
           Live Civilian Roles
        </h4>
        <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
          {loadingJobs ? (
            <div className="flex justify-center p-4">
               <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : jobs.length > 0 ? (
            Array.isArray(jobs) && jobs.map((job, idx) => (
              <div key={idx} className="bg-gray-900/80 p-4 rounded-lg border border-gray-700 hover:border-blue-500/50 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h5 className="font-bold text-indigo-300">{job.title}</h5>
                  <p className="text-xs text-gray-400 mt-1">{job.company} • {job.location}</p>
                </div>
                <a href={job.link} target="_blank" rel="noreferrer" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-md transition-colors w-full md:w-auto text-center shrink-0">
                  Apply Now
                </a>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 italic">No exact matches currently broadcasting on external hubs.</p>
          )}
        </div>
      </div>
    </div>
  );
}
