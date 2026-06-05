import type { AppModule } from "@/features/auth/constants/app-modules";

export type SystemSettingsFormInitial = {
  globalLowStock: number;
  isTelegramNotify: boolean;
  hasTelegramToken: boolean;
  telegramChatId: string | null;
  cashierAllowedModules: AppModule[];
};
