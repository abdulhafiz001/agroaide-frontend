import React from 'react';
import type { PressableProps } from 'react-native';
import styled from '@/design-system/styled';

import { Text } from './Typography';

type ChipTone = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface ChipProps extends PressableProps {
  label: string;
  tone?: ChipTone;
  icon?: React.ReactNode;
}

const Container = styled.Pressable<{ tone: ChipTone }>`
  flex-direction: row;
  align-items: center;
  padding: ${({ theme }) => `${theme.spacing.xs}px ${theme.spacing.sm}px`};
  border-radius: ${({ theme }) => theme.radii.pill}px;
  gap: ${({ theme }) => theme.spacing.xxs}px;
  background-color: ${({ theme, tone }) => {
    switch (tone) {
      case 'success':
        return `${theme.colors.success}22`;
      case 'warning':
        return `${theme.colors.warning}22`;
      case 'danger':
        return `${theme.colors.danger}22`;
      case 'info':
        return `${theme.colors.info}22`;
      default:
        return `${theme.colors.border}33`;
    }
  }};
`;

export const Chip: React.FC<ChipProps> = ({ label, tone = 'default', icon, ...rest }) => {
  return (
    <Container tone={tone} {...rest}>
      {icon}
      <Text variant="caption" tone={tone === 'default' ? 'muted' : tone}>
        {label}
      </Text>
    </Container>
  );
};

