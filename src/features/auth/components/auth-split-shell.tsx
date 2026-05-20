import { Instrument_Serif } from "next/font/google";
import Image from "next/image";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const welcomeSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-login-serif",
  display: "swap",
});

export function AuthMarketingPane ({
  welcomeText,
}: {
  welcomeText: string;
}) {
  return (
    <div className={cn(welcomeSerif.variable, 'relative hidden min-h-[42vh] flex-1 lg:block bg-[var(--brand-red)]')}>
      <Image src="/login-welcome.jpg" alt="Login Welcome" fill className="object-contain" />
    </div>
  );
}

export function AuthSplitShell ({
  form,
  hero,
}: {
  form: ReactNode;
  hero: ReactNode;
}) {
  return (
    <div className='grid min-h-[100dvh] w-full grid-cols-1 bg-background lg:grid-cols-2 lg:divide-x lg:divide-border'>
      <div className='flex flex-col lg:max-h-none'>{form}</div>
      {hero}
    </div>
  );
}
