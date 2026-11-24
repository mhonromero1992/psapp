import React, {useMemo, useState} from 'react';
import {PanResponder, StyleSheet, View, type LayoutChangeEvent} from 'react-native';
import Svg, {Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText} from 'react-native-svg';
import {useTheme} from 'styled-components/native';
import {Txt} from './Txt';

export interface ChartSeries {
  key: string;
  label: string;
  /** 1: blue, 2: green, ref: neutral. Validated palette, see DESIGN.md. */
  slot: '1' | '2' | 'ref';
  values: number[];
  area?: boolean;
}

const nice = (max: number) => {
  if (max <= 0) {return [0, 1];}
  const raw = max / 3;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw) ?? raw;
  const top = Math.ceil(max / step) * step;
  const out: number[] = [];
  for (let v = 0; v <= top + step / 2; v += step) {out.push(v);}
  return out;
};
const tick = (v: number) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M` : v >= 10_000 ? `${Math.round(v / 1000)}K` : v.toLocaleString('en-PH'));

/**
 * Time series: 2px lines, a light area wash, hairline grid, legend for two series. Touch and drag
 * to read any month (the readout sits above the chart, in words and numbers). `labels` are the short
 * axis labels ("Oct ’26"); `readoutLabels`, when given, are the full ones for the readout.
 */
export function AreaChart({labels, readoutLabels, series, format, caption, height = 210}: {labels: string[]; readoutLabels?: string[]; series: ChartSeries[]; format: (v: number) => string; caption: string; height?: number}) {
  const {colors, scale, fonts} = useTheme();
  const fontSize = Math.round(12 * Math.min(scale, 1.15));
  const [width, setWidth] = useState(0);
  const [idx, setIdx] = useState<number | null>(null);
  const pad = {t: 10, r: 10, b: 26, l: 46};
  const w = Math.max(1, width - pad.l - pad.r);
  const h = height - pad.t - pad.b;
  const n = labels.length;
  const ticks = useMemo(() => nice(Math.max(1, ...series.flatMap(s => s.values))), [series]);
  const max = ticks[ticks.length - 1];
  const x = (i: number) => pad.l + (n <= 1 ? w / 2 : (i / (n - 1)) * w);
  const y = (v: number) => pad.t + h - (v / max) * h;
  const color = (slot: ChartSeries['slot']) => (slot === '1' ? colors.chart1 : slot === '2' ? colors.chart2 : colors.chartRef);
  const path = (vals: number[]) => vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const pick = (px: number) => setIdx(Math.max(0, Math.min(n - 1, Math.round(((px - pad.l) / w) * (n - 1)))));
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderGrant: e => pick(e.nativeEvent.locationX),
        onPanResponderMove: e => pick(e.nativeEvent.locationX),
        onPanResponderTerminationRequest: () => true,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [w, n],
  );
  const shown = idx ?? n - 1;
  // Space labels by their real width, and never draw one that would touch the last label.
  const labelW = Math.max(...labels.map(l => l.length), 3) * fontSize * 0.56 + 10;
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(w / labelW))));
  const clearOfLast = (i: number) => (i === 0 ? x(i) + labelW : x(i) + labelW / 2) < x(n - 1) - labelW;

  return (
    <View>
      <View style={styles.readout} accessibilityLiveRegion="polite">
        <Txt variant="small" color="soft">
          {(readoutLabels ?? labels)[shown]}
        </Txt>
        <View style={styles.readRow}>
          {series.map(s => (
            <View key={s.key} style={styles.readItem}>
              <View style={[styles.key, {backgroundColor: color(s.slot)}]} />
              <Txt variant="smallStrong">{format(s.values[shown] ?? 0)}</Txt>
              <Txt variant="small" color="soft" style={styles.readLabel}>
                {s.label}
              </Txt>
            </View>
          ))}
        </View>
      </View>
      <View onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)} style={{height}} {...pan.panHandlers} accessible accessibilityRole="image" accessibilityLabel={caption}>
        {width > 0 && (
          <Svg width={width} height={height}>
            <Defs>
              {series.filter(s => s.area).map(s => (
                <LinearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={color(s.slot)} stopOpacity={0.18} />
                  <Stop offset="1" stopColor={color(s.slot)} stopOpacity={0.02} />
                </LinearGradient>
              ))}
            </Defs>
            {ticks.map(tv => (
              <React.Fragment key={tv}>
                <Line x1={pad.l} x2={pad.l + w} y1={y(tv)} y2={y(tv)} stroke={colors.chartGrid} strokeWidth={1} />
                <SvgText x={pad.l - 8} y={y(tv) + 4} fontSize={fontSize} fontFamily={fonts.regular} fill={colors.textMuted} textAnchor="end">
                  {tick(tv)}
                </SvgText>
              </React.Fragment>
            ))}
            {labels.map((l, i) =>
              i % every === 0 && i < n - 1 && clearOfLast(i) ? (
                <SvgText key={`${l}-${i}`} x={x(i)} y={height - 6} fontSize={fontSize} fontFamily={fonts.regular} fill={colors.textMuted} textAnchor={i === 0 ? 'start' : 'middle'}>
                  {l}
                </SvgText>
              ) : null,
            )}
            <SvgText x={x(n - 1)} y={height - 6} fontSize={fontSize} fontFamily={fonts.regular} fill={colors.textMuted} textAnchor="end">
              {labels[n - 1]}
            </SvgText>
            {series.map(s => (
              <React.Fragment key={s.key}>
                {s.area && <Path d={`${path(s.values)} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill={`url(#g-${s.key})`} />}
                <Path d={path(s.values)} stroke={color(s.slot)} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
              </React.Fragment>
            ))}
            <Line x1={x(shown)} x2={x(shown)} y1={pad.t} y2={pad.t + h} stroke={colors.textMuted} strokeWidth={1} opacity={0.4} />
            {series.map(s => (
              <Circle key={s.key} cx={x(shown)} cy={y(s.values[shown] ?? 0)} r={5} fill={color(s.slot)} stroke={colors.panel} strokeWidth={2} />
            ))}
          </Svg>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: {gap: 2, marginBottom: 10},
  readRow: {flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 4},
  readItem: {flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, maxWidth: '100%'},
  readLabel: {flexShrink: 1},
  key: {width: 14, height: 3, borderRadius: 2},
});
