# Drop raw images here

Save your image-generator exports in this folder using the **exact base name**
from `IMAGE_PROMPTS.md`. Any of `.png`, `.jpg` or `.jpeg` works.

Then, from the repo root:

```powershell
npm run images          # crop, resize, compress, rename
npm run images -- -Build  # same, then build the web app
```

The importer writes the finished JPGs into:

- `web/public/products/` — 1024 × 1024
- `web/public/avatars/` — 512 × 512
- `web/public/progress/` — 800 × 1000

Files you have not supplied are left untouched, so you can import in batches.

## Product names

```
advanced-hair-growth-serum
anti-hairfall-shampoo
biotin-gummies
hair-health-tablets
beard-growth-oil
beard-growth-roller
vitamin-c-serum
under-eye-cream
acne-control-serum
testosterone-booster
delay-spray
weight-loss-program
clock-cap
```

## Customer portraits (optional)

```
raj-gandhi
shreyans-jain
manan-sancheti
harsh-redasani
chandan-singh
```

## Demo progress photos

```
crown-week-01
crown-week-03
crown-week-05
```

Example: save the serum image as `image-drop/advanced-hair-growth-serum.png`.
Do not save it as `Gemini_Generated_Image_1234.png` — the importer matches on
the base name.
