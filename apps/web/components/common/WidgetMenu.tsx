"use client";

import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/lib/hooks/use-translation";

type WidgetMenuProps = {
  onDownloadCsv?: () => void;
  onToggleTable?: () => void;
  onShowDefinition?: () => void;
  disabled?: boolean;
};

export function WidgetMenu({ onDownloadCsv, onToggleTable, onShowDefinition, disabled }: WidgetMenuProps) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" aria-label={t("widget.options")} disabled={disabled}>
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {onDownloadCsv ? (
          <DropdownMenuItem onSelect={onDownloadCsv}>{t("widget.downloadCsv")}</DropdownMenuItem>
        ) : null}
        {onToggleTable ? (
          <DropdownMenuItem onSelect={onToggleTable}>{t("widget.toggleTable")}</DropdownMenuItem>
        ) : null}
        {onShowDefinition ? (
          <>
            {(onDownloadCsv || onToggleTable) && <DropdownMenuSeparator />}
            <DropdownMenuItem onSelect={onShowDefinition}>{t("widget.definition")}</DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
