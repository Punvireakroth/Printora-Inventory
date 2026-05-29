"use client";

import { deleteStaff } from "@/features/users/actions/delete-staff-user";
import type { DeleteStaffErrorCode } from "@/features/users/actions/delete-staff-user";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { StaffUserListItem } from "@/features/users/types/staff-user";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type DeleteStaffDialogProps = {
  member: StaffUserListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function displayName (member: StaffUserListItem): string {
  const trimmed = member.fullName?.trim();
  if (trimmed) {
    return trimmed;
  }
  return member.email;
}

export function DeleteStaffDialog ({
  member,
  open,
  onOpenChange,
}: DeleteStaffDialogProps) {
  const t = useTranslations("staff");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errorCode, setErrorCode] = useState<DeleteStaffErrorCode | null>(null);

  function handleConfirm () {
    setErrorCode(null);
    startTransition(async () => {
      const result = await deleteStaff({ userId: member.id });
      if (!result.ok) {
        setErrorCode(result.code);
        return;
      }
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("deleteDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("deleteDialog.description", { name: displayName(member) })}
          </DialogDescription>
        </DialogHeader>

        {errorCode ? (
          <p className="text-sm text-destructive" role="alert">
            {t(`errors.${errorCode}`)}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            disabled={pending}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            {tCommon("cancel")}
          </Button>
          <Button
            disabled={pending}
            onClick={handleConfirm}
            type="button"
            variant="destructive"
          >
            {pending ? tCommon("loading") : t("deleteDialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
