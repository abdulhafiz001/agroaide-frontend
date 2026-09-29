import React, { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
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
  autoSendOnOpen?: boolean;
};

const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: flex-end;
`;

const ModalContent = styled(Surface)`
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 24px;
  padding-bottom: ${Platform.OS === 'ios' ? 36 : 24}px;
  gap: 16px;
  max-height: 85%;
`;

const HandleBar = styled.View`
  width: 44px;
  height: 4px;
  border-radius: 2px;
  background-color: ${({ theme }) => theme.colors.border};
  align-self: center;
  margin-bottom: 2px;
`;

const IconPill = styled.View`
  width: 44px;
  height: 44px;
  border-radius: 22px;
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

export function EmailVerificationModal({
  visible,
  onClose,
  autoSendOnOpen = true,
}: EmailVerificationModalProps) {
  const theme = useTheme();
  const toast = useToast();
  const accessToken = useAppStore((s) => s.accessToken);
  const profile = useAppStore((s) => s.farmerProfile);
  const setFarmerProfile = useAppStore((s) => s.setFarmerProfile);

  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestVerificationCode = useCallback(
    async (isInitial = false) => {
      if (!accessToken || sendingCode) return;

      setSendingCode(true);
      setErrorMessage(null);

      try {
        const res = await authApi.sendEmailVerificationCode(accessToken);
        setCooldown(60);
        if (isInitial) {
          toast.success('Code sent', 'A 6-digit verification code has been sent to your email.');
        } else {
          toast.success('Code resent', res.message || 'Check your inbox for a new 6-digit code.');
        }
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Could not send verification code.';
        setErrorMessage(message);
        toast.error('Error sending code', message);
      } finally {
        setSendingCode(false);
      }
    },
    [accessToken, sendingCode, toast],
  );

  useEffect(() => {
    if (!visible) {
      setCode('');
      setErrorMessage(null);
      return;
    }

    if (autoSendOnOpen && cooldown === 0 && accessToken) {
      requestVerificationCode(true);
    }
  }, [visible, autoSendOnOpen, cooldown, accessToken, requestVerificationCode]);

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
    if (cooldown > 0 || sendingCode || !accessToken) return;
    await requestVerificationCode(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ModalOverlay>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
          <ModalContent>
            <HandleBar />
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={{ gap: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <IconPill>
                    <ShieldCheck size={22} color={theme.colors.primary} />
                  </IconPill>
                </View>

                <View style={{ gap: 4 }}>
                  <Text variant="headline">Verify your email</Text>
                  <Text variant="body" tone="muted">
                    {sendingCode ? (
                      'Sending 6-digit verification code to '
                    ) : (
                      'We sent a 6-digit verification code to '
                    )}
                    <Text variant="body" style={{ fontWeight: '600', color: theme.colors.textPrimary }}>
                      {profile?.email || 'your email'}
                    </Text>
                    {sendingCode ? '...' : '. Enter it below to secure password recovery.'}
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
                    disabled={cooldown > 0 || sendingCode}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text variant="caption" tone={cooldown > 0 || sendingCode ? 'muted' : 'accent'}>
                      {sendingCode
                        ? 'Sending code...'
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
              </View>
            </ScrollView>
          </ModalContent>
        </ModalOverlay>
      </KeyboardAvoidingView>
    </Modal>
  );
}
