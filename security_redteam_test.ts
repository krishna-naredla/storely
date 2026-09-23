/**
 * STORELLY PHASE 10 RED-TEAM SECURITY TEST RUNNER
 * Validates Data Invariants, Dirty Dozen Payloads, Timing Attacks, and API Security Controls
 */

import crypto from "crypto";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

// 1. Timing-Safe Compare Verification
function timingSafeCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

console.log("--- TEST SUITE 1: CRYPTOGRAPHIC SIGNATURE & TIMING-ATTACK RESISTANCE ---");
const secret = "test_rzp_secret_key_12345";
const orderId = "order_abc123";
const paymentId = "pay_xyz789";
const validSignature = crypto
  .createHmac("sha256", secret)
  .update(`${orderId}|${paymentId}`)
  .digest("hex");

const forgedSignature = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

assert(timingSafeCompare(validSignature, validSignature) === true, "Valid payment signature matches exactly");
assert(timingSafeCompare(forgedSignature, validSignature) === false, "Forged signature rejected");
assert(timingSafeCompare("", validSignature) === false, "Empty signature rejected safely without crash");
assert(timingSafeCompare("short", validSignature) === false, "Mismatched length rejected safely");

// 2. Token Tampering & Expiry Verification
console.log("\n--- TEST SUITE 2: SECURE DOWNLOAD TOKEN INTEGRITY & EXPIRATION ---");
const TOKEN_KEY = "storelly_digital_secret_test";

function createTestToken(payload: any): string {
  const base64Data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", TOKEN_KEY).update(base64Data).digest("base64url");
  return `${base64Data}.${signature}`;
}

function verifyTestToken(token: string): { valid: boolean; expired: boolean; payload?: any } {
  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false, expired: false };
  const [base64Data, signature] = parts;
  const expectedSig = crypto.createHmac("sha256", TOKEN_KEY).update(base64Data).digest("base64url");
  if (!timingSafeCompare(signature, expectedSig)) return { valid: false, expired: false };
  const payload = JSON.parse(Buffer.from(base64Data, "base64url").toString("utf8"));
  if (Date.now() > payload.expiresAt) return { valid: true, expired: true };
  return { valid: true, expired: false, payload };
}

const activeToken = createTestToken({
  itemId: "item_123",
  orderId: "ord_123",
  fileUrl: "https://res.cloudinary.com/storelly/image/upload/sample.pdf",
  expiresAt: Date.now() + 600000,
});
assert(verifyTestToken(activeToken).valid === true && verifyTestToken(activeToken).expired === false, "Fresh download token validates successfully");

const expiredToken = createTestToken({
  itemId: "item_123",
  orderId: "ord_123",
  fileUrl: "https://res.cloudinary.com/storelly/image/upload/sample.pdf",
  expiresAt: Date.now() - 5000,
});
assert(verifyTestToken(expiredToken).valid === true && verifyTestToken(expiredToken).expired === true, "Expired download token flagged as expired");

const tamperedToken = activeToken.slice(0, -6) + "xxxxxx";
assert(verifyTestToken(tamperedToken).valid === false, "Tampered signature rejected");

// 3. File Origin & Path Traversal Sanitization
console.log("\n--- TEST SUITE 3: INPUT SANITIZATION & SSRF / TRAVERSAL MITIGATION ---");
function isAuthorizedStorageOrigin(fileUrl: string): boolean {
  try {
    const parsed = new URL(fileUrl);
    const isCloudinary = parsed.hostname.endsWith(".cloudinary.com") || parsed.hostname === "res.cloudinary.com";
    const isFirebase = parsed.hostname.includes("firebasestorage.googleapis.com") || parsed.hostname.includes("storage.googleapis.com");
    return isCloudinary || isFirebase;
  } catch {
    return false;
  }
}

function isValidPublicId(publicId: string): boolean {
  if (typeof publicId !== "string" || !publicId) return false;
  return /^[a-zA-Z0-9_\-\/]+$/.test(publicId) && !publicId.includes("..");
}

assert(isAuthorizedStorageOrigin("https://res.cloudinary.com/storelly/raw/upload/guide.pdf") === true, "Legitimate Cloudinary URL permitted");
assert(isAuthorizedStorageOrigin("https://firebasestorage.googleapis.com/v0/b/storelly/o/asset.zip") === true, "Legitimate Firebase Storage URL permitted");
assert(isAuthorizedStorageOrigin("http://169.254.169.254/latest/meta-data/") === false, "AWS/Cloud Metadata SSRF attempt blocked");
assert(isAuthorizedStorageOrigin("http://localhost:3000/api/admin") === false, "Internal loopback SSRF attempt blocked");
assert(isAuthorizedStorageOrigin("https://evil-attacker-site.com/malware.exe") === false, "Arbitrary remote origin blocked");

assert(isValidPublicId("folder/subfolder/product_image_123") === true, "Clean Cloudinary publicId permitted");
assert(isValidPublicId("../../../etc/passwd") === false, "Directory traversal path blocked");
assert(isValidPublicId("image; rm -rf /") === false, "Command injection payload blocked");

// 4. Rate Limiter Functional Behavior
console.log("\n--- TEST SUITE 4: IN-MEMORY RATE LIMITING VERIFICATION ---");
const testLimiter = {
  requests: new Map<string, { count: number; resetTime: number }>(),
  max: 3,
  windowMs: 500,
  check(ip: string): boolean {
    const now = Date.now();
    const rec = this.requests.get(ip);
    if (!rec || now > rec.resetTime) {
      this.requests.set(ip, { count: 1, resetTime: now + this.windowMs });
      return true;
    }
    if (rec.count >= this.max) return false;
    rec.count += 1;
    return true;
  },
};

assert(testLimiter.check("1.2.3.4") === true, "Request 1 allowed");
assert(testLimiter.check("1.2.3.4") === true, "Request 2 allowed");
assert(testLimiter.check("1.2.3.4") === true, "Request 3 allowed");
assert(testLimiter.check("1.2.3.4") === false, "Request 4 blocked (exceeded limit)");
assert(testLimiter.check("9.9.9.9") === true, "Different IP not blocked by first IP's rate limit");

// 5. Invariant Validation: Client-side Order Creation Safety
console.log("\n--- TEST SUITE 5: FIRESTORE DATA INVARIANTS SIMULATION ---");
function isValidClientOrderCreate(data: any): boolean {
  if ('paymentStatus' in data && data.paymentStatus === 'paid' && data.total > 0) return false;
  if ('status' in data && (data.status === 'delivered' || data.status === 'confirmed')) return false;
  return true;
}

assert(isValidClientOrderCreate({ total: 500, paymentStatus: "unpaid", status: "pending" }) === true, "Standard unpaid checkout permitted");
assert(isValidClientOrderCreate({ total: 1000, paymentStatus: "paid", status: "confirmed" }) === false, "Dirty Dozen Payload 5: Client self-marking paid blocked");
assert(isValidClientOrderCreate({ total: 0, paymentStatus: "paid", status: "pending" }) === true, "Free zero-cost product checkout permitted");

console.log("\n========================================================");
console.log("🎯 ALL RED-TEAM SECURITY UNIT TESTS PASSED SUCCESSFULLY!");
console.log("========================================================\n");
