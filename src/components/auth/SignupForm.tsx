"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Eye, EyeOff, User, Mail, Lock, Phone, IdCard, School } from "lucide-react";
import { toast } from "sonner";
import { universities } from "@/data/universities";

export default function SignupForm() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");   // ✅ full name as on NRC
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "landlord">("student");
  const [university, setUniversity] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (role === "student") {
      if (!studentNumber.trim()) {
        toast.error("Please enter your Student ID.");
        return;
      }
      if (!university) {
        toast.error("Please select your university.");
        return;
      }
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: fullName });

      const userData: any = {
        fullName,          // ✅ using fullName
        email,
        phone,
        role,
        createdAt: Date.now(),
        hasAcceptedTerms: false,
      };

      if (role === "student") {
        userData.studentNumber = studentNumber.trim();
        userData.university = university;
      }

      await setDoc(doc(db, "users", user.uid), userData);

      toast.success("Account created successfully!");
      router.push(role === "landlord" ? "/dashboard/landlord" : "/");
    } catch (error: any) {
      console.error("Signup error:", error);
      if (error.code === "auth/email-already-in-use") {
        toast.error("This email is already registered.");
      } else if (error.code === "auth/weak-password") {
        toast.error("Password should be at least 6 characters.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Full Name (as on NRC) */}
      <div className="relative">
        <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full Name (as on NRC)"
          className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>

      <div className="relative">
        <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email Address"
          className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>

      <div className="relative">
        <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone Number (e.g., +260 97 123 4567)"
          className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>

      {role === "student" && (
        <>
          <div className="relative">
            <School size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none"
              disabled={isLoading}
            >
              <option value="">Select your university</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <IdCard size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value)}
              placeholder="Student ID (e.g., 2023123456)"
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>
        </>
      )}

      <div className="relative">
        <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min. 6 characters)"
          className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <div className="flex gap-2 rounded-full border border-gray-200 p-1">
        <button
          type="button"
          onClick={() => setRole("student")}
          className={`flex-1 rounded-full py-2 text-xs font-medium transition-colors ${
            role === "student" ? "bg-blue-600 text-white" : "text-gray-600"
          }`}
        >
          Student
        </button>
        <button
          type="button"
          onClick={() => setRole("landlord")}
          className={`flex-1 rounded-full py-2 text-xs font-medium transition-colors ${
            role === "landlord" ? "bg-blue-600 text-white" : "text-gray-600"
          }`}
        >
          Landlord
        </button>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300"
      >
        {isLoading ? "Creating account..." : "Sign Up"}
      </button>

      <p className="text-center text-xs text-gray-500">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="text-blue-600 hover:underline"
        >
          Log In
        </button>
      </p>
    </form>
  );
}