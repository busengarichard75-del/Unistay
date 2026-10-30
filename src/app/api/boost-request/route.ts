// src/app/api/boost-request/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getFirestoreDb, getAuthAdmin } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const ADMIN_EMAIL = "busengarichard75@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const adminDb = getFirestoreDb();

    // 1. Verify the caller is logged in
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    
    let callerUid = "";
    try {
      const decoded = await getAuthAdmin().verifyIdToken(token);
      callerUid = decoded.uid;
    } catch {
      return NextResponse.json({ error: "Invalid token." }, { status: 401 });
    }

    const { title, body } = await req.json();
    if (!title || !body) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }

    // 2. Find the Admin's UID using the hardcoded email
    const adminQuery = await adminDb
      .collection("users")
      .where("email", "==", ADMIN_EMAIL)
      .limit(1)
      .get();

    if (adminQuery.empty) {
      return NextResponse.json({ error: "Admin not found." }, { status: 404 });
    }

    const adminUid = adminQuery.docs[0].id;

    // 3. Create a notification ONLY for the Admin
    await adminDb.collection("notifications").add({
      userId: adminUid,
      title,
      body,
      type: "announcement",
      read: false,
      createdAt: Date.now(),
      link: "/admin", // Sends you directly to the admin panel
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("boost-request error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}