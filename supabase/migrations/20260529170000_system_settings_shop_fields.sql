-- Phase 3.1: shop profile, low-stock default, Telegram alert config
-- (Contributor may refine column names when building the settings UI.)

ALTER TABLE public.system_settings
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS business_phone text,
  ADD COLUMN IF NOT EXISTS global_low_stock integer NOT NULL DEFAULT 5
    CHECK (global_low_stock >= 0),
  ADD COLUMN IF NOT EXISTS telegram_bot_token text,
  ADD COLUMN IF NOT EXISTS telegram_chat_id text,
  ADD COLUMN IF NOT EXISTS is_telegram_notify boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.system_settings.business_name IS 'Shop display name (receipts, alerts).';
COMMENT ON COLUMN public.system_settings.business_phone IS 'Contact phone shown on receipts or settings.';
COMMENT ON COLUMN public.system_settings.global_low_stock IS 'Default minimum stock alert when product.minimum_stock is 0.';
COMMENT ON COLUMN public.system_settings.telegram_bot_token IS 'Telegram Bot API token (owner-only via RLS).';
COMMENT ON COLUMN public.system_settings.telegram_chat_id IS 'Telegram chat/channel id for sale alerts.';
COMMENT ON COLUMN public.system_settings.is_telegram_notify IS 'When true, completed sales trigger Telegram alerts.';
