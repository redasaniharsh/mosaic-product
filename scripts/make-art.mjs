// Generates unbranded, palette-consistent SVG product art for every image slot.
// SVGs are written to image-drop/svg/; scripts/render-art.ps1 rasterizes them.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'image-drop', 'svg');
fs.mkdirSync(out, { recursive: true });

const GREEN = '#1F3D2B';
const DEEP = '#14291C';
const LIME = '#C6F24E';
const IVORY = '#F2EFE8';
const CHAR = '#1A1C1A';
const AMBER = '#B4752F';
const RUBY = '#B3263A';

const defs = `
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#FAF8F3"/><stop offset=".55" stop-color="${IVORY}"/><stop offset="1" stop-color="#E4DED2"/>
  </linearGradient>
  <radialGradient id="halo" cx="50%" cy="38%" r="62%">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity=".92"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="vignette" cx="50%" cy="50%" r="72%">
    <stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1F3D2B" stop-opacity=".10"/>
  </radialGradient>
  <linearGradient id="green" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#2E5A3F"/><stop offset=".45" stop-color="${GREEN}"/><stop offset="1" stop-color="#14291C"/>
  </linearGradient>
  <linearGradient id="greenSoft" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#3D6A4C"/><stop offset="1" stop-color="#1F3D2B"/>
  </linearGradient>
  <linearGradient id="black" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#3A403B"/><stop offset=".4" stop-color="#20241F"/><stop offset="1" stop-color="#0E100E"/>
  </linearGradient>
  <linearGradient id="amber" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#D89A52"/><stop offset=".5" stop-color="${AMBER}"/><stop offset="1" stop-color="#7A451C"/>
  </linearGradient>
  <linearGradient id="frost" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#F6D9A8"/><stop offset=".55" stop-color="#D8A05E"/><stop offset="1" stop-color="#9C6330"/>
  </linearGradient>
  <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity=".82"/><stop offset=".5" stop-color="#F3F6F1" stop-opacity=".42"/><stop offset="1" stop-color="#DCE6DC" stop-opacity=".7"/>
  </linearGradient>
  <linearGradient id="paleGreen" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#EAF5D6"/><stop offset="1" stop-color="#A8CF8C"/>
  </linearGradient>
  <linearGradient id="silver" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#F7F8F6"/><stop offset=".5" stop-color="#AEB6AE"/><stop offset="1" stop-color="#6C756D"/>
  </linearGradient>
  <linearGradient id="copper" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#D89A70"/><stop offset=".5" stop-color="#A9663F"/><stop offset="1" stop-color="#6E3B24"/>
  </linearGradient>
  <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#B98454"/><stop offset="1" stop-color="#7A4E2B"/>
  </linearGradient>
  <filter id="blur" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="20"/></filter>
  <filter id="softblur" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="9"/></filter>
  <filter id="glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="14"/></filter>
`;

