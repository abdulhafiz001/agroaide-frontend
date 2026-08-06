import React, { useMemo } from 'react';
import { TextStyle, StyleProp } from 'react-native';

import { Text } from '@/design-system/components';

type Props = {
  text: string;
  style?: StyleProp<TextStyle>;
  fromAgent?: boolean;
};

type Segment = { text: string; bold?: boolean };

/** Remove model thinking / reasoning blocks before display. */
export function stripModelThinking(input: string): string {
  let cleaned = input;
  const patterns = [
    /<think\b[^>]*>[\s\S]*?<\/think>/gi,
    /<thinking\b[^>]*>[\s\S]*?<\/thinking>/gi,
    /<reasoning\b[^>]*>[\s\S]*?<\/reasoning>/gi,
    /```(?:thinking|reasoning|thought)\b[\s\S]*?```/gi,
  ];
  for (const pattern of patterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  cleaned = cleaned.replace(
    /^(?:thinking|reasoning|analysis|internal monologue)\s*:\s*[\s\S]*?(?:\n\n|\r\n\r\n)/i,
    '',
  );
  return cleaned.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Renders simple markdown-ish emphasis:
 * - **bold** and *bold* → bold text
 */
function parseEmphasis(input: string): Segment[] {
  const segments: Segment[] = [];
  const pattern = /(\*\*[^*\n]+?\*\*|\*[^*\n]+?\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(input)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: input.slice(lastIndex, match.index) });
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      segments.push({ text: token.slice(2, -2), bold: true });
    } else if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      segments.push({ text: token.slice(1, -1), bold: true });
    } else {
      segments.push({ text: token });
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < input.length) {
    segments.push({ text: input.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ text: input }];
}

export function FormattedMessage({ text, style }: Props) {
  const segments = useMemo(() => parseEmphasis(stripModelThinking(text)), [text]);

  return (
    <Text variant="body" style={style}>
      {segments.map((segment, index) => (
        <Text
          key={`${index}-${segment.text.slice(0, 16)}`}
          variant="body"
          style={[style, segment.bold ? { fontWeight: '700' } : null]}
        >
          {segment.text}
        </Text>
      ))}
    </Text>
  );
}
