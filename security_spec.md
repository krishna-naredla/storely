# STORELLY SECURITY SPECIFICATION & THREAT MODEL (PHASE 10)

## 1. System Overview & Security Principles
Storelly is a multi-tenant business Operating System for local commerce, retail vendors, and creator storefronts.
Security in Storelly enforces zero-trust architecture:
1. **Never trust client state**: All payment verifications, subscription upgrades, digital downloads, and role elevations must be authenticated and validated server-side.
2. **Tenant Isolation**: User A cannot read, list, update, or delete User B's private business data (orders, bookings, customers, expenses, payouts, settings).
3. **Least Privilege**: Public storefront visitors can only read published/active showcase data (products, categories, reviews, events). Private transactional collections (`orders`, `bookings`, `tickets`, `quotes`, `payment_transactions`) are strictly protected.
4. **Data Invariants**: Critical identifiers like `ownerId` are immutable. Authoritative fields like `paymentStatus: 'paid'` and `subscriptionStatus: 'active'` cannot be self-assigned by clients.

---

## 2. Core Data Invariants

### 2.1. Business Profiles (`/businesses/{businessId}`)
- **Creation**: Requires authenticated user (`request.auth != null`). The initial `ownerId` must strictly match `request.auth.uid`. Initial `subscriptionPlan` can only be `free` or `starter`; initial `subscriptionStatus` can only be `trial`, `inactive`, or `pending`.
- **Updates**: Only the verified owner or system admin. `ownerId` is strictly IMMUTABLE (`request.resource.data.ownerId == resource.data.ownerId`). Non-admins cannot alter `subscriptionPlan` or `subscriptionStatus`.
- **Deletion**: Only the verified owner or system admin.

### 2.2. Orders & Bookings (`/businesses/{businessId}/orders/*`, `/businesses/{businessId}/bookings/*`)
- **Creation**: Allowed for storefront customers, but client MUST NOT set `paymentStatus: 'paid'`, `status: 'delivered'`, or `status: 'confirmed'` on creation.
- **List Queries**: Denied to public and non-owners. Only the business owner or system admin can list all business orders.
- **Single Document Read (`get`)**: Business owner or authenticated customer whose `customerId` matches `request.auth.uid`.
- **Mutation**: Customers cannot modify payment status. Order status updates are restricted to the business owner and server-side payment verification.

### 2.3. Authoritative Payments (`/payment_transactions/*`)
- **Read**: NEVER publicly readable. Strictly restricted to system admins (`isAdmin()`).
- **Write**: Client write completely disabled (`allow write: if false;`). Only trusted backend processes using the Firebase Admin SDK / `serverDb` can create authoritative payment records after HMAC verification.

### 2.4. Audit Logs (`/admin_audit_logs/*`)
- **Read**: Strictly restricted to system admins (`isAdmin()`).
- **Write**: Clients cannot anonymously create audit logs (`allow create: if isAdmin();`). Update and delete are forbidden.

### 2.5. Support Tickets (`/platform_support_tickets/*`)
- **Tenant Isolation**: An authenticated user can only read support tickets where their verified email matches `senderEmail` OR where they own the `businessId` referenced in the ticket. Global list access is reserved for admins.

---

## 3. "Dirty Dozen" Threat Payloads & Mitigations

