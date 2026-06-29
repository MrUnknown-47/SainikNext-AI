"use client";

import React, { useState } from "react";
import {
  Settings,
  Sliders,
  Cpu,
  Database,
  RefreshCw,
  CheckCircle2,
  Lock
} from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const [apiUrl, setApiUrl] = useState("http://localhost:8000/api");
  const [scrapingInterval, setScrapingInterval] = useState("10");
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">
          System <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Settings</span>
        </h1>
        <p className="text-gray-400 text-sm">
          Manage system configurations, external service endpoints, and AI models.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Navigation / Sections info */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-gray-950 border border-gray-900 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Configuration</h3>
            <button className="w-full text-left px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-sm font-semibold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" /> System Settings
            </button>
          </div>
        </div>

        {/* Form Settings panels */}
        <div className="md:col-span-2 space-y-6">
          <section className="bg-gray-950 border border-gray-900 rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" /> Endpoint Settings
            </h3>

            {/* API Endpoints */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Backend API Base URL
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    className="flex-1 bg-black border border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition text-gray-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  APScheduler Sync Interval (Minutes)
                </label>
                <input
                  type="number"
                  value={scrapingInterval}
                  onChange={(e) => setScrapingInterval(e.target.value)}
                  className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition text-gray-300 font-mono"
                />
              </div>
            </div>
          </section>

          {/* AI Settings */}
          <section className="bg-gray-950 border border-gray-900 rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" /> AI & Models Configuration
            </h3>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-xs p-3.5 rounded-xl bg-gray-900/40 border border-gray-900">
                <div>
                  <p className="font-bold text-gray-300">Google Gemini LLM</p>
                  <p className="text-gray-500 mt-0.5">Primary translation model</p>
                </div>
                <span className="text-[10px] bg-green-500/10 border border-green-500/20 px-3 py-1 rounded text-green-400 font-bold uppercase">
                  gemini-2.5-flash
                </span>
              </div>

              <div className="flex items-center justify-between text-xs p-3.5 rounded-xl bg-gray-900/40 border border-gray-900">
                <div>
                  <p className="font-bold text-gray-300">Local Vector Embedder</p>
                  <p className="text-gray-500 mt-0.5">SentenceTransformer model</p>
                </div>
                <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded text-blue-400 font-bold uppercase">
                  all-MiniLM-L6-v2
                </span>
              </div>
            </div>
          </section>

          {/* Action */}
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold">
              <Lock className="w-4 h-4" /> <span>Enterprise encrypted policies</span>
            </div>
            
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/10 flex items-center gap-2 transition"
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-400" /> Saved!
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" /> Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
