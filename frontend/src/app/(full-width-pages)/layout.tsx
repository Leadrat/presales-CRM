import React from "react";

export default function FullWidthPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617]">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-8">
        {children}
      </main>
    </div>
  );
}