function frame(w, h, content, extraDefs = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>${defs}${extraDefs}</defs>
<rect width="${w}" height="${h}" fill="url(#bg)"/>
<ellipse cx="${w / 2}" cy="${h * 0.42}" rx="${w * 0.62}" ry="${h * 0.52}" fill="url(#halo)"/>
<rect width="${w}" height="${h}" fill="url(#vignette)"/>
${content}
</svg>`;
}

const shadow = (cx, cy, rx, ry = 34) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${DEEP}" opacity=".20" filter="url(#blur)"/>`;

const shine = (x, y, w, h, r = 18, o = '.30') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="#FFFFFF" opacity="${o}"/>`;

function dropper({ body = 'url(#amber)', liquid, cap = 'url(#black)', band = false, citrus = false, drop = false }) {
  const bodyPath = `M392 424 Q392 382 434 374 L590 374 Q632 382 632 424 L632 744 Q632 774 602 774 L422 774 Q392 774 392 744 Z`;
  return `
${shadow(512, 790, 210)}
${drop ? `<ellipse cx="694" cy="752" rx="30" ry="17" fill="${AMBER}" opacity=".9"/><ellipse cx="686" cy="746" rx="8" ry="5" fill="#FFFFFF" opacity=".55"/>` : ''}
${citrus ? `<path d="M706 700 Q760 660 742 606" stroke="#E8A33D" stroke-width="26" stroke-linecap="round" fill="none" opacity=".95"/><path d="M706 700 Q760 660 742 606" stroke="#F6D9A8" stroke-width="8" stroke-linecap="round" fill="none" opacity=".8"/>` : ''}
<rect x="474" y="330" width="76" height="52" rx="12" fill="url(#silver)"/>
<rect x="450" y="242" width="124" height="104" rx="20" fill="${cap}"/>
${shine(464, 254, 26, 78, 12, '.16')}
<path d="${bodyPath}" fill="${body}" stroke="#0F2015" stroke-opacity=".25" stroke-width="3"/>
${liquid ? `<path d="M400 556 Q512 578 624 556 L624 740 Q624 766 598 766 L426 766 Q400 766 400 740 Z" fill="${liquid}" opacity=".72"/>` : ''}
${band ? `<rect x="392" y="700" width="240" height="26" fill="${LIME}" opacity=".95"/>` : ''}
${shine(414, 412, 34, 320, 16, '.24')}
<path d="M600 412 Q620 430 620 470 L620 720" stroke="#FFFFFF" stroke-opacity=".18" stroke-width="10" stroke-linecap="round" fill="none"/>
`;
}

function pumpBottle() {
  return `
${shadow(512, 796, 236)}
<path d="M366 404 Q366 356 414 348 L610 348 Q658 356 658 404 L658 748 Q658 776 630 776 L394 776 Q366 776 366 748 Z" fill="url(#green)" stroke="#0F2015" stroke-opacity=".3" stroke-width="3"/>
<rect x="470" y="300" width="84" height="54" rx="12" fill="#173020"/>
<path d="M466 302 L558 302 L558 276 Q580 266 596 276 L596 292 L558 292 L558 286 L466 286 Z" fill="url(#black)"/>
<rect x="580" y="264" width="86" height="26" rx="13" fill="url(#black)"/>
<rect x="366" y="700" width="292" height="26" fill="${LIME}" opacity=".95"/>
${shine(392, 392, 40, 300, 18, '.22')}
<path d="M620 400 Q638 420 638 460 L638 720" stroke="#FFFFFF" stroke-opacity=".14" stroke-width="10" stroke-linecap="round" fill="none"/>
`;
}

function bear(x, y, s = 1, color = RUBY) {
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="${color}">
  <circle cx="0" cy="0" r="22"/><circle cx="-15" cy="-17" r="9"/><circle cx="15" cy="-17" r="9"/>
  <circle cx="0" cy="6" r="13" fill="#FFFFFF" opacity=".22"/>
  <circle cx="-7" cy="-2" r="2.4" fill="#3B1320"/><circle cx="7" cy="-2" r="2.4" fill="#3B1320"/>
</g>`;
}

function gummies() {
  return `
${shadow(512, 796, 244)}
<rect x="336" y="316" width="352" height="76" rx="16" fill="url(#green)"/>
<rect x="352" y="386" width="320" height="374" rx="42" fill="url(#glass)" stroke="#8FA98F" stroke-opacity=".6" stroke-width="3"/>
<rect x="366" y="400" width="292" height="346" rx="34" fill="#FBF6EA" opacity=".72"/>
${bear(430, 500, .9)}${bear(520, 478, .95)}${bear(606, 522, .85)}${bear(470, 590, .9)}${bear(570, 600, .95)}
${shine(372, 410, 30, 300, 15, '.38')}
<rect x="352" y="386" width="320" height="374" rx="42" fill="none" stroke="#FFFFFF" stroke-opacity=".55" stroke-width="4"/>
${bear(724, 706, .78)}${bear(786, 738, .66)}
`;
}

function tabletsBottle() {
  return `
${shadow(512, 790, 226)}
<rect x="424" y="332" width="176" height="70" rx="14" fill="url(#green)"/>
<path d="M396 396 Q396 372 420 372 L604 372 Q628 372 628 396 L628 740 Q628 770 598 770 L426 770 Q396 770 396 740 Z" fill="#EFECE3" stroke="#B7B3A7" stroke-width="3"/>
<rect x="396" y="690" width="232" height="28" fill="${LIME}" opacity=".9"/>
${shine(414, 412, 32, 300, 15, '.55')}
<g fill="#FFFFFF" stroke="#C9C7BE" stroke-width="2">
<ellipse cx="690" cy="700" rx="46" ry="15"/><ellipse cx="690" cy="682" rx="46" ry="15"/><ellipse cx="690" cy="664" rx="46" ry="15"/>
</g>
`;
}

