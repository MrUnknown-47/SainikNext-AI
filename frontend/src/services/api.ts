import { authService } from "./auth";

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api`
    : "http://localhost:8000/api";
};

const BASE_URL = getBaseUrl();

const getHeaders = () => {
  const token = authService.getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
};

export const apiService = {
  async getProfile() {
    const res = await fetch(`${BASE_URL}/profile`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Unauthorized");
    return res.json();
  },

  async getHealth() {
    try {
      const res = await fetch(`${BASE_URL.replace("/api", "")}/health`);
      if (!res.ok) throw new Error("Health check failed");
      return res.json();
    } catch (e) {
      return { status: "offline", database: "disconnected", gemini: "disconnected" };
    }
  },

  async matchJobs(army_role: string, skills: string[]) {
    try {
      const res = await fetch(`${BASE_URL}/match-jobs`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ army_role, skills }),
      });
      if (!res.ok) {
        return [];
      }
      const data = await res.json();
      return Array.isArray(data.matches)
        ? data.matches
        : [];
    } catch (e) {
      console.error("apiService.matchJobs error:", e);
      return [];
    }
  },

  async careerCoach(message: string) {
    const res = await fetch(`${BASE_URL}/career-coach`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ message }),
    });
    return res;
  },

  async generateResume(military_experience: string) {
    const res = await fetch(`${BASE_URL}/generate-resume`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ military_experience }),
    });
    return res.json();
  },

  async skillGap(user_skills: string[], target_job: string) {
    const res = await fetch(`${BASE_URL}/skill-gap`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ user_skills, target_job }),
    });
    return res.json();
  },

  async generateRoadmap(target_job: string, skill_gap: any) {
    const res = await fetch(`${BASE_URL}/roadmap`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ target_job, skill_gap }),
    });
    return res.json();
  },

  async getJobs(role: string) {
    const res = await fetch(`${BASE_URL}/jobs?role=${encodeURIComponent(role)}`, { headers: getHeaders() });
    return res.json();
  },

  async matchResume(resume_text: string, job_description: string) {
    const res = await fetch(`${BASE_URL}/resume-match`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ resume_text, job_description }),
    });
    return res.json();
  },
};