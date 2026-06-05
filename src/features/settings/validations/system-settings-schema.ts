import {
  APP_MODULES,
  type AppModule,
} from "@/features/auth/constants/app-modules";
import { z } from "zod";

const CashierModuleSchema = z.enum(APP_MODULES);

export const UpdateSystemSettingsSchema = z
  .object({
    globalLowStock: z.number().int().min(0),
    isTelegramNotify: z.boolean(),
    telegramBotToken: z.string().trim().optional(),
    telegramChatId: z.string().trim().optional(),
    cashierAllowedModules: z
      .array(CashierModuleSchema)
      .min(1)
      .refine(
        (modules) => modules.includes("pos"),
        { message: "pos_required" },
      ),
  })
  .superRefine((data, ctx) => {
    const Token = data.telegramBotToken?.trim() ?? "";
    if (Token.length > 0 && Token.length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["telegramBotToken"],
      });
    }
    if (data.isTelegramNotify) {
      const ChatId = data.telegramChatId?.trim() ?? "";
      if (!ChatId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["telegramChatId"],
        });
      }
    }
  });

export type UpdateSystemSettingsInput = z.infer<
  typeof UpdateSystemSettingsSchema
>;

export const CONFIGURABLE_CASHIER_MODULES = APP_MODULES.filter(
  (module): module is Exclude<AppModule, "pos"> => module !== "pos",
);
