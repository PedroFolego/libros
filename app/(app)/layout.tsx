export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans selection:bg-brand-primary selection:text-white pb-20">
      {children}
    </div>
  );
}
