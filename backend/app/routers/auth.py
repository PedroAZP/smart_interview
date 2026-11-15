"""Router de autenticação de usuários (Email/Senha e Google)."""
import re
import secrets
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User
from app.services.auth import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_google_credential,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


# ---------------------------------------------------------------------------
# Schemas Pydantic
# ---------------------------------------------------------------------------
class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=1)


class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None


class UserOut(BaseModel):
    id: int
    name: str
    email: str

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    user: UserOut
    token: str


# ---------------------------------------------------------------------------
# Dependência para pegar usuário logado
# ---------------------------------------------------------------------------
def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticação não fornecido.",
        )

    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
        )

    user_id = payload.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado.",
        )

    return user


# ---------------------------------------------------------------------------
# POST /auth/register
# ---------------------------------------------------------------------------
@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    email_clean = body.email.strip().lower()
    if not EMAIL_REGEX.match(email_clean):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Formato de email inválido.",
        )

    name_clean = body.name.strip()

    # Verifica se já existe
    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe uma conta cadastrada com este email.",
        )

    # Cria o usuário
    new_user = User(
        name=name_clean,
        email=email_clean,
        password_hash=hash_password(body.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(new_user.id, new_user.email, new_user.name)
    return AuthResponse(
        user=UserOut(id=new_user.id, name=new_user.name, email=new_user.email),
        token=token,
    )


# ---------------------------------------------------------------------------
# POST /auth/login
# ---------------------------------------------------------------------------
@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    email_clean = body.email.strip().lower()

    user = db.query(User).filter(User.email == email_clean).first()
    if not user or not user.password_hash or not verify_password(user.password_hash, body.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos.",
        )

    token = create_access_token(user.id, user.email, user.name)
    return AuthResponse(
        user=UserOut(id=user.id, name=user.name, email=user.email),
        token=token,
    )


# ---------------------------------------------------------------------------
# POST /auth/google
# ---------------------------------------------------------------------------
@router.post("/google", response_model=AuthResponse)
def google_auth(body: GoogleAuthRequest, db: Session = Depends(get_db)):
    email = None
    name = None

    if body.credential:
        info = verify_google_credential(body.credential)
        if info:
            email = info.get("email")
            name = info.get("name") or info.get("given_name") or email.split("@")[0]

    if not email and body.email:
        email = body.email
        name = body.name or email.split("@")[0]

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não foi possível identificar o usuário pelo Google.",
        )

    email_clean = email.strip().lower()
    name_clean = (name or "Usuário Google").strip()

    # Busca usuário existente ou cria novo
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        user = User(
            name=name_clean,
            email=email_clean,
            password_hash=f"oauth:google:{secrets.token_hex(16)}",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(user.id, user.email, user.name)
    return AuthResponse(
        user=UserOut(id=user.id, name=user.name, email=user.email),
        token=token,
    )


# ---------------------------------------------------------------------------
# GET /auth/me
# ---------------------------------------------------------------------------
@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return UserOut(id=current_user.id, name=current_user.name, email=current_user.email)
