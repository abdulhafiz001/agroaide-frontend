import React from 'react';
import Svg, { Circle } from 'react-native-svg';
import styled from '@/design-system/styled';

import { Text } from './Typography';

interface ProgressDonutProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  label?: string;
  subLabel?: string;
}

const Container = styled.View`
  align-items: center;
  justify-content: center;
`;

export const ProgressDonut: React.FC<ProgressDonutProps> = ({
  value,
  size = 96,
  strokeWidth = 10,
  color,
  backgroundColor,
  label,
  subLabel,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const strokeDashoffset = circumference - (circumference * clampedValue) / 100;

  return (
    <Container>
      <Svg width={size} height={size}>
        <Circle
          stroke={backgroundColor ?? '#d9dfe3'}
          fill="transparent"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke={color ?? '#57b346'}
          fill="transparent"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {label ? (
        <Text variant="headline" align="center">
          {label}
        </Text>
      ) : null}
      {subLabel ? (
        <Text variant="caption" tone="muted" align="center">
          {subLabel}
        </Text>
      ) : null}
    </Container>
  );
};

