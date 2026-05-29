"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function AddStaffSheetTrigger () {
  const t = useTranslations("staff");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} type="button">
        <Plus aria-hidden className="size-4" />
        {t("addStaff")}
      </Button>

      <Sheet onOpenChange={setOpen} open={open}>
        <SheetContent className="flex w-full flex-col sm:max-w-md" side="right">
          <SheetHeader>
            <SheetTitle>{t("addSheet.title")}</SheetTitle>
            <SheetDescription>{t("addSheet.description")}</SheetDescription>
          </SheetHeader>
          <div className="flex flex-1 flex-col justify-end gap-2 pt-4">
            <Button onClick={() => setOpen(false)} type="button" variant="outline">
              {t("addSheet.close")}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
