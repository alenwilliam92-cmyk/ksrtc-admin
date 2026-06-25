import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { Incident, AuditLogEntry, ServiceAdvisory } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory persistent database for the prototype lifetime
let incidents: Incident[] = [
  {
    id: "INC-8895",
    status: "NEW",
    severity: "CRITICAL",
    type: "SAFETY",
    busNumber: "KL-15-SW-001",
    route: "EKM-ALP (Swift)",
    location: "Alleppey NH",
    locationCoordinates: "09.4981°N, 76.3268°E",
    timestamp: "14:55",
    description: "Mobile Panic SOS alert triggered from bus. Driver reports suspicious activity and passenger disturbance near row 8.",
    driverName: "Siddharth Kumar",
    occupancy: "34 / 44",
    responseTime: "5m",
    lat: 9.4981,
    lng: 76.3268,
    aiSuggestedSOP: "• 1. Dispatch High Patrol team to coordinate intercept at local checkpoint.\n• 2. Instruct driver to maintain continuous radio contact and keep doors secure until police units arrive.\n• 3. Keep interior live cameras streaming for Central Control assessment.",
    backupDispatched: false,
    passengersNotified: false,
    emergencyUnitNotified: true
  },
  {
    id: "INC-8892",
    status: "NEW",
    severity: "CRITICAL",
    type: "MEDICAL",
    busNumber: "KL-15-X-1234",
    route: "TVM-EKM (Swift)",
    location: "Kozhikode Bypass",
    locationCoordinates: "11.2508°N, 75.8342°E",
    timestamp: "14:22",
    description: "Engine overheating warning light on. Passenger reports feeling severe chest pain and experiencing breathing difficulties. Bus pulled over near Thondayad Flyover.",
    driverName: "Raghavan Nair",
    occupancy: "42 / 48 (High)",
    responseTime: "15m",
    lat: 11.2508,
    lng: 75.8342,
    aiSuggestedSOP: "• 1. Immediately dispatch nearest Ambulance unit from Star Care Hospital, Kozhikode Bypass.\n• 2. Initiate dispatch of empty backup bus from Kozhikode depot to transfer remaining passengers.\n• 3. Instruct conductor to administer standard first-aid and ensure clear air flow on vehicle.",
    backupDispatched: true,
    passengersNotified: true,
    emergencyUnitNotified: true
  },
  {
    id: "INC-8889",
    status: "INVESTIGATING",
    severity: "MODERATE",
    type: "TECHNICAL",
    busNumber: "KL-15-Y-7762",
    route: "Kochi City Circular",
    location: "Ernakulam South",
    locationCoordinates: "09.9634°N, 76.2974°E",
    timestamp: "13:45",
    description: "Air conditioning failure in the middle portion of the bus. Passengers complaining of excessive heat. Bus standing at Platform 4.",
    driverName: "M. K. Hariharan",
    occupancy: "39 / 44",
    responseTime: "20m",
    lat: 9.9634,
    lng: 76.2974,
    aiSuggestedSOP: "• 1. Direct bus to the Ernakulam Central maintenance bay for technical evaluation.\n• 2. Refund or adjust tickets for passengers and direct them to the next city schedule departure.\n• 3. Instruct workshop crew to inspect coolant coils and ambient air sensors.",
    backupDispatched: false,
    passengersNotified: false,
    emergencyUnitNotified: false
  },
  {
    id: "INC-8885",
    status: "RESOLVED",
    severity: "LOW",
    type: "MISCONDUCT",
    busNumber: "KL-15-Z-1010",
    route: "Trivandrum Circular",
    location: "Trivandrum Central",
    locationCoordinates: "08.4891°N, 76.9531°E",
    timestamp: "12:10",
    description: "Argument between a passenger and the ticket inspector regarding smart-travel passes in the station parking area.",
    driverName: "Sreekumar V.",
    occupancy: "12 / 44",
    responseTime: "8m",
    lat: 8.4891,
    lng: 76.9531,
    aiSuggestedSOP: "• 1. Depot master intervened to clarify valid smart-card travel codes.\n• 2. Issue card validation receipt manually on the spot.\n• 3. Standard resolved log recorded.",
    backupDispatched: false,
    passengersNotified: false,
    emergencyUnitNotified: false
  }
];

