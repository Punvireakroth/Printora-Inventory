"use client";

import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LanguageSwitcher } from "@/features/i18n/components/language-switcher";
import { SignOutControl } from "@/features/auth/components/sign-out-control";
import { LoadingLink } from "@/components/layout/loading-link";
import { usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  LayoutDashboard,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Warehouse,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useState } from "react";

const PRIMARY_NAV = [
  { href: "/dashboard", messageKey: "dashboard", icon: LayoutDashboard },
  { href: "/products", messageKey: "products", icon: Package },
  { href: "/stock/receives", messageKey: "stock", icon: Warehouse },
  { href: "/reports", messageKey: "reports", icon: BarChart3 },
  { href: "/pos", messageKey: "pos", icon: ShoppingCart },
  { href: "/settings", messageKey: "settings", icon: Settings },
] as const;

function navLinkActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const t = useTranslations("navigation");

  return (
    <nav
      aria-label={t("ariaPrimary")}
      className="flex flex-1 flex-col gap-1 overflow-y-auto p-3"
    >
      {PRIMARY_NAV.map(({ href, messageKey, icon: Icon }) => {
        const Active = navLinkActive(pathname, href);
        return (
          <LoadingLink
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2.5 text-base font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              Active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/70",
            )}
            href={href}
            key={href}
            onClick={onNavigate}
          >
            <Icon aria-hidden className="size-4 shrink-0 opacity-90" />
            {t(messageKey)}
          </LoadingLink>
        );
      })}
    </nav>
  );
}

function BrandMark({ className }: { className?: string }) {
  const t = useTranslations("layout");
  return (
    <BrandLogo
      alt={t("brandMark")}
      className={className}
      href="/dashboard"
      linkClassName="px-2 py-1 focus-visible:ring-sidebar-ring"
      size="sm"
    />
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const t = useTranslations("layout");

  return (
    <>
      <div className="flex min-h-screen w-full bg-muted/30">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
          <div className="flex h-14 items-center border-b border-sidebar-border px-4">
            <BrandMark />
          </div>
          <SidebarNav />
          <div className="mt-auto space-y-2 border-t border-sidebar-border p-3">
            <SignOutControl className="w-full" />
            <div className="flex justify-end">
              <LanguageSwitcher />
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4 md:hidden">
            <Button
              aria-label={t("openMenu")}
              onClick={() => setMobileNavOpen(true)}
              size="icon-sm"
              type="button"
              variant="outline"
            >
              <Menu className="size-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <BrandMark className="truncate text-foreground" />
            </div>
            <div className="ml-auto shrink-0">
              <LanguageSwitcher />
            </div>
          </header>

          <main
            aria-label={t("mainAria")}
            className="flex-1 overflow-auto p-4 md:p-6"
            id="main-content"
          >
            {children}
          </main>
        </div>
      </div>

      <Sheet onOpenChange={setMobileNavOpen} open={mobileNavOpen}>
        <SheetContent
          className="flex h-full max-h-dvh w-[min(100vw-2rem,18rem)] flex-col gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
          side="left"
        >
          <SheetHeader className="border-b border-sidebar-border px-4 py-3 text-left">
            <SheetTitle className="sr-only">{t("mobileNavTitle")}</SheetTitle>
            <BrandMark />
          </SheetHeader>
          <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
          <div className="mt-auto space-y-2 border-t border-sidebar-border p-3">
            <SignOutControl className="w-full" />
            <LanguageSwitcher />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