| # | Attack Vector / Payload | Targeted Resource | Expected Result | Mitigation Rule / Logic |
|---|-------------------------|-------------------|-----------------|-------------------------|
| 1 | **Cross-Tenant Business Takeover**<br>`updateDoc(doc(db, "businesses", "biz_b"), { name: "Hacked" })` by User A | `/businesses/{businessId}` | **PERMISSION_DENIED (403)** | `resource.data.ownerId == request.auth.uid` check fails. |
| 2 | **Privilege Escalation on Creation**<br>`setDoc(doc(db, "businesses", "biz_new"), { ownerId: auth.uid, subscriptionStatus: "active", subscriptionPlan: "pro" })` | `/businesses/{businessId}` | **PERMISSION_DENIED (403)** | Rule blocks client from setting non-free subscription on creation. |
| 3 | **Owner ID Hijacking on Update**<br>`updateDoc(doc(db, "businesses", "biz_a"), { ownerId: "attacker_uid" })` | `/businesses/{businessId}` | **PERMISSION_DENIED (403)** | `request.resource.data.ownerId == resource.data.ownerId` invariant enforced. |
| 4 | **Mass Order PII Scraping**<br>`getDocs(collection(db, "businesses", "biz_victim", "orders"))` | `/businesses/{businessId}/orders` | **PERMISSION_DENIED (403)** | `allow list: if isBusinessOwner(businessId);` prevents unauthorized list queries. |
| 5 | **Self-Granted Free Order**<br>`addDoc(collection(db, "businesses", "biz_1", "orders"), { total: 5000, paymentStatus: "paid", status: "confirmed" })` | `/businesses/{businessId}/orders` | **PERMISSION_DENIED (403)** | `isValidClientOrderCreate()` rejects `paymentStatus: 'paid'` from client. |
| 6 | **Self-Granted Free Booking**<br>`addDoc(collection(db, "businesses", "biz_1", "bookings"), { totalPrice: 1500, paymentStatus: "paid", status: "confirmed" })` | `/businesses/{businessId}/bookings` | **PERMISSION_DENIED (403)** | `isValidClientBookingCreate()` rejects `paymentStatus: 'paid'` from client. |
| 7 | **Forged Event Ticket Pass**<br>`addDoc(collection(db, "businesses", "biz_1", "tickets"), { eventId: "paid_evt", paymentStatus: "paid" })` | `/businesses/{businessId}/tickets` | **PERMISSION_DENIED (403)** | Rule checks `get(event).data.isFree == true` before allowing client create. |
| 8 | **Forged Payment Transaction Injection**<br>`setDoc(doc(db, "payment_transactions", "tx_fake"), { status: "success", amount: 199 })` | `/payment_transactions/{id}` | **PERMISSION_DENIED (403)** | `allow write: if false;` in Firestore rules. |
| 9 | **Public Payment Ledger Leak**<br>`getDocs(collection(db, "payment_transactions"))` by unauthenticated visitor | `/payment_transactions` | **PERMISSION_DENIED (403)** | `allow read: if isAdmin();` denies non-admin access. |
| 10 | **Admin Audit Log Pollution**<br>`addDoc(collection(db, "admin_audit_logs"), { action: "SPAM", adminEmail: "fake@storelly.com" })` | `/admin_audit_logs` | **PERMISSION_DENIED (403)** | `allow create: if isAdmin();` prevents anonymous creation. |
| 11 | **Cross-Tenant Support Ticket Espionage**<br>`getDocs(collection(db, "platform_support_tickets"))` by regular user | `/platform_support_tickets` | **PERMISSION_DENIED (403)** | Rule mandates email match or business ownership. |
| 12 | **Direct Digital Asset Exfiltration**<br>`getDocs(collection(db, "businesses", "biz_1", "digital_products"))` | `/businesses/{businessId}/digital_products` | **PERMISSION_DENIED (403)** | Subcollection restricted to `isBusinessOwner(businessId);`. Downloads must pass HMAC proxy. |

---

## 4. Backend API Hardening Matrix

| Endpoint | Method | Authentication | Rate Limiting | Validation & Authority |
|---|---|---|---|---|
| `/api/cloudinary/sign` | POST | Firebase Auth (`verifyAuth`) | 30 req/min | Validates timestamp freshness (<5m) & parameters |
| `/api/digital/delete-file` | POST | Firebase Auth (`verifyAuth`) | 30 req/min | Regex sanitization on `publicId` (no path traversal) |
| `/api/digital/free` | POST | Public | 30 req/min | Canonical DB resolution: checks `isFree == true` or `price == 0` |
| `/api/digital/create-order` | POST | Public | 30 req/min | Canonical DB price resolution, validates `amount > 0` |
| `/api/digital/verify-payment` | POST | Public | 20 req/min | Timing-safe HMAC signature verification with fail-closed secret check |
| `/api/subscription/verify-payment`| POST | Public | 20 req/min | Timing-safe HMAC check; writes authoritative transaction via serverDb; updates business subscription server-side |
| `/api/digital/download` | GET | Token HMAC | 40 req/min | 10-minute expiry; strict hostname allowlist (Cloudinary / Google Cloud Storage) |
| `/api/orders/track` | GET | Token / Phone | 60 req/min | Phone digit match or customer auth; returns sanitized order snapshot |
| `/api/ai/chat` | POST | Public / Merchant | 20 req/min | Max 4,000 chars; sanitizes prompt; prevents Gemini quota exhaustion |
| `/api/events/cancellation-notice` | POST | Firebase Auth (`verifyAuth`) | 15 req/min | Enforces ownership check of target business |
