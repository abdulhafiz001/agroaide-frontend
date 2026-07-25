import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, type ListRenderItemInfo } from 'react-native';

import { Button, Surface, Text } from '@/design-system/components';
import styled from '@/design-system/styled';
import { useAppStore } from '@/store/useAppStore';

const { width } = Dimensions.get('window');
const SLIDE_WIDTH = width;

type Slide = {
  key: 'seed' | 'weather' | 'profile';
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
};

const slides: Slide[] = [
  {
    key: 'seed',
    title: 'Cultivate Intelligence',
    description: 'Get AI guidance tailored to Nigerian fields, every single day.',
    icon: 'leaf',
    iconColor: '#57b346',
    iconBg: '#57b34622',
  },
  {
    key: 'weather',
    title: 'Weather-smart Decisions',
    description: 'Seven-day critical alerts, rainfall insights, and irrigation cues you can trust.',
    icon: 'partly-sunny',
    iconColor: '#3b82f6',
    iconBg: '#3b82f622',
  },
  {
    key: 'profile',
    title: 'Personalized Agronomy',
    description: 'Tell us about your farm so AgroAide can optimize crops, tasks, and markets.',
    icon: 'person-circle',
    iconColor: '#db9534',
    iconBg: '#db953422',
  },
];

const Screen = styled.SafeAreaView`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
  padding-top: ${({ theme }) => theme.spacing.lg}px;
  padding-bottom: ${({ theme }) => theme.spacing.lg}px;
`;

const SlidePage = styled.View`
  width: ${SLIDE_WIDTH}px;
  padding-horizontal: ${({ theme }) => theme.spacing.md}px;
  justify-content: center;
`;

const SlideCard = styled(Surface)`
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg}px;
  padding: ${({ theme }) => theme.spacing.xl}px ${({ theme }) => theme.spacing.lg}px;
`;

const IconHalo = styled.View<{ $bg: string }>`
  width: 168px;
  height: 168px;
  border-radius: 84px;
  align-items: center;
  justify-content: center;
  background-color: ${({ $bg }) => $bg};
`;

const IconDisc = styled.View<{ $bg: string }>`
  width: 112px;
  height: 112px;
  border-radius: 56px;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.surface};
  border-width: 2px;
  border-color: ${({ $bg }) => $bg};
`;

const CopyBlock = styled.View`
  gap: ${({ theme }) => theme.spacing.sm}px;
  padding-horizontal: ${({ theme }) => theme.spacing.sm}px;
`;

const PaginatorTrack = styled.View`
  flex-direction: row;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs}px;
  margin-top: ${({ theme }) => theme.spacing.lg}px;
`;

const Dot = styled.View<{ active: boolean }>`
  width: ${({ active }) => (active ? 24 : 8)}px;
  height: 8px;
  border-radius: 999px;
  background-color: ${({ theme, active }) => (active ? theme.colors.primary : `${theme.colors.border}80`)};
`;

const ActionRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.lg}px;
  padding-horizontal: ${({ theme }) => theme.spacing.md}px;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

const ActionButtonSlot = styled.View`
  flex: 1;
`;

export default function OnboardingScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList<Slide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);

  const isLastSlide = useMemo(() => activeIndex === slides.length - 1, [activeIndex]);

  const goToSlide = (index: number) => {
    const clamped = Math.min(Math.max(index, 0), slides.length - 1);
    flatListRef.current?.scrollToOffset({ offset: clamped * SLIDE_WIDTH, animated: true });
    setActiveIndex(clamped);
  };

  const handleSkip = () => {
    goToSlide(slides.length - 1);
  };

  const handleNext = () => {
    if (isLastSlide) {
      completeOnboarding();
      router.replace('/auth/register');
      return;
    }
    goToSlide(activeIndex + 1);
  };

  const renderItem = ({ item }: ListRenderItemInfo<Slide>) => (
    <SlidePage>
      <SlideCard variant="muted" rounded="xl">
        <IconHalo $bg={item.iconBg}>
          <IconDisc $bg={item.iconColor}>
            <Ionicons name={item.icon} size={56} color={item.iconColor} />
          </IconDisc>
        </IconHalo>
        <CopyBlock>
          <Text variant="eyebrow" tone="accent" align="center">
            AgroAide
          </Text>
          <Text variant="display" align="center">
            {item.title}
          </Text>
          <Text variant="body" tone="muted" align="center">
            {item.description}
          </Text>
        </CopyBlock>
      </SlideCard>
    </SlidePage>
  );

  return (
    <Screen>
      <FlatList
        ref={flatListRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        data={slides}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        getItemLayout={(_, index) => ({
          length: SLIDE_WIDTH,
          offset: SLIDE_WIDTH * index,
          index,
        })}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(event.nativeEvent.contentOffset.x / SLIDE_WIDTH);
          setActiveIndex(newIndex);
        }}
        style={{ flexGrow: 0 }}
      />
      <PaginatorTrack>
        {slides.map((slide, index) => (
          <Dot key={slide.key} active={activeIndex === index} />
        ))}
      </PaginatorTrack>
      <ActionRow>
        {!isLastSlide ? (
          <ActionButtonSlot>
            <Button label="Skip" variant="ghost" onPress={handleSkip} fullWidth />
          </ActionButtonSlot>
        ) : (
          <ActionButtonSlot />
        )}
        <ActionButtonSlot>
          <Button label={isLastSlide ? 'Get Started' : 'Continue'} onPress={handleNext} fullWidth />
        </ActionButtonSlot>
      </ActionRow>
    </Screen>
  );
}
