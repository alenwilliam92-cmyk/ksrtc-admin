import React, { useState, useEffect } from "react";
import { Incident, AuditLogEntry } from "./types";
import { Sidebar } from "./components/Sidebar";
import { DashboardTab } from "./components/DashboardTab";
import { IncidentsTableTab } from "./components/IncidentsTableTab";
import { ServiceAdvisoriesTab } from "./components/ServiceAdvisoriesTab";
import { FleetTrackingTab } from "./components/FleetTrackingTab";
import { SettingsTab } from "./components/SettingsTab";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("alerts");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // SOS Modal Trigger state
  const [showSosModal, setShowSosModal] = useState<boolean>(false);
  const [sosDescription, setSosDescription] = useState<string>("");
  const [sosBusNumber, setSosBusNumber] = useState<string>("");

  // Clock state
  const [currentTime, setCurrentTime] = useState<string>("");

  // Synchronize dynamic lists
  const fetchIncidentsAndAudits = async () => {
    try {
      const resIncidents = await fetch("/api/incidents");
      const incidentsList = await resIncidents.json();
      setIncidents(incidentsList);

      const resAudits = await fetch("/api/activity");
      const auditsList = await resAudits.json();
      setAuditLogs(auditsList);
    } catch (e) {
      console.error("Failed loading backend feeds:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidentsAndAudits();

    // ticking clock
    const clockTimer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    }, 1000);

    return () => clearInterval(clockTimer);
  }, []);

  // Dispatch Action handler
  const handleTriggerAction = async (
    incidentId: string,
    action: "DISPATCH_BACKUP" | "NOTIFY_PASSENGERS" | "NOTIFY_EMERGENCY"
  ) => {
    try {
      const res = await fetch(`/api/incidents/${incidentId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        await fetchIncidentsAndAudits();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Status transition handler
  const handleUpdateStatus = async (incidentId: string, status: "NEW" | "INVESTIGATING" | "RESOLVED") => {
    try {
      const res = await fetch(`/api/incidents/${incidentId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        await fetchIncidentsAndAudits();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Diagnostic DB restore handler
  const handleResetDB = async () => {
    try {
      setIncidents([]);
      await fetch("/api/activity", { method: "DELETE" });
      
      // Reload page and restore seeds from server.ts initial states
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  // Create High-Priority Emergency SOS from top header
  const handleHeaderSosSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sosBusNumber || !sosDescription) {
      alert("Provide bus number and brief emergency descriptor");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SAFETY",
          busNumber: sosBusNumber.toUpperCase(),
          location: "National Highway Emergency Desk",
          description: `⚠️ IMMEDIATE CRITICAL ALARM: ${sosDescription}`,
          route: "Emergency Corridor Schedule",
          driverName: "Emergency Priority Roster",
          occupancy: "Immediate Alert"
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowSosModal(false);
        setSosBusNumber("");
        setSosDescription("");
        
        await fetchIncidentsAndAudits();
        
        // Auto analyze using Gemini!
        if (data.incident?.id) {
          await fetch(`/api/incidents/${data.incident.id}/analyze`, { method: "POST" });
          await fetchIncidentsAndAudits();
        }
      }
    } catch (e) {
      console.error(e);
      alert("Failed triggering alert routing");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 relative font-sans antialiased text-slate-800">
      
      {/* Dynamic Loading block overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex flex-col items-center justify-center text-white font-sans text-sm font-semibold">
          <span className="material-symbols-outlined text-4xl animate-spin text-primary">sync</span>
          <span className="mt-3">Awaiting Kerala Transit Feeds...</span>
        </div>
      )}

      {/* Persistent Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeAlertsCount={incidents.filter(i => i.status !== "RESOLVED").length}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-screen min-w-0">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 shrink-0 px-6 flex items-center justify-between shadow-xs">
          
          {/* Logo Name & Search */}
          <div className="flex items-center gap-6">
            <h2 className="font-display font-medium text-[15px] tracking-widest text-[#af101a] uppercase leading-none hidden md:block">
              Transit Safety Hub
            </h2>
            <div className="relative w-80">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-sm">search</span>
              <input
                type="text"
                disabled
                placeholder="Search telemetry feed (Global parameters active)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Clock controls, emergency triggers, profile buttons */}
          <div className="flex items-center gap-4">
            
            {/* UTC Dispatch clock */}
            <div className="bg-slate-900 text-green-400 px-3 py-1 font-code text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 tracking-widest">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
              <span>{currentTime || "15:24:12"}</span>
            </div>

            {/* Quick action Emergency SOS Trigger */}
            <button
              id="emergency-sos-top-btn"
              onClick={() => setShowSosModal(true)}
              className="px-5 py-2 bg-primary hover:bg-rose-700 text-white text-xs tracking-wider uppercase font-extrabold rounded-xl transition-all shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px] animate-bounce">warning_amber</span>
              Emergency SOS
            </button>

            {/* Simulated notification badge */}
            <button
              onClick={() => alert("Notification center: Under prototype session, incidents are logged in the Chronology activity board.")}
              className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors relative"
            >
              <span className="material-symbols-outlined text-[20px] leading-none">notifications</span>
              {incidents.filter(i => i.status === 'NEW').length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
              )}
            </button>

          </div>

        </header>

        {/* Outer scrolling contents viewport */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          
          {/* Router switcher */}
          {activeTab === "alerts" && (
            <DashboardTab
              incidents={incidents}
              setIncidents={setIncidents}
              refreshData={fetchIncidentsAndAudits}
              onTriggerAction={handleTriggerAction}
              onUpdateStatus={handleUpdateStatus}
            />
          )}

          {activeTab === "incidents" && (
            <IncidentsTableTab
              incidents={incidents}
              auditLogs={auditLogs}
              onUpdateStatus={handleUpdateStatus}
              onTriggerAction={handleTriggerAction}
              onClearActivity={async () => {
                await fetch("/api/activity", { method: "DELETE" });
                await fetchIncidentsAndAudits();
              }}
            />
          )}

          {activeTab === "service" && (
            <ServiceAdvisoriesTab />
          )}

          {activeTab === "fleet" && (
            <FleetTrackingTab />
          )}

          {activeTab === "settings" && (
            <SettingsTab onResetDB={handleResetDB} />
          )}

        </main>

      </div>

      {/* SOS Modal window */}
      {showSosModal && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-w-md w-full relative animate-fade-in">
            <div className="flex items-center gap-2 text-primary font-display font-black text-lg mb-2">
              <span className="material-symbols-outlined text-2xl animate-ping text-primary">warning</span>
              <h2>Central SOS Broadcast Form</h2>
            </div>
            
            <p className="text-xs text-slate-400 mb-4 leading-normal">
              Logging high-priority emergency alerts immediately notifies local transit depot stations and mobilizes county highway patrols, with automatic Gemini hazard-class categorization.
            </p>

            <form onSubmit={handleHeaderSosSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1 uppercase">Bus Fleet Number</label>
                <input
                  type="text"
                  placeholder="e.g. KL-15-SW-001"
                  value={sosBusNumber}
                  onChange={(e) => setSosBusNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-primary focus:bg-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1 uppercase">SITUATION STATEMENT</label>
                <textarea
                  placeholder="Briefly state patient or vehicle safety conditions..."
                  rows={3}
                  value={sosDescription}
                  onChange={(e) => setSosDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:bg-white outline-none resize-none"
                  required
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setShowSosModal(false)}
                  className="flex-1 py-2 px-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-[#af101a] hover:bg-rose-700 text-white rounded-xl uppercase tracking-wider shadow-md hover:shadow-lg"
                >
                  Deploy Emergency SOS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
