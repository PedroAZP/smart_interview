"""Router de entrevistas/chat."""
import asyncio
import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Interview, Message
from app.services.llm import gerar_resposta_stream, gerar_titulo

router = APIRouter(prefix="/interviews", tags=["interviews"])


# ---------------------------------------------------------------------------
# Schemas Pydantic
# ---------------------------------------------------------------------------
class CreateInterviewRequest(BaseModel):
    message: str                    # Primeira mensagem do usuário
    job_description: Optional[str] = None
    resume_text: Optional[str] = None
    guest_id: Optional[str] = None  # ID anônimo gerado no front


class CreateInterviewResponse(BaseModel):
    id: str
    title: str


class SendMessageRequest(BaseModel):
    content: str


class InterviewSummary(BaseModel):
    id: str
    title: str
    created_at: str

    model_config = {"from_attributes": True}


class MessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: str

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# POST /interviews  → cria entrevista e retorna o ID
# ---------------------------------------------------------------------------
@router.post("", response_model=CreateInterviewResponse, status_code=201)
def create_interview(
    body: CreateInterviewRequest,
    db: Session = Depends(get_db),
):
    if not body.message.strip():
        raise HTTPException(status_code=422, detail="A mensagem não pode ser vazia.")

    # Gera o título usando a primeira mensagem
    titulo = gerar_titulo(body.message)

    # Cria a entrevista no banco
    interview = Interview(
        guest_id=body.guest_id or "anon",
        title=titulo,
        job_description=body.job_description,
        resume_text=body.resume_text,
    )
    db.add(interview)
    db.flush()  # obtém o id antes do commit

    # Salva a primeira mensagem do usuário
    db.add(Message(interview_id=interview.id, role="user", content=body.message))
    db.commit()
    db.refresh(interview)

    return CreateInterviewResponse(id=interview.id, title=interview.title)


# ---------------------------------------------------------------------------
# GET /interviews  → lista entrevistas (histórico da sidebar)
# ---------------------------------------------------------------------------
@router.get("", response_model=list[InterviewSummary])
def list_interviews(
    guest_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Interview).order_by(Interview.created_at.desc())
    if guest_id:
        q = q.filter(Interview.guest_id == guest_id)
    return q.limit(50).all()


# ---------------------------------------------------------------------------
# GET /interviews/{id}/messages  → mensagens de uma entrevista
# ---------------------------------------------------------------------------
@router.get("/{interview_id}/messages", response_model=list[MessageOut])
def get_messages(interview_id: str, db: Session = Depends(get_db)):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Entrevista não encontrada.")
    return interview.messages


# ---------------------------------------------------------------------------
# POST /interviews/{id}/reply  → gera resposta para a última mensagem do usuário (sem duplicar user msg)
# ---------------------------------------------------------------------------
@router.post("/{interview_id}/reply")
def reply_last_message(
    interview_id: str,
    db: Session = Depends(get_db),
):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Entrevista não encontrada.")

    last_msg = interview.messages[-1] if interview.messages else None
    if not last_msg or last_msg.role == "model":
        async def empty_stream():
            yield f"data: {json.dumps({'done': True})}\n\n"

        return StreamingResponse(
            empty_stream(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache"},
        )

    history = [
        {"role": m.role, "content": m.content}
        for m in interview.messages
    ]

    job_desc = interview.job_description
    resume_txt = interview.resume_text
    db.close()

    async def event_stream():
        full_response = ""
        try:
            async for chunk in gerar_resposta_stream(history, job_desc, resume_txt):
                full_response += chunk
                data = json.dumps({"chunk": chunk}, ensure_ascii=False)
                yield f"data: {data}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return

        from app.db import SessionLocal
        new_db = SessionLocal()
        try:
            latest = (
                new_db.query(Message)
                .filter(Message.interview_id == interview_id)
                .order_by(Message.id.desc())
                .first()
            )
            if latest and latest.role != "model":
                new_db.add(
                    Message(
                        interview_id=interview_id,
                        role="model",
                        content=full_response,
                    )
                )
                new_db.commit()
        finally:
            new_db.close()

        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ---------------------------------------------------------------------------
# POST /interviews/{id}/messages  → envia mensagem e faz streaming da resposta
# ---------------------------------------------------------------------------
@router.post("/{interview_id}/messages")
def send_message(
    interview_id: str,
    body: SendMessageRequest,
    db: Session = Depends(get_db),
):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Entrevista não encontrada.")
    if not body.content.strip():
        raise HTTPException(status_code=422, detail="Mensagem vazia.")

    # Salva mensagem do usuário
    user_msg = Message(
        interview_id=interview_id, role="user", content=body.content
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    # Monta o histórico completo para o Gemini
    history = [
        {"role": m.role, "content": m.content}
        for m in interview.messages
    ]

    # Fecha a sessão antes do streaming (evita lock no SQLite)
    job_desc = interview.job_description
    resume_txt = interview.resume_text
    db.close()

    async def event_stream():
        full_response = ""
        try:
            async for chunk in gerar_resposta_stream(history, job_desc, resume_txt):
                full_response += chunk
                # Envia cada pedaço como SSE
                data = json.dumps({"chunk": chunk}, ensure_ascii=False)
                yield f"data: {data}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return

        # Salva a resposta completa no banco (nova sessão)
        from app.db import SessionLocal
        new_db = SessionLocal()
        try:
            new_db.add(
                Message(
                    interview_id=interview_id,
                    role="model",
                    content=full_response,
                )
            )
            new_db.commit()
        finally:
            new_db.close()

        # Sinal de fim do stream
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )

