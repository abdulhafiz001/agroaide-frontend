import { colorPalette, elevation, motion, radii, spacing, typography } from './design-tokens';

export type ThemeMode = 'light' | 'dark' | 'field';

export type ThemePreference = ThemeMode | 'system';

export interface AgroTheme {
  mode: ThemeMode;
  colors: {
    background: string;
    surface: string;
    surfaceAlt: string;
    overlay: string;
    primary: string;
    secondary: string;
    accent: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    info: string;
    danger: string;
    muted: string;
  };
  gradients: {
    primary: [string, string];
    alert: [string, string];
    success: [string, string];
    forecast: [string, string];
  };
  spacing: typeof spacing;
  typography: typeof typography;
  radii: typeof radii;
  elevation: typeof elevation;
  motion: typeof motion;
}

const baseTheme = {
  spacing,
  typography,
  radii,
  elevation,
  motion,
};

const createTheme = (mode: ThemeMode): AgroTheme => {
  if (mode === 'dark') {
    return {
      mode,
      ...baseTheme,
      colors: {
        background: colorPalette.midnight,
        surface: '#111418',
        surfaceAlt: '#1a2217',
        overlay: '#0b0f13cc',
        primary: colorPalette.primaryGreen,
        secondary: colorPalette.skyBlue,
        accent: colorPalette.warmOrange,
        textPrimary: '#f5f7eb',
        textSecondary: '#cbd5c0',
        border: '#272c35',
        success: colorPalette.success,
        warning: colorPalette.warning,
        info: colorPalette.info,
        danger: colorPalette.alertRed,
        muted: '#5c6459',
      },
      gradients: {
        primary: [colorPalette.primaryGreen, '#7ed957'],
        alert: [colorPalette.alertRed, '#f87171'],
        success: ['#11998e', '#38ef7d'],
        forecast: [colorPalette.skyBlue, '#7fbcff'],
      },
    };
  }

  if (mode === 'field') {
    return {
      mode,
      ...baseTheme,
      colors: {
        background: '#0b1d11',
        surface: '#11331d',
        surfaceAlt: '#154126',
        overlay: '#09140acc',
        primary: '#9bff6d',
        secondary: '#7dd3fc',
        accent: '#ffd166',
        textPrimary: '#f8ffe8',
        textSecondary: '#d4f9b7',
        border: '#1f4229',
        success: '#4ade80',
        warning: '#facc15',
        info: '#7dd3fc',
        danger: '#fb7185',
        muted: '#8ecf9f',
      },
      gradients: {
        primary: ['#5efc82', '#4ade80'],
        alert: ['#ff6b6b', '#f87171'],
        success: ['#59f390', '#22c55e'],
        forecast: ['#38bdf8', '#7dd3fc'],
      },
    };
  }

  return {
    mode,
    ...baseTheme,
    colors: {
      background: colorPalette.creamWhite,
      surface: colorPalette.pearl,
      surfaceAlt: colorPalette.softBeige,
      overlay: '#0f172acc',
      primary: colorPalette.primaryGreen,
      secondary: colorPalette.skyBlue,
      accent: colorPalette.warmOrange,
      textPrimary: colorPalette.deepForest,
      textSecondary: '#4f5c4e',
      border: '#d5d0c3',
      success: colorPalette.success,
      warning: colorPalette.warning,
      info: colorPalette.info,
      danger: colorPalette.alertRed,
      muted: '#909a89',
    },
    gradients: {
      primary: [colorPalette.primaryGreen, '#8ed46d'],
      alert: [colorPalette.alertRed, '#ff9770'],
      success: ['#7ed957', '#38ef7d'],
      forecast: ['#7dc4ff', '#4a90e2'],
    },
  };
};

export const lightTheme = createTheme('light');
export const darkTheme = createTheme('dark');
export const fieldTheme = createTheme('field');

export const themesByMode: Record<ThemeMode, AgroTheme> = {
  light: lightTheme,
  dark: darkTheme,
  field: fieldTheme,
};

export const getThemeByPreference = (
  preference: ThemePreference,
  systemColorScheme: 'light' | 'dark' | null,
): AgroTheme => {
  if (preference === 'system') {
    return systemColorScheme === 'dark' ? darkTheme : lightTheme;
  }

  return themesByMode[preference];
};

export type { AgroTheme as DesignSystemTheme };

