"use client";

import React, { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import {
  Briefcase,
  Search,
  MapPin,
  Building,
  ExternalLink,
  Loader2,
  Calendar,
  DollarSign
} from "lucide-react";
import { motion } from "framer-motion";

export default function JobsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userProfile = await apiService.getProfile();
        setProfile(userProfile);
        
        // Use user's translated matches as default query if available
        if (userProfile?.army_role) {
          const roleQuery = "Operations Manager"; // Default fallback match
          setSearchQuery(roleQuery);
          handleSearch(roleQuery);
        } else {
          handleSearch("Project Manager");
        }
      } catch (e) {
        console.error(e);
        handleSearch("Project Manager");
      }
    };
    loadProfile();
  }, []);

  const handleSearch = async (queryToUse?: string) => {
    const finalQuery = queryToUse || searchQuery;
    if (!finalQuery.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    try {
      const results = await apiService.getJobs(finalQuery);
      setJobs(results || []);
    } catch (e) {
      console.error(e);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">
          Job <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Matches</span>
        </h1>
        <p className="text-gray-400 text-sm">
          Browse real-time job listings fetched dynamically from connected corporate APIs and job portals.
        </p>
      </header>

      {/* Search Bar */}
      <section className="bg-gray-950 border border-gray-900 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full bg-black border border-gray-800 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition text-gray-300"
            placeholder="Search for job titles e.g. Operations Manager, Logistics..."
          />
        </div>
        <button
          onClick={() => handleSearch()}
          className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 transition"
        >
          Search Listings
        </button>
      </section>

      {/* Jobs Grid */}
      <section className="space-y-4">
        {loading ? (
          <div className="bg-gray-950 border border-gray-900 rounded-2xl p-16 flex flex-col items-center justify-center gap-4 min-h-[300px]">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-gray-400 text-xs font-mono uppercase tracking-widest">Scraping Live Feeds...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-gray-950 border border-gray-900 rounded-2xl p-16 text-center text-gray-500 text-sm flex flex-col items-center justify-center gap-3 min-h-[300px]">
            <Briefcase className="w-8 h-8 text-gray-700" />
            {hasSearched
              ? `No open listings found for "${searchQuery}". Try a different job title.`
              : "Search for a role to load open listings."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.isArray(jobs) && jobs.map((job, idx) => {
              const title = job.title || job.job_title || "Role Specialist";
              const company = job.company || job.employer_name || "Enterprise Corp";
              const location = job.location || job.job_city || job.city || "Bangalore, India";
              const applyLink = job.apply_link || job.job_apply_link || "#";
              const salary = job.salary || "Competitive";
              const date = job.created_at ? new Date(job.created_at).toLocaleDateString() : "Just Now";

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-gray-950 border border-gray-900 hover:border-gray-800 rounded-2xl p-6 flex flex-col justify-between hover:shadow-xl transition"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-bold text-base text-white group-hover:text-blue-400 leading-snug">
                          {title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-1.5 font-medium">
                          <Building className="w-3.5 h-3.5" />
                          <span>{company}</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-blue-500/10 px-2.5 py-1 rounded-md text-blue-400 border border-blue-500/20 font-bold uppercase tracking-wider">
                        Matched
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs text-gray-400 pt-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-500" />
                        <span>{location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-gray-500" />
                        <span>{salary}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-900/60 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Posted: {date}</span>
                    </div>
                    <a
                      href={applyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition"
                    >
                      Apply Now <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
