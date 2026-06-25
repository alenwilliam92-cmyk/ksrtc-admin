import React, { useState, useEffect } from "react";

interface FleetBus {
  id: string;
  busNumber: string;
  route: string;
  driver: string;
  speed: number;
  fuel: number;
  temp: number;
  status: "ONLINE" | "DELAYED" | "STANDBY" | "ALERT";
  coordinates: string;
  x: number; // coordinates for the SVG map
  y: number;
}

export function FleetTrackingTab() {
  const [fleet, setFleet] = useState<FleetBus[]>([
    { id: "BUS-1", busNumber: "KL-15-SW-001", route: "EKM-ALP (Swift)", driver: "Siddharth Kumar", speed: 45, fuel: 82, temp: 88, status: "ALERT", coordinates: "09.4981°N, 76.3268°E", x: 190, y: 120 },
    { id: "BUS-2", busNumber: "KL-15-X-1234", route: "TVM-EKM (Swift)", driver: "Raghavan Nair", speed: 0, fuel: 54, temp: 104, status: "ALERT", coordinates: "11.2508°N, 75.8342°E", x: 90, y: 35 },
    { id: "BUS-3", busNumber: "KL-15-FP-2990", route: "Thrissur-Calicut (FP)", driver: "K. Divakaran", speed: 52, fuel: 68, temp: 74, status: "ONLINE", coordinates: "10.5276°N, 76.2144°E", x: 232, y: 70 },
    { id: "BUS-4", busNumber: "KL-01-BK-992", route: "Kochi Circular", driver: "K. V. Joseph", speed: 12, fuel: 41, temp: 82, status: "DELAYED", coordinates: "09.9691°N, 76.3204°E", x: 195, y: 95 },
    { id: "BUS-5", busNumber: "KL-15-SF-8212", route: "Kollam-TVM (SF)", driver: "Suresh Pillai", speed: 64, fuel: 79, temp: 78, status: "ONLINE", coordinates: "08.8932°N, 76.6141°E", x: 215, y: 160 },
    { id: "BUS-6", busNumber: "KL-15-Z-1010", route: "TVM Local", driver: "Sreekumar V.", speed: 0, fuel: 91, temp: 65, status: "STANDBY", coordinates: "08.4891°N, 76.9531°E", x: 220, y: 185 }
  ]);

  const [selectedBusId, setSelectedBusId] = useState<string>("BUS-1");
  const selectedBus = fleet.find(b => b.id === selectedBusId) || fleet[0];

  // Tick simulation to make speed and fuel fluctuate slightly for high-fidelity interactive feel!
  useEffect(() => {
    const timer = setInterval(() => {
      setFleet(prev => prev.map(bus => {
        if (bus.status === "STANDBY" || bus.speed === 0) return bus;
        const speedDelta = Math.floor(Math.random() * 5) - 2;
        const newSpeed = Math.max(10, Math.min(80, bus.speed + speedDelta));
        return {
          ...bus,
          speed: newSpeed,
          // simulated coordinates fluctuation
          x: bus.x + (Math.random() * 1.5 - 0.75) * (bus.status === "ONLINE" ? 0.4 : 0),
          y: bus.y + (Math.random() * 1.5 - 0.75) * (bus.status === "ONLINE" ? 0.4 : 0)
        };
      }));
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      
      {/* Map View */}
      <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col h-[580px]">
        
        {/* Banner with controls */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h2 className="font-display font-bold text-slate-800 text-[16px]">GPS Fleet Tracking Telematics</h2>
            <p className="text-xs text-slate-400 font-medium">Kerala State main corridors radar sweep (Simulated live feed)</p>
          </div>
          <span className="text-[11px] font-mono text-primary font-black bg-rose-50 border border-rose-100 px-3 py-1 rounded-lg">
            📡 6 UNITS RADAR TRACKING
          </span>
        </div>

        {/* Mapped SVG canvas */}
        <div className="flex-1 bg-slate-900 rounded-xl relative overflow-hidden border border-slate-800 shadow-inner">
          
          {/* SVG Map of Kerala Coastal routes */}
          <svg className="absolute inset-0 w-full h-full text-slate-700 pointer-events-none" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
            {/* Outline route path connecting major Kerala Cities */}
            <path d="M 80 20 L 100 40 L 160 80 L 190 100 L 195 110 L 210 145 L 215 160 L 220 185" fill="none" stroke="#334155" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 80 20 L 100 40 L 160 80 L 190 100 L 195 110 L 210 145 L 215 160 L 220 185" fill="none" stroke="#475569" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

            {/* Coastal outline backdrop */}
            <path d="M 50 10 Q 150 50, 150 100 T 200 190" fill="none" stroke="#1e293b" strokeWidth="16" strokeOpacity="0.4" />

            {/* Label texts */}
            <text x="55" y="25" className="fill-slate-500 font-display font-extrabold text-[8px] tracking-widest uppercase">COZHIKODE (NORTH)</text>
            <text x="130" y="75" className="fill-slate-500 font-display font-extrabold text-[8px] tracking-widest uppercase">THRISSUR</text>
            <text x="150" y="105" className="fill-slate-500 font-display font-extrabold text-[8px] tracking-widest uppercase">ERNAKULAM (SOUTH)</text>
            <text x="228" y="155" className="fill-slate-500 font-display font-extrabold text-[8px] tracking-widest uppercase">KOLLAM</text>
            <text x="230" y="188" className="fill-slate-500 font-display font-extrabold text-[8px] tracking-widest uppercase">TRIVANDRUM TRUNK</text>
          </svg>

          {/* Interactive Absolute Placed Bus Markers */}
          {fleet.map((bus) => {
            const isSelected = bus.id === selectedBusId;
            return (
              <button
                key={bus.id}
                onClick={() => setSelectedBusId(bus.id)}
                className={`absolute w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group ${
                  isSelected 
                    ? "scale-125 z-40 bg-white text-slate-950 ring-4 ring-primary ring-opacity-65" 
                    : "z-30 hover:scale-110"
                } ${
                  bus.status === "ALERT" 
                    ? "bg-rose-600 text-white animate-bounce shadow-lg shadow-rose-600/50" 
                    : bus.status === "DELAYED"
                    ? "bg-amber-500 text-white shadow-lg shadow-amber-500/50"
                    : "bg-teal-600 text-white"
                }`}
                style={{ left: `${bus.x}%`, top: `${bus.y}%`, transform: 'translate(-50%, -50%)' }}
              >
                <span className="material-symbols-outlined text-[15px] p-1 font-bold">
                  {bus.status === "ALERT" ? "gpp_maybe" : "directions_bus"}
                </span>

                {/* Hover label tag */}
                <div className="absolute top-full mt-1 bg-slate-950/95 text-white scale-0 group-hover:scale-100 transition-all text-[8px] font-mono px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-50 capitalize font-bold">
                  {bus.busNumber} ({bus.speed} KMH)
                </div>
              </button>
            );
          })}

        </div>

      </div>

      {/* Roster Telematics Details Column */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
        
        {/* Detail Inspection Card */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-slate-800 text-[16px] mb-4"> Roster Telematics Inspection</h3>
            
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-center">
              <span className="px-3 py-1 bg-slate-200 text-slate-800 text-[10px] font-black font-mono rounded-lg uppercase tracking-wider">
                {selectedBus.id}
              </span>
              <h4 className="font-display font-black text-2xl text-slate-800 mt-2">{selectedBus.busNumber}</h4>
              <p className="text-xs text-slate-500 font-semibold mt-1">{selectedBus.route}</p>
            </div>

            {/* Numerical Gauges */}
            <div className="grid grid-cols-3 gap-3.5 mt-5">
              
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                <span className="material-symbols-outlined text-primary text-xl">speed</span>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 leading-none">CURRENT SPEED</p>
                <p className="text-sm font-black text-slate-800 mt-1.5 font-mono">{selectedBus.speed} <span className="text-[10px] text-slate-500 font-semibold">km/h</span></p>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                <span className="material-symbols-outlined text-primary text-xl">opacity</span>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 leading-none">FUEL REMAIN</p>
                <p className="text-sm font-black text-slate-800 mt-1.5 font-mono">{selectedBus.fuel}%</p>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                <span className="material-symbols-outlined text-primary text-xl">thermostat</span>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 leading-none">COOLANT TEMP</p>
                <p className={`text-sm font-black mt-1.5 font-mono ${selectedBus.temp > 100 ? 'text-rose-600' : 'text-slate-800'}`}>
                  {selectedBus.temp}°C
                </p>
              </div>

            </div>

            {/* Crew Contacts and logs */}
            <div className="mt-6 space-y-3.5 border-t border-slate-100 pt-5 text-xs">
              
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-semibold text-slate-400 uppercase tracking-tighter">DRIVER ASSIGNED</span>
                <span className="font-bold text-slate-800">{selectedBus.driver}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span className="font-semibold text-slate-400 uppercase tracking-tighter">GPS COORDINATES</span>
                <span className="font-medium font-mono text-slate-800">{selectedBus.coordinates}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span className="font-semibold text-slate-400 uppercase tracking-tighter">RF RADAR SCAN</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase text-white ${
                  selectedBus.status === 'ALERT'
                    ? "bg-rose-600 animate-pulse"
                    : selectedBus.status === 'DELAYED'
                    ? "bg-amber-500"
                    : "bg-green-600"
                }`}>
                  {selectedBus.status}
                </span>
              </div>

            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => alert(`Connecting securely to vehicle KL-Canbus telematics payload...`)}
              className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs tracking-wider uppercase rounded-xl hover:bg-slate-800 transition-all"
            >
              📊 Connect Canbus Logs
            </button>
          </div>
        </section>

      </div>

    </div>
  );
}
