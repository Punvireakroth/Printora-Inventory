"use client";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toggleStaffStatus } from "@/features/users/actions/toggle-staff-status";
import { useLoadingAction } from "@/hooks/use-loading-action";
import { AddStaffSheetTrigger } from "@/features/users/components/add-staff-sheet";
import { DeleteStaffDialog } from "@/features/users/components/delete-staff-dialog";
import type { StaffUserListItem } from "@/features/users/types/staff-user";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type StaffUsersPanelProps = {
  staff: StaffUserListItem[];
  currentUserId: string;
};

function displayName (member: StaffUserListItem): string {
  const trimmed = member.fullName?.trim();
  if (trimmed) {
    return trimmed;
  }
  return member.email;
}

function StaffUserRow ({
  member,
  currentUserId,
}: {
  member: StaffUserListItem;
  currentUserId: string;
}) {
  const t = useTranslations("staff");
  const format = useFormatter();
  const router = useRouter();
  const { run, isLoading } = useLoadingAction();
  const [accountStatus, setAccountStatus] = useState(member.accountStatus);
  const isSelf = member.id === currentUserId;
  const canDelete = !isSelf && member.role === "CASHIER";
  const isActive = accountStatus === "ACTIVE";
  const name = displayName(member);
  const ariaLabel = t("toggleAria", { name });
  const [deleteOpen, setDeleteOpen] = useState(false);

  function handleCheckedChange (checked: boolean) {
    const nextStatus = checked ? "ACTIVE" : "INACTIVE";
    const previous = accountStatus;
    setAccountStatus(nextStatus);

    void run(async () => {
      const result = await toggleStaffStatus({
        userId: member.id,
        accountStatus: nextStatus,
      });

      if (!result.ok) {
        setAccountStatus(previous);
        return;
      }

      setAccountStatus(result.accountStatus);
      router.refresh();
    });
  }

  return (
    <TableRow>
      <TableCell className="px-4 py-3 font-medium whitespace-normal">
        <div className="flex flex-col gap-0.5">
          <span className="line-clamp-2">{name}</span>
          {isSelf ? (
            <span className="text-xs text-muted-foreground">({t("you")})</span>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3 text-muted-foreground whitespace-normal">
        <span className="line-clamp-2 break-all">{member.email}</span>
      </TableCell>
      <TableCell className="px-4 py-3 whitespace-normal">
        <Badge variant={member.role === "OWNER" ? "default" : "secondary"}>
          {t(`role.${member.role}`)}
        </Badge>
      </TableCell>
      <TableCell className="px-4 py-3 whitespace-normal">
        <Badge
          variant={accountStatus === "ACTIVE" ? "outline" : "destructive"}
        >
          {t(`status.${accountStatus}`)}
        </Badge>
      </TableCell>
      <TableCell className="px-4 py-3 text-muted-foreground whitespace-normal">
        {format.dateTime(new Date(member.createdAt), {
          dateStyle: "medium",
        })}
      </TableCell>
      <TableCell className="px-4 py-3 whitespace-normal">
        <div className="flex items-center justify-end gap-2">
          {canDelete ? (
            <>
              <Button
                aria-label={t("deleteAria", { name })}
                onClick={() => setDeleteOpen(true)}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <Trash2 aria-hidden className="size-4 text-destructive" />
              </Button>
              <DeleteStaffDialog
                member={member}
                onOpenChange={setDeleteOpen}
                open={deleteOpen}
              />
            </>
          ) : null}
          <Switch
            aria-label={ariaLabel}
            checked={isActive}
            disabled={isLoading || isSelf}
            onCheckedChange={handleCheckedChange}
            title={isSelf ? t("cannotToggleSelf") : undefined}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}

export function StaffUsersPanel ({
  staff,
  currentUserId,
}: StaffUsersPanelProps) {
  const t = useTranslations("staff");
  const tNav = useTranslations("navigation");

  const sortedStaff = useMemo(
    () =>
      [...staff].sort((a, b) =>
        a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
      ),
    [staff],
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <nav aria-label={t("breadcrumbAria")} className="text-base text-muted-foreground">
            <Link className="hover:text-foreground" href="/settings">
              {tNav("settings")}
            </Link>
            <span aria-hidden className="mx-2">
              /
            </span>
            <span className="text-foreground">{t("title")}</span>
          </nav>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-base text-muted-foreground">{t("subtitle")}</p>
        </div>
        <AddStaffSheetTrigger />
      </div>

      <div className="rounded-xl border border-border bg-card">
        {sortedStaff.length === 0 ? (
          <p className="p-8 text-center text-base text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          <Table
            className="table-fixed"
            containerClassName="overflow-x-hidden"
          >
            <TableHeader>
              <TableRow>
                <TableHead className="w-[18%] px-4 py-3 whitespace-normal">
                  {t("columns.fullName")}
                </TableHead>
                <TableHead className="w-[28%] px-4 py-3 whitespace-normal">
                  {t("columns.email")}
                </TableHead>
                <TableHead className="w-[12%] px-4 py-3 whitespace-normal">
                  {t("columns.role")}
                </TableHead>
                <TableHead className="w-[12%] px-4 py-3 whitespace-normal">
                  {t("columns.status")}
                </TableHead>
                <TableHead className="w-[15%] px-4 py-3 whitespace-normal">
                  {t("columns.createdAt")}
                </TableHead>
                <TableHead className="w-[15%] px-4 py-3 text-right whitespace-normal">
                  {t("columns.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStaff.map((member) => (
                <StaffUserRow
                  currentUserId={currentUserId}
                  key={member.id}
                  member={member}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
