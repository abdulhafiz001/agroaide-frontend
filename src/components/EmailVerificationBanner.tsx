import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Mail, ShieldAlert, X } from 'lucide-react-native';
import styled, { useTheme } from '@/design-system/styled';

import { Text } from '@/design-system/components';

type EmailVerificationBannerProps = {
  visible: boolean;
  email?: string;
  onVerify: () => void;
  onDismiss?: () => void;
};

const BannerContainer = styled.View`
  background-color: #fffbeb;
  border-width: 1px;
  border-color: #fde68a;
  border-radius: 16px;
  padding: 12px 14px;
  margin-bottom: 12px;
  flex-direction: row;
  align-items: center;
  gap: 12px;
`;

const IconContainer = styled.View`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: #fef3c7;
  align-items: center;
  justify-content: center;
`;

const ContentContainer = styled.View`
  flex: 1;
  gap: 2px;
`;

const VerifyButton = styled.TouchableOpacity`
  background-color: ${({ theme }) => theme.colors.primary};
  padding-vertical: 6px;
  padding-horizontal: 12px;
  border-radius: 8px;
  align-self: center;
`;

export function EmailVerificationBanner({
  visible,
  email,
  onVerify,
  onDismiss,
}: EmailVerificationBannerProps) {
  const theme = useTheme();

  if (!visible) return null;

  return (
    <BannerContainer>
      <IconContainer>
        <Mail size={18} color="#b45309" />
      </IconContainer>

      <ContentContainer>
        <Text variant="headline" style={{ fontSize: 14, color: '#92400e', fontWeight: '700' }}>
          Verify your email
        </Text>
        <Text variant="caption" style={{ color: '#b45309', fontSize: 12 }} numberOfLines={1}>
          {email ? `Code sent to ${email}` : 'Secure password recovery and farm alerts'}
        </Text>
      </ContentContainer>

      <VerifyButton onPress={onVerify} activeOpacity={0.8}>
        <Text variant="caption" style={{ color: '#ffffff', fontWeight: '700' }}>
          Verify
        </Text>
      </VerifyButton>

      {onDismiss ? (
        <TouchableOpacity
          onPress={onDismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ padding: 4 }}
        >
          <X size={16} color="#92400e" />
        </TouchableOpacity>
      ) : null}
    </BannerContainer>
  );
}
