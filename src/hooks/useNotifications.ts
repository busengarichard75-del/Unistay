import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, QuerySnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { isAdminEmail } from "@/lib/admin";

interface NotificationCounts {
  pendingRequests: number;
  pendingApprovals: number;
  pendingPayments: number;
  total: number;
}

export function useNotifications() {
  const { user } = useAuth(); // ✅ Removed `role` from destructuring
  const [counts, setCounts] = useState<NotificationCounts>({
    pendingRequests: 0,
    pendingApprovals: 0,
    pendingPayments: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const isAdmin = user && isAdminEmail(user.email);
  const role = user?.role; // ✅ Use user.role directly

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let queries: any[] = [];

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
      return onSnapshot(q, (snapshot: QuerySnapshot) => {
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
      });
    });

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [user, role, isAdmin]);

  return { counts, loading };
}