"""
Deixa as fotos recortadas da galeria com aparência mais natural.

O que faz, em cada foto de fundo cinza-claro (recorte de estúdio):
  1. estima o fundo (gradiente suave) e acha a máscara da peça
  2. suaviza a borda do recorte (sem serrilhado nem "adesivo colado")
  3. light wrap: um pouco da luz do fundo invade a borda da peça
  4. a sombra original fica como fundo, sem virar parte do recorte
  5. tira o excesso de contraste e saturação da peça
  6. grão fino igual na foto inteira, para peça e fundo parecerem uma foto só

Já roda sozinho dentro do otimiza_imagens.py (fotos .jpg novas).
As fotos que já estão em assets/img/gallery/ JÁ passaram por ele:
não rode de novo nelas, senão o tratamento acumula.

Uso avulso: python3 tools/naturaliza.py entrada.jpg saida.webp
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi


def fit_background(img):
    h, w, _ = img.shape
    yy, xx = np.mgrid[0:h, 0:w]
    border = np.zeros((h, w), bool)
    b = max(8, h // 40)
    border[:b] = border[-b:] = True
    border[:, :b] = border[:, -b:] = True
    X = np.stack([np.ones(h * w), xx.ravel() / w, yy.ravel() / h,
                  (xx.ravel() / w) ** 2, (yy.ravel() / h) ** 2, (xx.ravel() * yy.ravel()) / (w * h)], 1)
    Xb = X[border.ravel()]
    bg = np.empty_like(img)
    for c in range(3):
        coef, *_ = np.linalg.lstsq(Xb, img[..., c].ravel()[border.ravel()], rcond=None)
        bg[..., c] = (X @ coef).reshape(h, w)
    return bg


def is_studio_cutout(img):
    h, w, _ = img.shape
    b = max(8, h // 40)
    edge = np.concatenate([img[:b].reshape(-1, 3), img[-b:].reshape(-1, 3),
                           img[:, :b].reshape(-1, 3), img[:, -b:].reshape(-1, 3)])
    return edge.mean() > 200 and edge.std(0).mean() < 14


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def naturaliza(im, seed=7):
    """Recebe e devolve uma PIL.Image RGB com o tratamento aplicado."""
    img = np.asarray(im.convert("RGB")).astype(np.float32)
    h, w, _ = img.shape
    s = w / 1200.0
    rng = np.random.default_rng(seed)

    if is_studio_cutout(img):
        bg = fit_background(img)
        diff = np.abs(img - bg).max(2)
        # sombra original do recorte: cinza neutro, liso, mais escuro que o fundo -> fica no fundo
        ratio = img / np.maximum(bg, 1)
        k = ratio.mean(2)
        neutral = ratio.std(2) < 0.025
        lumi = img.mean(2)
        grad = np.hypot(ndi.sobel(lumi, 0), ndi.sobel(lumi, 1))
        smooth = ndi.gaussian_filter(grad, 2) < 18
        shadow = neutral & smooth & (k > 0.45) & (k < 0.985)
        hard = (diff > 22) & ~shadow
        hard = ndi.binary_opening(hard, iterations=1)
        hard = ndi.binary_fill_holes(ndi.binary_closing(hard, iterations=2))
        lab, n = ndi.label(hard)
        if n:
            sizes = ndi.sum(hard, lab, range(1, n + 1))
            keep = np.isin(lab, 1 + np.where(sizes > 0.002 * h * w)[0])
        else:
            keep = hard
        din = ndi.distance_transform_edt(keep)
        dout = ndi.distance_transform_edt(~keep)
        # 2. borda do recorte: faixa de ~2px em volta do contorno fica levemente desfocada
        band = np.exp(-(np.minimum(din, dout) / (1.3 * s)) ** 2)
        soft = ndi.gaussian_filter(img, (0.9 * s, 0.9 * s, 0))
        out = img * (1 - band[..., None]) + soft * band[..., None]

        # 3. light wrap: luz do fundo borrada entrando ~6px na borda da peça
        bg_blur = ndi.gaussian_filter(np.where(keep[..., None], bg, img), (6 * s, 6 * s, 0))
        rim = (1 - smoothstep(0, 7 * s, din)) * keep
        rim = ndi.gaussian_filter(rim.astype(np.float32), 2 * s) * 0.18
        out = out * (1 - rim[..., None]) + bg_blur * rim[..., None]

        # 5. tom geral: menos saturação e contraste, preto não chapado
        lum = out @ np.array([0.2126, 0.7152, 0.0722], np.float32)
        out = lum[..., None] + (out - lum[..., None]) * 0.9
        out = 128 + (out - 128) * 0.94
        out = out * (1 - 9 / 255) + 9

        # fundo de estúdio: luz de cima, vinheta leve e um fio mais quente
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        r = np.hypot((xx - w / 2) / w, (yy - h * 0.42) / h)
        out = out * (1.0 - 0.08 * smoothstep(0.25, 0.85, r))[..., None]
        out = out + np.array([2.0, 1.0, -1.5], np.float32)
    else:
        # foto de ambiente (celular): só tira um pouco do amarelado e segura os brancos
        out = img.copy()
        means = out.reshape(-1, 3).mean(0)
        gray = means.mean()
        gain = (gray / means) ** 0.45                                   # 45% do caminho até o neutro
        out = out * gain
        hl = smoothstep(200, 255, out.mean(2))[..., None]
        out = out * (1 - 0.06 * hl)
        lum = out @ np.array([0.2126, 0.7152, 0.0722], np.float32)
        out = lum[..., None] + (out - lum[..., None]) * 1.04

    # 6. grão de filme em luminância, igual na foto toda
    g = rng.normal(0, 1, (h, w)).astype(np.float32)
    g = ndi.gaussian_filter(g, 0.6 * s)
    g = g / (g.std() + 1e-6)
    lum = out.mean(2, keepdims=True)
    amp = 2.4 * (0.6 + 0.4 * (1 - np.abs(lum - 128) / 128))
    out = out + g[..., None] * amp
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


def process(src, dst, seed=7, quality=82):
    naturaliza(Image.open(src), seed).save(dst, quality=quality, method=6)


if __name__ == "__main__":
    process(sys.argv[1], sys.argv[2])
