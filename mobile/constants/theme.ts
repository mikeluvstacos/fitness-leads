export const Colors = {
  primary:      '#F97316',  // orange — hunter energy
  primaryDark:  '#EA580C',
  accent:       '#FBBF24',  // amber
  background:   '#0F172A',  // dark navy
  surface:      '#1E293B',
  surfaceAlt:   '#334155',
  border:       '#475569',
  text:         '#F1F5F9',
  textMuted:    '#94A3B8',
  textDim:      '#64748B',
  danger:       '#EF4444',
  success:      '#22C55E',
  white:        '#FFFFFF',
  black:        '#000000',
};

export const Platform = {
  Craigslist: { color: '#7C3AED', bg: '#1E1040' },
  Reddit:     { color: '#EF4444', bg: '#2D0F0F' },
  Web:        { color: '#3B82F6', bg: '#0F1E3D' },
  OfferUp:    { color: '#F59E0B', bg: '#2D1F05' },
  'Yellow Pages': { color: '#22C55E', bg: '#0F2D1A' },
};

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  full: 9999,
};

export const FontSize = {
  xs:   11,
  sm:   13,
  md:   15,
  lg:   17,
  xl:   20,
  xxl:  24,
  xxxl: 30,
};

export const FontWeight = {
  regular:  '400' as const,
  medium:   '500' as const,
  semibold: '600' as const,
  bold:     '700' as const,
};
