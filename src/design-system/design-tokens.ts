export const colorPalette = {
  primaryGreen: '#57b346',
  warmOrange: '#db9534',
  deepForest: '#2c5c2a',
  creamWhite: '#f9f7f2',
  softBeige: '#f0e6d4',
  skyBlue: '#4a90e2',
  alertRed: '#e63946',
  charcoal: '#171b16',
  graphite: '#2b2b2b',
  pearl: '#fcfbf7',
  sage: '#8ba888',
  soilBrown: '#7b5e36',
  sunrise: '#ffedd5',
  dusk: '#1f2a37',
  midnight: '#0d1117',
  success: '#2eb873',
  warning: '#f1c40f',
  info: '#3aa0ff',
};

export const spacing = {
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  families: {
    primary: 'Inter',
    secondary: 'Inter',
    mono: 'Inter',
  },
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    '2xl': 26,
    '3xl': 32,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeights: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.4,
    relaxed: 1.5,
  },
};

export const radii = {
  none: 0,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999,
};

export const elevation = {
  xs: {
    shadowColor: '#00000020',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sm: {
    shadowColor: '#00000025',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  md: {
    shadowColor: '#00000030',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
};

export const motion = {
  durations: {
    shortest: 120,
    short: 180,
    medium: 250,
    long: 350,
  },
  easing: {
    standard: [0.2, 0.8, 0.2, 1],
    entrance: [0.4, 0, 0.2, 1],
    exit: [0.4, 0, 1, 1],
  },
};

export type ColorToken = keyof typeof colorPalette;

