import {dark, light, type Palette} from '../src/config/theme';

/** WCAG 2.x relative luminance and contrast, with rgba colours laid over their surface. */
function parse(c: string): [number, number, number, number] {
  const hex = c.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const [r, g, b] = [0, 2, 4].map(i => parseInt(hex[1].slice(i, i + 2), 16));
    return [r, g, b, 1];
  }
  const rgba = c.match(/^rgba?\(([^)]+)\)$/);
  if (!rgba) {throw new Error(`Unknown colour ${c}`);}
  const [r, g, b, a = '1'] = rgba[1].split(',').map(s => s.trim());
  return [Number(r), Number(g), Number(b), Number(a)];
}
function over(top: string, under: string): [number, number, number] {
  const [r, g, b, a] = parse(top);
  const [r2, g2, b2] = parse(under);
  return [r * a + r2 * (1 - a), g * a + g2 * (1 - a), b * a + b2 * (1 - a)];
}
function lum([r, g, b]: [number, number, number]) {
  const ch = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}
export function contrast(fg: string, bg: string, base = '#ffffff') {
  const b = over(bg, base);
  const f = over(fg, `rgb(${b.join(',')})`);
  const [l1, l2] = [lum(f), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

describe.each([
  ['light', light],
  ['dark', dark],
] as [string, Palette][])('%s palette', (_name, p) => {
  const surfaces = {ground: p.ground, panel: p.panel, panel2: p.panel2};

  test.each(['text', 'textSoft', 'textMuted', 'primaryText', 'link'] as const)('%s reads at 4.5:1 on every surface', key => {
    for (const [where, bg] of Object.entries(surfaces)) {
      // The surface name shows in the failure message.
      expect({where, ok: contrast(p[key], bg) >= 4.5}).toEqual({where, ok: true});
    }
  });

  test('white labels on filled buttons read at 4.5:1', () => {
    for (const fill of [p.primary, p.primaryPressed, p.positive, p.positivePressed, '#c4141b', '#a51117']) {
      expect(contrast(p.onPrimary, fill)).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('words on the night band read at 4.5:1', () => {
    expect(contrast(p.onBand, p.band)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.onBandMuted, p.band)).toBeGreaterThanOrEqual(4.5);
    // Brand art used on the band for "covered" and "your branch".
    expect(contrast('#5fd99a', p.band)).toBeGreaterThanOrEqual(4.5);
  });

  test.each(['ok', 'warn', 'bad', 'info', 'neutral'] as const)('%s status words read on their tint and on a panel', tone => {
    const t = p.tones[tone];
    expect(contrast(t.text, t.bg, p.panel)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t.text, t.bg, p.ground)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t.text, p.panel)).toBeGreaterThanOrEqual(4.5);
  });

  test('input borders and switches stand out at 3:1', () => {
    expect(contrast(p.lineStrong, p.panel)).toBeGreaterThanOrEqual(3);
    expect(contrast(p.lineStrong, p.ground)).toBeGreaterThanOrEqual(3);
    expect(contrast(p.focus, p.panel)).toBeGreaterThanOrEqual(3);
  });
});
