import { useMutation } from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform } from 'react-native';
import styled from '@/design-system/styled';

import { Button, InputField, Surface, Text } from '@/design-system/components';
import { ApiError } from '@/services/apiClient';
import { authApi } from '@/services/authApi';
import { useAppStore } from '@/store/useAppStore';

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Content = styled.ScrollView.attrs({
  contentContainerStyle: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 24,
  },
})``;

const Card = styled(Surface)`
  gap: ${({ theme }) => theme.spacing.md}px;
`;

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const setAuthState = useAppStore((state) => state.setAuthState);
  const setProfile = useAppStore((state) => state.setFarmerProfile);

  const loginMutation = useMutation({
    mutationFn: () => authApi.login(email.trim(), password),
    onMutate: () => setAuthState({ status: 'authenticating' }),
    onSuccess: (response) => {
      setAuthState({ status: 'authenticated', token: response.token });
      setProfile(response.profile);
      router.replace('/(app)/(tabs)/dashboard');
    },
    onError: (error) => {
      setAuthState({ status: 'signedOut' });
      const message = error instanceof ApiError ? error.message : 'Please verify your credentials and try again.';
      Alert.alert('Login failed', message);
    },
  });

  return (
    <Container>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Content>
          <Text variant="eyebrow" tone="accent">
            Welcome back
          </Text>
          <Text variant="display">Sign in to AgroAide</Text>
          <Card rounded="xl">
            <InputField label="Email address" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
            <InputField label="Password" secureTextEntry value={password} onChangeText={setPassword} />
            <Link href="/auth/recovery" asChild>
              <Text variant="caption" tone="accent" align="right">
                Forgot password?
              </Text>
            </Link>
            <Button
              label="Sign In"
              onPress={() => loginMutation.mutate()}
              loading={loginMutation.isPending}
              fullWidth
              disabled={!email || !password}
            />
          </Card>
          <Surface variant="transparent" style={{ alignItems: 'center' }}>
            <Text variant="body" tone="muted">
              New to AgroAide?{' '}
              <Link href="/auth/register" asChild>
                <Text variant="body" tone="accent">
                  Create account
                </Text>
              </Link>
            </Text>
          </Surface>
        </Content>
      </KeyboardAvoidingView>
    </Container>
  );
}

