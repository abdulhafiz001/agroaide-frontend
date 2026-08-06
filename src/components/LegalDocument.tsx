import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled, { useTheme } from '@/design-system/styled';

import { Surface, Text } from '@/design-system/components';
import { LEGAL_CONTENT, PRIVACY_VERSION, TERMS_VERSION } from '@/legal/legalContent';
import { useAppStore } from '@/store/useAppStore';
import type { SupportedLanguage } from '@/i18n/translations';

const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Content = styled.ScrollView.attrs(({ theme }) => ({
  contentContainerStyle: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl, gap: theme.spacing.md },
}))``;

export function LegalDocument({ kind }: { kind: 'privacy' | 'terms' }) {
  const router = useRouter();
  const theme = useTheme();
  const language = (useAppStore((state) => state.farmerProfile?.preferredLanguage) ?? 'en') as SupportedLanguage;
  const copy = LEGAL_CONTENT[language] ?? LEGAL_CONTENT.en;
  const sections = kind === 'privacy' ? copy.privacySections : copy.termsSections;
  const title = kind === 'privacy' ? copy.privacyTitle : copy.termsTitle;
  const version = kind === 'privacy' ? PRIVACY_VERSION : TERMS_VERSION;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
          style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text variant="title" accessibilityRole="header">{title}</Text>
      </View>
      <Content>
        <Surface rounded="lg" variant="muted">
          <Text variant="body">{copy.prototype}</Text>
          <Text variant="caption" tone="muted">Version {version}</Text>
        </Surface>
        {sections.map((section) => (
          <Surface key={section.title} rounded="lg">
            <Text variant="headline" accessibilityRole="header">{section.title}</Text>
            <Text variant="body" tone="muted">{section.body}</Text>
          </Surface>
        ))}
      </Content>
    </Screen>
  );
}
