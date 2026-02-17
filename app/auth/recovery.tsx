import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert } from 'react-native';
import styled from '@/design-system/styled';

import { Button, InputField, Surface, Text } from '@/design-system/components';
import { ApiError } from '@/services/apiClient';
import { authApi } from '@/services/authApi';

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.lg}px ${({ theme }) => theme.spacing.md}px;
`;

export default function RecoveryScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const recoveryMutation = useMutation({
    mutationFn: () => authApi.requestPasswordReset(email.trim()),
    onSuccess: (response) => {
      Alert.alert('Recovery link sent', response.message);
      router.back();
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : 'Unable to send recovery link right now.';
      Alert.alert('Recovery failed', message);
    },
  });

  return (
    <Container>
      <Text variant="display">Recover access</Text>
      <Surface rounded="xl" style={{ marginTop: 16, gap: 16 }}>
        <InputField label="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <InputField label="Phone number (optional)" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
        <Button
          label="Send recovery link"
          onPress={() => recoveryMutation.mutate()}
          loading={recoveryMutation.isPending}
          disabled={!email}
          fullWidth
        />
      </Surface>
    </Container>
  );
}

