import LottieView from 'lottie-react-native';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, type ListRenderItemInfo, View } from 'react-native';
import styled from '@/design-system/styled';

import { Button, Surface, Text } from '@/design-system/components';
import { useAppStore } from '@/store/useAppStore';

const { width } = Dimensions.get('window');
const SLIDE_WIDTH = width;

const slides = [
  {
    key: 'seed',
    title: 'Cultivate Intelligence',
    description: 'Harness AI guidance tailored to Nigerian fields, every single day.',
    animation: require('@/assets/lottie/growing-seed.json'),
  },
  {
    key: 'weather',
    title: 'Weather-smart Decisions',
    description: 'Seven-day critical alerts, rainfall insights, and irrigation cues you can trust.',
    animation: require('@/assets/lottie/weather-intel.json'),
  },
  {
    key: 'profile',
    title: 'Personalized Agronomy',
    description: 'Tell us about your farm so AgroAide can optimize crops, tasks, and markets.',
    animation: require('@/assets/lottie/personalize.json'),
  },
];

const Screen = styled.SafeAreaView`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.lg}px ${({ theme }) => theme.spacing.md}px;
`;

const SlideContainer = styled(Surface)`
  width: ${width - 48}px;
  align-self: center;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md}px;
  background-color: ${({ theme }) => theme.colors.surface};
`;

const PaginatorTrack = styled.View`
  flex-direction: row;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs}px;
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
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

const ActionButtonSlot = styled.View`
  flex: 1;
`;

export default function OnboardingScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList<(typeof slides)[number]>>(null);
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

  const renderItem = ({ item }: ListRenderItemInfo<(typeof slides)[0]>) => (
    <SlideContainer variant="muted" rounded="xl">
      <LottieView autoPlay loop style={{ width: width / 1.4, height: 260 }} source={item.animation} />
      <View>
        <Text variant="eyebrow" tone="accent" align="center">
          AgroAide
        </Text>
        <Text variant="display" align="center">
          {item.title}
        </Text>
        <Text variant="body" tone="muted" align="center">
          {item.description}
        </Text>
      </View>
    </SlideContainer>
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

