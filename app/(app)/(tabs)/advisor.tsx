import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, TouchableOpacity } from 'react-native';
import { useTheme } from 'styled-components/native';

import { Chip, Surface, Text } from '@/design-system/components';
import styled from '@/design-system/styled';
import { advisorApi } from '@/services/advisorApi';
import { weatherApi } from '@/services/weatherApi';
import { useAppStore } from '@/store/useAppStore';

// --- 1. Enhanced Styled Components ---
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
  elevation: 2;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.05;
  shadow-radius: 3px;
`;

const MessageList = styled.ScrollView.attrs({
  contentContainerStyle: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
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
  background-color: ${({ fromAgent, theme }) =>
    fromAgent ? theme.colors.surface : theme.colors.primary};
  elevation: 1;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.05;
  shadow-radius: 2px;
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
  height: 48px;
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

// --- 2. New Typing Indicator Component ---
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

// --- 3. Main Component with Modernized Logic ---
type Message = {
  id: string;
  text: string;
  fromAgent: boolean;
  timestamp?: Date;
};

export default function ModernAdvisorScreen() {
  const theme = useTheme();
  const accessToken = useAppStore((state) => state.accessToken);
  const profile = useAppStore((state) => state.farmerProfile);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'intro',
      text: 'Hi! I’m your AgroAide advisor. Ask me anything about crops, pests, or weather decisions.',
      fromAgent: true,
      timestamp: new Date(Date.now() - 300000),
    },
  ]);
  const [input, setInput] = useState('');
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState<string | null>(null);
  const chatMutation = useMutation({
    mutationFn: (message: string) => advisorApi.chat(message, accessToken ?? ''),
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
  const suggestions = suggestionsQuery.data?.suggestions ?? [];
  const weatherSummary = weatherQuery.data?.weatherForecast?.[0];

  useEffect(() => {
    const firstName = profile?.fullName?.trim().split(' ')[0];
    if (!firstName) {
      return;
    }

    setMessages((prev) => {
      if (!prev.length || prev[0].id !== 'intro') {
        return prev;
      }

      const updatedIntro = {
        ...prev[0],
        text: `Hi ${firstName}! I’m your AgroAide advisor. Ask me anything about crops, pests, or weather decisions.`,
      };

      return [updatedIntro, ...prev.slice(1)];
    });
  }, [profile?.fullName]);

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

  const handleSuggestionPress = (suggestion: string) => {
    setActiveSuggestion(suggestion);
    sendMessage(suggestion);
  };

  return (
    <Screen>
      {/* Compact App Header */}
      <AppHeader variant="default">
        <Surface variant="transparent" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Surface variant="transparent" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="leaf" size={18} color={theme.colors.primary} />
            <Text variant="body" style={{ fontWeight: '700' }}>
              AI Advisor
            </Text>
          </Surface>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </Surface>
      </AppHeader>

      {/* Compact Weather Context */}
      <SystemMessageCard variant="muted">
        <Ionicons name="sunny-outline" size={16} color={theme.colors.primary} />
        <Surface variant="transparent" style={{ flex: 1 }}>
          <Text variant="caption" style={{ fontWeight: '600' }}>
            {weatherSummary ? `${weatherSummary.condition}, ${weatherSummary.high}°/${weatherSummary.low}°` : 'Loading weather...'}
          </Text>
        </Surface>
      </SystemMessageCard>

      {/* Chat Messages List */}
      <MessageList>
        {messages.map((message) => (
          <ChatBubbleWrapper key={message.id} fromAgent={message.fromAgent}>
            <Avatar fromAgent={message.fromAgent}>
              {message.fromAgent ? (
                <Ionicons name="leaf" size={16} color="#FFF" />
              ) : (
                <Ionicons name="person" size={16} color="#FFF" />
              )}
            </Avatar>
            <BubbleContent fromAgent={message.fromAgent}>
              <Text variant="body" style={message.fromAgent ? { color: theme.colors.textPrimary } : { color: '#ffffff' }}>
                {message.text}
              </Text>
              {message.timestamp && (
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
              )}
            </BubbleContent>
          </ChatBubbleWrapper>
        ))}
        <TypingIndicator isVisible={isAgentTyping} />
      </MessageList>

      {/* Compact Quick Suggestions - horizontal scroll */}
      {!isAgentTyping && messages.length <= 4 && suggestions.length > 0 && (
        <Surface variant="transparent" style={{ paddingVertical: 6, paddingLeft: 16 }}>
          <Text variant="caption" tone="muted" style={{ marginBottom: 6, fontWeight: '600' }}>
            Try asking:
          </Text>
          <Surface variant="transparent" style={{ flexDirection: 'row', gap: 8 }}>
            {suggestions.slice(0, 3).map((suggestion) => (
              <Chip
                key={suggestion}
                label={suggestion.length > 30 ? suggestion.substring(0, 30) + '...' : suggestion}
                tone={activeSuggestion === suggestion ? 'success' : 'default'}
                onPress={() => handleSuggestionPress(suggestion)}
              />
            ))}
          </Surface>
        </Surface>
      )}

      {/* Modern Input Toolbar */}
      <InputToolbar>
        <AttachmentButton>
          <MaterialCommunityIcons name="attachment" size={20} color={theme.colors.textSecondary} />
        </AttachmentButton>
        <ChatInput
          placeholder="Ask about crops, weather, or pests..."
          placeholderTextColor="#9ba3ab"
          value={input}
          onChangeText={setInput}
          returnKeyType="send"
          onSubmitEditing={() => sendMessage(input)}
          blurOnSubmit={false}
        />
        {input.trim() ? (
          <TouchableOpacity
            style={{ marginLeft: 12, padding: 12 }}
            onPress={() => sendMessage(input)}
          >
            <Ionicons name="send" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        ) : (
          <VoiceButton>
            <Ionicons name="mic-outline" size={22} color="#FFF" />
          </VoiceButton>
        )}
      </InputToolbar>
    </Screen>
  );
}