let auditLogs: AuditLogEntry[] = [
  {
    id: "LOG-01",
    timestamp: "Just Now",
    title: "INC-8895 Mobilized",
    description: "High Patrol requested for security incident near Alleppey Bypass.",
    type: "ACTION_DISPATCH"
  },
  {
    id: "LOG-02",
    timestamp: "12 Mins Ago",
    title: "INC-8885 Resolved",
    description: "Audit completed by Clerk Ravi. Misconduct dispute resolved at Trivandrum Central depot.",
    type: "RESOLVED"
  },
  {
    id: "LOG-03",
    timestamp: "45 Mins Ago",
    title: "INC-8889 Status Changed",
    description: "Status moved to 'Investigating'. Technicians dispatched to Ernakulam Platform 4.",
    type: "STATUS_CHANGE"
  },
  {
    id: "LOG-04",
    timestamp: "1 Hour Ago",
    title: "Emergency Ambulance Request",
    description: "Dispatch request approved for Star Care Medical services near Thondayad Flyover.",
    type: "ACTION_DISPATCH"
  }
];

let advisories: ServiceAdvisory[] = [
  {
    id: "ADV-01",
    title: "Monsoon Heavy Rain Warning - Wayanad Ghats",
    impactLevel: "HIGH",
    status: "ACTIVE",
    publishedAt: "2 hours ago",
    content: "All KSRTC schedules traversing the Wayanad Ghat road (Thamarassery Churam) are instructed to drive under 25 km/h with hazard lights active due to extreme fog and slippery roads.",
    affectedRoutes: ["Wayanad-Kozhikode", "Mananthavady-Calicut"]
  },
  {
    id: "ADV-02",
    title: "Route Diversion Alappuzha Bypass",
    impactLevel: "MEDIUM",
    status: "ACTIVE",
    publishedAt: "4 hours ago",
    content: "Alappuzha Bypass local road underpass closed due to temporary drainage repair. Long routes shifted over bridge main lanes.",
    affectedRoutes: ["Kollam-Kochi", "TVM-Ernakulam Swift"]
  }
];

// Lazy instantiator for Gemini API
let aiInstance: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// ---------------------- Express APIs ----------------------

// Get all incidents
app.get("/api/incidents", (req, res) => {
  res.json(incidents);
});

// Create new incident
app.post("/api/incidents", (req, res) => {
  const { type, busNumber, location, description, driverName, route, occupancy } = req.body;
  
  const idNum = Math.floor(1000 + Math.random() * 9000);
  const newIncident: Incident = {
    id: `INC-${idNum}`,
    status: "NEW",
    severity: "MODERATE", // default, will trigger AI analysis below
    type: type || "TECHNICAL",
    busNumber: busNumber || "KL-15-X-0000",
    route: route || "Kochi-Trivandrum",
    location: location || "Unknown Location",
    locationCoordinates: "10.0121°N, 76.3245°E", // default Kerala middle coordinates
    timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
    description: description || "No detailed description provided.",
    driverName: driverName || "Unassigned Crew",
    occupancy: occupancy || "30 / 48",
    responseTime: "10m",
    lat: 10.0121,
    lng: 76.3245,
    aiSuggestedSOP: "• 1. Investigate local backup depots near incident zone.\n• 2. Maintain dispatcher radio updates.",
    backupDispatched: false,
    passengersNotified: false,
    emergencyUnitNotified: false
  };

  incidents.unshift(newIncident);
  
  // Auditing
  auditLogs.unshift({
    id: `LOG-${Math.floor(100 + Math.random() * 900)}`,
    timestamp: "Just Now",
    title: `New Incident ${newIncident.id}`,
    description: `Report filed for bus ${newIncident.busNumber} at ${newIncident.location}.`,
    type: "CREATED"
  });

  res.json({ success: true, incident: newIncident });
});

