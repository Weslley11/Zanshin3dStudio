"""
Reenquadra as fotos da galeria para nenhuma peça encostar na borda.

Para cada foto (fundo claro de estúdio):
  1. acha a peça com dois métodos somados (diferença para o fundo e o
     recortador isnet do rembg), para nenhuma parte fina ficar de fora
  2. se a peça encosta numa borda ou está a menos de 6% dela, reduz e
     centraliza a foto inteira (peça + sombra) dentro de uma margem de 8,5%
     e completa o fundo com o mesmo degradê da foto
  3. se a peça já foi fotografada cortada (encosta na borda da foto
     original), aquele lado fica preso na borda, como um close
  4. aplica o tratamento do naturaliza.py

Também recorta fotos de ambiente (celular) e monta no mesmo fundo de
estúdio, com sombra de contato, para entrarem na galeria iguais às demais.

Uso:
  python3 tools/enquadra.py estudio  entrada.webp saida-base   # saida-base.webp e saida-base-600.webp
  python3 tools/enquadra.py ambiente entrada.jpg  saida-base [--base-escura]
  python3 tools/enquadra.py natural  entrada.jpg  saida-base   # mantém o fundo real
  (--base-escura: peça com base preta sobre mesa clara, que o recortador
   costuma deixar meio transparente)

Precisa de: pip install rembg onnxruntime pillow numpy scipy
(o modelo isnet-general-use é baixado na primeira vez, ~180 MB)
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from naturaliza import naturaliza, fit_background  # noqa: E402

LADO = 1200
MARGEM = 0.085        # margem alvo em volta da peça
MARGEM_MIN = 0.06     # abaixo disso a foto é reenquadrada
ENCOSTA = 0.004       # peça a menos disso da borda = foi fotografada cortada
QUALIDADE = 82
FUNDO_REF = (233.0, 233.0, 235.0)

_sessao = None


def isnet(im):
    global _sessao
    from rembg import remove, new_session
    if _sessao is None:
        _sessao = new_session("isnet-general-use")
    return np.asarray(remove(im, session=_sessao, only_mask=True)).astype(np.float32) / 255.0


def limpa(m, area_min):
    lab, n = ndi.label(m)
    if not n:
        return m
    tam = ndi.sum(m, lab, range(1, n + 1))
    return np.isin(lab, 1 + np.where(tam > area_min)[0])


def mascaras_estudio(img, im):
    h, w, _ = img.shape
    bg = fit_background(img)
    diff = np.abs(img - bg).max(2)
    ratio = img / np.maximum(bg, 1)
    k = ratio.mean(2)
    lumi = img.mean(2)
    grad = np.hypot(ndi.sobel(lumi, 0), ndi.sobel(lumi, 1))
    sombra = (ratio.std(2) < 0.025) & (ndi.gaussian_filter(grad, 2) < 18) & (k > 0.45) & (k < 0.985)
    duro = (diff > 22) & ~sombra
    duro = ndi.binary_fill_holes(ndi.binary_closing(ndi.binary_opening(duro, iterations=1), iterations=2))
    peca = limpa(duro | (isnet(im) > 0.5), 0.0015 * h * w)
    # região a colar: peça + sombra + o que difere do fundo, com folga
    perto = ndi.binary_dilation(peca, iterations=110)
    colar = ndi.binary_dilation(((diff > 5) & perto) | peca, iterations=10)
    return bg, peca, colar


def caixa(m):
    ys, xs = np.where(m)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def corte_reto(m, box, img=None, bg=None):
    """Lados em que a peça termina numa linha reta (foto já recortada em close)."""
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    r = {
        "b": min(m[y1 - 4, x0:x1].mean(), m[y1 - 7, x0:x1].mean()) > 0.5,
        "t": min(m[y0 + 3, x0:x1].mean(), m[y0 + 6, x0:x1].mean()) > 0.5,
        "l": min(m[y0:y1, x0 + 6].mean(), m[y0:y1, x0 + 10].mean()) > 0.3,
        "r": min(m[y0:y1, x1 - 7].mean(), m[y0:y1, x1 - 11].mean()) > 0.3,
    }
    return r


def plano(box, w, h, m=None, img=None, bg=None):
    x0, y0, x1, y1 = box
    enc = {"l": x0 / w < ENCOSTA, "t": y0 / h < ENCOSTA, "r": (w - x1) / w < ENCOSTA, "b": (h - y1) / h < ENCOSTA}
    if m is not None:
        for k, v in corte_reto(m, box, img, bg).items():
            enc[k] = enc[k] or v
    marg = {"l": x0 / w, "t": y0 / h, "r": (w - x1) / w, "b": (h - y1) / h}
    precisa = any(marg[k] < MARGEM_MIN for k in marg if not enc[k]) or any(marg[k] > 0.01 for k in marg if enc[k])
    return enc, precisa


def posiciona(box, enc, s_max):
    """Escala s (até s_max) e canto (nx0, ny0) da peça no quadro novo de LADO px."""
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    M = MARGEM * LADO
    L = 0 if enc["l"] else M
    R = LADO if enc["r"] else LADO - M
    T = 0 if enc["t"] else M
    B = LADO if enc["b"] else LADO - M
    s = min(s_max, (R - L) / w, (B - T) / h)

    def eixo(a, b, ea, eb, tam):
        if ea and not eb:
            return 0.0
        if eb and not ea:
            return LADO - tam
        return a + ((b - a) - tam) / 2

    return s, eixo(L, R, enc["l"], enc["r"], w * s), eixo(T, B, enc["t"], enc["b"], h * s)


def transforma(arr, s, ox, oy, modo=Image.BICUBIC):
    """Leva arr (coordenadas da foto) para o quadro novo: X' = X*s + ox."""
    im = Image.fromarray(arr)
    return np.asarray(im.transform((LADO, LADO), Image.AFFINE, (1 / s, 0, -ox / s, 0, 1 / s, -oy / s), resample=modo))


