import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, QuerySnapshot, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { isAdminEmail } from "@/lib/admin";

interface NotificationCounts {
  pendingRequests: number; // for landlords – bookings with status "requested"
  pendingApprovals: number; // for students – bookings with status "approved" (waiting for payment)
  pendingPayments: number; // for admin – bookings with status "approved" (pending payment)
  total: number;
}

export function useNotifications() {
  const { user, role } = useAuth();
  const [counts, setCounts] = useState<NotificationCounts>({
    pendingRequests: 0,
    pendingApprovals: 0,
    pendingPayments: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const isAdmin = user && isAdminEmail(user.email);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Build queries based on role
    const queries: { q: any; key: keyof NotificationCounts }[] = [];

    if (role === "landlord") {
      const q = query(
        collection(db, "bookings"),
        where("landlordId", "==", user.uid),
        where("status", "==", "requested")
      );
      queries.push({ q, key: "pendingRequests" });
    } else if (role === "student") {
      const q = query(
        collection(db, "bookings"),
        where("studentId", "==", user.uid),
        where("status", "==", "approved")
      );
      queries.push({ q, key: "pendingApprovals" });
    } else if (isAdmin) {
      const q = query(
        collection(db, "bookings"),
        where("status", "==", "approved")
      );
      queries.push({ q, key: "pendingPayments" });
    }

    if (queries.length === 0) {
      setLoading(false);
      return;
    }

    // Use onSnapshot for real‑time updates
    const unsubscribes = queries.map(({ q, key }) => {
      return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
        setCounts((prev) => {
          const newCounts = { ...prev, [key]: snapshot.size };
          // Update total: sum all relevant counts
          newCounts.total = 0;
          if (role === "landlord") newCounts.total += newCounts.pendingRequests;
          if (role === "student") newCounts.total += newCounts.pendingApprovals;
          if (isAdmin) newCounts.total += newCounts.pendingPayments;
          return newCounts;
        });
        setLoading(false);
      }, (error) => {
        console.error("Notification listener error:", error);
        setLoading(false);
      });
    });

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [user, role, isAdmin]);

  return { counts, loading };
}