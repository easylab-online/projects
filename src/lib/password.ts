/**
 * PBKDF2-SHA256 password hashing via Web Crypto SubtleCrypto.
 * Matches D1 seed: 100000 iterations, 32-byte derived key.
 * Salt is stored as a hex string; PBKDF2 salt bytes are the UTF-8
 * encoding of that hex string (same as the existing seeded user).
 */

const ITERATIONS = 100_000;
const KEY_BITS = 256; // 32 bytes

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function deriveKey(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(saltHex),
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    KEY_BITS,
  );
  return bytesToHex(new Uint8Array(bits));
}

/** Derive a PBKDF2-SHA256 hex hash for `password` using the given salt hex string. */
export async function hashPassword(
  password: string,
  saltHex: string,
): Promise<string> {
  return deriveKey(password, saltHex);
}

/** Verify password against stored salt + hash hex strings. */
export async function verifyPassword(
  password: string,
  saltHex: string,
  hashHex: string,
): Promise<boolean> {
  const derived = await deriveKey(password, saltHex);
  return timingSafeEqualHex(derived.toLowerCase(), hashHex.toLowerCase());
}
