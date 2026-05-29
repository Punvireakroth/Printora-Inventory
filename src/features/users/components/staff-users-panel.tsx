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
import { AddStaffSheetTrigger } from "@/features/users/components/add-staff-sheet";
import type { StaffUserListItem } from "@/features/users/types/staff-user";
import { Link } from "@/i18n/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

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
  const [pending, startTransition] = useTransition();
  const [accountStatus, setAccountStatus] = useState(member.accountStatus);
  const isSelf = member.id === currentUserId;
  const isActive = accountStatus === "ACTIVE";
  const name = displayName(member);
  const ariaLabel = t("toggleAria", { name });

  function handleCheckedChange (checked: boolean) {
    const nextStatus = checked ? "ACTIVE" : "INACTIVE";
    const previous = accountStatus;
    setAccountStatus(nextStatus);

    startTransition(async () => {
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
      <TableCell className="font-medium">
        {name}
        {isSelf ? (
          <span className="ml-2 text-xs text-muted-foreground">({t("you")})</span>
        ) : null}
      </TableCell>
      <TableCell className="text-muted-foreground">{member.email}</TableCell>
      <TableCell>
        <Badge variant={member.role === "OWNER" ? "default" : "secondary"}>
          {t(`role.${member.role}`)}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge
          variant={accountStatus === "ACTIVE" ? "outline" : "destructive"}
        >
          {t(`status.${accountStatus}`)}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {format.dateTime(new Date(member.createdAt), {
          dateStyle: "medium",
        })}
      </TableCell>
      <TableCell className="text-right">
        <Switch
          aria-label={ariaLabel}
          checked={isActive}
          disabled={pending || isSelf}
          onCheckedChange={handleCheckedChange}
          title={isSelf ? t("cannotToggleSelf") : undefined}
        />
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
          <nav aria-label={t("breadcrumbAria")} className="text-sm text-muted-foreground">
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
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <AddStaffSheetTrigger />
      </div>

      <div className="rounded-xl border border-border bg-card">
        {sortedStaff.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.fullName")}</TableHead>
                <TableHead>{t("columns.email")}</TableHead>
                <TableHead>{t("columns.role")}</TableHead>
                <TableHead>{t("columns.status")}</TableHead>
                <TableHead>{t("columns.createdAt")}</TableHead>
                <TableHead className="w-[88px] text-right">
                  <span className="sr-only">{t("columns.activeToggle")}</span>
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
