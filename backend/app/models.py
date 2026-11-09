# Schema do banco de dados
import uuid
from typing import Optional

from sqlalchemy import CheckConstraint, ForeignKey, Index, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now():
    return text("(datetime('now'))")


# ---------------------------------------------------------------------
# users
# ---------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    email: Mapped[str] = mapped_column(unique=True)
    password_hash: Mapped[str]
    created_at: Mapped[str] = mapped_column(server_default=_now())


# ---------------------------------------------------------------------
# interviews (o chat). Dono: user_id (logado) OU guest_id (visitante)
# ---------------------------------------------------------------------
class Interview(Base):
    __tablename__ = "interviews"
    __table_args__ = (
        CheckConstraint(
            "user_id IS NOT NULL OR guest_id IS NOT NULL", name="ck_interview_owner"
        ),
        CheckConstraint(
            "status IN ('in_progress', 'finished')", name="ck_interview_status"
        ),
        Index("idx_interviews_user", "user_id", "created_at"),
        Index("idx_interviews_guest", "guest_id", "created_at"),
    )

    id: Mapped[str] = mapped_column(primary_key=True, default=_uuid)
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE")
    )
    guest_id: Mapped[Optional[str]]
    title: Mapped[str] = mapped_column(
        default="Nova entrevista", server_default="Nova entrevista"
    )
    job_description: Mapped[Optional[str]] = mapped_column(Text)
    resume_text: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(
        default="in_progress", server_default="in_progress"
    )
    created_at: Mapped[str] = mapped_column(server_default=_now())
    finished_at: Mapped[Optional[str]]

    messages: Mapped[list["Message"]] = relationship(
        back_populates="interview",
        order_by="Message.id",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    report: Mapped[Optional["Report"]] = relationship(
        back_populates="interview",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    files: Mapped[list["File"]] = relationship(
        secondary="interview_files", back_populates="interviews"
    )


# ---------------------------------------------------------------------
# messages. role segue o padrão do Gemini: 'user' e 'model'
# ---------------------------------------------------------------------
class Message(Base):
    __tablename__ = "messages"
    __table_args__ = (
        CheckConstraint("role IN ('user', 'model')", name="ck_message_role"),
        Index("idx_messages_interview", "interview_id", "id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    interview_id: Mapped[str] = mapped_column(
        ForeignKey("interviews.id", ondelete="CASCADE")
    )
    role: Mapped[str]
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[str] = mapped_column(server_default=_now())

    interview: Mapped["Interview"] = relationship(back_populates="messages")


# ---------------------------------------------------------------------
# reports (1:1 com a entrevista)
# ---------------------------------------------------------------------
class Report(Base):
    __tablename__ = "reports"
    __table_args__ = (
        CheckConstraint("score BETWEEN 0 AND 100", name="ck_report_score"),
        CheckConstraint(
            "score_technical BETWEEN 0 AND 100", name="ck_report_score_technical"
        ),
        CheckConstraint(
            "score_communication BETWEEN 0 AND 100",
            name="ck_report_score_communication",
        ),
        CheckConstraint(
            "score_alignment BETWEEN 0 AND 100", name="ck_report_score_alignment"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    interview_id: Mapped[str] = mapped_column(
        ForeignKey("interviews.id", ondelete="CASCADE"), unique=True
    )
    score: Mapped[int]
    score_technical: Mapped[int]
    score_communication: Mapped[int]
    score_alignment: Mapped[int]
    summary: Mapped[str] = mapped_column(Text)
    created_at: Mapped[str] = mapped_column(server_default=_now())

    interview: Mapped["Interview"] = relationship(back_populates="report")
    items: Mapped[list["ReportItem"]] = relationship(
        back_populates="report",
        order_by="ReportItem.sort_order",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


# ---------------------------------------------------------------------
# report_items: pontos fortes, pontos cegos e plano de melhoria
# ---------------------------------------------------------------------
class ReportItem(Base):
    __tablename__ = "report_items"
    __table_args__ = (
        CheckConstraint(
            "kind IN ('strength', 'blind_spot', 'improvement')",
            name="ck_report_item_kind",
        ),
        Index("idx_report_items_report", "report_id", "kind", "sort_order"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    report_id: Mapped[int] = mapped_column(ForeignKey("reports.id", ondelete="CASCADE"))
    kind: Mapped[str]
    topic: Mapped[Optional[str]]
    description: Mapped[str] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(default=0, server_default="0")

    report: Mapped["Report"] = relationship(back_populates="items")


# ---------------------------------------------------------------------
# files: biblioteca (só metadados; o arquivo fica em disco)
# ---------------------------------------------------------------------
class File(Base):
    __tablename__ = "files"
    __table_args__ = (
        CheckConstraint(
            "user_id IS NOT NULL OR guest_id IS NOT NULL", name="ck_file_owner"
        ),
        CheckConstraint("kind IN ('resume', 'job_description')", name="ck_file_kind"),
        CheckConstraint("size_bytes > 0", name="ck_file_size"),
        Index("idx_files_user", "user_id", "created_at"),
        Index("idx_files_guest", "guest_id", "created_at"),
        Index("idx_files_hash", "user_id", "sha256"),
    )

    id: Mapped[str] = mapped_column(primary_key=True, default=_uuid)
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE")
    )
    guest_id: Mapped[Optional[str]]
    kind: Mapped[str]
    original_name: Mapped[str]
    stored_name: Mapped[str] = mapped_column(unique=True)
    mime_type: Mapped[str]
    size_bytes: Mapped[int]
    sha256: Mapped[str]
    extracted_text: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[str] = mapped_column(server_default=_now())

    interviews: Mapped[list["Interview"]] = relationship(
        secondary="interview_files", back_populates="files"
    )


# ---------------------------------------------------------------------
# interview_files: liga entrevistas e arquivos (N:N)
# ---------------------------------------------------------------------
class InterviewFile(Base):
    __tablename__ = "interview_files"
    __table_args__ = (Index("idx_interview_files_file", "file_id"),)

    interview_id: Mapped[str] = mapped_column(
        ForeignKey("interviews.id", ondelete="CASCADE"), primary_key=True
    )
    file_id: Mapped[str] = mapped_column(
        ForeignKey("files.id", ondelete="CASCADE"), primary_key=True
    )
    created_at: Mapped[str] = mapped_column(server_default=_now())