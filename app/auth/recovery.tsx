import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import styled from '@/design-system/styled';
import { useTheme } from 'styled-components/native';

import { useToast } from '@/components/Toast';
import { Button, InputField, Surface, Text } from '@/design-system/components';
import { ApiError } from '@/services/apiClient';
import { authApi } from '@/services/authApi';

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Content = styled.ScrollView.attrs({
  contentContainerStyle: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 20,
  },
  keyboardShouldPersistTaps: 'handled' as const,
})``;

const Card = styled(Surface)`
  gap: ${({ theme }) => theme.spacing.md}px;
  margin-top: 16px;
`;

export default function RecoveryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const toast = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const requestMutation = useMutation({
    mutationFn: () => authApi.requestPasswordReset(identifier.trim()),
    onSuccess: (response) => {
      toast.success('Recovery code sent', response.message);
      setStep(2);
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : 'Unable to send recovery code right now.';
      toast.error('Recovery failed', message);
    },
  });

  const resetMutation = useMutation({
    mutationFn: () =>
      authApi.resetPasswordWithCode({
        identifier: identifier.trim(),
        code: code.trim(),
        password,
        password_confirmation: passwordConfirmation,
      }),
    onSuccess: (response) => {
      toast.success('Password updated', response.message);
      router.replace('/auth/login');
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : 'Unable to reset password right now.';
      toast.error('Reset failed', message);
    },
  });

  const canSubmitReset =
    Boolean(code.trim().length === 6) &&
    Boolean(password) &&
    Boolean(passwordConfirmation) &&
    password === passwordConfirmation;

  return (
    <Container>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <Content>
          <Text variant="display">Recover access</Text>
          <Text variant="body" tone="muted">
            {step === 1
              ? 'Enter your email or phone number. If an account exists, we will email a 6-digit recovery code.'
              : 'Enter the code from your email and choose a new password.'}
          </Text>

          {step === 1 ? (
            <Card rounded="xl">
              <InputField
                label="Email or phone number"
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="name@email.com or 0803..."
              />
              <Button
                label="Send recovery code"
                onPress={() => requestMutation.mutate()}
                loading={requestMutation.isPending}
                disabled={!identifier.trim()}
                fullWidth
              />
              <Button label="Back to sign in" variant="ghost" onPress={() => router.back()} fullWidth />
            </Card>
          ) : (
            <Card rounded="xl">
              <InputField
                label="Recovery code"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="6-digit code"
              />
              <InputField
                label="New password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                rightElement={
                  <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={theme.colors.textSecondary}
                    />
                  </Pressable>
                }
              />
              <InputField
                label="Confirm new password"
                value={passwordConfirmation}
                onChangeText={setPasswordConfirmation}
                secureTextEntry={!showPassword}
              />
              <Button
                label="Reset password"
                onPress={() => resetMutation.mutate()}
                loading={resetMutation.isPending}
                disabled={!canSubmitReset}
                fullWidth
              />
              <Button
                label="Resend code"
                variant="ghost"
                onPress={() => requestMutation.mutate()}
                loading={requestMutation.isPending}
                fullWidth
              />
            </Card>
          )}
        </Content>
      </KeyboardAvoidingView>
    </Container>
  );
}
