import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/design-system/components';

export type ToastType = 'success' | 'error' | 'info';

export type ToastPayload = {
  type?: ToastType;
  title: string;
  message?: string;
  durationMs?: number;
  position?: 'top' | 'bottom';
};

type ToastContextValue = {
  showToast: (payload: ToastPayload) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toneConfig = {
  success: { bg: '#10B981', icon: '✓' },
  error: { bg: '#EF4444', icon: '!' },
  info: { bg: '#3B82F6', icon: 'i' },
} as const;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<(ToastPayload & { id: number }) | null>(null);

  const translateY = useRef(new Animated.Value(-200)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const progress = useRef(new Animated.Value(1)).current;

  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: -200, useNativeDriver: true, friction: 8, tension: 60 }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.9, duration: 200, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }, [opacity, scale, translateY]);

  const showToast = useCallback(
    (payload: ToastPayload) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);

      progress.setValue(1);
      idRef.current += 1;
      const duration = payload.durationMs ?? 3500;
      const next = {
        ...payload,
        id: idRef.current,
        type: payload.type ?? 'info',
        position: payload.position ?? 'top',
      };

      setToast(next);
      translateY.setValue(-200);
      opacity.setValue(0);
      scale.setValue(0.9);

      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8, tension: 80 }),
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8, tension: 80 }),
      ]).start();

      // scaleX is native-driver safe (width is not)
      Animated.timing(progress, { toValue: 0, duration, useNativeDriver: true }).start();

      hideTimer.current = setTimeout(hide, duration);
    },
    [hide, opacity, progress, scale, translateY],
  );

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      success: (title, message) => showToast({ type: 'success', title, message }),
      error: (title, message) => showToast({ type: 'error', title, message }),
      info: (title, message) => showToast({ type: 'info', title, message }),
    }),
    [showToast],
  );

  const tone = toast?.type ?? 'info';
  const isTop = (toast?.position ?? 'top') === 'top';

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.card,
            {
              top: isTop ? insets.top + 12 : undefined,
              bottom: !isTop ? insets.bottom + 12 : undefined,
              borderColor: `${toneConfig[tone].bg}33`,
              shadowColor: toneConfig[tone].bg,
              opacity,
              transform: [{ translateY }, { scale }],
            },
          ]}
        >
          <Pressable onPress={hide} style={styles.row}>
            <View style={[styles.iconRing, { backgroundColor: `${toneConfig[tone].bg}22` }]}>
              <Text style={{ color: toneConfig[tone].bg, fontSize: 16, fontWeight: '700' }}>
                {toneConfig[tone].icon}
              </Text>
            </View>
            <View style={styles.content}>
              <Text variant="headline" style={styles.title}>
                {toast.title}
              </Text>
              {toast.message ? (
                <Text variant="caption" style={styles.message}>
                  {toast.message}
                </Text>
              ) : null}
            </View>
          </Pressable>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  backgroundColor: toneConfig[tone].bg,
                  transform: [{ scaleX: progress }],
                },
              ]}
            />
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 20,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderWidth: 1,
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconRing: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },
  message: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  progressFill: {
    height: '100%',
    width: '100%',
    transformOrigin: 'left center',
  },
});
