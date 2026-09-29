import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, TouchableOpacity, View } from 'react-native';
import styled, { useTheme } from '@/design-system/styled';
import { Mail, ShieldCheck } from 'lucide-react-native';

import { Button, InputField, Surface, Text } from '@/design-system/components';
import { useToast } from '@/components/Toast';
import { authApi } from '@/services/authApi';
import { ApiError } from '@/services/apiClient';
import { useAppStore } from '@/store/useAppStore';

type EmailVerificationModalProps = {
  visible: boolean;
  onClose: () => void;
};

const Overlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.55);
  justify-content: center;
  padding: 20px;
`;

const Card = styled(Surface)`
  border-radius: 24px;
  padding: 24px;
  gap: 16px;
`;

const IconPill = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: ${({ theme }) => `${theme.colors.primary}18`};
  align-items: center;
  justify-content: center;
  align-self: flex-start;
`;

const Actions = styled.View`
  flex-direction: row;
  gap: 10px;
  margin-top: 4px;
  align-items: center;
`;

export function EmailVerificationModal({ visible, onClose }: EmailVerificationModalProps) {
  const theme = useTheme();
  const toast = useToast();
  const accessToken = useAppStore((s) => s.accessToken);
  const profile = useAppStore((s) => s.farmerProfile);
  const setFarmerProfile = useAppStore((s) => s.setFarmerProfile);

  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setCode('');
      setErrorMessage(null);
      return;
    }

    // Auto-prompt send if farmer just opened modal and cooldown is 0
    if (cooldown === 0) {
      setCooldown(30);
    }
  }, [visible]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async () => {
    const trimmed = code.trim();
    if (trimmed.length !== 6) {
      setErrorMessage('Please enter the full 6-digit code.');
      return;
    }
    if (!accessToken) {
      toast.error('Authentication error', 'Please sign in to verify your email.');
      return;
    }

    setVerifying(true);
    setErrorMessage(null);

    try {
      const response = await authApi.verifyEmail(accessToken, trimmed);
      setFarmerProfile(response.profile);
      toast.success('Email verified', 'Your email address is now verified.');
      onClose();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Invalid verification code. Please try again.';
      setErrorMessage(message);
      toast.error('Verification failed', message);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending || !accessToken) return;

    setResending(true);
    setErrorMessage(null);

    try {
      const res = await authApi.sendEmailVerificationCode(accessToken);
      toast.success('Code sent', res.message || 'Check your inbox for a new 6-digit code.');
      setCooldown(60);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not send verification code.';
      toast.error('Error sending code', message);
    } finally {
      setResending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Overlay>
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <IconPill>
                <ShieldCheck size={24} color={theme.colors.primary} />
              </IconPill>
            </View>

            <View style={{ gap: 4 }}>
              <Text variant="headline">Verify your email</Text>
              <Text variant="body" tone="muted">
                We sent a 6-digit verification code to{' '}
                <Text variant="body" style={{ fontWeight: '600', color: theme.colors.textPrimary }}>
                  {profile?.email || 'your email'}
                </Text>
                . Enter it below to secure password recovery.
              </Text>
            </View>

            <InputField
              label="6-Digit Verification Code"
              value={code}
              onChangeText={(text) => {
                setCode(text.replace(/[^0-9]/g, '').slice(0, 6));
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="e.g. 123456"
              keyboardType="number-pad"
              maxLength={6}
              error={errorMessage || undefined}
              autoFocus
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: -4 }}>
              <TouchableOpacity
                onPress={handleResend}
                disabled={cooldown > 0 || resending}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text variant="caption" tone={cooldown > 0 ? 'muted' : 'accent'}>
                  {resending
                    ? 'Sending...'
                    : cooldown > 0
                    ? `Resend code in ${cooldown}s`
                    : 'Resend code'}
                </Text>
              </TouchableOpacity>
              <Text variant="caption" tone="muted">
                Valid for 15 mins
              </Text>
            </View>

            <Actions>
              <View style={{ flex: 1 }}>
                <Button
                  label="Later"
                  variant="ghost"
                  onPress={onClose}
                  fullWidth
                  disabled={verifying}
                />
              </View>
              <View style={{ flex: 1.4 }}>
                <Button
                  label="Verify"
                  onPress={handleVerify}
                  loading={verifying}
                  disabled={code.trim().length !== 6 || verifying}
                  fullWidth
                />
              </View>
            </Actions>
          </Card>
        </Overlay>
      </KeyboardAvoidingView>
    </Modal>
  );
}
