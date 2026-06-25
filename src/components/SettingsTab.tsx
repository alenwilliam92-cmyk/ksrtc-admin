import React from "react";

interface SettingsTabProps {
  onResetDB: () => Promise<void>;
}

export function SettingsTab({ onResetDB }: SettingsTabProps) {
  const handleReset = async () => {
    if (confirm("Reset prototype state back to initial state? This restores default mock incidents and clears customized reports.")) {
      await onResetDB();
      alert("Prototype restored to default.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans">

      {/* Dispatcher Profile Card */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="font-display font-bold text-slate-800 text-[16px] mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">account_box</span>
          Active Supervisor Profile
        </h2>

        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden shrink-0 ring-4 ring-primary/10">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
              alt="Anand G. Nair dispatcher photo"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="text-center sm:text-left space-y-1">
            <h3 className="font-display font-extrabold text-base text-slate-900 leading-none">Anand G. Nair</h3>
            <p className="text-xs font-bold text-slate-500 font-mono">Shift Supervisor ID: KSRTC-882</p>
            <p className="text-[11px] text-slate-400 font-medium">Kerala State Road Transport Corporation Central Control Room</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6 text-xs border-t border-slate-100 pt-5">
          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-tight text-[10px]">Assigned Control Desk</span>
            <p className="font-bold text-slate-800 mt-0.5">National Highway Bypass SOS Terminal 4</p>
          </div>
          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-tight text-[10px]">Secure VoIP Link</span>
            <p className="font-bold text-slate-800 mt-0.5">+91-VOIP-882-KSRTC</p>
          </div>
        </div>
      </section>

      {/* Diagnostics reset column */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h2 className="font-display font-bold text-slate-800 text-[16px] flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-500 text-xl">database</span>
            Prototype Diagnostics
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">Manage in-memory persistent logs and test-bed incidents</p>
        </div>

        <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleReset}
            className="flex-1 py-2.5 bg-rose-50 border border-rose-100 text-rose-700 font-bold rounded-xl hover:bg-rose-100 transition-all text-xs"
          >
            Reset Database & Reports
          </button>
          <button
            onClick={() => alert("Simulated GPS fleet telemetry ping sent to all 6 vehicle canbus controllers.")}
            className="flex-1 py-2.5 bg-slate-100 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-250 transition-all text-xs"
          >
            Force Telemetry Ping (GPS)
          </button>
        </div>
      </section>

    </div>
  );
}