function comb() {
  let teeth = '';
  for (let i = 0; i < 15; i++) teeth += `<rect x="${650 + i * 12}" y="676" width="5" height="76" rx="2" fill="url(#wood)"/>`;
  return `<rect x="636" y="620" width="200" height="62" rx="14" fill="url(#wood)"/>${teeth}`;
}

function beardOil() {
  return `${dropper({ body: 'url(#amber)', liquid: '#E8B45F', cap: 'url(#black)', drop: true })}${comb()}`;
}

function roller() {
  let needles = '';
  for (let i = 0; i < 26; i++) {
    const x = 388 + i * 9.4;
    needles += `<circle cx="${x}" cy="${330 + (i % 3) * 6}" r="3.3" fill="#C8D1C6" opacity=".9"/>`;
    needles += `<path d="M${x} 318 L${x + 2} 300" stroke="#E3E8DF" stroke-width="2" stroke-linecap="round" opacity=".75"/>`;
  }
  return `
${shadow(512, 798, 196)}
<rect x="470" y="404" width="84" height="336" rx="38" fill="url(#black)"/>
${shine(486, 424, 20, 284, 10, '.18')}
<rect x="486" y="374" width="52" height="52" rx="12" fill="url(#silver)"/>
<rect x="368" y="286" width="288" height="112" rx="56" fill="url(#black)"/>
<ellipse cx="368" cy="342" rx="26" ry="56" fill="#2B302A"/>
<ellipse cx="656" cy="342" rx="26" ry="56" fill="#111410"/>
${needles}
<path d="M392 300 Q512 278 632 300" stroke="#FFFFFF" stroke-opacity=".22" stroke-width="8" stroke-linecap="round" fill="none"/>
`;
}

function eyeCream() {
  return `
${shadow(512, 790, 214)}
<rect x="386" y="330" width="252" height="72" rx="18" fill="url(#silver)"/>
<path d="M384 396 Q384 372 408 372 L616 372 Q640 372 640 396 L640 734 Q640 766 608 766 L416 766 Q384 766 384 734 Z" fill="#F7F5EE" stroke="#C9CFC6" stroke-width="3"/>
<ellipse cx="512" cy="400" rx="100" ry="24" fill="#FFFFFF" opacity=".85"/>
<path d="M588 386 Q620 372 636 396" stroke="#FFFFFF" stroke-width="16" stroke-linecap="round" fill="none" opacity=".85"/>
<circle cx="612" cy="372" r="18" fill="#FFFFFF" opacity=".95"/>
${shine(408, 430, 30, 270, 15, '.55')}
<rect x="384" y="716" width="256" height="20" fill="${LIME}" opacity=".85"/>
`;
}

function blackJar() {
  return `
${shadow(512, 790, 228)}
<rect x="398" y="310" width="228" height="76" rx="16" fill="url(#copper)"/>
${shine(412, 324, 30, 48, 10, '.22')}
<path d="M386 382 Q386 358 410 358 L614 358 Q638 358 638 382 L638 742 Q638 772 608 772 L416 772 Q386 772 386 742 Z" fill="url(#black)"/>
${shine(408, 400, 30, 310, 15, '.16')}
<g transform="translate(694 706)"><ellipse rx="46" ry="18" fill="#1D2220"/><ellipse rx="46" ry="18" fill="url(#copper)" opacity=".55" transform="translate(0 -16)"/></g>
<g transform="translate(790 738)"><ellipse rx="42" ry="17" fill="#1D2220"/><ellipse rx="42" ry="17" fill="url(#copper)" opacity=".55" transform="translate(0 -15)"/></g>
<rect x="386" y="716" width="252" height="18" fill="${LIME}" opacity=".8"/>
`;
}

