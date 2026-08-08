/** Types partagés du dashboard (alignés sur les schémas Pydantic). */

export type AmbulanceStatus = "AVAILABLE" | "BUSY" | "OUT_OF_SERVICE" | "OFFLINE";
export type TripStatus =
  | "REQUESTED"
  | "SEARCHING"
  | "ASSIGNED"
  | "ACCEPTED"
  | "EN_ROUTE_TO_PATIENT"
  | "ARRIVED_AT_PATIENT"
  | "PATIENT_PICKED_UP"
  | "EN_ROUTE_TO_HOSPITAL"
  | "ARRIVED_AT_HOSPITAL"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED"
  | "FAILED";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Ambulance {
  id: string;
  hospital_id: string;
  plate_number: string;
  model: string;
  capacity: number;
  equipment_notes?: string | null;
  status: AmbulanceStatus;
  location?: GeoPoint | null;
  location_updated_at?: string | null;
  heading?: number | null;
  speed_kmh?: number | null;
  assigned_driver_id?: string | null;
  assigned_driver_name?: string | null;
}

export interface Driver {
  id: string;
  role: "AMBULANCIER" | "ADMIN_HOSPITAL";
  full_name: string;
  phone: string;
  hospital_id: string | null;
  ambulance_id: string | null;
  is_available: boolean;
  is_active: boolean;
  must_change_password: boolean;
  ambulance?: { id: string; plate_number: string; model: string; status: string } | null;
}

export interface Trip {
  id: string;
  emergency_request_id: string;
  ambulance_id: string;
  driver_id: string;
  hospital_id: string;
  status: TripStatus;
  assigned_at?: string | null;
  accepted_at?: string | null;
  started_at?: string | null;
  arrived_at_patient_at?: string | null;
  picked_up_at?: string | null;
  arrived_at_hospital_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  rejected_at?: string | null;
}

export interface TripDetail extends Trip {
  plate_number?: string | null;
  driver_name?: string | null;
  pickup_location?: GeoPoint | null;
  reason_category?: string | null;
  reason_note?: string | null;
  beneficiary_name?: string | null;
  beneficiary_phone?: string | null;
  status_events: { from_status?: string | null; to_status: string; created_at: string }[];
}

export interface Hospital {
  id: string;
  name: string;
  city: string;
  address?: string | null;
  contact_phone: string;
  emergency_backup_phone?: string | null;
  default_search_radius_km: string;
  max_search_radius_km: string;
  is_active: boolean;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}