// Analyze incident using Gemini
app.post("/api/incidents/:id/analyze", async (req, res) => {
  const { id } = req.params;
  const incident = incidents.find(inc => inc.id === id);
  if (!incident) {
    return res.status(404).json({ error: "Incident not found" });
  }

  try {
    const ai = getGemini();
    const prompt = `You are a professional safety dispatch AI helper for the KSRTC (Kerala State Road Transport Corporation) control room.
Analyze this incident description: "${incident.description}"
Classified under category: "${incident.type}".
Location: "${incident.location}".

Classify it into one of these strict values for 'severity': "CRITICAL", "MODERATE", "LOW".
Then generate a very practical, localized bullet-point list of up to 3 standard operating procedures (SOP) actions (labeled 'aiSuggestedSOP') to help the dispatcher. Use bullet points started with '•'. Mention Kerala context if useful (e.g. nearby depots like TVM Central, Kollam, Alappuzha, Ernakulam, Thrissur, Kozhikode etc).

Respond strictly with a JSON object following this JSON format:
{
  "severity": "CRITICAL" | "MODERATE" | "LOW",
  "aiSuggestedSOP": "string containing bullet points"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            severity: {
              type: Type.STRING,
              description: "Must be CRITICAL, MODERATE, or LOW"
            },
            aiSuggestedSOP: {
              type: Type.STRING,
              description: "Bullet points detailing immediate controls"
            }
          },
          required: ["severity", "aiSuggestedSOP"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || '{}');
    if (parsedData.severity) {
      incident.severity = parsedData.severity;
    }
    if (parsedData.aiSuggestedSOP) {
      incident.aiSuggestedSOP = parsedData.aiSuggestedSOP;
    }

    auditLogs.unshift({
      id: `LOG-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: "Just Now",
      title: "AI Analysis Complete",
      description: `Gemini classified ${incident.id} as ${incident.severity} priority.`,
      type: "SYSTEM_AUDIT"
    });

    res.json({ success: true, incident });
  } catch (err: any) {
    console.error("Gemini analysis error:", err);
    // Graceful error recovery: fallback to a safe classification
    incident.severity = "MODERATE";
    incident.aiSuggestedSOP = "• 1. Instruct driver to pull over safely to the shoulder.\n• 2. Call the regional depot superintendent for route coordination.\n• 3. Keep internal cameras recorded if possible.";
    res.json({ success: true, incident, note: "Fallback used. Check GEMINI_API_KEY if error persists." });
  }
});

// Update Incident Status / Actions
app.post("/api/incidents/:id/action", (req, res) => {
  const { id } = req.params;
  const { action, status } = req.body;

  const incident = incidents.find(inc => inc.id === id);
  if (!incident) {
    return res.status(404).json({ error: "Incident not found" });
  }

  if (status) {
    const oldStatus = incident.status;
    incident.status = status;
    auditLogs.unshift({
      id: `LOG-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: "Just Now",
      title: `Status Changed: ${incident.id}`,
      description: `Dispatched transitioned status from ${oldStatus} to ${status}.`,
      type: "STATUS_CHANGE"
    });
  }

  if (action === "DISPATCH_BACKUP") {
    incident.backupDispatched = true;
    auditLogs.unshift({
      id: `LOG-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: "Just Now",
      title: `Backup Dispatched: ${incident.id}`,
      description: `Assigned rescue vehicle schedule from local depot for bus roster ${incident.busNumber}.`,
      type: "ACTION_DISPATCH"
    });
  } else if (action === "NOTIFY_PASSENGERS") {
    incident.passengersNotified = true;
    auditLogs.unshift({
      id: `LOG-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: "Just Now",
      title: `Alert Broadcasted: ${incident.id}`,
      description: `Route advisory SMS and PUSH notifications sent to registered passengers.`,
      type: "ACTION_DISPATCH"
    });
  } else if (action === "NOTIFY_EMERGENCY") {
    incident.emergencyUnitNotified = true;
    auditLogs.unshift({
      id: `LOG-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: "Just Now",
      title: `Emergency Mobilized: ${incident.id}`,
      description: `Police and medical relief services alerted relative to coordinates ${incident.locationCoordinates}.`,
      type: "ACTION_DISPATCH"
    });
  }

  res.json({ success: true, incident });
});

// Fetch Audit Logs
app.get("/api/activity", (req, res) => {
  res.json(auditLogs);
});

// Clear Audit Logs
app.delete("/api/activity", (req, res) => {
  auditLogs = [];
  res.json({ success: true });
});

// Fetch Service Advisories
app.get("/api/advisories", (req, res) => {
  res.json(advisories);
});

// Create Service Advisory
app.post("/api/advisories", (req, res) => {
  const { title, impactLevel, content, affectedRoutes } = req.body;
  const newAdv: ServiceAdvisory = {
    id: `ADV-${Math.floor(10 + Math.random() * 90)}`,
    title: title || "New Advisory",
    impactLevel: impactLevel || "LOW",
    status: "ACTIVE",
    publishedAt: "Just Now",
    content: content || "Details regarding schedule modification.",
    affectedRoutes: affectedRoutes || ["All Routes"]
  };
  advisories.unshift(newAdv);
  res.json({ success: true, advisory: newAdv });
});

// ----------------- Vite Integration Middleware -----------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Transit Control server running on http://localhost:${PORT}`);
  });
}

startServer();
