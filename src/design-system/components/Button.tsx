import React from 'react';
import { ActivityIndicator, PressableProps } from 'react-native';
import styled from '@/design-system/styled';

import { Text } from './Typography';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

interface ButtonProps extends PressableProps {
  label: string;
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const ButtonBase = styled.Pressable<{ variant: ButtonVariant; fullWidth?: boolean; disabled?: boolean }>`
  min-height: 48px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => `${theme.spacing.sm}px ${theme.spacing.lg}px`};
  border-radius: ${({ theme }) => theme.radii.lg}px;
  gap: ${({ theme }) => theme.spacing.xs}px;
  background-color: ${({ theme, variant }) => {
    switch (variant) {
      case 'secondary':
      case 'outline':
        return theme.colors.surface;
      case 'ghost':
        return 'transparent';
      default:
        return theme.colors.primary;
    }
  }};
  border-width: ${({ variant }) => (variant === 'ghost' || variant === 'secondary' || variant === 'outline' ? 1 : 0)}px;
  border-color: ${({ theme, variant }) =>
    variant === 'ghost' || variant === 'secondary' || variant === 'outline' ? theme.colors.border : 'transparent'};
  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
`;

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = 'primary',
  icon,
  loading,
  disabled,
  fullWidth,
  ...rest
}) => {
  const tone: Parameters<typeof Text>[0]['tone'] =
    variant === 'primary' ? 'inverse' : variant === 'secondary' || variant === 'outline' ? 'default' : 'accent';

  return (
    <ButtonBase
      variant={variant}
      disabled={disabled || loading}
      fullWidth={fullWidth}
      accessibilityRole="button"
      accessibilityLabel={rest.accessibilityLabel ?? label}
      accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#ffffff' : undefined} />
      ) : (
        <>
          {icon}
          <Text variant="headline" tone={tone}>
            {label}
          </Text>
        </>
      )}
    </ButtonBase>
  );
};