function spray() {
  return `
${shadow(512, 790, 176)}
<rect x="446" y="246" width="132" height="64" rx="14" fill="url(#black)"/>
<rect x="478" y="214" width="68" height="40" rx="10" fill="url(#silver)"/>
<path d="M438 310 Q438 286 462 286 L562 286 Q586 286 586 310 L586 748 Q586 776 558 776 L466 776 Q438 776 438 748 Z" fill="url(#black)"/>
${shine(456, 326, 24, 392, 12, '.16')}
<rect x="438" y="714" width="148" height="20" fill="${LIME}" opacity=".85"/>
`;
}

function weightLoss() {
  let tapeTicks = '';
  for (let i = 0; i < 15; i++) {
    const x = 264 + i * 11;
    tapeTicks += `<path d="M${x} 706 L${x} 720" stroke="#F2EFE8" stroke-width="2" opacity=".65"/>`;
  }
  return `
${shadow(512, 800, 300, 26)}
<rect x="300" y="330" width="330" height="270" rx="22" fill="url(#green)" transform="rotate(-4 465 465)"/>
<rect x="300" y="556" width="330" height="26" fill="${LIME}" opacity=".95" transform="rotate(-4 465 465)"/>
<g transform="rotate(7 690 470)"><rect x="596" y="360" width="228" height="188" rx="12" fill="#FCFAF5" stroke="#CFC9BB" stroke-width="3"/><rect x="618" y="392" width="184" height="8" rx="4" fill="#D8D2C4"/><rect x="618" y="424" width="150" height="8" rx="4" fill="#D8D2C4"/><rect x="618" y="456" width="170" height="8" rx="4" fill="#D8D2C4"/></g>
<path d="M250 690 Q330 752 440 708" stroke="#242824" stroke-width="24" stroke-linecap="round" fill="none"/>
${tapeTicks}
<rect x="466" y="640" width="300" height="124" rx="24" fill="url(#silver)"/>
<rect x="494" y="666" width="244" height="64" rx="12" fill="#1A211C"/>
<rect x="508" y="678" width="216" height="40" rx="8" fill="#243128" opacity=".7"/>
<rect x="742" y="600" width="66" height="176" rx="28" fill="url(#silver)"/>
<rect x="756" y="580" width="38" height="30" rx="8" fill="#6C756D"/>
`;
}

function clockCap() {
  let leds = '';
  for (let i = 0; i < 15; i++) {
    const a = Math.PI * (0.08 + i * 0.058);
    const x = 512 + Math.cos(a) * 178;
    const y = 470 + Math.sin(a) * 62;
    leds += `<circle cx="${x}" cy="${y}" r="6" fill="#FF4B4B" opacity=".9"/>`;
  }
  return `
${shadow(512, 790, 244)}
<ellipse cx="512" cy="690" rx="196" ry="42" fill="url(#black)"/>
<path d="M330 470 Q340 268 512 256 Q684 268 694 470 Q694 508 650 520 L374 520 Q330 508 330 470 Z" fill="url(#black)"/>
<ellipse cx="512" cy="504" rx="182" ry="54" fill="#101310"/>
${leds}
<ellipse cx="512" cy="504" rx="174" ry="46" fill="#FF3B3B" opacity=".22" filter="url(#glow)"/>
<path d="M372 320 Q420 274 512 270" stroke="#FFFFFF" stroke-opacity=".14" stroke-width="14" stroke-linecap="round" fill="none"/>
<rect x="482" y="690" width="60" height="62" rx="10" fill="#141814"/>
`;
}

const products = {
  'advanced-hair-growth-serum': () => dropper({ body: 'url(#amber)', liquid: '#D9A45E', cap: 'url(#black)', drop: true }),
  'anti-hairfall-shampoo': pumpBottle,
  'biotin-gummies': gummies,
  'hair-health-tablets': tabletsBottle,
  'beard-growth-oil': beardOil,
  'beard-growth-roller': roller,
  'vitamin-c-serum': () => dropper({ body: 'url(#frost)', liquid: '#F0C778', cap: 'url(#black)', citrus: true }),
  'under-eye-cream': eyeCream,
  'acne-control-serum': () => dropper({ body: 'url(#glass)', liquid: 'url(#paleGreen)', cap: '#F2F0E9' }),
  'testosterone-booster': blackJar,
  'delay-spray': spray,
  'weight-loss-program': weightLoss,
  'clock-cap': clockCap
};

