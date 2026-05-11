# Pre Plan Implementations

# Existing solution (Their excel)

[test.xlsx](Pre%20Plan%20Implementations/test.xlsx)

Based on the excel they do this

| Section | Meaning |
| --- | --- |
| Purchase / ទំនិញចូល | How many items came into stock |
| Sales / លក់ចេញ | How many items were sold |
| Stock / ទំនិញនៅសល់ | How many items remain |
| Unit Price / តម្លៃឯកតា | Selling price per item |
| Total Price / តម្លៃសរុប | Sales amount, calculated as `Sales Qty × Unit Price` |
- Their product schema

```jsx
  Coffee cups / tumblers
  Water bottles
  Different sizes
  Different colors
  Different designs
```

# System plan and feature

### Brief features

---

Based on the existing solution I can translate this into the system point of view that they would need these

- Product list
- Stock in
- POS sale - With system alert to telelgram, as well as, record of sale transactions
- Auto stock deduce
- Low stock alert
- Sale report
- Stock reort
- Dashboard to different users (Business owner & Staff/Cashier)
- UI language switching between English (`en`) and Khmer (`km`), with persisted preference (cookie and/or user profile; optional shop default in settings)

### User roles

---

There are two user roles, Business owner & Cashier. Different roles have different access control. 

**Business Owner - able to do and get these activities**

```jsx
- Manage products
- Manage categories 
- Manage suppliers
- Receive stock 
- Adjust stock 
- Receive complete sale alert via telegram bot
- View stock balance
- View stock movement history
- View all sales
- Manage cashier/staff accounts
```

**Cashier/Staff**

Can do ✅

```jsx
- Use POS screen
- Search product 
- Add product to be sale
- Change sale quantity
- Apply discount if allowed
- Complete sale
- Generate & print receipt
- View their own sale history
```

Cannot do ❌

```jsx
- Edit product cost
- Edit product selling price
- Delete products
- Change product stock
- View profit reports
- Manage users
```

# System details specifications

### System setting

System fields

| Field | Purpose | Example |
| --- | --- | --- |
| Minimum Stock | Warning level of product stock | 5 |
| Supplier Creation | Create all the supplier the business take the product from |   • ABC Supplier
  • Yinglong Supplier
  • … |
| Category Creation | Create product category the business is selling |   • Coffee cups
  • Water Bottle
  • Tumbler
  • Accessories
  • … |
| Default UI language (optional) | Locale for first-time visitors before they choose | `km` or `en` |
| User language preference | Stored per staff member so POS/dashboard reopen in their language | `km` or `en` |

### Product management

---

Product fields

| Field | Purpose | Example |
| --- | --- | --- |
| Product Name | Full product name | កែវកាហ្វេ 530ml |
| SKU | Internal product code | CUP-530-BLK-GOLD |
| Category | Product group | Coffee Cup |
| Size | Product size | 530ml |
| Color / Variant | Difference between similar products | Black Gold |
| Supplier | Where the product comes from | ABC Supplier |
| Cost Price | Buying price | $7 |
| Selling Price | Selling price | $12 |
| Current Stock | Quantity available | 7 |
| Status | Active / Inactive | Active |
| Image | Optional product photo | Product image |

### Stock in

---

Example of stock in 

```jsx
Product: កែវកាហ្វេ 530ml ខ្មៅ មាស
Quantity received: 20
Cost price: $7
Supplier: ABC Supplier
Date: 10 May 2026
Note: New delivery
```

System will do this calculation automatically

```jsx
Old stock: 7
Stock in: +20
New stock: 27
```

System will record transaction history like this 

| Product | Type | Qty | Old Stock | New Stock | User |
| --- | --- | --- | --- | --- | --- |
| កែវកាហ្វេ 530ml ខ្មៅ មាស | Stock In | +20 | 7 | 27 | Owner |

### POS selling flow

---

POS flow

