import React, { useState } from "react";
import { Incident, AuditLogEntry, IncidentStatus, IncidentSeverity } from "../types";

interface IncidentsTableTabProps {
  incidents: Incident[];
  auditLogs: AuditLogEntry[];
  onUpdateStatus: (incidentId: string, status: IncidentStatus) => Promise<void>;
  onTriggerAction: (incidentId: string, action: "DISPATCH_BACKUP" | "NOTIFY_PASSENGERS" | "NOTIFY_EMERGENCY") => Promise<void>;
  onClearActivity: () => Promise<void>;
}

export function IncidentsTableTab({
  incidents,
  auditLogs,
  onUpdateStatus,
  onTriggerAction,
  onClearActivity
}: IncidentsTableTabProps) {
  // Filtering states
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Bento Metrics (Dynamic based on live in-memory incidents state!)
  const totalActiveCount = incidents.filter(i => i.status !== "RESOLVED").length;
  const resolvedCount = incidents.filter(i => i.status === "RESOLVED").length;
  const highPriorityCount = incidents.filter(i => i.severity === "CRITICAL" && i.status !== "RESOLVED").length;
  const avgResponseMin = 8; // target center minutes

  // Export CSV simulation
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Incident ID,Status,Severity,Type,Bus Number,Route,Location,Time,Description\r\n";
    
    incidents.forEach(i => {
      const row = `"${i.id}","${i.status}","${i.severity}","${i.type}","${i.busNumber}","${i.route}","${i.location}","${i.timestamp}","${i.description?.replace(/"/g, '""')}"`;
      csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `KSRTC_Incidents_Report_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter conditions
  const filteredIncidents = incidents.filter(i => {
    const matchesStatus = statusFilter === "ALL" || i.status === statusFilter;
    const matchesSeverity = severityFilter === "ALL" || i.severity === severityFilter;
    const matchesSearch = `${i.id} ${i.busNumber} ${i.location} ${i.description} ${i.type}`.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSeverity && matchesSearch;
  });

  // Color mappings
  const getSeverityBadgeClass = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "MODERATE":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "LOW":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusCircleClass = (status: string) => {
    switch (status) {
      case "NEW":
        return "bg-rose-600 animate-pulse";
      case "INVESTIGATING":
        return "bg-amber-500";
      case "RESOLVED":
        return "bg-green-500";
      default:
        return "bg-slate-400";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "CREATED":
        return "add_circle";
      case "RESOLVED":
        return "task_alt";
      case "STATUS_CHANGE":
        return "published_with_changes";
      case "ACTION_DISPATCH":
        return "quickreply";
      case "SYSTEM_AUDIT":
      default:
        return "terminal";
    }
  };

  return (
    <div className="flex gap-6 h-full">

      {/* Center Content Component (Bento & Table) */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Stats Row */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
          
          {/* Stat Card 1 */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-primary flex flex-col justify-between">
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Total Active SOS</p>
            <div className="flex justify-between items-end mt-1">
              <span className="font-display font-black text-3xl text-primary leading-none">{totalActiveCount}</span>
              <span className="material-symbols-outlined text-primary text-2xl animate-pulse">priority_high</span>
            </div>
            <p className="text-[10px] text-amber-600 font-bold mt-2 flex items-center gap-1 font-sans">
              <span className="material-symbols-outlined text-xs">trending_up</span> 
              Live control monitoring
            </p>
          </div>

          {/* Stat Card 2 */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-status-low flex flex-col justify-between">
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Resolved Cases Today</p>
            <div className="flex justify-between items-end mt-1">
              <span className="font-display font-black text-3xl text-status-low leading-none">{resolvedCount}</span>
              <span className="material-symbols-outlined text-status-low text-2xl">check_circle</span>
            </div>
            <p className="text-[10px] text-green-600 font-bold mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">done_all</span> 
              Performance maximized
            </p>
          </div>

          {/* Stat Card 3 */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-emergency flex flex-col justify-between">
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Critical Priorities</p>
            <div className="flex justify-between items-end mt-1">
              <span className="font-display font-black text-3xl text-emergency leading-none">{highPriorityCount}</span>
              <span className="material-symbols-outlined text-emergency text-2xl">emergency</span>
            </div>
            <p className="text-[10px] text-rose-600 font-bold mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">gpp_maybe</span> 
              Immediate supervision required
            </p>
          </div>

          {/* Stat Card 4 */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-secondary flex flex-col justify-between">
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Avg. Local Response</p>
            <div className="flex justify-between items-end mt-1">
              <div className="flex items-baseline gap-1">
                <span className="font-display font-black text-3xl text-secondary leading-none">{avgResponseMin}</span>
                <span className="font-bold text-xs text-slate-500">min</span>
              </div>
              <span className="material-symbols-outlined text-secondary text-2xl">schedule</span>
            </div>
            <p className="text-[10px] text-slate-500 font-bold mt-2 flex items-center gap-1 font-mono">
              <span className="material-symbols-outlined text-xs">speed</span> 
              Target: under 12 min
            </p>
          </div>

        </section>

        {/* Dynamic Filters and Main Incident Table */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden min-h-[450px]">
          
          {/* Table Header Controls */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Status Selector */}
              <select
                id="filter-status-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
              >
                <option value="ALL">Status: All Reports</option>
                <option value="NEW">Status: New</option>
                <option value="INVESTIGATING">Status: Investigating</option>
                <option value="RESOLVED">Status: Resolved</option>
              </select>

              {/* Severity Selector */}
              <select
                id="filter-severity-select"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
              >
                <option value="ALL">Severity: All</option>
                <option value="CRITICAL">Severity: Critical</option>
                <option value="MODERATE">Severity: Moderate</option>
                <option value="LOW">Severity: Low</option>
              </select>

              {/* Keyword Search Input */}
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-xs text-slate-400">filter_list</span>
                <input
                  type="text"
                  placeholder="Filter key..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl w-36 outline-none focus:ring-1 focus:ring-primary focus:w-48 transition-all"
                />
              </div>

            </div>

            {/* Export CSV action button */}
            <button
              id="export-csv-btn"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 text-xs font-bold text-primary hover:bg-slate-100 p-2 rounded-xl transition-all border border-slate-200 bg-white"
            >
              <span className="material-symbols-outlined text-sm font-bold">download</span> 
              Export CSV
            </button>
          </div>

          {/* Incident Data Table Frame */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-wider shrink-0">
                  <th className="px-5 py-4.5">Incident ID & Status</th>
                  <th className="px-5 py-4.5">Severity</th>
                  <th className="px-5 py-4.5">Type / Category</th>
                  <th className="px-5 py-4.5 font-mono">Bus Fleet Identifier</th>
                  <th className="px-5 py-4.5">Chronology & Location</th>
                  <th className="px-5 py-4.5 text-right">Emergency Shortcuts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-24 text-slate-400 font-medium">
                      <span className="material-symbols-outlined text-4xl block text-slate-200">content_paste_off</span>
                      No reports match the active dispatch filters.
                    </td>
                  </tr>
                ) : (
                  filteredIncidents.map((incident) => (
                    <tr key={incident.id} className="hover:bg-slate-50/75 transition-colors group">
                      
                      {/* ID and custom Status Dot */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${getStatusCircleClass(incident.status)}`}></span>
                          <div>
                            <p className="font-extrabold text-slate-900 font-display text-[13px]">{incident.id}</p>
                            <p className="text-[9px] font-black tracking-wide text-slate-400 uppercase leading-none mt-1">
                              {incident.status}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Severity level */}
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-0.5 text-[9px] font-black rounded-md tracking-wider border uppercase ${getSeverityBadgeClass(incident.severity)}`}>
                          {incident.severity}
                        </span>
                      </td>

                      {/* Case category */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <span className="material-symbols-outlined text-[15px] text-slate-400 leading-none">
                            {incident.type === 'MEDICAL' ? 'medical_services' : incident.type === 'TECHNICAL' ? 'build' : 'gpp_maybe'}
                          </span>
                          <span className="capitalize">{incident.type.toLowerCase()}</span>
                        </div>
                      </td>

                      {/* Vehicle Number tag */}
                      <td className="px-5 py-4">
                        <span className="font-extrabold font-mono text-[11px] bg-slate-100 px-2 py-0.5 border border-slate-200 rounded text-slate-700">
                          {incident.busNumber}
                        </span>
                      </td>

                      {/* Timestamp & Town Landmark description */}
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-bold text-slate-800 leading-snug">{incident.timestamp} | {incident.location}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">{incident.route}</p>
                        </div>
                      </td>

                      {/* Inline Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-1 px-1">
                          
                          {/* Close / Resolve toggle button */}
                          {incident.status !== 'RESOLVED' ? (
                            <button
                              onClick={() => onUpdateStatus(incident.id, "RESOLVED")}
                              title="Resolve Incident Case"
                              className="p-1 px-2.5 hover:bg-green-150 rounded-xl text-green-700 border border-green-200 hover:bg-green-50/50 bg-white transition-all text-[11px] font-bold"
                            >
                              Resolve
                            </button>
                          ) : (
                            <span className="text-slate-400 font-semibold px-2">✓ Closed</span>
                          )}

                          {/* Quick trigger action menus */}
                          <div className="relative group/menu inline-block">
                            <button className="p-1 px-1.5 hover:bg-slate-100 rounded-xl text-slate-500 border border-slate-200 bg-white transition-all text-[11px]">
                              •••
                            </button>
                            <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 shadow-lg rounded-xl py-1 z-50 hidden group-hover/menu:block min-w-[150px] text-left">
                              <button
                                onClick={() => onTriggerAction(incident.id, "DISPATCH_BACKUP")}
                                className="w-full text-[11px] font-bold text-slate-600 hover:bg-slate-50 px-3 py-2 border-b border-slate-100 flex items-center gap-1"
                              >
                                🚌 Roster Backup
                              </button>
                              <button
                                onClick={() => onTriggerAction(incident.id, "NOTIFY_PASSENGERS")}
                                className="w-full text-[11px] font-bold text-slate-600 hover:bg-slate-50 px-3 py-2 border-b border-slate-100 flex items-center gap-1"
                              >
                                💬 SMS Warning
                              </button>
                              <button
                                onClick={() => onTriggerAction(incident.id, "NOTIFY_EMERGENCY")}
                                className="w-full text-[11px] font-bold text-rose-700 hover:bg-rose-50 px-3 py-2 flex items-center gap-1"
                              >
                                🚨 Police Dispatch
                              </button>
                            </div>
                          </div>

                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table list statistics footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Showing {filteredIncidents.length} of {incidents.length} total prototype instances</span>
            <div className="flex items-center gap-1">
              <button className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 cursor-not-allowed">
                <span className="material-symbols-outlined text-sm leading-none">chevron_left</span>
              </button>
              <button className="w-6 h-6 flex items-center justify-center bg-primary text-white font-extrabold rounded text-[11px]">1</button>
              <button className="w-6 h-6 flex items-center justify-center hover:bg-slate-200 rounded text-[11px]">2</button>
              <button className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500">
                <span className="material-symbols-outlined text-sm leading-none">chevron_right</span>
              </button>
            </div>
          </div>

        </section>

      </div>

      {/* Right Chronology Audit Log Sidebar */}
      <aside className="w-80 shrink-0 hidden xl:flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Sidebar logs Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg animate-spin">history</span>
            Live Dispatch Activity Log
          </h3>
          <span className="w-2.5 h-2.5 bg-green-550 border border-white rounded-full animate-pulse" title="Live System Synchronization"></span>
        </div>

        {/* Real logs timeline panel */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {auditLogs.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-xs italic">
              Activity log is empty. Dispatcher operations generate chronological events here.
            </div>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="relative pl-6 border-l-2 border-slate-100 pb-1">
                {/* Node icon circle */}
                <div className="absolute -left-[14px] top-0 w-[26px] h-[26px] bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center text-slate-500 ring-4 ring-white shadow-xs">
                  <span className="material-symbols-outlined text-[13px] leading-none text-slate-600">
                    {getActivityIcon(log.type)}
                  </span>
                </div>
                
                {/* Log timeline node description */}
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter leading-none mt-1">
                  {log.timestamp}
                </p>
                <p className="text-xs font-bold text-slate-800 mt-1">{log.title}</p>
                <p className="text-[11px] text-slate-500 leading-normal mt-0.5">{log.description}</p>
              </div>
            ))
          )}
        </div>

        {/* Audit clear operations footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 shrink-0">
          <button
            id="clear-activity-logs-btn"
            onClick={onClearActivity}
            className="w-full py-1.5 border border-slate-200 bg-white rounded-lg hover:bg-rose-50 hover:text-rose-700 hover:border-rose-100 transition-all text-slate-500 text-[10px] uppercase font-bold tracking-wider"
          >
            Purge Dispatch Logs
          </button>
        </div>

      </aside>

    </div>
  );
}
