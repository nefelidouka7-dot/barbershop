export type UserRole = "shop_owner" | "barber" | "customer";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
}

export interface Barber {
  id: string;
  user_id: string | null;
  name: string;
  photo_url: string | null;
  bio: string | null;
  active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  active: boolean;
  created_at: string;
}

export interface BarberService {
  barber_id: string;
  service_id: string;
}

export interface WorkingHours {
  id: string;
  barber_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface TimeOff {
  id: string;
  barber_id: string;
  start_datetime: string;
  end_datetime: string;
  reason: string | null;
}

export interface Customer {
  id: string;
  user_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  barber_id: string;
  service_id: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  start_datetime: string;
  end_datetime: string;
  status: AppointmentStatus;
  notes: string | null;
  reminder_sent: boolean;
  created_at: string;
  barber?: Barber;
  service?: Service;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      barbers: { Row: Barber; Insert: Partial<Barber>; Update: Partial<Barber> };
      services: { Row: Service; Insert: Partial<Service>; Update: Partial<Service> };
      barber_services: {
        Row: BarberService;
        Insert: BarberService;
        Update: Partial<BarberService>;
      };
      working_hours: {
        Row: WorkingHours;
        Insert: Partial<WorkingHours>;
        Update: Partial<WorkingHours>;
      };
      time_off: { Row: TimeOff; Insert: Partial<TimeOff>; Update: Partial<TimeOff> };
      customers: {
        Row: Customer;
        Insert: Partial<Customer>;
        Update: Partial<Customer>;
      };
      appointments: {
        Row: Appointment;
        Insert: Partial<Appointment>;
        Update: Partial<Appointment>;
      };
    };
  };
}
