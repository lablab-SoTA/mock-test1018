import { Suspense } from "react";
import type { ReactNode } from "react";

import { DashboardStateHydrator } from "@/components/header/DashboardStateHydrator";
import { GlobalHeader } from "@/components/header/GlobalHeader";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Suspense fallback={null}>
        <DashboardStateHydrator />
      </Suspense>
      <GlobalHeader />
      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
