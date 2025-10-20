"use client";

import { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type WidgetShellProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function WidgetShell({ title, description, actions, children, className }: WidgetShellProps) {
  return (
    <Card className={cn("flex h-full flex-col", className)}>
      <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-5">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold leading-tight">{title}</h2>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div> : null}
      </div>
      <div className="flex-1 px-4 py-4 sm:px-5">{children}</div>
    </Card>
  );
}
