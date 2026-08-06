import React, { forwardRef } from 'react';
import { TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import styled from '@/design-system/styled';

import { Text } from './Typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  rightElement?: React.ReactNode;
}

const Wrapper = styled.View`
  width: 100%;
  gap: ${({ theme }) => theme.spacing.xs}px;
`;

const InputRow = styled.View<{ hasError?: boolean }>`
  min-height: 48px;
  width: 100%;
  flex-direction: row;
  align-items: center;
  border-radius: ${({ theme }) => theme.radii.md}px;
  border-width: 1.5px;
  border-color: ${({ theme, hasError }) => (hasError ? theme.colors.danger : `${theme.colors.border}aa`)};
  background-color: ${({ theme }) => theme.colors.surface};
  padding-right: ${({ theme }) => theme.spacing.sm}px;
`;

const StyledInput = styled(TextInput)`
  flex: 1;
  padding: ${({ theme }) => `${theme.spacing.sm}px ${theme.spacing.md}px`};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: Inter_500Medium;
`;

export const InputField = forwardRef<TextInput, InputProps>(({ label, error, rightElement, style, ...rest }, ref) => {
  return (
    <Wrapper>
      {label ? (
        <Text variant="caption" tone="muted">
          {label}
        </Text>
      ) : null}
      <InputRow hasError={Boolean(error)}>
        <StyledInput
          ref={ref}
          placeholderTextColor="#9ba3ab"
          style={style}
          accessibilityLabel={rest.accessibilityLabel ?? label}
          accessibilityHint={rest.accessibilityHint ?? error}
          {...rest}
        />
        {rightElement ? <View>{rightElement}</View> : null}
      </InputRow>
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : null}
    </Wrapper>
  );
});

InputField.displayName = 'InputField';