def salva(im, base, seed):
    im = naturaliza(im, seed=seed)
    im.save(base + ".webp", "WEBP", quality=QUALIDADE, method=6)
    im.resize((600, 600), Image.LANCZOS).save(base + "-600.webp", "WEBP", quality=QUALIDADE, method=6)


# fotos que já são close (a peça foi fotografada cortada): esses lados ficam presos na borda
CLOSES = {
    "kratos-busto-natural": "lb",
    "kratos-rosto": "rb",
    "kratos-torso": "lb",
    "touro-hoodie-detalhe": "b",
    "mascote-flamengo": "r",
}


def estudio(entrada, base, forcar=False):
    im = Image.open(entrada).convert("RGB")
    if im.size != (LADO, LADO):
        im = im.resize((LADO, LADO), Image.LANCZOS)
    img = np.asarray(im).astype(np.float32)
    bg, peca, colar = mascaras_estudio(img, im)
    box = caixa(peca)
    presos = CLOSES.get(os.path.basename(base), "")
    enc = {k: k in presos for k in "ltrb"}
    marg = {"l": box[0] / LADO, "t": box[1] / LADO, "r": (LADO - box[2]) / LADO, "b": (LADO - box[3]) / LADO}
    precisa = any(marg[k] < MARGEM_MIN for k in marg if not enc[k]) or any(marg[k] > 0.01 for k in marg if enc[k])
    if not (precisa or forcar):
        return False, enc
    s, nx0, ny0 = posiciona(box, enc, 1.0)
    ox, oy = nx0 - box[0] * s, ny0 - box[1] * s
    foto = transforma(img.clip(0, 255).astype(np.uint8), s, ox, oy).astype(np.float32)
    a = transforma((colar * 255).astype(np.uint8), s, ox, oy, Image.BILINEAR).astype(np.float32) / 255
    a = ndi.gaussian_filter(a, 10)
    # fora da foto original não há nada para colar: corta o alfa ali (sem faixa escura na borda)
    dentro = transforma(np.full(img.shape[:2], 255, np.uint8), s, ox, oy, Image.NEAREST) > 0
    a = a * ndi.gaussian_filter(ndi.binary_erosion(dentro, iterations=6).astype(np.float32), 3)
    out = foto * a[..., None] + bg * (1 - a[..., None])
    salva(Image.fromarray(out.clip(0, 255).astype(np.uint8)), base, sum(map(ord, os.path.basename(base))))
    return True, enc


def fundo_estudio():
    yy, xx = np.mgrid[0:LADO, 0:LADO].astype(np.float32) / LADO
    r = np.hypot(xx - 0.5, yy - 0.38)
    luz = 1.0 - 0.07 * np.clip((r - 0.15) / 0.7, 0, 1) ** 1.4
    return np.array(FUNDO_REF, np.float32)[None, None] * luz[..., None]


