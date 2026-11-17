import os
import base64
import hashlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from config import settings

class CryptoVault:
    def __init__(self, master_secret: str = None):
        secret = master_secret or settings.VAULT_MASTER_KEY
        # Derive a 256-bit (32 bytes) key deterministically using SHA-256
        self._key = hashlib.sha256(secret.encode()).digest()
        self._aesgcm = AESGCM(self._key)

    def encrypt_api_key(self, plaintext_key: str) -> str:
        """Encrypts plaintext API key into a base64 encoded ciphertext string."""
        if not plaintext_key:
            return ""
        nonce = os.urandom(12) # Standard 96-bit nonce for AES-GCM
        ciphertext = self._aesgcm.encrypt(nonce, plaintext_key.encode('utf-8'), None)
        combined = nonce + ciphertext
        return base64.b64encode(combined).decode('utf-8')

    def decrypt_api_key(self, encrypted_payload: str) -> str:
        """Decrypts base64 encoded payload back into plaintext."""
        if not encrypted_payload:
            return ""
        try:
            combined = base64.b64decode(encrypted_payload.encode('utf-8'))
            nonce = combined[:12]
            ciphertext = combined[12:]
            decrypted = self._aesgcm.decrypt(nonce, ciphertext, None)
            return decrypted.decode('utf-8')
        except Exception as e:
            raise ValueError(f"Vault decryption failed: {str(e)}")

    @staticmethod
    def generate_fingerprint(api_key: str) -> str:
        """Generates a safe UI display mask e.g. sk-proj...7f8d without leaking the key."""
        if not api_key:
            return "not-set"
        clean = api_key.strip()
        if len(clean) <= 8:
            return f"{clean[:2]}...{clean[-2:]}"
        prefix = clean[:6] if clean.startswith("sk-") else clean[:4]
        suffix = clean[-4:]
        return f"{prefix}...{suffix}"

vault = CryptoVault()
