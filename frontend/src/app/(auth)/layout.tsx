export const metadata = {
  title: "Auth | Pre-Sales CRM",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617]">
      {children}
    </div>
  );
}