def ambiente(entrada, base, bases_escuras=False):
    im = Image.open(entrada).convert("RGB")
    W, H = im.size
    alfa = isnet(im)
    peca = limpa(alfa > 0.5, 0.002 * W * H)
    if bases_escuras:
        # bases escuras sobre mesa clara: o recortador às vezes deixa a base
        # meio transparente. Na parte de baixo da peça, o que é escuro e está
        # colado nela entra inteiro.
        lum = np.asarray(im).astype(np.float32).mean(2)
        x0, y0, x1, y1 = caixa(peca)
        perto = ndi.binary_dilation(alfa > 0.1, iterations=25)
        escuro = (lum < 100) & perto
        escuro[: int(y0 + 0.62 * (y1 - y0))] = False
        duro = ndi.binary_closing(peca | escuro, iterations=2)
        buracos = ndi.binary_fill_holes(duro) & ~duro
        lab, n = ndi.label(buracos)
        if n:  # só tapa furinhos; vãos grandes (entre capa e base) continuam vazados
            tam = ndi.sum(buracos, lab, range(1, n + 1))
            duro |= np.isin(lab, 1 + np.where(tam < 0.0004 * W * H)[0])
        peca = limpa(ndi.binary_opening(duro, iterations=2), 0.002 * W * H)
        alfa = np.maximum(alfa, ndi.gaussian_filter(peca.astype(np.float32), 1.0))
    alfa = alfa * ndi.binary_dilation(peca, iterations=3)
    box = caixa(peca)
    enc, _ = plano(box, W, H)
    s, nx0, ny0 = posiciona(box, enc, 10.0)
    ox, oy = nx0 - box[0] * s, ny0 - box[1] * s
    src = np.asarray(im)
    foto = transforma(src, s, ox, oy).astype(np.float32)
    a = transforma((alfa * 255).astype(np.uint8), s, ox, oy, Image.BILINEAR).astype(np.float32) / 255
    # tira 1px da borda (resto do fundo antigo) e suaviza
    a = np.minimum(a, ndi.grey_erosion(a, size=3))
    a = ndi.gaussian_filter(a, 0.6)
    bg = fundo_estudio()
    # sombra de contato embaixo da peça + sombra ambiente suave
    m = a > 0.5
    rows = np.where(m.any(1))[0]
    sombra = np.zeros_like(a)
    if len(rows) and not enc["b"]:
        base_y = rows.max()
        pe = m[max(0, base_y - 40):base_y + 1].any(0).astype(np.float32)
        pe = ndi.gaussian_filter1d(pe, 18)
        yy = np.arange(LADO, dtype=np.float32)[:, None]
        faixa = np.exp(-((yy - base_y - 4) / 14.0) ** 2)
        sombra += 0.45 * faixa * pe[None, :]
    amb = ndi.gaussian_filter(np.roll(a, 14, axis=0), 28)
    sombra = np.clip(sombra + 0.22 * amb, 0, 0.6)
    bg = bg * (1 - sombra[..., None])
    out = foto * a[..., None] + bg * (1 - a[..., None])
    salva(Image.fromarray(out.clip(0, 255).astype(np.uint8)), base, sum(map(ord, os.path.basename(base))))
    return enc


def natural(entrada, base, folga=0.10):
    """Foto real (mesa da impressora, cozinha...): mantém o fundo, enquadra em
    quadrado com a peça inteira e folga em volta, e aplica o tratamento.
    Se a peça for mais alta (ou larga) que a foto permite, o quadrado é
    completado com o próprio fundo da foto, desfocado e um pouco mais escuro."""
    from PIL import ImageFilter, ImageEnhance
    im = Image.open(entrada).convert("RGB")
    W, H = im.size
    peca = limpa(isnet(im) > 0.5, 0.002 * W * H)
    x0, y0, x1, y1 = caixa(peca)
    lado = int(max(x1 - x0, y1 - y0) * (1 + 2 * folga))
    lado = max(lado, int(0.45 * min(W, H)))
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    if lado <= min(W, H):
        left = int(min(max(cx - lado / 2, 0), W - lado))
        top = int(min(max(cy - lado / 2, 0), H - lado))
        sq = im.crop((left, top, left + lado, top + lado))
    else:
        left, top = int(cx - lado / 2), int(cy - lado / 2)
        # fundo: a foto esticada para cobrir o quadrado, bem desfocada
        fundo = im.resize((lado, int(lado * H / W)) if H / W >= 1 else (int(lado * W / H), lado), Image.LANCZOS)
        fx, fy = (fundo.width - lado) // 2, (fundo.height - lado) // 2
        fundo = fundo.crop((fx, fy, fx + lado, fy + lado)).filter(ImageFilter.GaussianBlur(lado / 30))
        fundo = ImageEnhance.Brightness(fundo).enhance(0.82)
        # foto real colada por cima, com a borda esfumada
        a = np.zeros((H, W), np.float32)
        a[...] = 1
        f = max(8, int(0.03 * lado))
        rampa = np.clip(np.arange(W) / f, 0, 1) * np.clip((W - 1 - np.arange(W)) / f, 0, 1)
        rampa_y = np.clip(np.arange(H) / f, 0, 1) * np.clip((H - 1 - np.arange(H)) / f, 0, 1)
        if left > 0 or left + lado < W:
            rampa = np.ones(W)
        if top > 0 or top + lado < H:
            rampa_y = np.ones(H)
        a = (rampa[None, :] * rampa_y[:, None]).astype(np.float32)
        sq = fundo.copy()
        sq.paste(im, (-left, -top), Image.fromarray((a * 255).astype(np.uint8)))
    sq = sq.resize((LADO, LADO), Image.LANCZOS)
    salva(sq, base, sum(map(ord, os.path.basename(base))))


if __name__ == "__main__":
    modo, entrada, base = sys.argv[1:4]
    if modo == "natural":
        natural(entrada, base)
    elif modo == "estudio":
        print(estudio(entrada, base, forcar=True))
    else:
        print(ambiente(entrada, base, "--base-escura" in sys.argv))
