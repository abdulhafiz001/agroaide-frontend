import React from 'react';
import { Modal, View } from 'react-native';
import styled from '@/design-system/styled';

import { Button, Surface, Text } from '@/design-system/components';

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const Overlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  padding: 24px;
`;

const Card = styled(Surface)`
  border-radius: 24px;
  padding: 24px;
  gap: 12px;
`;

const Actions = styled.View`
  flex-direction: row;
  gap: 10px;
  margin-top: 8px;
  align-items: center;
`;

// Wrapper components to control button ratios accurately
const CancelWrapper = styled(View)`
  flex: 1; 
`;

const ConfirmWrapper = styled(View)`
  flex: 1.2; /* Larger width ratio so "Delete" never wraps */
`;

export function ConfirmModal({
  visible,
  title,
  message,
  children,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  destructive = true,
  loading = false,
  confirmDisabled = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Overlay>
        <Card>
          <Text variant="headline">{title}</Text>
          <Text variant="body" tone="muted">
            {message}
          </Text>
          {children}
          <Actions>
            <CancelWrapper>
              <Button
                label={cancelLabel}
                variant="ghost"
                onPress={onCancel}
                fullWidth
                disabled={loading}
              />
            </CancelWrapper>
            
            <ConfirmWrapper>
              <Button
                label={confirmLabel}
                onPress={onConfirm}
                loading={loading}
                disabled={confirmDisabled || loading}
                fullWidth
                style={destructive ? { backgroundColor: '#e63946' } : undefined}
              />
            </ConfirmWrapper>
          </Actions>
        </Card>
      </Overlay>
    </Modal>
  );
}