```jsx
1. Cashier searches product by name, SKU, size, color, or category
2. Cashier selects product
3. Product is added to cart
4. Cashier adjusts quantity
5. Cashier applies discount if allowed
6. Cashier selects payment method
7. Cashier clicks Complete Sale
8. System creates sale record
9. System reduces stock automatically
10. System prints or shows receipt
```

Sale stock rules

```jsx
Add to cart → stock does not change yet
Complete sale → stock decreases
Cancel sale → stock does not change
Refund/return → stock increases if item is returned
```

### System calculation formula

---

Stock calculation

```jsx
Stock = Purchase - Sales
```

Low stock calculation

```jsx
IsLowStock = Stock <= LowStockQty (configed in setting)
```

### Report - Business Owner

```jsx
Today's Sales
Total Sales This Month
Low-Stock Products
Total Products
Total Stock Quantity
Best-Selling Products
Recent Sales
Recent Stock Movements
```

---

**Stock Balance - Search SKU**

| Product | Purchased | Sold | Current Stock | Unit Price | Sales Amount |
| --- | --- | --- | --- | --- | --- |
| កែវកាហ្វេ 530ml ខ្មៅ មាស | 2 | 1 | 1 | $12 | $12 |

**Sale transaction record - Filter (**Today, This week, This month, Custom date range, Staff)

| Date | Receipt No. | Staff | Total Amount | Payment Method |
| --- | --- | --- | --- | --- |
| 10 May 2026 | INV-001 | Dara | $24 | Cash |

**Best Selling product**

| Product | Quantity Sold | Sales Amount |
| --- | --- | --- |
| កែវកាហ្វេ 530ml ស ក្រហម | 16 | $192 |
| ដបទឹក 500ml សមានដៃយួរ | 7 | $56 |

**Low-Stock Report**

| Product | Current Stock | Minimum Stock | Status |
| --- | --- | --- | --- |
| កែវកាហ្វេ 530ml ខ្មៅ មាស | 1 | 5 | Low Stock |

**Stock movement**

| Date | Product | Type | Qty | Old Stock | New Stock | User |
| --- | --- | --- | --- | --- | --- | --- |
| 10 May | កែវកាហ្វេ 530ml | Stock In | +20 | 7 | 27 | Owner |
| 10 May | កែវកាហ្វេ 530ml | Sale | -2 | 27 | 25 | Staff |

**Profit Report** 

| Qty Sold | Sales Amount | Cost Amount | Profit |
| --- | --- | --- | --- |
| 10 | $120 | $70 | $50 |

### Language & UI locale (km | en)

---

**Locales**

- English: `en`
- Khmer: `km`

**Behavior**

- The **application UI** (menus, buttons, labels, validation messages, reports column headers, empty states) is translated via message catalogs for both locales.
- **Catalog data** (product names, supplier names, categories as typed by staff) is **not** machine-translated; it appears as stored (often Khmer, sometimes English), matching how the business works today.
- Users switch language from a clear control on main layouts (POS, dashboard, settings). The choice is remembered (recommended: save on `users.preferred_locale` and mirror in a cookie for fast SSR).
- Dates, numbers, and currency display follow the active locale where practical (e.g. Khmer digit shaping for `km`).
- Telegram sale alerts use the **cashier’s active UI language** when the sale completes so wording matches the POS screen.

**Routing (implementation note)**

- Prefer locale-prefixed routes with Next.js App Router (e.g. `/en/...`, `/km/...`) and middleware to resolve or redirect locale.

### Screens

---

Business Owner screens

```jsx
Dashboard
Products
Add/Edit Product
Receive Stock
Inventory / Stock Balance / Stock Adjustment
Stock Movements
Sales History
Reports
Staff Accounts
Settings (includes optional shop default language)
Language switcher (en | km) on primary shells
```

Cashier/Staff screens

```jsx
POS Sale Screen
Payment Screen
Receipt Screen
My Sales History
Language switcher (en | km) on POS and related flows
```