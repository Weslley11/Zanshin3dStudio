"""
Gera as versões WebP das fotos da galeria.

Para cada assets/img/gallery/<nome>.jpg cria:
  <nome>.webp      1200 px — usada só onde a foto aparece grande
                   (destaque da home e foto principal da página de peça)
  <nome>-600.webp   600 px — cards, faixa da home e miniaturas, que são
                   exibidos com no máximo ~500 px físicos mesmo em celular
                   de tela densa

Uso:
  python3 tools/otimiza_imagens.py              converte o que ainda não foi convertido
  python3 tools/otimiza_imagens.py --apagar-jpg  idem, e remove o .jpg que já tem as duas versões

Rode depois de colocar uma foto nova (.jpg) na pasta da galeria.
"""
import os
import sys

from PIL import Image

GAL = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "img", "gallery")
QUALIDADE = 82          # WebP 82 fica visualmente igual ao JPEG 88 que a galeria usava
TAMANHOS = ((1200, ""), (600, "-600"))


def converte(jpg):
    base = os.path.splitext(jpg)[0]
    im = Image.open(jpg).convert("RGB")
    feitos = []
    for lado, sufixo in TAMANHOS:
        destino = f"{base}{sufixo}.webp"
        if os.path.exists(destino) and os.path.getmtime(destino) >= os.path.getmtime(jpg):
            continue
        saida = im if im.size == (lado, lado) else im.resize((lado, lado), Image.LANCZOS)
        saida.save(destino, "WEBP", quality=QUALIDADE, method=6)
        feitos.append(os.path.basename(destino))
    return feitos


def main():
    apagar = "--apagar-jpg" in sys.argv
    jpgs = sorted(f for f in os.listdir(GAL) if f.lower().endswith(".jpg"))
    convertidos = apagados = 0
    for nome in jpgs:
        caminho = os.path.join(GAL, nome)
        if converte(caminho):
            convertidos += 1
        base = os.path.splitext(caminho)[0]
        if apagar and all(os.path.exists(f"{base}{s}.webp") for _, s in TAMANHOS):
            os.remove(caminho)
            apagados += 1

    webps = [f for f in os.listdir(GAL) if f.endswith(".webp")]
    total = sum(os.path.getsize(os.path.join(GAL, f)) for f in webps)
    print(f"{len(jpgs)} jpg encontrados, {convertidos} convertidos, {apagados} jpg apagados")
    print(f"{len(webps)} webp na galeria, {total / 1048576:.1f} MB no total")


if __name__ == "__main__":
    main()
