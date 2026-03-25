export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-mono text-6xl font-bold text-[var(--text-muted)] mb-4">404</h1>
        <p className="font-sans text-sm text-[var(--text-secondary)]">
          Page not found
        </p>
      </div>
    </div>
  );
}
