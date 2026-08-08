import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import styled, { useTheme } from '@/design-system/styled';

import { InputField, Text } from '@/design-system/components';

const TagWrap = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
`;

const Tag = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
  padding: 8px 10px 8px 12px;
  border-radius: 12px;
  background-color: ${({ theme }) => `${theme.colors.primary}18`};
  border-width: 1px;
  border-color: ${({ theme }) => `${theme.colors.primary}40`};
`;

type Props = {
  label?: string;
  value: string[];
  onChange: (crops: string[]) => void;
  placeholder?: string;
  hint?: string;
};

function normalizeCrop(raw: string): string {
  return raw.replace(/,/g, ' ').trim().replace(/\s+/g, ' ');
}

function titleCaseCrop(raw: string): string {
  return raw
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function CropTagsInput({
  label = 'Primary crops',
  value,
  onChange,
  placeholder = 'Type a crop, then comma',
  hint = 'Type a crop and press comma (or Done) to add it as a card. Tap × to remove.',
}: Props) {
  const theme = useTheme();
  const [draft, setDraft] = useState('');

  const commitTokens = (text: string) => {
    const parts = text.split(',');
    const complete = parts.slice(0, -1);
    const remainder = parts[parts.length - 1] ?? '';

    if (complete.length === 0) {
      setDraft(text);
      return;
    }

    const next = [...value];
    for (const piece of complete) {
      const crop = titleCaseCrop(normalizeCrop(piece));
      if (!crop) continue;
      if (next.some((c) => c.toLowerCase() === crop.toLowerCase())) continue;
      next.push(crop);
    }
    onChange(next);
    setDraft(remainder.replace(/^\s+/, ''));
  };

  const flushDraft = () => {
    const crop = titleCaseCrop(normalizeCrop(draft));
    if (!crop) return;
    if (value.some((c) => c.toLowerCase() === crop.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...value, crop]);
    setDraft('');
  };

  return (
    <View style={{ gap: 8 }}>
      <InputField
        label={label}
        value={draft}
        onChangeText={commitTokens}
        placeholder={placeholder}
        autoCapitalize="words"
        returnKeyType="done"
        onSubmitEditing={flushDraft}
        onBlur={flushDraft}
      />
      {value.length > 0 ? (
        <TagWrap>
          {value.map((crop) => (
            <Tag key={crop}>
              <Text variant="caption" style={{ color: theme.colors.primary, fontWeight: '600' }}>
                {crop}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${crop}`}
                hitSlop={8}
                onPress={() => onChange(value.filter((c) => c !== crop))}
              >
                <Ionicons name="close-circle" size={18} color={theme.colors.primary} />
              </Pressable>
            </Tag>
          ))}
        </TagWrap>
      ) : null}
      <Text variant="caption" tone="muted">
        {hint}
      </Text>
    </View>
  );
}
