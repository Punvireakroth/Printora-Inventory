"use client";

import { LoadingLink } from "@/components/layout/loading-link";
import { Fragment } from "react";

export type PageBreadcrumbItem = {
  label: string;
  href?: string;
};

type PageBreadcrumbProps = {
  ariaLabel: string;
  items: PageBreadcrumbItem[];
};

export function PageBreadcrumb ({ ariaLabel, items }: PageBreadcrumbProps) {
  return (
    <nav aria-label={ariaLabel} className="text-base text-muted-foreground">
      {items.map((item, index) => (
        <Fragment key={`${item.label}-${index}`}>
          {index > 0 ? (
            <span aria-hidden className="mx-2">
              /
            </span>
          ) : null}
          {item.href ? (
            <LoadingLink className="hover:text-foreground" href={item.href}>
              {item.label}
            </LoadingLink>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
