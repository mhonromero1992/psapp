"""
Static Archivo cuts for the app, from the Google Fonts variable font (OFL).

    python3 scripts/make-fonts.py path/to/Archivo[wdth,wght].ttf

Each file is named after its PostScript name, so one fontFamily works on Android (file name)
and iOS (PostScript name). Never set fontWeight with these: the weight is in the file.
Needs fonttools (pip install fonttools).
"""
import os
import sys

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

CUTS = [
    # (PostScript name, family, style, weight, width)
    ("Archivo-Regular", "Archivo", "Regular", 400, 100),
    ("Archivo-Medium", "Archivo Medium", "Regular", 500, 100),
    ("Archivo-SemiBold", "Archivo SemiBold", "Regular", 600, 100),
    ("Archivo-Bold", "Archivo", "Bold", 700, 100),
    # Headings: semi-condensed like a uniform name tape (the web app: width 84%, weight 800).
    ("ArchivoSemiCondensed-ExtraBold", "Archivo SemiCondensed ExtraBold", "Regular", 800, 87.5),
    ("ArchivoSemiCondensed-Bold", "Archivo SemiCondensed Bold", "Regular", 700, 87.5),
]

def main(src: str, out_dir: str) -> None:
    os.makedirs(out_dir, exist_ok=True)
    for ps, family, style, wght, wdth in CUTS:
        font = TTFont(src)
        static = instantiateVariableFont(font, {"wght": wght, "wdth": wdth}, updateFontNames=False)
        name = static["name"]
        for rec in list(name.names):
            if rec.nameID in (1, 2, 3, 4, 6, 16, 17, 21, 22, 25):
                name.removeNames(nameID=rec.nameID)
        for platform in ((3, 1, 0x409), (1, 0, 0)):
            name.setName(family, 1, *platform)
            name.setName(style, 2, *platform)
            name.setName(f"{ps};PS-ACCESS", 3, *platform)
            name.setName(f"{family} {style}".replace(" Regular", ""), 4, *platform)
            name.setName(ps, 6, *platform)
        static["OS/2"].usWeightClass = wght
        path = os.path.join(out_dir, f"{ps}.ttf")
        static.save(path)
        print(f"{path} ({os.path.getsize(path) // 1024} KB)")

if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    main(sys.argv[1], os.path.join(here, "..", "src", "assets", "fonts"))
