export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center px-6">
      <p className="font-heading text-2xl font-semibold tracking-[-0.02em]">
        ShelfLM
      </p>
      <p className="mt-3 max-w-[32ch] text-center text-sm leading-relaxed text-muted-foreground">
        Landing page later.{" "}
        <a
          href="/login"
          className="border-b border-border text-foreground transition-colors hover:border-primary"
        >
          Sign in
        </a>{" "}
        to enter.
      </p>
    </div>
  );
}