for (const [name, draw] of Object.entries(products)) {
  fs.writeFileSync(path.join(out, `${name}.svg`), frame(1024, 1024, draw()), 'utf8');
}

// Demo progress frames: the same crown illustrated with increasing density.
for (const [week, density, ring] of [['01', 26, 0.35], ['03', 52, 0.6], ['05', 86, 0.9]]) {
  let strands = '';
  for (let i = 0; i < density; i++) {
    const a = (i * 137.5 * Math.PI) / 180;
    const r = 60 + ((i * 47) % 170);
    const x = 400 + Math.cos(a) * r;
    const y = 420 + Math.sin(a) * r * 0.82;
    const len = 44 + ((i * 29) % 46);
    strands += `<path d="M${x} ${y} Q${x + 12} ${y - len * 0.6} ${x + 4} ${y - len}" stroke="${i % 4 === 0 ? LIME : GREEN}" stroke-width="${i % 5 === 0 ? 5 : 3}" stroke-linecap="round" fill="none" opacity="${0.5 + (i % 4) * 0.12}"/>`;
  }
  const content = `
${shadow(400, 700, 210, 30)}
<ellipse cx="400" cy="430" rx="214" ry="248" fill="#E7C9A8"/>
<ellipse cx="400" cy="430" rx="188" ry="222" fill="#EAD2B5"/>
<ellipse cx="400" cy="430" rx="176" ry="210" fill="#D9B48F" opacity=".45"/>
<circle cx="400" cy="430" r="${170 * ring}" fill="${GREEN}" opacity="${0.08 + ring * 0.12}"/>
${strands}
<path d="M280 590 Q400 646 520 590" stroke="#C79C75" stroke-width="7" stroke-linecap="round" fill="none" opacity=".6"/>
<rect x="620" y="300" width="120" height="120" rx="24" fill="#FFFFFF" opacity=".35"/>
<circle cx="680" cy="360" r="34" fill="${GREEN}" opacity=".12"/>
`;
  fs.writeFileSync(path.join(out, `crown-week-${week}.svg`), frame(800, 1000, content), 'utf8');
}

// Illustrative avatars: stylised, deliberately not photographic portraits.
const people = [
  ['raj-gandhi', '#D8B28F', '#20201E', '#2F5A3F'],
  ['shreyans-jain', '#C9946B', '#171717', '#6E4E34'],
  ['manan-sancheti', '#E0BD9A', '#3A2519', '#1F3D2B'],
  ['harsh-redasani', '#C98F63', '#141414', '#3A5A43'],
  ['chandan-singh', '#B9825C', '#221914', '#5C432C']
];
for (const [name, skin, hair, shirt] of people) {
  const content = `
<circle cx="256" cy="256" r="232" fill="${GREEN}" opacity=".10"/>
<path d="M56 512 Q90 372 256 372 Q422 372 456 512 L456 512 L56 512 Z" fill="${shirt}"/>
<path d="M196 366 L196 412 Q256 452 316 412 L316 366 Z" fill="${skin}"/>
<ellipse cx="256" cy="250" rx="112" ry="132" fill="${skin}"/>
<path d="M144 250 Q140 106 256 104 Q372 106 368 250 Q346 190 306 176 Q250 206 190 176 Q158 196 144 250 Z" fill="${hair}"/>
<ellipse cx="214" cy="250" rx="9" ry="11" fill="#263029" opacity=".85"/>
<ellipse cx="298" cy="250" rx="9" ry="11" fill="#263029" opacity=".85"/>
<path d="M232 310 Q256 326 280 310" stroke="#8A5A48" stroke-width="7" stroke-linecap="round" fill="none"/>
<path d="M256 264 L250 292 L262 292" stroke="#A97358" stroke-width="5" stroke-linecap="round" fill="none" opacity=".7"/>
`;
  fs.writeFileSync(path.join(out, `${name}.svg`), frame(512, 512, content), 'utf8');
}

console.log(`Wrote ${fs.readdirSync(out).filter((f) => f.endsWith('.svg')).length} SVG files to ${out}`);
