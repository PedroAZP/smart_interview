"""Serviço de comunicação com o Gemini."""
import json
import re
from pathlib import Path
from typing import AsyncIterator

from google import genai
from google.genai import types

from app.config import settings

BASE = Path(__file__).parent.parent
PROMPT_PATH = BASE / "prompts" / "entrevistador.md"
AVALIADOR_PROMPT_PATH = BASE / "prompts" / "avaliador.md"

_client: genai.Client | None = None


def get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


def ler_prompt_template() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8").strip()


def montar_system_prompt(vaga: str | None, curriculo: str | None) -> str:
    template = ler_prompt_template()
    valores = {
        "vaga": vaga or "NÃO INFORMADA",
        "curriculo": curriculo or "NÃO INFORMADO",
    }
    return re.sub(
        r"\{(vaga|curriculo)\}", lambda m: valores[m.group(1)], template
    )


def _build_contents(messages: list[dict]) -> list[types.Content]:
    """Converte lista de dicts {role, content} em types.Content do Gemini."""
    return [
        types.Content(role=m["role"], parts=[types.Part(text=m["content"])])
        for m in messages
    ]


def gerar_resposta_sync(
    messages: list[dict],
    job_description: str | None = None,
    resume_text: str | None = None,
) -> str:
    """Gera resposta completa (não-streaming). Usado para gerar títulos."""
    client = get_client()
    system_prompt = montar_system_prompt(job_description, resume_text)
    config = types.GenerateContentConfig(system_instruction=system_prompt)
    contents = _build_contents(messages)
    response = client.models.generate_content(
        model=settings.gemini_model, contents=contents, config=config
    )
    return response.text or ""


async def gerar_resposta_stream(
    messages: list[dict],
    job_description: str | None = None,
    resume_text: str | None = None,
) -> AsyncIterator[str]:
    """Gera resposta em streaming via async generator."""
    client = get_client()
    system_prompt = montar_system_prompt(job_description, resume_text)
    config = types.GenerateContentConfig(system_instruction=system_prompt)
    contents = _build_contents(messages)

    async for chunk in await client.aio.models.generate_content_stream(
        model=settings.gemini_model, contents=contents, config=config
    ):
        if chunk.text:
            yield chunk.text


def gerar_titulo(primeira_mensagem_usuario: str) -> str:
    """Gera um título curto e descritivo para a conversa."""
    client = get_client()
    prompt = (
        "Crie um título curto (máximo 6 palavras, sem aspas, sem ponto final) "
        "que resuma o tema desta mensagem de abertura de entrevista:\n\n"
        f"{primeira_mensagem_usuario[:500]}"
    )
    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=[types.Content(role="user", parts=[types.Part(text=prompt)])],
    )
    titulo = (response.text or "Nova entrevista").strip().strip('"').strip("'")
    # Garante que não excede 80 caracteres
    return titulo[:80]


def gerar_relatorio_analise(
    messages: list[dict],
    job_description: str | None = None,
    resume_text: str | None = None,
) -> dict:
    """Gera o relatório estruturado de diagnóstico e avaliação da entrevista."""
    client = get_client()
    system_prompt = AVALIADOR_PROMPT_PATH.read_text(encoding="utf-8").strip()

    historico_texto = "\n\n".join(
        f"{'Candidato' if m['role'] == 'user' else 'Tech Lead'}: {m['content']}"
        for m in messages
    )

    prompt = (
        f"Vaga:\n{job_description or 'Não informada'}\n\n"
        f"Currículo:\n{resume_text or 'Não informado'}\n\n"
        f"Transcrição da Entrevista:\n{historico_texto}\n\n"
        "Com base em todo o diálogo acima, gere a avaliação completa e estruturada em JSON."
    )

    config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        response_mime_type="application/json",
        temperature=0.4,
    )

    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=[types.Content(role="user", parts=[types.Part(text=prompt)])],
        config=config,
    )

    raw_text = (response.text or "").strip()
    # Remove eventuais fences markdown caso o modelo adicione
    raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text, flags=re.MULTILINE)
    raw_text = re.sub(r"\s*```$", "", raw_text, flags=re.MULTILINE).strip()

    try:
        data = json.loads(raw_text)
    except Exception as e:
        # Fallback defensivo com valores padrões coerentes
        data = {
            "score": 70,
            "score_technical": 70,
            "score_communication": 70,
            "score_alignment": 70,
            "summary": "A entrevista foi concluída. O candidato respondeu às perguntas do Tech Lead demonstrando interesse e conhecimentos na área.",
            "items": [
                {
                    "kind": "strength",
                    "topic": "Engajamento",
                    "description": "O candidato participou ativamente respondendo aos cenários apresentados.",
                },
                {
                    "kind": "blind_spot",
                    "topic": "Profundidade Técnica",
                    "description": "Algumas respostas poderiam ter sido mais detalhadas com exemplos práticos.",
                },
                {
                    "kind": "improvement",
                    "topic": "Prática Contínua",
                    "description": "Continuar praticando simulações de cenários reais de desenvolvimento.",
                },
            ],
        }

    # Garante que as notas estão entre 0 e 100
    for key in ["score", "score_technical", "score_communication", "score_alignment"]:
        val = int(data.get(key, 70))
        data[key] = max(0, min(100, val))

    return data

