export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Molino RENTAL CRM</h1>
        <p className="mb-8 text-lg text-muted-foreground">
          Ingatlankezelő és karbantartási rendszer
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Bejelentkezés
          </a>
          <a
            href="/register"
            className="inline-flex items-center justify-center rounded-md border border-input px-6 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Regisztráció
          </a>
        </div>
      </div>
    </div>
  );
}