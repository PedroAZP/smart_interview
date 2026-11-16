"""Serviço de autenticação e criptografia."""
import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Optional

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from app.config import settings


# ---------------------------------------------------------------------------
# Hashing de Senha (PBKDF2 HMAC-SHA256)
# ---------------------------------------------------------------------------
def hash_password(password: str) -> str:
    """Gera hash PBKDF2 com salt seguro de 16 bytes e 100.000 iterações."""
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
    return f"{salt.hex()}:{key.hex()}"


def verify_password(stored_password: str, provided_password: str) -> bool:
    """Valida a senha contra o hash armazenado usando tempo constante."""
    try:
        salt_hex, key_hex = stored_password.split(":")
        salt = bytes.fromhex(salt_hex)
        key = hashlib.pbkdf2_hmac("sha256", provided_password.encode("utf-8"), salt, 100_000)
        return secrets.compare_digest(key.hex(), key_hex)
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Tokens JWT (HMAC-SHA256 assinado com biblioteca padrão)
# ---------------------------------------------------------------------------
def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data_str: str) -> bytes:
    padding = "=" * (4 - (len(data_str) % 4))
    return base64.urlsafe_b64decode((data_str + padding).encode("ascii"))


def create_access_token(user_id: int, email: str, name: str, expires_in_days: int = 7) -> str:
    """Gera um JWT assinado com HMAC-SHA256."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": str(user_id),
        "user_id": user_id,
        "email": email,
        "name": name,
        "iat": int(time.time()),
        "exp": int(time.time()) + (expires_in_days * 86400),
    }

    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")

    secret_key = settings.jwt_secret.encode("utf-8")
    signature = hmac.new(secret_key, signing_input, hashlib.sha256).digest()
    signature_b64 = _b64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{signature_b64}"


def decode_access_token(token: str) -> Optional[dict]:
    """Verifica a assinatura e expiração do token JWT."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None

        header_b64, payload_b64, signature_b64 = parts
        signing_input = f"{header_b64}.{payload_b64}".encode("ascii")

        secret_key = settings.jwt_secret.encode("utf-8")
        expected_sig = hmac.new(secret_key, signing_input, hashlib.sha256).digest()
        provided_sig = _b64url_decode(signature_b64)

        if not hmac.compare_digest(expected_sig, provided_sig):
            return None

        payload_bytes = _b64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))

        if payload.get("exp", 0) < time.time():
            return None

        return payload
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Verificação de Token Google
# ---------------------------------------------------------------------------
def verify_google_credential(credential: str) -> Optional[dict]:
    """Valida criptograficamente o id_token do Google usando o GOOGLE_CLIENT_ID."""
    if not settings.google_client_id:
        print("ERRO DE CONFIGURAÇÃO: GOOGLE_CLIENT_ID não definido no arquivo .env.")
        return None

    try:
        idinfo = google_id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            settings.google_client_id,
        )
        return idinfo
    except Exception as e:
        print(f"Erro ao verificar token do Google: {e}")
        return None