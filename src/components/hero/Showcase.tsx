import Image from "next/image";

export function Showcase() {
  return (
    <section className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 px-4 py-10 sm:grid-cols-2">
      <div className="relative h-64 w-full overflow-hidden rounded-2xl sm:h-80">
        <Image
          src="/2.JFIF"
          alt="Student boarding room"
          fill
          quality={100}
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      <div className="relative h-64 w-full overflow-hidden rounded-2xl sm:h-80">
        <Image
          src="/3.JFIF"
          alt="Student boarding house"
          fill
          quality={100}
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
    </section>
  );
}