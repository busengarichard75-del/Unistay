// src/lib/sendBookingEmail.ts
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface BookingEmailData {
  to: string;
  studentName: string;
  propertyTitle: string;
  bookingId: string;
  // ... any other details
}

export async function sendBookingConfirmationEmail(data: BookingEmailData) {
  const mailRef = collection(db, "mail");
  
  const emailHtml = `
    <h1>Your Booking is Confirmed!</h1>
    <p>Hi ${data.studentName},</p>
    <p>Your booking for <strong>${data.propertyTitle}</strong> has been successfully confirmed.</p>
    <p>Booking ID: ${data.bookingId}</p>
    <p>You can view your booking pass in your dashboard.</p>
    <p>— The Peza Team</p>
  `;

  await addDoc(mailRef, {
    to: data.to,
    message: {
      subject: `🎉 Booking Confirmed: ${data.propertyTitle}`,
      html: emailHtml,
    },
  });
}