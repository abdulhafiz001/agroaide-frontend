import React, { forwardRef } from 'react';
import { TextInput } from 'react-native';
import type { TextInputProps } from 'react-native';
import styled from '@/design-system/styled';

import { Text } from './Typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

const Wrapper = styled.View`
  width: 100%;
  gap: ${({ theme }) => theme.spacing.xs}px;
`;

const StyledInput = styled.TextInput<{ hasError?: boolean }>`
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing.sm}px ${theme.spacing.md}px`};
  border-radius: ${({ theme }) => theme.radii.md}px;
  border-width: 1.5px;
  border-color: ${({ theme, hasError }) => (hasError ? theme.colors.danger : `${theme.colors.border}aa`)};
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: Inter_500Medium;
`;

export const InputField = forwardRef<TextInput, InputProps>(({ label, error, ...rest }, ref) => {
  return (
    <Wrapper>
      {label ? (
        <Text variant="caption" tone="muted">
          {label}
        </Text>
      ) : null}
      <StyledInput ref={ref} placeholderTextColor="#9ba3ab" hasError={Boolean(error)} {...rest} />
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : null}
    </Wrapper>
  );
});

InputField.displayName = 'InputField';

