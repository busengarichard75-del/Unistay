// src/services/statsAggregator.ts
import type { Firestore } from "firebase-admin/firestore";

export interface DailyStats {
  date: string;
  newUsers: number;
  newProperties: number;
  newServices: number;
  newProducts: number;
  newBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  agentFeeRevenue: number;
}

export async function computeDailyStats(db: Firestore, date: string): Promise<DailyStats> {
  const startOfDay = new Date(date + "T00:00:00Z").getTime();
  const endOfDay = startOfDay + 86400000;

  const countIn = async (col: string, field: string, status?: string) => {
    let ref: any = db.collection(col).where(field, ">=", startOfDay).where(field, "<", endOfDay);
    if (status) ref = ref.where("status", "==", status);
    return (await ref.count().get()).data().count;
  };

  const [
    newUsers,
    newProperties,
    newServices,
    newProducts,
    newBookings,
    confirmedBookings,
    cancelledBookings,
  ] = await Promise.all([
    countIn("users", "createdAt"),
    countIn("properties", "createdAt"),
    countIn("services", "createdAt"),
    countIn("products", "createdAt"),
    countIn("bookings", "createdAt"),
    (async () => {
      const snap = await db.collection("bookings")
        .where("confirmedAt", ">=", startOfDay)
        .where("confirmedAt", "<", endOfDay)
        .count().get();
      return snap.data().count;
    })(),
    (async () => {
      const snap = await db.collection("bookings")
        .where("cancelledAt", ">=", startOfDay)
        .where("cancelledAt", "<", endOfDay)
        .count().get();
      return snap.data().count;
    })(),
  ]);

  return {
    date,
    newUsers,
    newProperties,
    newServices,
    newProducts,
    newBookings,
    confirmedBookings,
    cancelledBookings,
    agentFeeRevenue: confirmedBookings * 100,
  };
}