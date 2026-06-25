export type IncidentSeverity = "CRITICAL" | "MODERATE" | "LOW";
export type IncidentStatus = "NEW" | "INVESTIGATING" | "RESOLVED";
export type IncidentType = "TECHNICAL" | "DELAY" | "ACCIDENT" | "MEDICAL" | "SAFETY" | "MISCONDUCT";

export interface Incident {
  id: string; // e.g. "INC-8892"
  status: IncidentStatus;
  severity: IncidentSeverity;
  type: IncidentType;
  busNumber: string; // e.g. "KL-15-X-1234"
  route: string; // e.g. "TVM-EKM (Swift)"
  location: string; // e.g. "Kollam Bypass"
  locationCoordinates: string; // e.g. "08.9234°N, 76.6212°E"
  timestamp: string; // e.g. "14:22" or "Just Now"
  description: string;
  driverName: string;
  occupancy: string;
  responseTime: string; // e.g. "15m"
  lat: number;
  lng: number;
  aiSuggestedSOP: string; // AI generated SOP suggestions
  backupDispatched: boolean;
  passengersNotified: boolean;
  emergencyUnitNotified: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  type: "CREATED" | "RESOLVED" | "STATUS_CHANGE" | "ACTION_DISPATCH" | "SYSTEM_AUDIT";
}

export interface ServiceAdvisory {
  id: string;
  title: string;
  impactLevel: "HIGH" | "MEDIUM" | "LOW";
  status: "ACTIVE" | "ARCHIVED";
  publishedAt: string;
  content: string;
  affectedRoutes: string[];
}
