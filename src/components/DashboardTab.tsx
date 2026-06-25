import React, { useState } from "react";
import { Incident, IncidentType } from "../types";

interface DashboardTabProps {
  incidents: Incident[];
  setIncidents: React.Dispatch<React.SetStateAction<Incident[]>>;
  refreshData: () => Promise<void>;
  onTriggerAction: (incidentId: string, action: "DISPATCH_BACKUP" | "NOTIFY_PASSENGERS" | "NOTIFY_EMERGENCY") => Promise<void>;
  onUpdateStatus: (incidentId: string, status: "NEW" | "INVESTIGATING" | "RESOLVED") => Promise<void>;
}

export function DashboardTab({
  incidents,
  setIncidents,
  refreshData,
  onTriggerAction,
  onUpdateStatus
}: DashboardTabProps) {
  // Focus incident state
  const activeIncidents = incidents.filter(i => i.status !== "RESOLVED");
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(
    activeIncidents.length > 0 ? activeIncidents[0].id : incidents[0]?.id || ""
  );

  // Form states
  const [formData, setFormData] = useState({
    type: "TECHNICAL" as IncidentType,
    busNumber: "",
    route: "",
    location: "",
    description: "",
    driverName: "",
    occupancy: "38 / 44"
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  
  // Quick Search filters
  const [searchText, setSearchText] = useState("");

  const focusedIncident = incidents.find(i => i.id === selectedIncidentId) || incidents[0];

  // Service Summary Stats
  const normalSchedules = 124;
  const delayedSchedules = incidents.filter(i => i.type === "DELAY" && i.status !== "RESOLVED").length || 3;
  const suspendedSchedules = incidents.filter(i => i.status === "NEW" && i.severity === "CRITICAL").length || 1;

  // Handle reporting form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.busNumber || !formData.location || !formData.description) {
      alert("Please complete all required fields (Bus Number, Location, and Description).");
      return;
    }

    setFormSubmitting(true);
    try {
      const response = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formData.type,
          busNumber: formData.busNumber.toUpperCase(),
          location: formData.location,
          description: formData.description,
          route: formData.route || "Local Schedule Bypass",
          driverName: formData.driverName || "M. G. Krishnan",
          occupancy: formData.occupancy
        })
      });

      const result = await response.json();
      if (result.success) {
        setFormSuccess(true);
        setFormData({
          type: "TECHNICAL",
          busNumber: "",
          route: "",
          location: "",
          description: "",
          driverName: "",
          occupancy: "38 / 44"
        });
        
        await refreshData();
        
        // Auto-select the newly created incident
        if (result.incident?.id) {
          setSelectedIncidentId(result.incident.id);
          
          // Trigger server-side Gemini analysis for immediate classification!
          fetch(`/api/incidents/${result.incident.id}/analyze`, { method: "POST" })
            .then(res => res.json())
            .then(() => refreshData());
        }

        setTimeout(() => setFormSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit request.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Get incident style parameters
  const getSeverityBadge = (sec: string) => {
    switch (sec) {
      case "CRITICAL":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "MODERATE":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "LOW":
        default:
        return "bg-green-100 text-green-850 border-green-200";
    }
  };

  const getStatusBorder = (status: string) => {
    switch (status) {
      case "NEW":
        return "border-rose-600 bg-rose-50/25";
      case "INVESTIGATING":
        return "border-amber-500 bg-amber-50/25";
      case "RESOLVED":
        return "border-green-500 bg-green-50/25";
      default:
        return "border-slate-300";
    }
  };

  const getSeverityAlertColor = (sec: string) => {
    switch (sec) {
      case "CRITICAL":
        return "rose";
      case "MODERATE":
        return "amber";
      case "LOW":
      default:
        return "green";
    }
  };

  // Filter alerts by description/bus text
  const filteredAlerts = incidents.filter(i => {
    const textToSearch = `${i.busNumber} ${i.description} ${i.location} ${i.route} ${i.type}`.toLowerCase();
    return textToSearch.includes(searchText.toLowerCase());
  });

  return (
    <div className="grid grid-cols-12 gap-6">
      
      {/* Left Column: Live Alerts & Status */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
        
        {/* Service Impact Dashboard */}
        <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="font-display font-semibold text-[16px] text-slate-800 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">dashboard</span>
            Service Impact Dashboard
          </h2>
          
          <div className="grid grid-cols-1 gap-2.5">
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-6 bg-swift rounded-full"></div>
                <span className="font-semibold text-xs text-slate-700 tracking-wide font-mono">KSRTC SWIFT</span>
              </div>
              <span className="px-2.5 py-0.5 bg-green-100 border border-green-200 text-green-700 text-[10px] font-bold rounded-full">
                NORMAL
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-6 bg-primary rounded-full"></div>
                <span className="font-semibold text-xs text-slate-700 tracking-wide font-mono">SUPER FAST</span>
              </div>
              <span className="px-2.5 py-0.5 bg-amber-100 border border-amber-200 text-amber-700 text-[10px] font-bold rounded-full">
                {delayedSchedules} DELAYED
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-6 bg-secondary rounded-full"></div>
                <span className="font-semibold text-xs text-slate-700 tracking-wide font-mono">FAST PASSENGER</span>
              </div>
              <span className="px-2.5 py-0.5 bg-rose-100 border border-rose-200 text-rose-700 text-[10px] font-bold rounded-full">
                {suspendedSchedules} SUSPENDED
              </span>
            </div>
          </div>
        </section>

        {/* Live Alert Feed */}
        <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden min-h-[400px]">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h2 className="font-display font-semibold text-[16px] text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">notification_important</span>
              Active Incident Feed
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-rose-600 rounded-full animate-bounce"></span>
              <span className="text-[11px] font-bold text-rose-600">
                {activeIncidents.length} Active
              </span>
            </div>
          </div>

          {/* Search bar specifically for feed filtering */}
          <div className="relative mb-3 shrink-0">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm text-slate-400">filter_alt</span>
            <input
              type="text"
              placeholder="Search feed..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:bg-white transition-all outline-none"
            />
            {searchText && (
              <button onClick={() => setSearchText("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600">
                Clear
              </button>
            )}
          </div>

          <div className="space-y-3 overflow-y-auto flex-1 pr-1 max-h-[450px]">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-10">
                <span className="material-symbols-outlined text-slate-300 text-3xl">inbox</span>
                <p className="text-xs text-slate-400 mt-2 font-medium">No matching active reports found</p>
              </div>
            ) : (
              filteredAlerts.map((incident) => {
                const isFocused = incident.id === selectedIncidentId;
                const typeColor = getSeverityAlertColor(incident.severity);
                return (
                  <div
                    key={incident.id}
                    onClick={() => setSelectedIncidentId(incident.id)}
                    className={`p-3.5 border-l-[5px] rounded-r-xl transition-all duration-200 cursor-pointer ${getStatusBorder(incident.status)} ${
                      isFocused
                        ? "bg-slate-50 ring-1 ring-slate-100 shadow-sm"
                        : "bg-white hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="flex justify-between text-[11px] font-extrabold uppercase mb-1">
                      <span className={`text-${typeColor}-700 tracking-wider font-display`}>
                        {incident.type} ({incident.id})
                      </span>
                      <span className="text-slate-400 font-medium">{incident.timestamp}</span>
                    </div>
                    <p className="text-[13px] font-bold text-slate-800 leading-snug line-clamp-2">
                      {incident.busNumber}: {incident.description}
                    </p>
                    <div className="flex justify-between items-center mt-2 border-t border-slate-100/50 pt-2 shrink-0">
                      <span className="text-[10px] text-slate-500 font-semibold font-mono">
                        Route: {incident.route}
                      </span>
                      <span className={`px-2 py-0.5 text-[9px] font-black tracking-widest rounded uppercase ${
                        incident.status === 'NEW' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {incident.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

      </div>

      {/* Middle Column: Focused SOS Alert Inspection */}
      <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
        
        {/* Focused Incident Card */}
        {focusedIncident ? (
          <section className="bg-white rounded-2xl shadow-lg border-2 border-primary/10 overflow-hidden flex flex-col">
            {/* Header banner alert */}
            <div className={`p-4 text-white flex justify-between items-center transition-colors ${
              focusedIncident.severity === 'CRITICAL' ? 'bg-primary' : 'bg-amber-600'
            }`}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-3xl animate-pulse">
                  {focusedIncident.severity === 'CRITICAL' ? 'gpp_maybe' : 'report'}
                </span>
                <div>
                  <h3 className="font-display font-black text-xl leading-none">{focusedIncident.busNumber}</h3>
                  <p className="text-[10px] tracking-wider uppercase font-semibold mt-1 opacity-90">
                    Status: {focusedIncident.status} • {focusedIncident.severity} PRIORITY
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold font-mono">{focusedIncident.responseTime || "10m"}</div>
                <div className="text-[9px] tracking-wider font-bold opacity-80">MAPPED RESPONSE</div>
              </div>
            </div>

            {/* Map Canvas Frame */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="h-44 bg-slate-200 rounded-xl relative overflow-hidden border border-slate-200/80 shadow-inner flex items-center justify-center">
                {/* SVG Mock Map of Kerala Route Point */}
                <svg className="absolute inset-0 w-full h-full text-slate-300" viewBox="0 0 400 200" preserveAspectRatio="none">
                  {/* Decorative map lines */}
                  <path d="M 0 54 Q 100 40, 180 80 T 400 45" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
                  <path d="M 0 54 Q 100 40, 180 80 T 400 45" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
                  
                  <path d="M 120 0 C 130 90, 240 120, 270 200" fill="none" stroke="#ffffff" strokeWidth="8" strokeOpacity="0.8" />
                  <path d="M 120 0 C 130 90, 240 120, 270 200" fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 3" />
                  
                  {/* Local river body representation */}
                  <path d="M -20 180 Q 80 140, 200 170 T 420 120" fill="none" stroke="#93c5fd" strokeWidth="18" strokeOpacity="0.4" />
                  
                  {/* Landmark nodes */}
                  <circle cx="150" cy="65" r="3" fill="#64748b" />
                  <text x="156" y="68" className="fill-slate-400 font-mono font-bold text-[9px]">DEPO JUNCTION</text>

                  <circle cx="280" cy="110" r="3" fill="#64748b" />
                  <text x="286" y="113" className="fill-slate-400 font-mono font-bold text-[9px]">Star Hosp HQ</text>
                </svg>

                {/* Live Position Radar Pulsing Dot */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/20 pulse-red flex items-center justify-center border-2 border-primary bg-white shadow-md">
                    <span className="material-symbols-outlined text-[16px] text-primary">directions_bus</span>
                  </div>
                  <div className="bg-slate-900/95 backdrop-blur-xs text-[9px] font-mono text-green-400 font-bold px-2 py-0.5 rounded-md mt-2 shadow-md uppercase tracking-wider">
                    {focusedIncident.location}
                  </div>
                </div>

                {/* Telemetries bottom banner */}
                <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-xs px-2 py-1 rounded border border-slate-200 text-[9px] font-bold text-slate-700 shadow-sm">
                  📍 {focusedIncident.locationCoordinates || "09.4981°N, 76.3268°E"}
                </div>
              </div>
            </div>

            {/* Crew Description Log */}
            <div className="p-5 flex-1 space-y-4">
              <div>
                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">TELEMETRY & PERSONNEL</span>
                <div className="grid grid-cols-2 gap-3.5 mt-2">
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-xl">person</span>
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase leading-none">DRIVER NAME</p>
                      <p className="text-xs font-bold text-slate-800 mt-1">{focusedIncident.driverName}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-xl">groups</span>
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase leading-none">OCCUPANCY STATUS</p>
                      <p className="text-xs font-bold text-slate-800 mt-1">{focusedIncident.occupancy}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">CREW SITUATION STATEMENT</span>
                <p className="text-[13px] text-slate-700 font-medium bg-rose-50/30 border border-rose-100/50 p-3.5 rounded-xl mt-1.5 leading-relaxed">
                  "{focusedIncident.description}"
                </p>
              </div>

              {/* Gemini Smart Assist SOP Block */}
              {focusedIncident.aiSuggestedSOP && (
                <div className="bg-gradient-to-br from-indigo-50/50 to-indigo-100/20 border border-indigo-200/70 p-4 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-700 text-[18px]">psychology</span>
                    <span className="text-xs font-bold text-indigo-950 uppercase tracking-widest font-display">
                      KSRTC AI Copilot Safety Guideline
                    </span>
                  </div>
                  <div className="text-xs text-indigo-900 font-medium leading-relaxed font-sans whitespace-pre-line bg-white/70 p-3 rounded-lg shadow-xs">
                    {focusedIncident.aiSuggestedSOP}
                  </div>
                </div>
              )}
            </div>

            {/* Quick action triggers footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-3 gap-2 shrink-0">
              <button
                id="call-driver-btn"
                onClick={() => alert(`Dialing crew radio: 91-KSRTC-VOIP-DRV (${focusedIncident.driverName}). Link established.`)}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                <span className="material-symbols-outlined text-lg">call</span>
                Call Driver
              </button>

              <button
                id="update-status-btn"
                onClick={() => {
                  const transitionStatus = focusedIncident.status === 'NEW' ? 'INVESTIGATING' : 'RESOLVED';
                  onUpdateStatus(focusedIncident.id, transitionStatus);
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                  focusedIncident.status === 'NEW'
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-200'
                    : 'bg-green-100 hover:bg-green-200 text-green-800 border border-green-200'
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {focusedIncident.status === 'NEW' ? 'gavel' : 'check_circle'}
                </span>
                {focusedIncident.status === 'NEW' ? 'Set Active' : 'Resolve'}
              </button>

              <button
                id="live-cam-btn"
                onClick={() => alert("Connecting live inside-cabin passenger cams. Accessing stream...")}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl"
              >
                <span className="material-symbols-outlined text-lg">video_camera_front</span>
                Live Cam
              </button>
            </div>
          </section>
        ) : (
          <div className="text-center p-10 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-400 text-sm">Select an incident to view details.</p>
          </div>
        )}

        {/* Report New Incident Form */}
        <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="font-display font-semibold text-[16px] text-slate-800 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">edit_note</span>
            Report New Fleet Incident
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1 uppercase tracking-wider">Incident Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as IncidentType })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-primary focus:bg-white transition-all outline-none"
                >
                  <option value="TECHNICAL">Technical Issue</option>
                  <option value="DELAY">Traffic Delay</option>
                  <option value="ACCIDENT">Accident Collision</option>
                  <option value="MEDICAL">Medical Emergency</option>
                  <option value="SAFETY">Crew/Passenger Safety</option>
                  <option value="MISCONDUCT">Conductor Misconduct</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1 uppercase tracking-wider">Bus Number</label>
                <input
                  type="text"
                  placeholder="e.g. KL-15-X-9988"
                  value={formData.busNumber}
                  onChange={(e) => setFormData({ ...formData, busNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-primary focus:bg-white transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1 uppercase tracking-wider">Affected Route</label>
                <input
                  type="text"
                  placeholder="e.g. TVM-EKM (Swift)"
                  value={formData.route}
                  onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:bg-white transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1 uppercase tracking-wider">Driver Name</label>
                <input
                  type="text"
                  placeholder="e.g. Vijay Kumar"
                  value={formData.driverName}
                  onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:bg-white transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 mb-1 uppercase tracking-wider">Location / Landmark</label>
              <input
                type="text"
                placeholder="e.g. Haripad Junction / Thondayad Flyover"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:bg-white transition-all outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 mb-1 uppercase tracking-wider">Detailed Description</label>
              <textarea
                placeholder="Excellently describe the current situation (mechanical noises, smoke, patient status...)"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:bg-white transition-all outline-none resize-none"
                required
              ></textarea>
            </div>

            <button
              id="submit-incident-btn"
              type="submit"
              disabled={formSubmitting}
              className="w-full py-2.5 bg-primary hover:bg-rose-700 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">
                {formSubmitting ? "sync" : "send"}
              </span>
              {formSubmitting ? "Initiating SOS Entry & AI Analysis..." : "Submit Incident Report"}
            </button>

            {formSuccess && (
              <div className="bg-green-50 border border-green-200 p-3 rounded-xl text-xs text-green-700 font-semibold text-center animate-fade-in animate-pulse">
                ✓ Report logged successfully. Initiating Gemini severity screening...
              </div>
            )}
          </form>
        </section>

      </div>

      {/* Right Column: Action Center & Coordination */}
      <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
        
        {/* Action Center Buttons */}
        <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex-1">
          <h2 className="font-display font-semibold text-[16px] text-slate-800 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">bolt</span>
            SOS Action Center
          </h2>

          {focusedIncident ? (
            <div className="space-y-4">
              
              {/* Dispatch Backup */}
              <button
                id="dispatch-backup-action-btn"
                onClick={() => onTriggerAction(focusedIncident.id, "DISPATCH_BACKUP")}
                disabled={focusedIncident.backupDispatched}
                className={`w-full group flex flex-col gap-1.5 p-4 border rounded-xl text-left transition-all ${
                  focusedIncident.backupDispatched
                    ? "bg-slate-50 border-slate-200 cursor-not-allowed opacity-80"
                    : "bg-rose-50/50 border-rose-200 hover:bg-rose-50/80 cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-2 text-primary font-extrabold text-xs tracking-wide uppercase">
                  <span className="material-symbols-outlined text-[18px]">rv_hookup</span>
                  <span>Dispatch Rescue Backup</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  {focusedIncident.backupDispatched 
                    ? "✓ Dispatch Order Logged in Central System."
                    : `Direct the closest standby bus at the nearest depot to pick up coordinates for ${focusedIncident.busNumber}.`}
                </p>
              </button>

              {/* Notify Passengers */}
              <button
                id="notify-passengers-action-btn"
                onClick={() => onTriggerAction(focusedIncident.id, "NOTIFY_PASSENGERS")}
                disabled={focusedIncident.passengersNotified}
                className={`w-full group flex flex-col gap-1.5 p-4 border rounded-xl text-left transition-all ${
                  focusedIncident.passengersNotified
                    ? "bg-slate-50 border-slate-200 cursor-not-allowed opacity-80"
                    : "bg-indigo-50/50 border-indigo-200 hover:bg-indigo-50/80 cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-xs tracking-wide uppercase">
                  <span className="material-symbols-outlined text-[18px]">sms</span>
                  <span>Notify Passengers</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  {focusedIncident.passengersNotified
                    ? "✓ SMS Alerts broadcasted success."
                    : "Instantly draft and send SMS delay codes and options directly to passenger numbers."}
                </p>
              </button>

              {/* Emergency Unit */}
              <button
                id="emergency-unit-action-btn"
                onClick={() => onTriggerAction(focusedIncident.id, "NOTIFY_EMERGENCY")}
                disabled={focusedIncident.emergencyUnitNotified}
                className={`w-full group flex flex-col gap-1.5 p-4 border rounded-xl text-left transition-all ${
                  focusedIncident.emergencyUnitNotified
                    ? "bg-slate-50 border-slate-200 cursor-not-allowed opacity-80"
                    : "bg-rose-50/60 border-rose-300 hover:bg-rose-100/50 cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-2 text-rose-800 font-extrabold text-xs tracking-wide uppercase">
                  <span className="material-symbols-outlined text-[18px]">health_and_safety</span>
                  <span>Mobilize Emergency</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  {focusedIncident.emergencyUnitNotified
                    ? "✓ Emergency signals broadcasted to local depot."
                    : "Directly trigger localized Highway Patrol and emergency medical crew dispatch."}
                </p>
              </button>

            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Select an active incident from list to initiate target actions.</p>
          )}

          {/* Emergency contacts card */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Regional Depot Master Contacts</h3>
            <div className="space-y-2.5">
              {[
                { name: "Kollam Depot Master", num: "91-474-2751010" },
                { name: "Ernakulam Central Office", num: "91-484-2372033" },
                { name: "Trivandrum Central Ctrl", num: "91-471-2323886" }
              ].map((contact, index) => (
                <div
                  key={index}
                  onClick={() => alert(`Initiating VOIP dispatcher trunk call to ${contact.name}`)}
                  className="flex items-center justify-between p-2 hover:bg-slate-50 border border-slate-100 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-rose-600 rounded-full"></div>
                    <span className="text-xs font-bold text-slate-600">{contact.name}</span>
                  </div>
                  <span className="material-symbols-outlined text-[15px] text-primary">call</span>
                </div>
              ))}
            </div>
          </div>

          {/* Graphical decorative showcase of KSRTC Swift Fleet */}
          <div className="mt-8 rounded-xl overflow-hidden relative shadow-md group">
            <img
              src="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=400&q=80"
              alt="High-tech Red Bus Fleet"
              className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent flex items-end p-3">
              <span className="text-[9px] font-black text-white tracking-widest uppercase font-mono">
                KSRTC SWIFT ADMIN PROTOTYPE
              </span>
            </div>
          </div>
        </section>

      </div>

    </div>
  );
}
