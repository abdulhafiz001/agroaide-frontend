import { useMutation } from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled, { useTheme } from '@/design-system/styled';


import { useToast } from '@/components/Toast';
import { Button, InputField, Surface, Text } from '@/design-system/components';
import { ApiError } from '@/services/apiClient';
import { authApi } from '@/services/authApi';
import { clearAllSyncActions } from '@/services/syncQueue';
import { useAppStore } from '@/store/useAppStore';
import { authStorage } from '@/utils/authStorage';
import { clearAuthQueryCache } from '@/utils/queryClient';
import { isFarmProfileComplete } from '@/utils/farmProfile';

const Container = styled(SafeAreaView)`
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
  keyboardShouldPersistTaps: 'handled' as const,
})``;

const Card = styled(Surface)`
  gap: ${({ theme }) => theme.spacing.md}px;
`;

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const toast = useToast();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const setAuthState = useAppStore((state) => state.setAuthState);
  const setProfile = useAppStore((state) => state.setFarmerProfile);

  const loginMutation = useMutation({
    mutationFn: () => authApi.login(identifier.trim(), password),
    onMutate: () => setAuthState({ status: 'authenticating' }),
    onSuccess: async (response) => {
      clearAuthQueryCache();
      await clearAllSyncActions();
      await authStorage.saveToken(response.token);
      setAuthState({ status: 'authenticated', token: response.token });
      setProfile(response.profile);
      console.info('[auth] sign-in completed');
      toast.success('Welcome back', 'Signed in successfully.');
      if (!isFarmProfileComplete(response.profile)) {
        router.replace('/auth/complete-farm');
      } else {
        router.replace('/(app)/(tabs)/dashboard');
      }
    },
    onError: (error) => {
      clearAuthQueryCache();
      setAuthState({ status: 'signedOut' });
      const message = error instanceof ApiError ? error.message : 'Please verify your credentials and try again.';
      toast.error('Login failed', message);
    },
  });

  return (
    <Container>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <Content>
          <Text variant="eyebrow" tone="accent">
            Welcome back
          </Text>
          <Text variant="display">Sign in to AgroAide</Text>
          <Card rounded="xl">
            <InputField
              label="Email or phone number"
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="name@email.com or 0803..."
            />
            <InputField
              label="Password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              rightElement={
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </Pressable>
              }
            />
            <View style={{ alignItems: 'flex-end' }}>
              <Link href="/auth/recovery" asChild>
                <Text variant="caption" tone="accent" align="right">
                  Forgot password?
                </Text>
              </Link>
            </View>
            <Button
              label="Sign In"
              onPress={() => loginMutation.mutate()}
              loading={loginMutation.isPending}
              fullWidth
              disabled={!identifier || !password}
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
