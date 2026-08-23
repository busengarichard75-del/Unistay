import { HeroHeadline } from "./HeroHeadline";
import { UserGreeting } from "@/components/UserGreeting";

export function Hero() {
  return (
    <section className="w-full bg-blue-50 px-4 py-20">
      <div className="mx-auto max-w-3xl text-center">
        {/* ✅ User Greeting - shows when logged in */}
        <UserGreeting />

        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          <HeroHeadline />
        </h1>
        <p className="mt-4 text-base text-gray-600 sm:text-lg">
          UniStay helps university students discover verified accommodation
          close to where they study.
        </p>
      </div>
    </section>
  );
}