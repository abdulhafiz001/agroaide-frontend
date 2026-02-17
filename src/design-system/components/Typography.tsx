import type { TextProps as RNTextProps } from 'react-native';
import styled from '@/design-system/styled';

import { typography } from '../design-tokens';

type TextVariant = 'display' | 'title' | 'headline' | 'body' | 'caption' | 'eyebrow';
type TextTone = 'default' | 'muted' | 'inverse' | 'accent' | 'success' | 'warning' | 'danger';

type SizeKey = keyof typeof typography.sizes;
type WeightKey = keyof typeof typography.weights;
type LineHeightKey = keyof typeof typography.lineHeights;

const variantConfig: Record<
  TextVariant,
  {
    size: SizeKey;
    weight: WeightKey;
    lineHeight: LineHeightKey;
    letterSpacing?: number;
    uppercase?: boolean;
  }
> = {
  display: { size: '3xl', weight: 'bold', lineHeight: 'relaxed' },
  title: { size: '2xl', weight: 'semibold', lineHeight: 'snug' },
  headline: { size: 'lg', weight: 'semibold', lineHeight: 'normal' },
  body: { size: 'md', weight: 'regular', lineHeight: 'normal' },
  caption: { size: 'sm', weight: 'medium', lineHeight: 'snug' },
  eyebrow: { size: 'xs', weight: 'semibold', lineHeight: 'tight', letterSpacing: 1, uppercase: true },
};

const toneColor = (tone: TextTone, theme: any) => {
  switch (tone) {
    case 'muted':
      return theme.colors.textSecondary;
    case 'inverse':
      return theme.mode === 'light' ? theme.colors.background : theme.colors.surface;
    case 'accent':
      return theme.colors.accent;
    case 'success':
      return theme.colors.success;
    case 'warning':
      return theme.colors.warning;
    case 'danger':
      return theme.colors.danger;
    default:
      return theme.colors.textPrimary;
  }
};

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
  align?: 'left' | 'center' | 'right';
  uppercase?: boolean;
}

const weightToFont: Record<WeightKey, string> = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

const StyledText = styled.Text<TextProps>`
  color: ${({ theme, tone = 'default' }) => toneColor(tone, theme)};
  font-size: ${({ theme, variant = 'body' }) => theme.typography.sizes[variantConfig[variant].size]}px;
  font-family: ${({ variant = 'body' }) => weightToFont[variantConfig[variant].weight]};
  line-height: ${({ theme, variant = 'body' }) =>
      theme.typography.sizes[variantConfig[variant].size] *
      theme.typography.lineHeights[variantConfig[variant].lineHeight]}px;
  text-align: ${({ align = 'left' }) => align};
  letter-spacing: ${({ variant = 'body' }) => variantConfig[variant].letterSpacing ?? 0}px;
  text-transform: ${({ uppercase, variant = 'body' }) => {
    const config = variantConfig[variant];
    const shouldUppercase = uppercase ?? config.uppercase ?? false;
    return shouldUppercase ? 'uppercase' : 'none';
  }};
`;

export const Text: React.FC<React.PropsWithChildren<TextProps>> = ({ children, ...rest }) => {
  return <StyledText {...rest}>{children}</StyledText>;
};

