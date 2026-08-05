import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { Text } from '@/design-system/components';

type SeriesPoint = { date: string; price: number };
type Series = { key: string; color: string; points: SeriesPoint[] };

const COLORS = ['#166534', '#1d4ed8', '#b45309', '#7c3aed', '#be123c', '#0f766e'];

type Props = {
  history: Record<string, SeriesPoint[]>;
  height?: number;
};

export function MarketPriceChart({ history, height = 200 }: Props) {
  const series: Series[] = useMemo(() => {
    return Object.entries(history)
      .filter(([, pts]) => pts.length > 0)
      .slice(0, 6)
      .map(([key, points], i) => ({
        key,
        color: COLORS[i % COLORS.length],
        points: [...points].sort((a, b) => a.date.localeCompare(b.date)),
      }));
  }, [history]);

  const width = 320;
  const pad = { top: 16, right: 12, bottom: 28, left: 48 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const allPrices = series.flatMap((s) => s.points.map((p) => p.price));
  const allDates = Array.from(new Set(series.flatMap((s) => s.points.map((p) => p.date)))).sort();

  if (series.length === 0 || allDates.length === 0 || allPrices.length === 0) {
    return (
      <View style={{ padding: 16, alignItems: 'center' }}>
        <Text tone="muted" variant="caption">
          Price history will appear after the next daily sync when Market Eye prices change.
        </Text>
      </View>
    );
  }

  const minP = Math.min(...allPrices);
  const maxP = Math.max(...allPrices);
  const span = Math.max(maxP - minP, 1);

  const xFor = (date: string) => {
    if (allDates.length === 1) return pad.left + innerW / 2;
    const i = allDates.indexOf(date);
    return pad.left + (i / (allDates.length - 1)) * innerW;
  };
  const yFor = (price: number) => pad.top + (1 - (price - minP) / span) * innerH;

  return (
    <View style={{ gap: 10 }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Line
          x1={pad.left}
          y1={pad.top}
          x2={pad.left}
          y2={pad.top + innerH}
          stroke="#d1d5db"
          strokeWidth={1}
        />
        <Line
          x1={pad.left}
          y1={pad.top + innerH}
          x2={pad.left + innerW}
          y2={pad.top + innerH}
          stroke="#d1d5db"
          strokeWidth={1}
        />
        <SvgText x={4} y={pad.top + 4} fill="#6b7280" fontSize="10">
          ₦{Math.round(maxP).toLocaleString('en-NG')}
        </SvgText>
        <SvgText x={4} y={pad.top + innerH} fill="#6b7280" fontSize="10">
          ₦{Math.round(minP).toLocaleString('en-NG')}
        </SvgText>
        {allDates.length > 0 ? (
          <SvgText x={pad.left} y={height - 6} fill="#6b7280" fontSize="9">
            {allDates[0].slice(5)}
          </SvgText>
        ) : null}
        {allDates.length > 1 ? (
          <SvgText x={pad.left + innerW - 36} y={height - 6} fill="#6b7280" fontSize="9">
            {allDates[allDates.length - 1].slice(5)}
          </SvgText>
        ) : null}

        {series.map((s) => {
          const pts = s.points.map((p) => `${xFor(p.date)},${yFor(p.price)}`).join(' ');
          return (
            <React.Fragment key={s.key}>
              <Polyline points={pts} fill="none" stroke={s.color} strokeWidth={2.5} />
              {s.points.map((p) => (
                <Circle
                  key={`${s.key}-${p.date}`}
                  cx={xFor(p.date)}
                  cy={yFor(p.price)}
                  r={3.5}
                  fill={s.color}
                />
              ))}
            </React.Fragment>
          );
        })}
      </Svg>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 4 }}>
        {series.map((s) => (
          <View key={s.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.color }} />
            <Text variant="caption">{s.key}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
