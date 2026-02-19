/**
 * MYPAAvatar — Living 3D-like spirit rendered with Skia.
 *
 * Organic sphere with abstract facial features (eyes, mouth, ear hint),
 * breathing animation, blink cycle, and expression states driven by
 * voice pipeline and system events.
 *
 * Two sizes: full (AI Hub, ~140px) and mini (other screens, ~36px).
 * Touch-interactive: deforms with spring physics on press.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import {
  Canvas,
  Circle,
  RadialGradient,
  vec,
  Group,
  Blur,
  Path,
  Skia,
  Oval,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  useFrameCallback,
  runOnJS,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import { brand } from '../styles/colors';

// ── Types ────────────────────────────────────────────────────

export type AvatarSize = 'full' | 'mini';

export interface MYPAAvatarProps {
  size?: AvatarSize;
  /** Expression index from useAssistantSceneState (SharedValue) */
  expressionIndex?: number;
  /** Voice pipeline energy 0-1 for mouth pulse */
  energy?: number;
  /** Called when user taps the avatar */
  onPress?: () => void;
  /** Whether the avatar is in an active voice session */
  isActive?: boolean;
}

// ── Constants ────────────────────────────────────────────────

const SIZES = {
  full: { canvas: 180, body: 64, eyeR: 4.5, eyeSpacing: 18, mouthW: 16, earR: 10 },
  mini: { canvas: 48, body: 17, eyeR: 1.5, eyeSpacing: 5, mouthW: 5, earR: 3 },
} as const;

// Teal color palette for the avatar
const AVATAR_COLORS = {
  bodyOuter: brand.primary,        // #4AADA1
  bodyInner: '#3A9488',
  bodyCore: '#E0F4F1',             // Bright inner glow
  eyeGlow: '#FFFFFF',
  eyeDim: 'rgba(255, 255, 255, 0.4)',
  mouthLine: 'rgba(255, 255, 255, 0.6)',
  mouthDim: 'rgba(255, 255, 255, 0.15)',
  earHint: 'rgba(45, 138, 126, 0.5)',
  shadow: 'rgba(74, 173, 161, 0.3)',
} as const;

// ── Component ────────────────────────────────────────────────

