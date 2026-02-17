import React from 'react';
import { ActivityIndicator, PressableProps } from 'react-native';
import styled from '@/design-system/styled';

import { Text } from './Typography';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends PressableProps {
  label: string;
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const ButtonBase = styled.Pressable<{ variant: ButtonVariant; fullWidth?: boolean; disabled?: boolean }>`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => `${theme.spacing.sm}px ${theme.spacing.lg}px`};
  border-radius: ${({ theme }) => theme.radii.lg}px;
  gap: ${({ theme }) => theme.spacing.xs}px;
  background-color: ${({ theme, variant }) => {
    switch (variant) {
      case 'secondary':
        return theme.colors.surface;
      case 'ghost':
        return 'transparent';
      default:
        return theme.colors.primary;
    }
  }};
  border-width: ${({ variant }) => (variant === 'ghost' ? 1 : 0)}px;
  border-color: ${({ theme, variant }) => (variant === 'ghost' ? theme.colors.border : 'transparent')};
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
    variant === 'primary' ? 'inverse' : variant === 'secondary' ? 'default' : 'accent';

  return (
    <ButtonBase variant={variant} disabled={disabled || loading} fullWidth={fullWidth} {...rest}>
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

