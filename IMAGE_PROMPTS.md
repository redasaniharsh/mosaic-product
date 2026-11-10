# Image prompt pack

Every image slot in the app now points at a fixed local filename. Generate a
replacement in Gemini, save it with the exact filename below, drop it in the
folder, rebuild, and the site picks it up. No code changes needed.

## How to generate

- Use **Gemini 2.5 Flash Image** ("Nano Banana") or any Gemini image model.
- Ask for **1:1 square** for products and portraits, **4:5 portrait** for
  progress photos.
- Paste the **global style** first, then the per-image prompt in the same
  message.
- Save as **JPG**, roughly 1024 px on the long edge, under **300 KB**.
- The crop used by the site is landscape and centred, so keep the product in the
  middle 60% of the frame with space above and below.

### Global style (paste at the start of every product prompt)

> Premium e-commerce product photograph for an Indian men's grooming brand.
> Unbranded packaging: absolutely no text, letters, numbers, logos, barcodes or
> watermarks anywhere in the image. Deep forest-green (#1F3D2B) and soft warm
> ivory (#F2EFE8) palette with a single lime (#C6F24E) accent. Soft diffused
> studio light from the upper left, gentle contact shadow, clean seamless
> background, 85 mm lens look, shallow depth of field, crisp focus on the
> product, no harsh reflections, no hands. Product centred, square 1:1
> composition, generous negative space above and below.

---

## 1. Product images

Save to `web/public/products/<filename>`.

| # | Filename | Must show |
|---|----------|-----------|
| 1 | `advanced-hair-growth-serum.jpg` | Slim 30 ml amber-glass dropper bottle of clear serum, black rubber dropper cap, one drop on the surface |
| 2 | `anti-hairfall-shampoo.jpg` | 200 ml matte forest-green pump bottle, soft squared shoulders, no label |
| 3 | `biotin-gummies.jpg` | Clear glass jar with brushed dark-green lid, filled with ruby-red bear-shaped gummies; a few gummies beside it |
| 4 | `hair-health-tablets.jpg` | Matte off-white supplement bottle with dark-green screw cap, small stack of round white tablets beside it |
| 5 | `beard-growth-oil.jpg` | 30 ml amber-glass bottle with black dropper, golden oil drop on a dark surface, wooden beard comb beside it |
| 6 | `beard-growth-roller.jpg` | Matte black dermal roller, small 0.5 mm titanium microneedle head, standing upright, macro detail on the needles |
| 7 | `vitamin-c-serum.jpg` | 30 ml frosted amber-orange glass dropper bottle, pale golden serum, one bright citrus peel curl as a subtle prop |
| 8 | `under-eye-cream.jpg` | Small 15 g white ceramic jar with brushed-silver lid, tiny dab of cream on the rim |
| 9 | `acne-control-serum.jpg` | 30 ml clear glass dropper bottle with pale green liquid, clinical and minimal, matte white cap |
| 10 | `testosterone-booster.jpg` | Matte black 60-tablet supplement jar with a copper lid, two dark capsules beside it |
| 11 | `delay-spray.jpg` | Slim 20 ml matte black metered spray canister with a minimal pump top, discreet and clinical, no suggestive imagery |
| 12 | `weight-loss-program.jpg` | **Not a bottle.** Flat-lay of a 12-week program kit: matte forest-green box with a lime edge, folded blank meal-plan card, soft measuring tape, digital kitchen scale |
| 13 | `clock-cap.jpg` | Matte black wearable red-light therapy cap on a minimal stand, faint red LED glow visible inside the brim, clinical device look |

### Copy-paste product prompts

**1. advanced-hair-growth-serum.jpg**
> A slim 30 ml amber-glass dropper bottle filled with clear hair-growth serum,
> matte black rubber dropper cap, standing on a warm ivory seamless surface. One
> glossy drop of serum rests beside the bottle. Minimal, clinical, premium.

**2. anti-hairfall-shampoo.jpg**
> A 200 ml matte forest-green shampoo bottle with a matching pump dispenser and
> softly squared shoulders. Unlabelled, with a subtle lime band near the base.
> Standing on warm ivory, a small pool of white lather beside it.

**3. biotin-gummies.jpg**
> A clear glass jar with a brushed dark-green metal lid, filled with glossy
> ruby-red bear-shaped gummy vitamins. Three gummies scattered on the warm ivory
> surface in front of the jar. Appetising but premium, not candy-like.

**4. hair-health-tablets.jpg**
> A matte off-white HDPE supplement bottle with a deep forest-green screw cap,
> standing on warm ivory. A neat stack of five round white tablets and two loose
> ones beside the base. Clean pharmacy aesthetic.

**5. beard-growth-oil.jpg**
> A 30 ml amber-glass beard oil bottle with a black dropper cap, one golden drop
> of oil suspended from the dropper, a small wooden beard comb resting beside it
> on a dark walnut surface. Warm, tactile, masculine.

**6. beard-growth-roller.jpg**
> A matte black dermal roller with a small cylindrical head of fine titanium
> microneedles, standing upright on warm ivory. Extreme sharp macro detail on the
> needle head, the handle falling softly out of focus.

**7. vitamin-c-serum.jpg**
> A 30 ml frosted amber-orange glass dropper bottle of pale golden vitamin C
> serum, matte white dropper cap, one thin curl of citrus peel beside it on warm
> ivory. Bright, clean, morning-light feeling.

**8. under-eye-cream.jpg**
> A small 15 g white ceramic cosmetic jar with a brushed-silver lid, open, with a
> tiny pearl of cream on the rim and the lid resting beside it. Soft ivory
> surface, calm and clinical.

**9. acne-control-serum.jpg**
> A 30 ml clear glass dropper bottle filled with pale sage-green acne serum,
> matte white cap, standing on warm ivory. One clear droplet on the surface.
> Clinical, restrained, no fruit or flowers.

**10. testosterone-booster.jpg**
> A matte black 60-tablet supplement jar with a brushed copper lid, standing on
> a dark slate surface. Two matte dark-brown capsules beside the base. Strong,
> performance-oriented, no gym props.

**11. delay-spray.jpg**
> A slim 20 ml matte black metered spray canister with a minimal silver pump top,
> standing on warm ivory. Discreet, clinical, pharmacy-like. No body parts, no
> suggestive imagery, no text.

**12. weight-loss-program.jpg**
> Overhead flat-lay of a 12-week wellness program kit on warm ivory: a closed
> matte forest-green box with a thin lime edge, a folded blank meal-plan card, a
> soft charcoal measuring tape curled beside it, a small digital kitchen scale
> and a stainless water bottle. Calm, organised, editorial.

**13. clock-cap.jpg**
> A matte black wearable low-level laser therapy cap resting on a minimal dark
> stand, faint red LED glow visible inside the brim, a thin black cable. Warm
> ivory background, soft studio light, clinical device photography. No head, no
> person.

---

## 2. Customer portraits (optional)

Save to `web/public/avatars/<filename>`, square 1:1, head-and-shoulders.

> Candid documentary portrait of a [age]-year-old Indian man from [city],
> [hair/beard detail], wearing a plain [shirt], seated near a window in a modest
> Indian living room. Soft natural daylight, warm neutral wall, 50 mm lens,
> natural skin texture, relaxed expression looking slightly off camera. Square
> 1:1 head-and-shoulders crop. No text, no logos.

| Filename | Person |
|----------|--------|
| `raj-gandhi.jpg` | 26, Ahmedabad, short black hair, light stubble, olive T-shirt |
| `shreyans-jain.jpg` | 24, Indore, short black hair, slightly patchy beard, grey shirt |
| `manan-sancheti.jpg` | 27, Pune, neat short hair, thin glasses, collared shirt |
| `harsh-redasani.jpg` | 23, Surat, short hair, clean-shaven, casual hoodie |
| `chandan-singh.jpg` | 29, Lucknow, trimmed beard, solid build, polo shirt |

> **Ethics note:** these are illustrative portraits of real named interviewees.
> The app currently falls back to a clean monogram, which is the honest option.
> If you use generated faces, say "illustrative portrait" in the research doc or
> keep the monogram.

Until the files exist, the site shows a designed monogram (initials), not a
broken image.

---

## 3. Demo progress photos

Save to `web/public/progress/<filename>`, 4:5 portrait.

Generate **week 1 first**, then use it as the reference image for the other two
so the head, room and light stay identical.

> Top-down smartphone photo of the crown of a 27-year-old Indian man with short
> dark hair, taken in a plain bathroom under cool white daylight. Dry hair, no
> product, visible scalp along the parting, slight camera-phone grain, honest
> and unstyled. 4:5 portrait. No text.

| Filename | Difference |
|----------|------------|
| `crown-week-01.jpg` | Baseline: parting slightly wide, scalp visible |
| `crown-week-03.jpg` | Same frame, shedding phase, hair looks a little thinner |
| `crown-week-05.jpg` | Same frame, denser at the crown, tiny baby hairs along the parting |

These replace the abstract demo plates. Placeholder JPGs with the right names are
already in the folder, so nothing breaks if you skip this section.

---

## 4. After generating

1. Copy each file into the folder with the **exact** filename above.
2. Run `npm run build` in the repo root (or just commit — Render builds on push).
3. Check the four surfaces: landing page quotes and stack, Products grid and
   modal, Routine thumbnails, Progress gallery and compare slider.
4. Commit and push. Render redeploys automatically.

Priority if you only generate a few: `beard-growth-roller`,
`weight-loss-program`, `clock-cap`, `acne-control-serum`, `testosterone-booster`
— these five currently read least like their product names.
