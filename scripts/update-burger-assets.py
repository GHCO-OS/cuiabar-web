from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageOps


ROOT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE_DIR = Path.home() / "Downloads" / "Super Rede - Dell" / "Burgers - MIX PRODUTO"
OUTPUT_DIR = ROOT_DIR / "public" / "burguer"

CARD_TARGET = (960, 1200)
HERO_TARGET = (1600, 960)
OG_TARGET = (1200, 630)

SOURCES = [
    {
        "source": "O Raiz - Mix produto.png",
        "output": "o-raiz.webp",
        "centering": (0.5, 0.42),
    },
    {
        "source": "O Cuiabar - mix produto.png",
        "output": "o-cuiabar.webp",
        "centering": (0.5, 0.44),
    },
    {
        "source": "O Brabo - Mix produto.png",
        "output": "o-brabo.webp",
        "centering": (0.5, 0.45),
    },
    {
        "source": "O Crocante - Mix Produto.png",
        "output": "o-crocante.webp",
        "centering": (0.5, 0.38),
    },
    {
        "source": "O Parrudo - Mix Produto.png",
        "output": "o-parrudo.webp",
        "centering": (0.5, 0.48),
    },
    {
        "source": "O Colosso – Duplo Costela & Cheddar - Mix Produto.png",
        "output": "o-colosso.webp",
        "centering": (0.5, 0.43),
    },
    {
        "source": "Duplo crispy com molho de mostarda - Mix Produto.png",
        "output": "o-insano.webp",
        "centering": (0.5, 0.34),
    },
]

DERIVATIVES = [
    {
        "source": "O Brabo - Mix produto.png",
        "output": "burger-cuiabar-hero.webp",
        "size": HERO_TARGET,
        "centering": (0.52, 0.42),
    },
    {
        "source": "O Cuiabar - mix produto.png",
        "output": "burger-cuiabar-og.webp",
        "size": OG_TARGET,
        "centering": (0.48, 0.42),
    },
]


def build_image(source_path: Path, output_path: Path, size: tuple[int, int], centering: tuple[float, float]) -> None:
    image = Image.open(source_path).convert("RGB")
    cropped = ImageOps.fit(image, size, method=Image.Resampling.LANCZOS, centering=centering)
    cropped.save(output_path, format="WEBP", quality=84, method=6)


def main() -> None:
    parser = argparse.ArgumentParser(description="Atualiza os assets web do Burger Cuiabar a partir dos PNGs fonte.")
    parser.add_argument("--source-dir", default=str(DEFAULT_SOURCE_DIR), help="Pasta com os PNGs fonte do Burger.")
    args = parser.parse_args()

    source_dir = Path(args.source_dir)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    missing = [item["source"] for item in [*SOURCES, *DERIVATIVES] if not (source_dir / item["source"]).exists()]
    if missing:
        missing_list = "\n".join(f"- {name}" for name in missing)
        raise SystemExit(f"Arquivos fonte ausentes em {source_dir}:\n{missing_list}")

    for item in SOURCES:
        build_image(
            source_dir / item["source"],
            OUTPUT_DIR / item["output"],
            CARD_TARGET,
            item["centering"],
        )
        print(f"OK card  -> {OUTPUT_DIR / item['output']}")

    for item in DERIVATIVES:
        build_image(
            source_dir / item["source"],
            OUTPUT_DIR / item["output"],
            item["size"],
            item["centering"],
        )
        print(f"OK deriv -> {OUTPUT_DIR / item['output']}")


if __name__ == "__main__":
    main()
