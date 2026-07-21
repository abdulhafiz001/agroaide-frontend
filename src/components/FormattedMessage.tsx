import React, { useMemo } from 'react';
import { TextStyle, StyleProp } from 'react-native';

import { Text } from '@/design-system/components';

type Props = {
  text: string;
  style?: StyleProp<TextStyle>;
  fromAgent?: boolean;
};

/**
 * Renders simple markdown-ish emphasis: **bold** → bold text.
 */
export function FormattedMessage({ text, style }: Props) {
  const parts = useMemo(() => text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean), [text]);

  return (
    <Text variant="body" style={style}>
      {parts.map((part, index) => {
        const isBold = part.startsWith('**') && part.endsWith('**') && part.length > 4;
        if (isBold) {
          return (
            <Text key={`${index}-${part}`} variant="body" style={[style, { fontWeight: '700' }]}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return (
          <Text key={`${index}-${part.slice(0, 12)}`} variant="body" style={style}>
            {part}
          </Text>
        );
      })}
    </Text>
  );
}
