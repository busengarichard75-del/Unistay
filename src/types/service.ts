// src/types/service.ts

export type ServiceCategory =
  | "barber"
  | "printing"
  | "photography"
  | "tech"
  | "food"
  | "transport"
  | "other";

export type ServiceStatus = "available" | "inactive";

// ─── New: Availability ───
export type AvailabilityDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type AvailabilityMode = "walk_in" | "appointment" | "both";

export interface ServiceAvailability {
  days?: AvailabilityDay[];
  from?: string;  // "08:00"
  to?: string;    // "18:00"
  mode?: AvailabilityMode;
  note?: string;
}

// ─── New: Price ───
export type ServicePriceType = "from" | "contact";

// ─── New: Payment methods ───
export type PaymentMethod = "cash" | "mobile_money" | "bank_transfer";

export interface Service {
  id: string;
  ownerId: string;
  title: string;
  category: ServiceCategory;
  description: string;
  imageUrls?: string[];
  location: string;
  universityId: string;
  latitude?: number;
  longitude?: number;
  whatsapp: string;
  status: ServiceStatus;
  views: number;
  whatsappClicks: number;
  createdAt: number;
  updatedAt: number;
  adminHidden?: boolean;
  adminHiddenReason?: string | null;

  // ─── New (all optional, backward compatible) ───
  availability?: ServiceAvailability;
  priceType?: ServicePriceType;
  priceFrom?: number;
  paymentMethods?: PaymentMethod[];
  serviceArea?: string;
}

export const SERVICE_CATEGORIES: { id: ServiceCategory; label: string; icon: string }[] = [
  { id: "barber", label: "Barber / Beauty", icon: "💈" },
  { id: "printing", label: "Printing", icon: "🖨️" },
  { id: "photography", label: "Photography", icon: "📸" },
  { id: "tech", label: "Tech / Repairs", icon: "🔧" },
  { id: "food", label: "Food", icon: "🍲" },
  { id: "transport", label: "Transport", icon: "🚌" },
  { id: "other", label: "Other", icon: "✨" },
];

export const AVAILABILITY_DAY_LABELS: Record<AvailabilityDay, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

export const AVAILABILITY_MODE_LABELS: Record<AvailabilityMode, string> = {
  walk_in: "Walk-in",
  appointment: "By appointment",
  both: "Walk-in & appointment",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  mobile_money: "Mobile Money",
  bank_transfer: "Bank Transfer",
};