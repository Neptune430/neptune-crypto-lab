// Caesar Cipher
export function caesarEncrypt(text: string, shift: number): string {
  return text.replace(/[a-zA-Z]/g, (char) => {
    const base = char >= 'a' ? 97 : 65;
    return String.fromCharCode(((char.charCodeAt(0) - base + shift) % 26 + 26) % 26 + base);
  });
}

export function caesarDecrypt(text: string, shift: number): string {
  return caesarEncrypt(text, -shift);
}

export function caesarSteps(text: string, shift: number, encrypt: boolean): { original: string; shifted: string; code: number; newCode: number }[] {
  const s = encrypt ? shift : -shift;
  return text.split('').filter(c => /[a-zA-Z]/.test(c)).map(char => {
    const base = char >= 'a' ? 97 : 65;
    const code = char.charCodeAt(0);
    const newCode = ((code - base + s) % 26 + 26) % 26 + base;
    return { original: char, shifted: String.fromCharCode(newCode), code, newCode };
  });
}

// Vigenère Cipher
export function vigenereEncrypt(text: string, key: string): string {
  if (!key) return text;
  const k = key.toLowerCase();
  let ki = 0;
  return text.replace(/[a-zA-Z]/g, (char) => {
    const base = char >= 'a' ? 97 : 65;
    const shift = k.charCodeAt(ki % k.length) - 97;
    ki++;
    return String.fromCharCode(((char.charCodeAt(0) - base + shift) % 26) + base);
  });
}

export function vigenereDecrypt(text: string, key: string): string {
  if (!key) return text;
  const k = key.toLowerCase();
  let ki = 0;
  return text.replace(/[a-zA-Z]/g, (char) => {
    const base = char >= 'a' ? 97 : 65;
    const shift = k.charCodeAt(ki % k.length) - 97;
    ki++;
    return String.fromCharCode(((char.charCodeAt(0) - base - shift + 26) % 26) + base);
  });
}

export function vigenereSteps(text: string, key: string, encrypt: boolean): { original: string; keyChar: string; shift: number; result: string }[] {
  if (!key) return [];
  const k = key.toLowerCase();
  let ki = 0;
  return text.split('').filter(c => /[a-zA-Z]/.test(c)).map(char => {
    const base = char >= 'a' ? 97 : 65;
    const keyChar = k[ki % k.length];
    const shift = keyChar.charCodeAt(0) - 97;
    ki++;
    const newCode = encrypt
      ? ((char.charCodeAt(0) - base + shift) % 26) + base
      : ((char.charCodeAt(0) - base - shift + 26) % 26) + base;
    return { original: char, keyChar, shift, result: String.fromCharCode(newCode) };
  });
}

// ROT13
export function rot13(text: string): string {
  return caesarEncrypt(text, 13);
}

// Base64
export function base64Encode(text: string): string {
  try { return btoa(unescape(encodeURIComponent(text))); } catch { return 'Error encoding'; }
}

export function base64Decode(text: string): string {
  try { return decodeURIComponent(escape(atob(text))); } catch { return 'Invalid Base64 input'; }
}

// AES-256-GCM
export async function aesEncrypt(text: string, password: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt']
  );
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text));
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function aesDecrypt(ciphertext: string, password: string): Promise<string> {
  try {
    const enc = new TextEncoder();
    const data = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const encrypted = data.slice(28);
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['decrypt']
    );
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
    return new TextDecoder().decode(decrypted);
  } catch { return 'Decryption failed. Wrong key or corrupted data.'; }
}

// SHA-256
export async function sha256Hash(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// HMAC-SHA256
export async function hmacSha256(text: string, key: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(text));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// RSA-OAEP
export async function rsaGenerateKeys(): Promise<{ publicKey: string; privateKey: string }> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true, ['encrypt', 'decrypt']
  );
  const pub = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const priv = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  return {
    publicKey: btoa(String.fromCharCode(...new Uint8Array(pub))),
    privateKey: btoa(String.fromCharCode(...new Uint8Array(priv)))
  };
}

export async function rsaEncrypt(text: string, publicKeyB64: string): Promise<string> {
  try {
    const keyData = Uint8Array.from(atob(publicKeyB64), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey('spki', keyData, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']);
    const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, new TextEncoder().encode(text));
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  } catch { return 'Encryption failed. Check your public key.'; }
}

export async function rsaDecrypt(ciphertext: string, privateKeyB64: string): Promise<string> {
  try {
    const keyData = Uint8Array.from(atob(privateKeyB64), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey('pkcs8', keyData, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['decrypt']);
    const decrypted = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, key, Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0)));
    return new TextDecoder().decode(decrypted);
  } catch { return 'Decryption failed. Wrong key or corrupted data.'; }
}
