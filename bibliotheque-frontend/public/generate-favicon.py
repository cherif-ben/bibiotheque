#!/usr/bin/env python3
"""Generate PNG favicons from the book icon design."""
import os
from PIL import Image, ImageDraw

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

def create_book_icon(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    s = size / 64

    # Rounded rectangle background (indigo)
    r = int(14 * s)
    draw.rounded_rectangle([0, 0, size-1, size-1], radius=r, fill=(99, 102, 241, 255))

    # Book cover (white)
    draw.rounded_rectangle(
        [int(18*s), int(12*s), int(50*s), int(52*s)],
        radius=int(3*s), fill=(255, 255, 255, 245)
    )

    # Book spine
    draw.rounded_rectangle(
        [int(14*s), int(12*s), int(18*s), int(52*s)],
        radius=int(2*s), fill=(255, 255, 255, 77)
    )

    # Title line (indigo)
    lh = max(1, int(1.5 * s))
    draw.rounded_rectangle(
        [int(24*s), int(20*s), int(44*s), int(20*s)+lh+int(1*s)],
        radius=max(1, int(1*s)), fill=(99, 102, 241, 220)
    )

    # Body lines (gray)
    for y, w in [(27, 40), (33, 42), (39, 36)]:
        draw.rounded_rectangle(
            [int(24*s), int(y*s), int(w*s), int(y*s)+lh],
            radius=max(1, int(1*s)), fill=(100, 116, 139, 200)
        )

    return img

# Generate PNGs
for name, sz in [('favicon-16x16.png', 16), ('favicon-32x32.png', 32),
                  ('favicon-48x48.png', 48), ('apple-touch-icon.png', 180)]:
    create_book_icon(sz).save(os.path.join(OUTPUT_DIR, name), 'PNG')
    print(f'✅ {name} ({sz}x{sz})')

# Generate ICO (multi-size)
imgs = [create_book_icon(s) for s in [16, 32, 48]]
imgs[0].save(os.path.join(OUTPUT_DIR, 'favicon.ico'), format='ICO',
             sizes=[(s, s) for s in [16, 32, 48]], append_images=imgs[1:])
print('✅ favicon.ico (multi-size)')
