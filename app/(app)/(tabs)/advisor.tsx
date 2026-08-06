import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  useAudioRecorderState,
  setAudioModeAsync,
} from 'expo-audio';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled, { useTheme } from '@/design-system/styled';

import { AuthenticatedImage } from '@/components/AuthenticatedImage';
import { FormattedMessage } from '@/components/FormattedMessage';
import { useToast } from '@/components/Toast';
import { Chip, Surface, Text } from '@/design-system/components';

import { advisorApi } from '@/services/advisorApi';
import { farmScanApi, type ScanDetail } from '@/services/farmScanApi';
import { weatherApi } from '@/services/weatherApi';
import { useAppStore } from '@/store/useAppStore';
import { useTranslation } from '@/i18n/useTranslation';

const Screen = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const AppHeader = styled(Surface)`
  padding-top: 10px;
  padding-horizontal: 20px;
  padding-bottom: 8px;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
`;

const MessageList = styled.ScrollView.attrs({
  contentContainerStyle: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  keyboardShouldPersistTaps: 'handled' as const,
})`
  flex: 1;
`;

const ChatBubbleWrapper = styled.View<{ fromAgent: boolean }>`
  flex-direction: ${({ fromAgent }) => (fromAgent ? 'row' : 'row-reverse')};
  align-items: flex-end;
  margin-bottom: 16px;
  max-width: 90%;
  align-self: ${({ fromAgent }) => (fromAgent ? 'flex-start' : 'flex-end')};
`;

const Avatar = styled.View<{ fromAgent: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: ${({ fromAgent, theme }) => (fromAgent ? theme.colors.primary : theme.colors.accent)};
  align-items: center;
  justify-content: center;
  margin-horizontal: 8px;
`;

const BubbleContent = styled(Surface)<{ fromAgent: boolean }>`
  padding: 12px 16px;
  border-radius: 18px;
  border-bottom-left-radius: ${({ fromAgent }) => (fromAgent ? '4px' : '18px')};
  border-bottom-right-radius: ${({ fromAgent }) => (fromAgent ? '18px' : '4px')};
  background-color: ${({ fromAgent, theme }) => (fromAgent ? theme.colors.surface : theme.colors.primary)};
`;

const SystemMessageCard = styled(Surface)`
  margin-vertical: 6px;
  margin-horizontal: 16px;
  padding: 10px 14px;
  border-radius: 10px;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  background-color: ${({ theme }) => theme.colors.surfaceAlt};
`;

const InputToolbar = styled.View`
  flex-direction: row;
  align-items: center;
  padding-horizontal: 16px;
  padding-vertical: 12px;
  background-color: ${({ theme }) => theme.colors.surface};
  border-top-width: 1px;
  border-top-color: ${({ theme }) => theme.colors.border};
`;

const ChatInput = styled.TextInput`
  flex: 1;
  min-height: 48px;
  max-height: 120px;
  padding: ${({ theme }) => `${theme.spacing.sm}px ${theme.spacing.md}px`};
  border-radius: 24px;
  border-width: 1.5px;
  border-color: ${({ theme }) => `${theme.colors.border}aa`};
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: Inter_500Medium;
`;

const VoiceButton = styled(TouchableOpacity)`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.accent};
  margin-left: 12px;
`;

const AttachmentButton = styled(TouchableOpacity)`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.surfaceAlt};
  margin-right: 12px;
`;

const ScanContextCard = styled(TouchableOpacity)`
  margin: 10px 16px 4px;
  border-radius: 18px;
  overflow: hidden;
  border-width: 1px;
  border-color: ${({ theme }) => `${theme.colors.primary}35`};
  background-color: ${({ theme }) => theme.colors.surface};
