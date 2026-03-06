import { useState, useEffect, useCallback } from "react";
import {
  caesarEncrypt, caesarDecrypt, caesarSteps,
  vigenereEncrypt, vigenereDecrypt, vigenereSteps,
  rot13, base64Encode, base64Decode,
  aesEncrypt, aesDecrypt,
  sha256Hash, hmacSha256,
  rsaGenerateKeys, rsaEncrypt, rsaDecrypt
} from "@/lib/crypto";

type CipherType = "caesar" | "vigenere" | "rot13" | "base64" | "aes" | "sha256" | "hmac" | "rsa";

const cipherInfo: Record<CipherType, { label: string; tag: string; tagColor: string; desc: string }> = {
  caesar: { label: "Caesar Cipher", tag: "Classical", tagColor: "hsl(174, 100%, 50%)", desc: "A substitution cipher that shifts each letter by a fixed number of positions in the alphabet. One of the oldest known ciphers, used by Julius Caesar." },
  vigenere: { label: "Vigenère Cipher", tag: "Classical", tagColor: "hsl(45, 100%, 60%)", desc: "A polyalphabetic cipher using a keyword to determine variable shift amounts for each letter. Much stronger than simple substitution." },
  rot13: { label: "ROT13", tag: "Classical", tagColor: "hsl(280, 80%, 65%)", desc: "A special case of Caesar cipher with a fixed shift of 13. Applying it twice returns the original text." },
  base64: { label: "Base64", tag: "Encoding", tagColor: "hsl(120, 60%, 50%)", desc: "A binary-to-text encoding scheme that represents data in an ASCII string format. Commonly used for data transfer." },
  aes: { label: "AES-256-GCM", tag: "Symmetric", tagColor: "hsl(200, 100%, 60%)", desc: "Advanced Encryption Standard with 256-bit key in Galois/Counter Mode. Industry-standard authenticated encryption." },
  sha256: { label: "SHA-256", tag: "Hashing", tagColor: "hsl(0, 80%, 60%)", desc: "Secure Hash Algorithm producing a 256-bit digest. A one-way function used for data integrity verification." },
  hmac: { label: "HMAC-SHA256", tag: "Authentication", tagColor: "hsl(30, 100%, 55%)", desc: "Hash-based Message Authentication Code using SHA-256. Provides both integrity and authenticity verification." },
  rsa: { label: "RSA-OAEP", tag: "Asymmetric", tagColor: "hsl(330, 80%, 60%)", desc: "RSA encryption with Optimal Asymmetric Encryption Padding. Uses public/private key pairs for secure communication." },
};

const isHashCipher = (c: CipherType) => c === "sha256";