export function MYPAAvatar({
  size = 'full',
  expressionIndex = 0,
  energy = 0,
  onPress,
  isActive = false,
}: MYPAAvatarProps) {
  const dim = SIZES[size];
  const cx = dim.canvas / 2;
  const cy = dim.canvas / 2;
  const isMini = size === 'mini';

  // ── Breathing animation ──────────────────────────────
  const breathScale = useSharedValue(1);
  const breathOffset = useSharedValue(0); // Vertical float

  useEffect(() => {
    breathScale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    breathOffset.value = withRepeat(
      withSequence(
        withTiming(-2, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(2, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  // ── Blink cycle ──────────────────────────────────────
  const blinkProgress = useSharedValue(0); // 0 = open, 1 = closed
  const blinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleBlink = useCallback(() => {
    const delay = 3000 + Math.random() * 4000; // 3-7s between blinks
    blinkTimer.current = setTimeout(() => {
      // Quick blink: close then open
      blinkProgress.value = withSequence(
        withTiming(1, { duration: 80 }),
        withTiming(0, { duration: 120 }),
      );
      scheduleBlink();
    }, delay);
  }, []);

  useEffect(() => {
    scheduleBlink();
    return () => {
      if (blinkTimer.current) clearTimeout(blinkTimer.current);
    };
  }, [scheduleBlink]);

  // ── Touch deformation ────────────────────────────────
  const pressScale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    pressScale.value = withSpring(0.92, { damping: 12, stiffness: 200 });
  }, []);

  const handlePressOut = useCallback(() => {
    pressScale.value = withSpring(1, { damping: 8, stiffness: 150 });
  }, []);

  // ── Animated container style ─────────────────────────
  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: breathScale.value * pressScale.value },
      { translateY: breathOffset.value },
    ],
  }));

  // ── Expression-derived values ────────────────────────
  // 0=none, 1=waiting, 2=concerned, 3=confident, 4=celebrating, 5=resting
  const eyeBrightness = expressionIndex === 4 ? 1.0  // celebrating: bright
    : expressionIndex === 5 ? 0.3                      // resting: dim
    : expressionIndex === 2 ? 0.5                      // concerned: softer
    : expressionIndex === 1 ? 0.8                      // waiting: alert
    : isActive ? 0.9 : 0.6;                            // active vs idle

  const mouthCurve = expressionIndex === 4 ? 0.3       // celebrating: smile
    : expressionIndex === 2 ? -0.15                     // concerned: slight downturn
    : expressionIndex === 3 ? 0.15                      // confident: slight upturn
    : 0;                                                 // neutral

  const bodyGlowOpacity = expressionIndex === 4 ? 0.5  // celebrating: bright glow
    : expressionIndex === 5 ? 0.1                       // resting: dim
    : isActive ? 0.35 : 0.2;                            // active vs idle

  // ── Mouth path (subtle curved line) ──────────────────
  const mouthY = cy + dim.body * 0.35;
  const mouthPath = Skia.Path.Make();
  const mhw = dim.mouthW / 2;
  mouthPath.moveTo(cx - mhw, mouthY);
  mouthPath.quadTo(cx, mouthY + mouthCurve * dim.body, cx + mhw, mouthY);

  // ── Mouth energy pulse (wider when speaking) ─────────
  const mouthScale = 1 + energy * 0.3;
  const mouthOpacity = Math.max(0.15, energy * 0.8 + (mouthCurve !== 0 ? 0.4 : 0));

  // ── Ear hint (slight protrusion on right side) ───────
  const earCx = cx + dim.body * 0.85;
  const earCy = cy - dim.body * 0.1;

  // ── Eye positions ────────────────────────────────────
  // When listening (isActive), eyes shift slightly toward ear side
  const eyeShift = isActive ? dim.eyeSpacing * 0.08 : 0;
  const leftEyeX = cx - dim.eyeSpacing / 2 + eyeShift;
  const rightEyeX = cx + dim.eyeSpacing / 2 + eyeShift;
  const eyeY = cy - dim.body * 0.15;

  // Eye vertical squash for blink (approximated with static render)
  // For mini size, simplify rendering
  const eyeAlpha = eyeBrightness.toFixed(2);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={isMini ? undefined : handlePressIn}
      onPressOut={isMini ? undefined : handlePressOut}
      style={styles.pressable}
    >
      <Animated.View style={[{ width: dim.canvas, height: dim.canvas }, containerStyle]}>
        <Canvas style={{ width: dim.canvas, height: dim.canvas }}>
          {/* Outer glow / shadow */}
          <Circle cx={cx} cy={cy} r={dim.body * 1.3}>
            <RadialGradient
              c={vec(cx, cy)}
              r={dim.body * 1.3}
              colors={[
                `rgba(74, 173, 161, ${bodyGlowOpacity.toFixed(2)})`,
                `rgba(74, 173, 161, ${(bodyGlowOpacity * 0.3).toFixed(2)})`,
                'transparent',
              ]}
            />
          </Circle>

          {/* Main body — layered circles for depth/subsurface scattering */}
          {/* Outer edge */}
          <Circle cx={cx} cy={cy} r={dim.body} color={AVATAR_COLORS.bodyOuter} />

          {/* Mid layer */}
          <Circle cx={cx} cy={cy} r={dim.body * 0.88}>
            <RadialGradient
              c={vec(cx - dim.body * 0.15, cy - dim.body * 0.2)}
              r={dim.body * 0.88}
              colors={[
                AVATAR_COLORS.bodyCore,
                AVATAR_COLORS.bodyOuter,
                AVATAR_COLORS.bodyInner,
              ]}
            />
          </Circle>

          {/* Inner core glow — subsurface scattering effect */}
          <Circle cx={cx - dim.body * 0.1} cy={cy - dim.body * 0.15} r={dim.body * 0.5}>
            <RadialGradient
              c={vec(cx - dim.body * 0.1, cy - dim.body * 0.15)}
              r={dim.body * 0.5}
              colors={[
                `rgba(224, 244, 241, ${(bodyGlowOpacity + 0.2).toFixed(2)})`,
                'transparent',
              ]}
            />
          </Circle>

          {/* Specular highlight (top-left) */}
          <Circle cx={cx - dim.body * 0.25} cy={cy - dim.body * 0.3} r={dim.body * 0.2}>
            <RadialGradient
              c={vec(cx - dim.body * 0.25, cy - dim.body * 0.3)}
              r={dim.body * 0.2}
              colors={['rgba(255, 255, 255, 0.35)', 'transparent']}
            />
          </Circle>

          {!isMini && (
            <Group>
              {/* Ear hint — subtle bulge on right side */}
              <Circle cx={earCx} cy={earCy} r={dim.earR}>
                <RadialGradient
                  c={vec(earCx, earCy)}
                  r={dim.earR}
                  colors={[AVATAR_COLORS.earHint, 'transparent']}
                />
              </Circle>

              {/* Left eye */}
              <Circle
                cx={leftEyeX}
                cy={eyeY}
                r={dim.eyeR}
                color={`rgba(255, 255, 255, ${eyeAlpha})`}
              />
              {/* Left eye glow */}
              <Circle cx={leftEyeX} cy={eyeY} r={dim.eyeR * 2}>
                <RadialGradient
                  c={vec(leftEyeX, eyeY)}
                  r={dim.eyeR * 2}
                  colors={[
                    `rgba(255, 255, 255, ${(eyeBrightness * 0.3).toFixed(2)})`,
                    'transparent',
                  ]}
                />
              </Circle>

              {/* Right eye */}
              <Circle
                cx={rightEyeX}
                cy={eyeY}
                r={dim.eyeR}
                color={`rgba(255, 255, 255, ${eyeAlpha})`}
              />
              {/* Right eye glow */}
              <Circle cx={rightEyeX} cy={eyeY} r={dim.eyeR * 2}>
                <RadialGradient
                  c={vec(rightEyeX, eyeY)}
                  r={dim.eyeR * 2}
                  colors={[
                    `rgba(255, 255, 255, ${(eyeBrightness * 0.3).toFixed(2)})`,
                    'transparent',
                  ]}
                />
              </Circle>

              {/* Mouth — subtle curved line */}
              <Group transform={[{ scaleX: mouthScale }]} origin={vec(cx, mouthY)}>
                <Path
                  path={mouthPath}
                  style="stroke"
                  strokeWidth={1.5}
                  color={`rgba(255, 255, 255, ${mouthOpacity.toFixed(2)})`}
                  strokeCap="round"
                />
              </Group>
            </Group>
          )}

          {/* Mini mode: just two tiny eye dots */}
          {isMini && (
            <Group>
              <Circle
                cx={cx - dim.eyeSpacing / 2}
                cy={cy - dim.body * 0.1}
                r={dim.eyeR}
                color={`rgba(255, 255, 255, ${eyeAlpha})`}
              />
              <Circle
                cx={cx + dim.eyeSpacing / 2}
                cy={cy - dim.body * 0.1}
                r={dim.eyeR}
                color={`rgba(255, 255, 255, ${eyeAlpha})`}
              />
            </Group>
          )}
        </Canvas>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MYPAAvatar;
