# db schema

# Users

| Column | Type | Note |
| --- | --- | --- |
| id | uuid | Primary key |
| full_name | text | Staff or owner name |
| email | text | Login email |
| password_hash | text | If not using Supabase Auth directly |
| role | enum | OWNER, CASHIER |
| status | enum | ACTIVE, INACTIVE |
| preferred_locale | text | Nullable; `en` or `km`. Persisted UI language after user switches language; drives SSR/session defaults together with cookie. |
| created_at | timestamp | Created date |
| updated_at | timestamp | Updated date |

Constraint (recommended): `preferred_locale IS NULL OR preferred_locale IN ('en','km')`.

# Categories

| Column | Type | Note |
| --- | --- | --- |
| id | uuid | Primary key |
| name | text | Category name |
| description | text | Optional |
| status | enum | ACTIVE, INACTIVE |
| created_at | timestamp | Created date |
| updated_at | timestamp | Updated date |

# Suppliers

| Column | Type | Note |
| --- | --- | --- |
| id | uuid | Primary key |
| name | text | Supplier name |
| phone | text | Optional |
| address | text | Optional |
| note | text | Optional |
| status | enum | ACTIVE, INACTIVE |
| created_at | timestamp | Created date |
| updated_at | timestamp | Updated date |

# Products

| Column | Type | Note |
| --- | --- | --- |
| id | uuid | Primary key |
| category_id | uuid | FK to categories |
| supplier_id | uuid | FK to suppliers, nullable |
| product_name | text | Example: កែវកាហ្វេ 530ml |
| sku | text | Unique internal code |
| size | text | Example: 530ml |
| color | text | Example: Black Gold |
| design | text | Optional |
| cost_price | numeric | Buying price |
| selling_price | numeric | Selling price |
| current_stock | integer | Current available stock |
| minimum_stock | integer | Low stock warning qty |
| image_url | text | Optional |
| status | enum | ACTIVE, INACTIVE |
| created_at | timestamp | Created date |
| updated_at | timestamp | Updated date |

# Stock Movements

| Column | Type | Note |
| --- | --- | --- |
| id | uuid | Primary key |
| product_id | uuid | FK to products |
| user_id | uuid | User who performed action |
| movement_type | enum | STOCK_IN, SALE, ADJUSTMENT, REFUND |
| quantity | integer | Positive or negative |
| old_stock | integer | Stock before change |
| new_stock | integer | Stock after change |
| reference_id | uuid | Sale ID or stock receive ID, nullable |
| note | text | Optional |
| created_at | timestamp | Created date |

# Stock Receives

| Column | Type | Note |
| --- | --- | --- |
| id | uuid | Primary key |
| supplier_id | uuid | FK to suppliers |
| received_by | uuid | FK to users |
| receive_no | text | Example: REC-0001 |
| note | text | Optional |
| received_at | timestamp | Stock receive date |
| created_at | timestamp | Created date |

# Stock Receive Items

| Column | Type | Note |
| --- | --- | --- |
| id | uuid | Primary key |
| stock_receive_id | uuid | FK to stock_receives |
| product_id | uuid | FK to products |
| quantity | integer | Received quantity |
| cost_price | numeric | Cost at receive time |
| created_at | timestamp | Created date |

# Sales

| Column | Type | Note |
| --- | --- | --- |
| id | uuid | Primary key |
| receipt_no | text | Example: INV-0001 |
| cashier_id | uuid | FK to users |
| subtotal_amount | numeric | Before discount |
| discount_amount | numeric | Total discount |
| total_amount | numeric | Final amount |
| payment_method | enum | CASH, BANK_TRANSFER, ABA, OTHER |
| sale_status | enum | COMPLETED, CANCELLED, REFUNDED |
| telegram_sent | boolean | Whether alert was sent |
| locale_at_sale | text | `en` or `km`; UI locale when sale completed (Telegram wording, receipts labels if localized, audit). Nullable for legacy rows. |
| created_at | timestamp | Sale date |

Constraint (recommended): `locale_at_sale IS NULL OR locale_at_sale IN ('en','km')`.

# Sale Items

| Column | Type | Note |
| --- | --- | --- |
| id | uuid | Primary key |
| sale_id | uuid | FK to sales |
| product_id | uuid | FK to products |
| product_name_snapshot | text | Keep name at sale time |
| sku_snapshot | text | Keep SKU at sale time |
| quantity | integer | Sold quantity |
| unit_price | numeric | Selling price at sale time |
| cost_price_snapshot | numeric | Cost at sale time |
| discount_amount | numeric | Item discount |
| total_amount | numeric | Quantity × unit price - discount |
| created_at | timestamp | Created date |

**Snapshot fields are important:**

If product name, SKU, cost, or selling price changes later, old receipts and profit reports still remain correct.

# Stock Adjustments

| Column | Type | Note |
| --- | --- | --- |
| id | uuid | Primary key |
| product_id | uuid | FK to products |
| adjusted_by | uuid | FK to users |
| stock_movements | uuid | FK to stock movement |
| old_stock | integer | Before adjustment |
| new_stock | integer | After adjustment |
| reason | text | Required |
| created_at | timestamp | Created date |

# Settings (`system_settings`)

| Column | Type | Note |
| --- | --- | --- |
| id | uuid | Primary key |
| setting_key | text | Example: telegram_bot_token |
| global_low_stock | integer | Minimum low stock alert |
| default_locale | text | Shop-wide fallback UI language for first visits: `en` or `km`. Used when user has no `preferred_locale` and no cookie yet. |
| business_name | text | Optional — e.g. Printora |
| business_phone | text | Optional |
| supplier | LOOKUP |  |
| Categories | LOOKUP |  |
| Colors | LOOKUP |  |
| Size | LOOKUP |  |
| updated_at | timestamp | Updated date |

Constraint (recommended): `default_locale IS NULL OR default_locale IN ('en','km')`.

---

## Internationalization (language support)

Supported UI locales: **`en`** (English) and **`km`** (Khmer).

| Concern | Stored in DB | Not stored in DB |
| --- | --- | --- |
| User’s language choice | `users.preferred_locale` | — |
| Shop default before any preference | `system_settings.default_locale` | — |
| Locale at POS checkout / Telegram | `sales.locale_at_sale` | — |
| Product/category/supplier display names | — | Entered as-is (`product_name`, etc.); app UI chrome uses message catalogs in code |

**Resolution order (recommended):** URL segment (`/en/…`, `/km/…`) is authoritative for routing; then cookie mirror; then `users.preferred_locale` after login; then `system_settings.default_locale`; finally app default (e.g. `km` if product chooses one).

Message JSON files (`messages/en.json`, `messages/km.json`) stay in the repo — they are not database tables.

See also [.cursor/rules/project-rules.mdc](../.cursor/rules/project-rules.mdc) (Internationalization rules) and [business-analysis.md](./business-analysis.md) (Language & UI locale).