export default function Index() {
  const [cipher, setCipher] = useState<CipherType>("caesar");
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [shift, setShift] = useState(3);
  const [key, setKey] = useState("");
  const [rsaKeys, setRsaKeys] = useState<{ publicKey: string; privateKey: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [steps, setSteps] = useState<any[]>([]);

  // Prevent copy
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener("copy", prevent);
    document.addEventListener("cut", prevent);
    document.addEventListener("contextmenu", prevent);
    return () => {
      document.removeEventListener("copy", prevent);
      document.removeEventListener("cut", prevent);
      document.removeEventListener("contextmenu", prevent);
    };
  }, []);

  // Generate RSA keys on cipher change
  useEffect(() => {
    if (cipher === "rsa" && !rsaKeys) {
      rsaGenerateKeys().then(setRsaKeys);
    }
  }, [cipher, rsaKeys]);

  const process = useCallback(async () => {
    if (!input) { setOutput(""); setSteps([]); return; }
    let result = "";
    const isEnc = mode === "encrypt";

    switch (cipher) {
      case "caesar":
        result = isEnc ? caesarEncrypt(input, shift) : caesarDecrypt(input, shift);
        setSteps(caesarSteps(input, shift, isEnc));
        break;
      case "vigenere":
        if (!key) { setOutput("Enter a key..."); setSteps([]); return; }
        result = isEnc ? vigenereEncrypt(input, key) : vigenereDecrypt(input, key);
        setSteps(vigenereSteps(input, key, isEnc));
        break;
      case "rot13":
        result = rot13(input);
        setSteps(caesarSteps(input, 13, true));
        break;
      case "base64":
        result = isEnc ? base64Encode(input) : base64Decode(input);
        setSteps([]);
        break;
      case "aes":
        if (!key) { setOutput("Enter a password..."); setSteps([]); return; }
        result = isEnc ? await aesEncrypt(input, key) : await aesDecrypt(input, key);
        setSteps([]);
        break;
      case "sha256":
        result = await sha256Hash(input);
        setSteps([]);
        break;
      case "hmac":
        if (!key) { setOutput("Enter a key..."); setSteps([]); return; }
        result = await hmacSha256(input, key);
        setSteps([]);
        break;
      case "rsa":
        if (!rsaKeys) { setOutput("Generating keys..."); return; }
        result = isEnc
          ? await rsaEncrypt(input, rsaKeys.publicKey)
          : await rsaDecrypt(input, rsaKeys.privateKey);
        setSteps([]);
        break;
    }
    setOutput(result);
  }, [input, cipher, mode, shift, key, rsaKeys]);

  useEffect(() => { process(); }, [process]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const needsKey = cipher === "vigenere" || cipher === "aes" || cipher === "hmac";
  const info = cipherInfo[cipher];

  return (
    <div className="min-h-screen bg-background grid-bg relative overflow-hidden">
      {/* Scan line effect */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden opacity-[0.03]">
        <div className="w-full h-px bg-primary" style={{ animation: "scan-line 8s linear infinite" }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <header className="text-center mb-10 animate-fade-in-up">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="animate-pulse-glow">
              <div className="w-10 h-10 rounded-lg border-2 border-primary flex items-center justify-center">
                <div className="w-4 h-4 rounded-sm bg-primary/60" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-wider text-primary text-glow font-mono">
              NEPTUNE
            </h1>
          </div>
          <p className="text-sm sm:text-base tracking-[0.3em] uppercase text-muted-foreground font-light mb-2">
            Encrypt Beyond the Horizon
          </p>
          <p className="text-xs text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Advanced browser-based cryptographic laboratory - Encrypt, Decrypt, Hash, Authenticate & Analyze in real time.
          </p>
        </header>

        {/* Cipher Tabs */}
        <nav className="flex flex-wrap justify-center gap-2 mb-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          {(Object.keys(cipherInfo) as CipherType[]).map((c) => (
            <button
              key={c}
              onClick={() => { setCipher(c); setOutput(""); setSteps([]); }}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 border ${
                cipher === c
                  ? "bg-primary/15 border-primary text-primary box-glow"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              <span className="text-muted-foreground mr-1">{cipherInfo[c].tag}</span>
              <span className="font-semibold">{cipherInfo[c].label}</span>
            </button>
          ))}
        </nav>

        {/* Encrypt / Decrypt Toggle */}
        {!isHashCipher(cipher) && (
          <div className="flex justify-center gap-1 mb-8 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <button
              onClick={() => setMode("encrypt")}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                mode === "encrypt"
                  ? "bg-primary text-primary-foreground box-glow-strong"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🔒 Encrypt
            </button>
            <button
              onClick={() => setMode("decrypt")}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                mode === "decrypt"
                  ? "bg-primary text-primary-foreground box-glow-strong"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🔓 Decrypt
            </button>
          </div>
        )}

        {/* Main Panels */}
        <div className="grid md:grid-cols-2 gap-4 mb-6 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          {/* Input Panel */}
          <div className="glass rounded-xl p-5 gradient-border">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                ✏️ Input
              </span>
              <span className="text-xs text-muted-foreground font-mono">{input.length} chars</span>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === "encrypt" ? "Enter plaintext to encrypt..." : "Enter ciphertext to decrypt..."}
              className="w-full h-32 bg-secondary/50 rounded-lg p-3 text-sm font-mono text-foreground placeholder:text-muted-foreground resize-none border border-border focus:border-primary focus:outline-none transition-colors"
              style={{ userSelect: "text" }}
            />

            {/* Cipher-specific controls */}
            {cipher === "caesar" && (
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground font-semibold tracking-wider uppercase">Shift Amount</span>
                  <span className="bg-primary/20 text-primary px-2 py-0.5 rounded font-mono font-bold">{shift}</span>
                </div>
                <input
                  type="range" min={1} max={25} value={shift}
                  onChange={(e) => setShift(Number(e.target.value))}
                  className="w-full accent-primary"
                  style={{ accentColor: "hsl(174, 100%, 50%)" }}
                />
              </div>
            )}
            {needsKey && (
              <div className="mt-3">
                <label className="text-xs text-muted-foreground font-semibold tracking-wider uppercase mb-1 block">
                  {cipher === "aes" ? "Password" : "Key"}
                </label>
                <input
                  type={cipher === "aes" ? "password" : "text"}
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder={cipher === "vigenere" ? "Enter keyword..." : cipher === "aes" ? "Enter password..." : "Enter secret key..."}
                  className="w-full bg-secondary/50 rounded-lg px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground border border-border focus:border-primary focus:outline-none transition-colors"
                  style={{ userSelect: "text" }}
                />
              </div>
            )}
            {cipher === "rsa" && rsaKeys && (
              <div className="mt-3 text-xs text-muted-foreground">
                <span className="text-primary">✓</span> RSA-2048 key pair generated
              </div>
            )}
          </div>

          {/* Output Panel */}
          <div className="glass rounded-xl p-5 gradient-border">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                📤 Output
              </span>
              <button
                onClick={handleCopy}
                className="text-xs px-3 py-1 rounded border border-border text-muted-foreground hover:text-primary hover:border-primary transition-all"
              >
                {copied ? "✓ Copied" : "📋 Copy"}
              </button>
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="Result will appear here..."
              className="w-full h-32 bg-secondary/50 rounded-lg p-3 text-sm font-mono text-primary/90 placeholder:text-muted-foreground resize-none border border-border"
            />
          </div>
        </div>

        {/* Step-by-Step Visualization */}
        <div className="glass rounded-xl p-5 gradient-border mb-6 animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-primary">⚡</span>
            <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
              Step-by-Step Visualization
            </span>
          </div>
          {steps.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="flex gap-2 pb-2 min-w-0">
                {steps.slice(0, 30).map((step, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 bg-secondary/50 rounded-lg p-3 border border-border min-w-[80px] text-center animate-fade-in-up"
                    style={{ animationDelay: `${i * 0.03}s` }}
                  >
                    <div className="text-lg font-mono font-bold text-foreground mb-1">
                      {step.original}
                    </div>
                    <div className="text-primary text-lg mb-1">↓</div>
                    <div className="text-lg font-mono font-bold text-primary text-glow">
                      {step.shifted || step.result}
                    </div>
                    {"shift" in step && (
                      <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                        +{step.shift}
                      </div>
                    )}
                    {"keyChar" in step && (
                      <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                        key: {step.keyChar}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {steps.length > 30 && (
                <p className="text-xs text-muted-foreground mt-2">Showing first 30 of {steps.length} steps</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6 italic">
              Type something to see how the algorithm transforms your data
            </p>
          )}
        </div>

        {/* Cipher Info */}
        <div className="glass rounded-xl p-5 gradient-border mb-6 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center gap-3">
            <span className="text-xl">🔐</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{info.label}</span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ backgroundColor: info.tagColor + "22", color: info.tagColor }}
                >
                  {info.tag}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{info.desc}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-8 animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
          <p className="text-xs text-muted-foreground">
            NEPTUNE Cryptographic Laboratory - Made with ❤️ by John Ofulue for security professionals
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            All computations run locally in your browser via the Web Crypto API.
          </p>
        </footer>
      </div>
    </div>
  );
}
