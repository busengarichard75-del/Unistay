"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { universities } from "@/data/universities";

type Role = "student" | "landlord";

export function SignupForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [studentId, setStudentId] = useState("");
  const [universityId, setUniversityId] = useState(universities[0].id);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setIsSubmitting(true);

    if (!auth || !db) {
      setError("Authentication service is unavailable. Please try again.");
      setIsSubmitting(false);
      return;
    }

    try {
      const firebaseAuth = auth;
      const firestore = db;

      const credential = await createUserWithEmailAndPassword(
        firebaseAuth,
        email,
        password
      );

      await setDoc(doc(firestore, "users", credential.user.uid), {
        name,
        email,
        role,
        studentId: role === "student" ? studentId : null,
        universityId: role === "student" ? universityId : null,
      });

      router.push("/");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-4">
      <div className="flex rounded-full border border-gray-200 p-1">
        <button
          type="button"
          onClick={() => setRole("student")}
          className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
            role === "student"
              ? "bg-blue-600 text-white"
              : "text-gray-600"
          }`}
        >
          Student
        </button>

        <button
          type="button"
          onClick={() => setRole("landlord")}
          className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
            role === "landlord"
              ? "bg-blue-600 text-white"
              : "text-gray-600"
          }`}
        >
          Landlord
        </button>
      </div>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Full name"
        className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none"
      />

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none"
      />

      {role === "student" && (
        <>
          <input
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="Student ID"
            className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none"
          />

          <select
            value={universityId}
            onChange={(e) => setUniversityId(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none"
          >
            {universities.map((u) => (
              <option key={u.id} value={u.id} disabled={!u.isAvailable}>
                {u.name}
                {!u.isAvailable ? " (coming soon)" : ""}
              </option>
            ))}
          </select>
        </>
      )}

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none"
      />

      {error && (
        <p className="text-sm text-red-500">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300"
      >
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}