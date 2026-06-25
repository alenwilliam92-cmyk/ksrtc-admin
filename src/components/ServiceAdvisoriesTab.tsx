import React, { useState, useEffect } from "react";
import { ServiceAdvisory } from "../types";

export function ServiceAdvisoriesTab() {
  const [advisories, setAdvisories] = useState<ServiceAdvisory[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [impactLevel, setImpactLevel] = useState<"HIGH" | "MEDIUM" | "LOW">("LOW");
  const [affectedRoute, setAffectedRoute] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load advisories
  const fetchAdvisories = async () => {
    try {
      const res = await fetch("/api/advisories");
      const list = await res.json();
      setAdvisories(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAdvisories();
  }, []);

  const handleCreateAdvisory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      alert("Title and content are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/advisories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          impactLevel,
          affectedRoutes: [affectedRoute || "All Routes"]
        })
      });

      const data = await res.json();
      if (data.success) {
        setTitle("");
        setContent("");
        setAffectedRoute("");
        setImpactLevel("LOW");
        await fetchAdvisories();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      
      {/* Advisories Feed */}
      <div className="col-span-12 lg:col-span-7 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-slate-800 text-[16px]">Active KSRTC Passenger Service Advisories</h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">Scheduled detours, delays, and state emergency alerts</p>
          </div>
          <button
            onClick={fetchAdvisories}
            className="p-1 px-3 border border-slate-200 bg-white hover:bg-slate-50 transition-all rounded-lg text-xs font-bold text-slate-600 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm leading-none">refresh</span>
            Reload
          </button>
        </div>

        <div className="space-y-4">
          {advisories.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs italic">
              No active warnings logged in the passenger advisory network.
            </div>
          ) : (
            advisories.map((adv) => (
              <div
                key={adv.id}
                className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs relative overflow-hidden"
              >
                {/* Side priority stripe */}
                <span className={`absolute top-0 left-0 w-2 h-full ${
                  adv.impactLevel === 'HIGH' 
                    ? 'bg-rose-600' 
                    : adv.impactLevel === 'MEDIUM' 
                    ? 'bg-amber-500' 
                    : 'bg-green-550'
                }`} />

                <div className="flex justify-between items-start mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[9px] font-black rounded tracking-wider ${
                      adv.impactLevel === 'HIGH'
                        ? 'bg-rose-100 text-rose-850'
                        : adv.impactLevel === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-850'
                        : 'bg-green-100 text-green-850'
                    }`}>
                      {adv.impactLevel} IMPACT
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">{adv.publishedAt}</span>
                  </div>
                  <span className="font-mono text-slate-400 font-bold text-[10px] uppercase">{adv.id}</span>
                </div>

                <h3 className="font-display font-extrabold text-sm text-slate-800">{adv.title}</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed mt-2 bg-slate-50 border border-slate-100/50 p-3 rounded-xl">{adv.content}</p>

                <div className="flex items-center gap-1.5 mt-3.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Affected schedules:</span>
                  <div className="flex gap-1">
                    {adv.affectedRoutes.map((route, idx) => (
                      <span key={idx} className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-slate-600">
                        {route}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Broadcast form */}
      <div className="col-span-12 lg:col-span-5">
        <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-display font-extrabold text-slate-800 text-[16px] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">campaign</span>
              Broadcast New Warning update
            </h3>

            <form onSubmit={handleCreateAdvisory} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1 uppercase tracking-wider">Advisory Title</label>
                <input
                  type="text"
                  placeholder="e.g. Wayanad fog road warning / Thrissur delay bypass"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-primary focus:bg-white transition-all outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 mb-1 uppercase tracking-wider">Impact category</label>
                  <select
                    value={impactLevel}
                    onChange={(e) => setImpactLevel(e.target.value as "HIGH" | "MEDIUM" | "LOW")}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-medium focus:ring-1 focus:ring-primary focus:bg-white transition-all outline-none"
                  >
                    <option value="LOW">Low priority</option>
                    <option value="MEDIUM">Medium priority</option>
                    <option value="HIGH">High hazard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 mb-1 uppercase tracking-wider">Affected Route</label>
                  <input
                    type="text"
                    placeholder="e.g. Kozhikode route"
                    value={affectedRoute}
                    onChange={(e) => setAffectedRoute(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1 uppercase tracking-wider">Detailed Broadcast content</label>
                <textarea
                  placeholder="Insert instructions for passenger app notifications and ticketing alerts..."
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:bg-white transition-all outline-none resize-none"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-primary hover:bg-rose-700 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm font-bold">send_and_archive</span>
                {isSubmitting ? "Broadcasting..." : "Broadcast Service warning"}
              </button>
            </form>
          </div>
        </section>
      </div>

    </div>
  );
}