`;

const TypingIndicator = ({ isVisible }: { isVisible: boolean }) => {
  const opacity = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.2, duration: 500, useNativeDriver: true }),
      ]),
    ).start();
  }, [opacity]);

  if (!isVisible) return null;

  return (
    <ChatBubbleWrapper fromAgent>
      <Avatar fromAgent>
        <Ionicons name="leaf" size={16} color="#fff" />
      </Avatar>
      <BubbleContent fromAgent>
        <Surface variant="transparent" style={{ flexDirection: 'row', padding: 4 }}>
          {[0, 1, 2].map((dot) => (
            <Animated.View
              key={dot}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#A0A0A0',
                marginHorizontal: 2,
                opacity,
              }}
            />
          ))}
        </Surface>
      </BubbleContent>
    </ChatBubbleWrapper>
  );
};

type Message = {
  id: string;
  text: string;
  fromAgent: boolean;
  timestamp?: Date;
};

function buildIntro(firstName?: string): Message {
  return {
    id: 'intro',
    text: firstName
      ? `Hi ${firstName}. I’m your AgroAide farm advisor — I can see your weather, fields, soil, and tasks. Ask me anything about today’s farm decisions.`
      : 'Hi! I’m your AgroAide farm advisor — I can see your weather, fields, soil, and tasks. Ask me anything about today’s farm decisions.',
    fromAgent: true,
    timestamp: new Date(),
  };
}

export default function ModernAdvisorScreen() {
  const theme = useTheme();
  const toast = useToast();
  const router = useRouter();
  const params = useLocalSearchParams<{ scanId?: string }>();
  const insets = useSafeAreaInsets();
  const { t, lang } = useTranslation();
  const accessToken = useAppStore((state) => state.accessToken);
  const profile = useAppStore((state) => state.farmerProfile);
  const aiAdvisorPreference = useAppStore((state) => state.aiAdvisorPreference);
  const personalDataRevision = useAppStore((state) => state.personalDataRevision);
  // Prefer AAC/M4A so Groq Whisper accepts phone recordings (avoid CAF/PCM).
  const audioRecorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    extension: '.m4a',
    numberOfChannels: 1,
    bitRate: 128000,
    sampleRate: 44100,
    android: {
      ...RecordingPresets.HIGH_QUALITY.android,
      extension: '.m4a',
      outputFormat: 'mpeg4',
      audioEncoder: 'aac',
    },
    ios: {
      ...RecordingPresets.HIGH_QUALITY.ios,
      extension: '.m4a',
      outputFormat: 'aac',
      audioQuality: 127,
    },
  } as typeof RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const listRef = useRef<any>(null);
  const handledScanIdRef = useRef<string | null>(null);
  const isRecordingRef = useRef(false);
  const voiceBusyRef = useRef(false);
  const lastPersonalDataRevision = useRef(personalDataRevision);

  const firstName = profile?.fullName?.trim().split(' ')[0];
  const [messages, setMessages] = useState<Message[]>([buildIntro(firstName)]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState('');
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRecordingUi, setIsRecordingUi] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState<string | null>(null);
  const [activeScan, setActiveScan] = useState<ScanDetail | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const requestPreferences = useMemo(
    () => ({
      ...aiAdvisorPreference,
      language: profile?.preferredLanguage ?? lang,
    }),
    [aiAdvisorPreference, lang, profile?.preferredLanguage],
  );

  const chatMutation = useMutation({
    mutationFn: (message: string) => advisorApi.chat(message, accessToken ?? '', requestPreferences),
  });

  const historyQuery = useQuery({
    queryKey: ['advisorHistory', accessToken],
    queryFn: () => advisorApi.getHistory(accessToken ?? ''),
    enabled: Boolean(accessToken),
  });

  const suggestionsQuery = useQuery({
    queryKey: ['advisorSuggestions'],
    queryFn: () => advisorApi.getSuggestions(accessToken ?? ''),
    enabled: Boolean(accessToken),
  });

  const weatherQuery = useQuery({
    queryKey: ['advisorWeatherContext'],
    queryFn: () => weatherApi.getForecast(accessToken ?? ''),
    enabled: Boolean(accessToken),
  });

  const scanIdParam = params.scanId ? String(params.scanId) : null;

  const scanQuery = useQuery({
    queryKey: ['advisorScanContext', scanIdParam],
    queryFn: () => farmScanApi.getScan(accessToken ?? '', scanIdParam!),
    enabled: Boolean(accessToken && scanIdParam),
  });

  const suggestions = suggestionsQuery.data?.suggestions ?? [];
  const weatherSummary = weatherQuery.data?.weatherForecast?.[0];
  const hasUserMessages = useMemo(() => messages.some((m) => !m.fromAgent), [messages]);

  useEffect(() => {
    if (lastPersonalDataRevision.current === personalDataRevision) return;
    lastPersonalDataRevision.current = personalDataRevision;
    setMessages([buildIntro(firstName)]);
    setHistoryLoaded(true);
    setInput('');
    setActiveScan(null);
    handledScanIdRef.current = null;
  }, [firstName, personalDataRevision]);

  useEffect(() => {
    if (!historyQuery.data || historyLoaded) return;
    const history = historyQuery.data.messages ?? [];
    if (history.length === 0) {
      setHistoryLoaded(true);
      return;
    }

    setMessages([
      buildIntro(firstName),
      ...history.map((m) => ({
        id: m.id,
        text: m.text,
        fromAgent: m.fromAgent,
        timestamp: m.timestamp ? new Date(m.timestamp) : undefined,
      })),
    ]);
    setHistoryLoaded(true);
  }, [firstName, historyLoaded, historyQuery.data]);

  useEffect(() => {
    if (!scanIdParam || !scanQuery.data?.scan) return;
    setActiveScan(scanQuery.data.scan);
  }, [scanIdParam, scanQuery.data]);

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (status.granted) {
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      }
    })();
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const onHide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  useEffect(() => {
    if (!messages.length && keyboardHeight === 0) return;
    requestAnimationFrame(() => listRef.current?.scrollToEnd?.({ animated: true }));
  }, [messages.length, isAgentTyping, keyboardHeight]);

  const startRecording = async () => {
    if (isRecordingRef.current || voiceBusyRef.current || isTranscribing) return;
    voiceBusyRef.current = true;

    try {
      const status = await AudioModule.getRecordingPermissionsAsync();
      if (!status.granted) {
        const req = await AudioModule.requestRecordingPermissionsAsync();
        if (!req.granted) {
          toast.error('Permission required', 'Microphone access is needed for voice input.');
          return;
        }
      }
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      isRecordingRef.current = true;
      setIsRecordingUi(true);
    } catch {
      isRecordingRef.current = false;
      setIsRecordingUi(false);
      toast.error('Error', 'Could not start recording. Please try again.');
    } finally {
      voiceBusyRef.current = false;
    }
  };

  const stopRecording = async () => {
    if (!isRecordingRef.current && !recorderState.isRecording) return;
    if (voiceBusyRef.current) return;

    voiceBusyRef.current = true;
    isRecordingRef.current = false;
    setIsRecordingUi(false);
    setIsTranscribing(true);

    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (!uri) {
        setIsTranscribing(false);
        voiceBusyRef.current = false;
        toast.error('Recording failed', 'No audio was captured. Please try again.');
        return;
      }

      const response = await fetch(uri);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onerror = () => {
        setIsTranscribing(false);
        voiceBusyRef.current = false;
        toast.error('Error', 'Could not read the recording.');
      };

      reader.onloadend = async () => {
        const base64 = reader.result as string;
        if (!base64 || typeof base64 !== 'string' || !base64.includes('base64,')) {
          setIsTranscribing(false);
          voiceBusyRef.current = false;
          toast.error('Recording failed', 'Could not encode the audio. Please try again.');
          return;
        }
        try {
          const result = await advisorApi.transcribeVoice(base64, accessToken ?? '', requestPreferences);
          if (result.success && result.text) {
            setInput(result.text);
          } else {
            toast.error('Transcription failed', result.error || 'Could not transcribe audio.');
          }
        } catch {
          toast.error('Error', 'Voice transcription failed. Please type your message.');
        } finally {
          setIsTranscribing(false);
          voiceBusyRef.current = false;
        }
      };

      reader.readAsDataURL(blob);
    } catch {
      setIsTranscribing(false);
      voiceBusyRef.current = false;
      toast.error('Error', 'Could not process recording.');
    }
  };

  /** Tap once to start, tap again to stop — avoids press-and-hold race toasts. */
  const toggleRecording = () => {
    if (isRecordingRef.current || recorderState.isRecording) {
      void stopRecording();
      return;
    }
    void startRecording();
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text,
      fromAgent: false,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setActiveSuggestion(null);
    setIsAgentTyping(true);

    chatMutation
      .mutateAsync(text)
      .then((response) => {
        setMessages((prev) => [
          ...prev,
          {
            id: `agent-${Date.now()}`,
            fromAgent: true,
            text: response.reply,
            timestamp: new Date(),
          },
        ]);
      })
      .catch(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `agent-${Date.now()}`,
            fromAgent: true,
            text: 'I could not reach the advisor service. Please check your connection and try again.',
            timestamp: new Date(),
          },
        ]);
      })
      .finally(() => {
        setIsAgentTyping(false);
      });
  };

  useEffect(() => {
    if (!activeScan || !scanIdParam) return;
    if (handledScanIdRef.current === scanIdParam) return;
    if (!historyLoaded) return;

    handledScanIdRef.current = scanIdParam;

    const disease = activeScan.diseaseName || activeScan.analysis?.disease?.name;
    const condition = activeScan.conditionLabel || activeScan.condition;
    const summary = activeScan.summary || activeScan.analysis?.summary || 'No summary available';
    const fieldPart = activeScan.fieldName
      ? ` for ${activeScan.fieldName}${activeScan.fieldCrop ? ` (${activeScan.fieldCrop})` : ''}`
      : '';

    const prompt = [
      `I just scanned my crop${fieldPart}.`,
      `Result: ${condition}${disease ? ` — ${disease}` : ''}.`,
      `Scanner summary: ${summary}`,
      'Please explain what this means and what I should do next on my farm.',
    ].join(' ');

    sendMessage(prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per scanId after history loads
  }, [activeScan, scanIdParam, historyLoaded]);

  // Tab bar (~70) sits under the keyboard on Android; lift chat by the overlap only.
  const androidTabBar = 70;
  const keyboardLift =
    Platform.OS === 'android' && keyboardHeight > 0
      ? Math.max(0, keyboardHeight - androidTabBar)
      : 0;

  return (
    <Screen style={{ paddingTop: insets.top }}>
      <KeyboardAvoidingView
        style={{ flex: 1, marginBottom: keyboardLift }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <AppHeader variant="default">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="leaf" size={18} color={theme.colors.primary} />
            <Text variant="body" style={{ fontWeight: '700' }}>
              {t('aiAdvisor')}
            </Text>
          </View>
        </AppHeader>

        <SystemMessageCard variant="muted">
          <Ionicons name="sunny-outline" size={16} color={theme.colors.primary} />
          <Surface variant="transparent" style={{ flex: 1 }}>
            <Text variant="caption" style={{ fontWeight: '600' }}>
              {weatherSummary
                ? `${weatherSummary.condition}, ${weatherSummary.high}°/${weatherSummary.low}°`
                : t('loadingFarmWeather')}
            </Text>
          </Surface>
        </SystemMessageCard>

        {activeScan ? (
          <View style={{ position: 'relative' }}>
            <ScanContextCard
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: '/farm-scan',
                  params: { scanId: activeScan.id },
                })
              }
            >
              <View style={{ flexDirection: 'row', gap: 12, padding: 12, paddingRight: 40, alignItems: 'center' }}>
                <AuthenticatedImage
                  uri={activeScan.imagePath}
                  style={{ width: 72, height: 72, borderRadius: 14 }}
                  contentFit="cover"
                  fallback={
                    <View
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 14,
                        backgroundColor: `${theme.colors.primary}18`,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="scan" size={28} color={theme.colors.primary} />
                    </View>
                  }
                />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text variant="caption" style={{ fontWeight: '700', color: theme.colors.primary }}>
                    {t('cropScanAttached')}
                  </Text>
                  <Text variant="headline" numberOfLines={1}>
                    {activeScan.diseaseName || activeScan.conditionLabel || activeScan.condition}
                  </Text>
                  <Text variant="caption" tone="muted" numberOfLines={2}>
                    {activeScan.summary || t('tapToReopenScan')}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {activeScan.fieldName ? `${activeScan.fieldName} · ` : ''}
                    {new Date(activeScan.date).toLocaleDateString()} · {t('tapToView')}
                  </Text>
                </View>
              </View>
            </ScanContextCard>
            <TouchableOpacity
              onPress={() => {
                setActiveScan(null);
                handledScanIdRef.current = scanIdParam;
                router.setParams({ scanId: undefined });
              }}
              hitSlop={12}
              style={{
                position: 'absolute',
                top: 18,
                right: 28,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: theme.colors.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
              }}
              accessibilityLabel="Remove attached scan"
            >
              <Ionicons name="close" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : null}

        <MessageList ref={listRef}>
          {messages.map((message) => (
            <ChatBubbleWrapper key={message.id} fromAgent={message.fromAgent}>
              <Avatar fromAgent={message.fromAgent}>
                <Ionicons name={message.fromAgent ? 'leaf' : 'person'} size={16} color="#FFF" />
              </Avatar>
              <BubbleContent fromAgent={message.fromAgent}>
                <FormattedMessage
                  text={message.text}
                  style={message.fromAgent ? { color: theme.colors.textPrimary } : { color: '#ffffff' }}
                />
                {message.timestamp ? (
                  <Text
                    variant="caption"
                    tone="muted"
                    style={{
                      textAlign: 'right',
                      marginTop: 4,
                      fontSize: 10,
                      color: message.fromAgent ? theme.colors.textSecondary : 'rgba(255,255,255,0.7)',
                    }}
                  >
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                ) : null}
              </BubbleContent>
            </ChatBubbleWrapper>
          ))}
          <TypingIndicator isVisible={isAgentTyping} />
        </MessageList>

        {!hasUserMessages && !isAgentTyping ? (
          <Surface variant="transparent" style={{ paddingVertical: 6, paddingHorizontal: 16 }}>
            <Text variant="caption" tone="muted" style={{ marginBottom: 6, fontWeight: '600' }}>
              {t('tryAsking')}
            </Text>
            <Surface variant="transparent" style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Chip
                label={t('scanMyCrops')}
                tone="success"
                icon={<Ionicons name="scan" size={14} color={theme.colors.success} />}
                onPress={() => router.push('/farm-scan')}
              />
              {suggestions.slice(0, 3).map((suggestion) => (
                <Chip
                  key={suggestion}
                  label={suggestion.length > 30 ? `${suggestion.substring(0, 30)}...` : suggestion}
                  tone={activeSuggestion === suggestion ? 'success' : 'default'}
                  onPress={() => {
                    setActiveSuggestion(suggestion);
                    sendMessage(suggestion);
                  }}
                />
              ))}
            </Surface>
          </Surface>
        ) : null}

        <InputToolbar
          style={{
            paddingBottom: keyboardHeight > 0 ? 10 : Math.max(insets.bottom, 12),
          }}
        >
          <AttachmentButton
            onPress={() => router.push('/farm-scan')}
            accessibilityRole="button"
            accessibilityLabel="Attach a crop scan">
            <Ionicons name="scan" size={20} color={theme.colors.accent} />
          </AttachmentButton>
          <ChatInput
            placeholder={t('askPlaceholder')}
            placeholderTextColor="#9ba3ab"
            value={input}
            onChangeText={setInput}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)}
            blurOnSubmit={false}
            editable={!isTranscribing}
            multiline
          />
          {isTranscribing ? (
            <View style={{ marginLeft: 12, padding: 12 }}>
              <Ionicons name="hourglass-outline" size={22} color={theme.colors.accent} />
            </View>
          ) : input.trim() ? (
            <TouchableOpacity
              style={{ marginLeft: 12, padding: 12 }}
              onPress={() => sendMessage(input)}
              accessibilityRole="button"
              accessibilityLabel="Send message">
              <Ionicons name="send" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          ) : (
            <VoiceButton
              onPress={toggleRecording}
              style={isRecordingUi ? { backgroundColor: theme.colors.danger } : undefined}
              accessibilityRole="button"
              accessibilityLabel={isRecordingUi ? 'Stop voice recording' : 'Start voice recording'}
              accessibilityState={{ busy: isTranscribing }}
            >
              <Ionicons name={isRecordingUi ? 'mic' : 'mic-outline'} size={22} color="#FFF" />
            </VoiceButton>
          )}
        </InputToolbar>
      </KeyboardAvoidingView>
    </Screen>
  );
}
