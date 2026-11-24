import React, {useEffect, useRef} from 'react';
import {AccessibilityInfo, Animated, type StyleProp, type ViewStyle} from 'react-native';

/** Sections rise in once per app session (Home's entrance). Still under reduced motion. */
const played = new Set<string>();

export function RiseIn({id, index = 0, children, style}: {id: string; index?: number; children: React.ReactNode; style?: StyleProp<ViewStyle>}) {
  const first = !played.has(id);
  const v = useRef(new Animated.Value(first ? 0 : 1)).current;
  useEffect(() => {
    if (!first) {return;}
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (!alive) {return;}
      if (reduced) {return v.setValue(1);}
      Animated.timing(v, {toValue: 1, duration: 520, delay: 70 * index, useNativeDriver: true}).start(() => played.add(id));
    });
    return () => {
      alive = false;
    };
  }, [first, index, id, v]);
  return <Animated.View style={[style, {opacity: v, transform: [{translateY: v.interpolate({inputRange: [0, 1], outputRange: [16, 0]})}]}]}>{children}</Animated.View>;
}
