import type { ViewProps } from 'react-native';
import { Platform } from 'react-native';
import styled from '@/design-system/styled';
import { css } from 'styled-components/native';

type SurfaceVariant = 'default' | 'muted' | 'elevated' | 'transparent';
type SpacingScale = 'none' | 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type RadiusScale = 'sm' | 'md' | 'lg' | 'xl' | 'pill';

interface SurfaceProps extends ViewProps {
  variant?: SurfaceVariant;
  padding?: SpacingScale;
  rounded?: RadiusScale;
}

const variantStyles = {
  default: css`
    background-color: ${({ theme }) => theme.colors.surface};
    border-color: ${({ theme }) => `${theme.colors.border}50`};
    border-width: 1px;
    ${Platform.OS === 'ios'
      ? css`
          shadow-color: rgba(0, 0, 0, 0.12);
          shadow-offset: 0px 6px;
          shadow-opacity: 0.12;
          shadow-radius: 12px;
        `
      : css`
          elevation: 4;
        `}
  `,
  muted: css`
    background-color: ${({ theme }) => theme.colors.surfaceAlt};
    border-color: transparent;
  `,
  elevated: css`
    background-color: ${({ theme }) => theme.colors.surface};
    border-color: ${({ theme }) => `${theme.colors.border}30`};
    ${Platform.OS === 'ios'
      ? css`
          shadow-color: rgba(0, 0, 0, 0.18);
          shadow-offset: 0px 8px;
          shadow-opacity: 0.18;
          shadow-radius: 16px;
        `
      : css`
          elevation: 8;
        `}
  `,
  transparent: css`
    background-color: transparent;
    border-color: transparent;
  `,
};

export const Surface = styled.View<Omit<SurfaceProps, 'style'>>`
  border-radius: ${({ theme, rounded = 'lg' }) => theme.radii[rounded]}px;
  padding: ${({ theme, padding = 'md' }) => theme.spacing[padding]}px;
  ${(props) => variantStyles[props.variant ?? 'default']};
`;

