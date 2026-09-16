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
          Your campus, all in one place.
        </p>
        <p className="mt-2 text-sm text-gray-500 sm:text-base">
          Find verified rooms, trusted services, and student deals — everything
          you need to settle in and thrive at university.
        </p>
      </div>
    </section>
  );
}