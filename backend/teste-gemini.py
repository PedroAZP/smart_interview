import argparse
import re
import sys
from pathlib import Path

from google import genai
from google.genai import types

from app.config import settings

BASE = Path(__file__).parent  # a pasta backend/, não importa de onde você rode
PROMPT_PATH = BASE / "app" / "prompts" / "entrevistador.md"
CASOS = BASE / "casos_teste"
MAX_VOLTAS = 30  # trava de segurança para não gastar cota sem querer


def ler_arquivo(caminho: Path) -> str:
    if not caminho.exists():
        sys.exit(f"Arquivo não encontrado: {caminho}")
    return caminho.read_text(encoding="utf-8").strip()


def montar_prompt(template: str, vaga: str | None, curriculo: str | None) -> str:
    valores = {
        "vaga": vaga or "NÃO INFORMADA",
        "curriculo": curriculo or "NÃO INFORMADO",
    }
    # Uma única passada: se a vaga contiver "{curriculo}" escrito, ele não é trocado de novo.
    return re.sub(
        r"\{(vaga|curriculo)\}", lambda m: valores[m.group(1)], template
    )


def mensagem(papel: str, texto: str) -> types.Content:
    return types.Content(role=papel, parts=[types.Part(text=texto)])


def gerar_resposta(client, config, historico):
    """Chama o Gemini em streaming. Devolve (texto, uso_de_tokens, motivo_de_termino)."""
    texto = ""
    uso = None
    motivo = None

    print("\nTech Lead: ", end="", flush=True)
    stream = client.models.generate_content_stream(
        model=settings.gemini_model, contents=historico, config=config
    )
    for pedaco in stream:
        if pedaco.usage_metadata:
            uso = pedaco.usage_metadata  # só o último pedaço traz o total
        if pedaco.candidates and pedaco.candidates[0].finish_reason:
            motivo = pedaco.candidates[0].finish_reason
        if pedaco.text:
            print(pedaco.text, end="", flush=True)
            texto += pedaco.text
    print()
    return texto, uso, motivo


def mostrar_uso(uso) -> None:
    if not uso:
        return
    print(
        f"[tokens] entrada={uso.prompt_token_count} "
        f"saída={uso.candidates_token_count} "
        f"raciocínio={getattr(uso, 'thoughts_token_count', None)} "
        f"total={uso.total_token_count}"
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Entrevista de teste no terminal")
    parser.add_argument("--vaga", help="nome do arquivo em casos_teste/vagas (sem .txt)")
    parser.add_argument(
        "--curriculo", help="nome do arquivo em casos_teste/curriculos (sem .txt)"
    )
    parser.add_argument(
        "--mostrar-prompt", action="store_true", help="imprime o prompt final antes de começar"
    )
    args = parser.parse_args()

    template = ler_arquivo(PROMPT_PATH)
    if "{vaga}" not in template or "{curriculo}" not in template:
        sys.exit("O entrevistador.md precisa ter os marcadores {vaga} e {curriculo}.")
    vaga = ler_arquivo(CASOS / "vagas" / f"{args.vaga}.txt") if args.vaga else None
    curriculo = (
        ler_arquivo(CASOS / "curriculos" / f"{args.curriculo}.txt")
        if args.curriculo
        else None
    )
    system_prompt = montar_prompt(template, vaga, curriculo)

    if args.mostrar_prompt:
        print("=" * 60, system_prompt, "=" * 60, sep="\n")

    client = genai.Client(api_key=settings.gemini_api_key)
    config = types.GenerateContentConfig(system_instruction=system_prompt)
    historico: list[types.Content] = []

    print(f"Modelo: {settings.gemini_model}")
    print("Digite como se fosse o candidato. Comandos: sair | /novo")

    for _ in range(MAX_VOLTAS):
        try:
            fala = input("\nVocê: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nEncerrado.")
            return

        if not fala:
            continue
        if fala.lower() == "sair":
            print("Encerrado.")
            return
        if fala.lower() == "/novo":
            historico.clear()
            print("Histórico zerado.")
            continue

        historico.append(mensagem("user", fala))
        try:
            resposta, uso, motivo = gerar_resposta(client, config, historico)
        except KeyboardInterrupt:
            historico.pop()  # evita duas mensagens "user" seguidas
            print("\n[interrompido]")
            continue
        except Exception as erro:
            historico.pop()
            print(f"\n[erro] {type(erro).__name__}: {erro}")
            continue

        if not resposta:
            historico.pop()
            print(f"[resposta vazia] motivo de término: {motivo}")
            continue

        historico.append(mensagem("model", resposta))
        mostrar_uso(uso)

    print(f"\nLimite de {MAX_VOLTAS} voltas atingido. Encerrado.")


if __name__ == "__main__":
    main()