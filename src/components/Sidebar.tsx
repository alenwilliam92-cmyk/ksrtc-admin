import React from "react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeAlertsCount: number;
}

export function Sidebar({ activeTab, setActiveTab, activeAlertsCount }: SidebarProps) {
  const menuItems = [
    { id: "alerts", label: "Live Alerts", icon: "warning", badge: activeAlertsCount },
    { id: "incidents", label: "Incident Reports", icon: "report_problem" },
    { id: "service", label: "Service Updates", icon: "campaign" },
    { id: "fleet", label: "Fleet Tracking", icon: "directions_bus" },
    { id: "settings", label: "Settings", icon: "settings" }
  ];

  return (
    <aside id="sidebar-panel" className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen shrink-0 transition-all">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h1 className="font-display font-black text-2xl text-primary tracking-tight leading-none">
          Transit Control
        </h1>
        <p className="text-xs text-slate-500 font-medium tracking-wide mt-1 uppercase">
          Kerala KSRTC Admin
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              id={`sidebar-btn-${item.id}`}
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all duration-200 group relative ${
                isActive
                  ? "bg-primary text-white font-semibold shadow-md shadow-primary/20 scale-[1.02]"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`material-symbols-outlined text-[22px] transition-transform group-hover:scale-105 ${
                    isActive ? "text-white" : "text-slate-500"
                  }`}
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : undefined }}
                >
                  {item.icon}
                </span>
                <span className="text-[14px]">{item.label}</span>
              </div>
              
              {/* Badge for alerts */}
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    isActive
                      ? "bg-white text-primary"
                      : "bg-primary text-white animate-pulse"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Dispatcher profile and Footer Actions */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/70 space-y-4">
        {/* Support link */}
        <button
          id="help-center-btn"
          onClick={() => setActiveTab("settings")}
          className="w-full flex items-center gap-3 px-4 py-2 text-xs text-slate-500 hover:text-slate-800 transition-colors rounded-lg hover:bg-slate-200/50"
        >
          <span className="material-symbols-outlined text-sm">help</span>
          <span>Help & System Status</span>
        </button>

        {/* User Card */}
        <div className="flex items-center gap-3.5 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 ring-2 ring-primary/10">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
              alt="Dispatcher Headshot"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate leading-tight">
              Anand G. Nair
            </p>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide">
              ID: #KSRTC-882 (Sup)
            </p>
          </div>
        </div>

        {/* logout */}
        <button
          id="sign-out-btn"
          onClick={() => alert("Prototype session active. Admin maintains backup dispatcher safety.")}
          className="w-full py-2.5 flex items-center justify-center gap-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-100 transition-all"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          <span>Sign Out Session</span>
        </button>
      </div>
    </aside>
  );
}
