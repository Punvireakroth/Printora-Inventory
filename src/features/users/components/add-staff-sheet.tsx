"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AddStaffForm } from "@/features/users/components/add-staff-form";
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
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md" side="right">
          <SheetHeader className="px-4 pt-4">
            <SheetTitle>{t("addSheet.title")}</SheetTitle>
            <SheetDescription>{t("addSheet.description")}</SheetDescription>
          </SheetHeader>
          <AddStaffForm
            onCancel={() => setOpen(false)}
            onSuccess={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
