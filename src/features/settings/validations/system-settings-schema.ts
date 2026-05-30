import { z } from "zod";

export const UpdateSystemSettingsSchema = z
  .object({
    globalLowStock: z.number().int().min(0),
    isTelegramNotify: z.boolean(),
    telegramBotToken: z.string().trim().optional(),
    telegramChatId: z.string().trim().optional(),
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
