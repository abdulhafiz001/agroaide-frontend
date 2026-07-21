import { Image, type ImageProps } from 'expo-image';
import React, { useMemo } from 'react';

import { useAppStore } from '@/store/useAppStore';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.trim()?.replace(/\/$/, '') ?? '';

type Props = Omit<ImageProps, 'source'> & {
  uri?: string | null;
  fallback?: React.ReactNode;
};

/** Resolve API-relative scan image paths and attach the auth token. */
export function resolveAuthenticatedUri(uri?: string | null): string | null {
  if (!uri) return null;
  if (
    uri.startsWith('http://') ||
    uri.startsWith('https://') ||
    uri.startsWith('file:') ||
    uri.startsWith('content:') ||
    uri.startsWith('data:')
  ) {
    return uri;
  }
  if (!API_BASE_URL) return null;
  return `${API_BASE_URL}${uri.startsWith('/') ? uri : `/${uri}`}`;
}

export function AuthenticatedImage({ uri, fallback = null, style, ...rest }: Props) {
  const token = useAppStore((s) => s.accessToken);
  const resolved = useMemo(() => resolveAuthenticatedUri(uri), [uri]);

  if (!resolved) {
    return <>{fallback}</>;
  }

  const needsAuth = resolved.startsWith(API_BASE_URL) && Boolean(token);

  return (
    <Image
      {...rest}
      style={style}
      source={{
        uri: resolved,
        headers: needsAuth ? { Authorization: `Bearer ${token}` } : undefined,
      }}
    />
  );
}
