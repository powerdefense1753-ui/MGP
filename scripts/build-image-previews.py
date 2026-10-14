"""Generate display-size WebP derivatives without modifying source images. Requires Pillow."""
from pathlib import Path
from PIL import Image, ImageOps
import json
root=Path(__file__).resolve().parents[1]
source=root/'public/play-media'; target=root/'public/play-thumbs'; target.mkdir(exist_ok=True)
original=output=count=0
for path in source.iterdir():
    if path.suffix.lower() not in ('.png','.jpg','.jpeg','.webp'): continue
    with Image.open(path) as img:
        img=ImageOps.exif_transpose(img).convert('RGB')
        for kind,width in [('icon',128),('card',480)]:
            dest=target/f'{path.stem}-{kind}.webp'
            if not dest.exists() or dest.stat().st_mtime<path.stat().st_mtime:
                small=img.copy(); small.thumbnail((width,width*3)); small.save(dest,'WEBP',quality=78,method=6)
            output+=dest.stat().st_size
        original+=path.stat().st_size;count+=1
print(json.dumps(dict(images=count,originalBytes=original,derivativeBytes=output)))
