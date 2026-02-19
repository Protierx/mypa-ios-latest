/**
 * MYPAAvatar v4 — GPU-Rendered 3D Spirit with Behavior System
 *
 * Shader computes per-pixel:
 *  - Ray-sphere intersection → true 3D surface normals
 *  - Phong diffuse + Blinn-Phong specular (sharp + soft)
 *  - Fresnel rim glow for spherical depth
 *  - Subsurface scattering pulses with voice energy
 *  - Gaze-directed eyes using iGazeX/iGazeY uniforms
 *  - Mouth luminance band driven by iMouthOpen
 *  - Outer aura halo, edge antialiasing
 *
 * Behavior system (useFrameCallback, 60fps UI thread):
 *  - Idle: Lissajous drift gaze, slow blinks
 *  - Listening: Center-lock gaze, micro-saccades, reduced blinks
 *  - Processing: Upper-left aversion, elevated saccades
 *  - Speaking: 70/30 center/aversion, mouth tracks energy
 *  - Transition blinks: "got it" on listen→process, punctuation on speak→idle
 */

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import {
  Canvas,
  Circle,
  RadialGradient,
  Fill,
  Shader,
  Skia,
  vec,
  Group,
  Blur,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

export type AvatarSize = 'full' | 'mini';
export type AvatarVoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export interface MYPAAvatarProps {
  size?: AvatarSize;
  expressionIndex?: number;
  energy?: number;
  onPress?: () => void;
  isActive?: boolean;
  voiceState?: AvatarVoiceState;
}

const SIZES = {
  full: { canvas: 200, body: 68, eyeR: 6.5, eyeSpacing: 22 },
  mini: { canvas: 52, body: 18, eyeR: 2.0, eyeSpacing: 6.5 },
} as const;

// Voice state → numeric for worklet access
const VS_IDLE = 0;
const VS_LISTENING = 1;
const VS_PROCESSING = 2;
const VS_SPEAKING = 3;

function voiceStateToIndex(s: AvatarVoiceState): number {
  switch (s) {
    case 'listening': return VS_LISTENING;
    case 'processing': return VS_PROCESSING;
    case 'speaking': return VS_SPEAKING;
    default: return VS_IDLE;
  }
}

// ── SkSL Fragment Shader ──────────────────────────────────────────────
const SPHERE_SHADER_SOURCE = `
uniform float2 iResolution;
uniform float  iTime;
uniform float  iEnergy;
uniform float  iBlink;
uniform float  iExpression;
uniform float  iSquash;
uniform float  iActive;
uniform float  iGazeX;
uniform float  iGazeY;
uniform float  iMouthOpen;

half4 main(float2 fragCoord) {
  // Step 1: Normalize to [-1, 1] centered
  float2 uv = (fragCoord * 2.0 - iResolution) / min(iResolution.x, iResolution.y);

  // Step 2: Squash deformation (press → compress Y, expand X)
  float sq = iSquash * 0.12;
  uv.y *= (1.0 + sq);
  uv.x *= (1.0 - sq * 0.5);

  // Step 3: Ray-sphere intersection
  float sphereR = 0.62;
  float3 rayOrigin = float3(0.0, 0.0, -2.0);
  float3 rayDir = normalize(float3(uv, 1.5));
  float3 sphereCenter = float3(0.0, 0.0, 0.0);

  float3 oc = rayOrigin - sphereCenter;
  float b = dot(oc, rayDir);
  float c = dot(oc, oc) - sphereR * sphereR;
  float discriminant = b * b - c;

  if (discriminant < 0.0) {
    // Outside sphere: outer aura
    float dist = length(uv);
    float auraBase = 0.14 + iActive * 0.18 + iEnergy * 0.3;
    float aura = auraBase * smoothstep(1.2, 0.65, dist);
    aura *= (1.0 + 0.08 * sin(iTime * 2.5));
    float3 auraCol = float3(0.29, 0.68, 0.63);
    return half4(half3(auraCol * aura), half(aura * 0.6));
  }

  // Step 4: Surface point and normal
  float t = -b - sqrt(discriminant);
  float3 hitPoint = rayOrigin + t * rayDir;
  float3 normal = normalize(hitPoint - sphereCenter);

  // Step 5: Lighting (upper-left, Skia Y-down so negative Y = upper)
  float3 lightDir = normalize(float3(-0.4, -0.55, -0.8));
  float3 viewDir = normalize(-rayDir);
  float3 halfVec = normalize(lightDir + viewDir);

  // Step 6: Organic surface noise
  float noise = sin(normal.x * 8.0 + iTime * 0.3)
              * sin(normal.y * 6.0 + iTime * 0.4)
              * sin(normal.z * 7.0 + iTime * 0.2) * 0.04;

  // Step 7: Phong diffuse
  float NdotL = max(dot(normal, lightDir), 0.0);
  float diffuse = NdotL * 0.6 + 0.3 + noise;

  // Step 8: Blinn-Phong specular
  float NdotH = max(dot(normal, halfVec), 0.0);
  float specular = pow(NdotH, 64.0) * 0.9;
  float specularSoft = pow(NdotH, 16.0) * 0.25;

  // Step 9: Fresnel rim
  float NdotV = max(dot(normal, viewDir), 0.0);
  float fresnel = pow(1.0 - NdotV, 3.5);
  float3 rimColor = float3(0.45, 0.85, 0.78);

  // Step 10: Subsurface scattering (voice-reactive inner glow)
  float sss = pow(max(dot(viewDir, -lightDir + normal * 0.5), 0.0), 3.0);
  float sssIntensity = 0.18 + iEnergy * 0.5;
  float3 sssColor = float3(0.76, 0.95, 0.92) * sss * sssIntensity;

  // Step 11: Teal color palette
  float3 baseColor = float3(0.29, 0.68, 0.63);
  float3 lightColor = float3(0.80, 0.94, 0.92);
  float3 shadowColor = float3(0.08, 0.28, 0.25);
  float3 surfaceColor = mix(shadowColor, lightColor, diffuse);
  surfaceColor = mix(surfaceColor, baseColor, 0.4);

  // Step 12: Combine lighting
  float3 color = surfaceColor
               + specular * float3(1.0, 1.0, 1.0)
               + specularSoft * float3(0.9, 0.98, 0.97)
               + fresnel * rimColor * 0.45
               + sssColor;

  // ── Step 13: Eyes (gaze-directed) ──────────────────────────────
  // Base eye positions (negative Y = above center in Skia coords)
  // iGazeX/iGazeY offset both eyes together (conjugate gaze)
  float gazeScale = 0.3;
  float3 leftEyeDir  = normalize(float3(-0.22 + iGazeX * gazeScale, -0.12 + iGazeY * gazeScale, -0.97));
  float3 rightEyeDir = normalize(float3( 0.22 + iGazeX * gazeScale, -0.12 + iGazeY * gazeScale, -0.97));

  float leftEyeDist  = acos(clamp(dot(normal, leftEyeDir), -1.0, 1.0));
  float rightEyeDist = acos(clamp(dot(normal, rightEyeDir), -1.0, 1.0));

  // Eye core glow
  float eyeRadius = 0.14;
  float leftGlow  = smoothstep(eyeRadius, eyeRadius * 0.12, leftEyeDist);
  float rightGlow = smoothstep(eyeRadius, eyeRadius * 0.12, rightEyeDist);

  // Eye brightness from expression
  float eyeBright = 0.62;
  if (iExpression > 4.5) { eyeBright = 0.22; }
  else if (iExpression > 3.5) { eyeBright = 1.0; }
  else if (iExpression > 1.5 && iExpression < 2.5) { eyeBright = 0.48; }
  else if (iActive > 0.5) { eyeBright = 0.88; }

  // Blink fades eye glow
  float blinkFade = 1.0 - iBlink * 0.96;
  float eyeIntensity = eyeBright * blinkFade;

  // Core white glow
  color += (leftGlow + rightGlow) * eyeIntensity * float3(1.0, 1.0, 1.0);

  // Outer halo (soft teal around eyes)
  float leftHalo  = smoothstep(eyeRadius * 2.8, eyeRadius * 0.4, leftEyeDist);
  float rightHalo = smoothstep(eyeRadius * 2.8, eyeRadius * 0.4, rightEyeDist);
  color += (leftHalo + rightHalo) * eyeIntensity * 0.2 * float3(0.82, 0.97, 0.96);

  // ── Step 14: Mouth (luminance band, speaking only) ─────────────
  if (iMouthOpen > 0.01) {
    // Mouth center (positive Y = below center in Skia coords)
    float3 mouthCenter = normalize(float3(0.0, 0.22, -0.97));

    // Tangent frame at mouth center for elliptical shape
    float3 mRight = normalize(cross(mouthCenter, float3(0.0, 1.0, 0.0)));
    float3 mUp = normalize(cross(mRight, mouthCenter));

    // Project pixel normal offset into mouth tangent plane
    float3 diff = normal - mouthCenter * dot(normal, mouthCenter);
    float h = dot(diff, mRight);
    float v = dot(diff, mUp);

    // Ellipse dimensions scale with mouth openness
    float mw = 0.08 + 0.10 * iMouthOpen;
    float mh = 0.012 + 0.038 * iMouthOpen;
    float ed = (h * h) / (mw * mw) + (v * v) / (mh * mh);

    float mouthGlow = smoothstep(1.0, 0.15, ed) * iMouthOpen;
    // Mouth brightness: ~45% of eye brightness, not affected by blink
    color += mouthGlow * 0.45 * float3(0.92, 1.0, 0.98);
  }

  // ── Step 15: Alpha (edge antialiasing) ─────────────────────────
  float edgeDist = length(uv) / sphereR;
  float alpha = smoothstep(1.0, 0.97, edgeDist);

  return half4(half3(clamp(color, float3(0.0), float3(1.0))), half(alpha));
}
`;

// ── Fallback Avatar (RadialGradient layers) ───────────────────────────
function FallbackAvatar({
  size = 'full',
  expressionIndex = 0,
  energy = 0,
  isActive = false,
}: Omit<MYPAAvatarProps, 'onPress' | 'voiceState'>) {
  const dim = SIZES[size];
  const cx = dim.canvas / 2;
  const cy = dim.canvas / 2;
  const B = dim.body;
  const isMini = size === 'mini';

  const eyeBrightness =
    expressionIndex === 4 ? 1.0
    : expressionIndex === 5 ? 0.22
    : expressionIndex === 2 ? 0.48
    : expressionIndex === 1 ? 0.82
    : isActive ? 0.88 : 0.62;

  const auraIntensity =
    expressionIndex === 4 ? 0.55
    : expressionIndex === 5 ? 0.06
    : isActive ? 0.32 + energy * 0.3 : 0.14;

  const coreGlow = 0.18 + energy * 0.5 + (expressionIndex === 4 ? 0.3 : 0);
  const lightX = cx - B * 0.30;
  const lightY = cy - B * 0.36;
  const specX = cx - B * 0.28;
  const specY = cy - B * 0.38;
  const eyeY = cy - B * 0.19;
  const leftEyeX = cx - dim.eyeSpacing / 2;
  const rightEyeX = cx + dim.eyeSpacing / 2;

  return (
    <Canvas style={{ width: dim.canvas, height: dim.canvas }}>
      <Circle cx={cx} cy={cy} r={B * 1.72}>
        <RadialGradient
          c={vec(cx, cy)} r={B * 1.72}
          colors={[
            `rgba(74, 173, 161, ${(auraIntensity * 0.28).toFixed(3)})`,
            `rgba(74, 173, 161, ${(auraIntensity * 0.10).toFixed(3)})`,
            'transparent',
          ]}
          positions={[0, 0.55, 1.0]}
        />
      </Circle>
      <Group>
        <Blur blur={isMini ? 4 : 9} />
        <Circle cx={cx + B * 0.05} cy={cy + B * 0.82} r={B * 0.60}>
          <RadialGradient
            c={vec(cx + B * 0.05, cy + B * 0.82)} r={B * 0.60}
            colors={['rgba(12, 52, 48, 0.42)', 'rgba(12, 52, 48, 0.14)', 'transparent']}
            positions={[0, 0.5, 1.0]}
          />
        </Circle>
      </Group>
      <Circle cx={cx} cy={cy} r={B}>
        <RadialGradient
          c={vec(lightX, lightY)} r={B * 1.85}
          colors={['#CBF0EB', '#7DCEC8', '#4AADA1', '#2A8078', '#154740']}
          positions={[0, 0.18, 0.45, 0.72, 1.0]}
        />
      </Circle>
      <Circle cx={cx} cy={cy} r={B}>
        <RadialGradient
          c={vec(cx, cy)} r={B}
          colors={['transparent', 'transparent', 'rgba(8, 38, 35, 0.38)']}
          positions={[0, 0.62, 1.0]}
        />
      </Circle>
      <Circle cx={cx - B * 0.06} cy={cy - B * 0.12} r={B * 0.68}>
        <RadialGradient
          c={vec(cx - B * 0.06, cy - B * 0.12)} r={B * 0.68}
          colors={[
            `rgba(195, 242, 235, ${(coreGlow * 0.55).toFixed(3)})`,
            `rgba(130, 210, 200, ${(coreGlow * 0.22).toFixed(3)})`,
            'transparent',
          ]}
          positions={[0, 0.45, 1.0]}
        />
      </Circle>
      <Group>
        <Blur blur={isMini ? 2.5 : 5.5} />
        <Circle cx={specX} cy={specY} r={B * 0.26}>
          <RadialGradient
            c={vec(specX, specY)} r={B * 0.26}
            colors={['rgba(255, 255, 255, 0.78)', 'rgba(230, 250, 248, 0.38)', 'transparent']}
            positions={[0, 0.40, 1.0]}
          />
        </Circle>
      </Group>
      <Circle cx={leftEyeX} cy={eyeY} r={dim.eyeR * 3.2}>
        <RadialGradient
          c={vec(leftEyeX, eyeY)} r={dim.eyeR * 3.2}
          colors={[
            `rgba(255, 255, 255, ${eyeBrightness.toFixed(2)})`,
            `rgba(210, 248, 244, ${(eyeBrightness * 0.55).toFixed(2)})`,
            'transparent',
          ]}
          positions={[0, 0.28, 1.0]}
        />
      </Circle>
      <Circle cx={rightEyeX} cy={eyeY} r={dim.eyeR * 3.2}>
        <RadialGradient
          c={vec(rightEyeX, eyeY)} r={dim.eyeR * 3.2}
          colors={[
            `rgba(255, 255, 255, ${eyeBrightness.toFixed(2)})`,
            `rgba(210, 248, 244, ${(eyeBrightness * 0.55).toFixed(2)})`,
            'transparent',
          ]}
          positions={[0, 0.28, 1.0]}
        />
      </Circle>
    </Canvas>
  );
}

// ── Main Component ────────────────────────────────────────────────────
export function MYPAAvatar({
  size = 'full',
  expressionIndex = 0,
  energy = 0,
  onPress,
  isActive = false,
  voiceState = 'idle',
}: MYPAAvatarProps) {
  const dim = SIZES[size];
  const isMini = size === 'mini';

  // ── Compile shader once ────────────────────────────────────────
  const sphereEffect = useMemo(() => {
    try {
      return Skia.RuntimeEffect.Make(SPHERE_SHADER_SOURCE);
    } catch (e) {
      console.warn('Sphere shader compilation failed, using fallback');
      return null;
    }
  }, []);

  // ── Core uniforms ──────────────────────────────────────────────
  const iTime = useSharedValue(0);
  const iEnergy = useSharedValue(0);
  const iExpression = useSharedValue(expressionIndex);
  const iSquash = useSharedValue(0);
  const iActive = useSharedValue(isActive ? 1 : 0);

  // ── Behavior uniforms ──────────────────────────────────────────
  const gazeX = useSharedValue(0);
  const gazeY = useSharedValue(0);
  const mouthOpenSV = useSharedValue(0);
  const voiceStateSV = useSharedValue(voiceStateToIndex(voiceState));

  // ── Sync props → SharedValues ──────────────────────────────────
  useEffect(() => {
    iTime.value = withRepeat(
      withTiming(1000, { duration: 1000000, easing: Easing.linear }),
      -1, false,
    );
  }, []);

  useEffect(() => {
    iEnergy.value = withTiming(energy, { duration: 120 });
  }, [energy]);

  useEffect(() => {
    iExpression.value = withTiming(expressionIndex, { duration: 200 });
  }, [expressionIndex]);

  useEffect(() => {
    iActive.value = withTiming(isActive ? 1 : 0, { duration: 300 });
  }, [isActive]);

  useEffect(() => {
    voiceStateSV.value = voiceStateToIndex(voiceState);
  }, [voiceState]);

  // ── Breathing / float ──────────────────────────────────────────
  const breathScale = useSharedValue(1);
  const breathOffset = useSharedValue(0);

  useEffect(() => {
    breathScale.value = withRepeat(
      withSequence(
        withTiming(1.038, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, true,
    );
    breathOffset.value = withRepeat(
      withSequence(
        withTiming(-3.5, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
        withTiming(3.5, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, true,
    );
  }, []);

  // ── Blink system (state-aware timing) ──────────────────────────
  const blinkProgress = useSharedValue(0);
  const blinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceStateRef = useRef(voiceState);

  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  const scheduleBlink = useCallback(() => {
    const s = voiceStateRef.current;
    let minD: number, maxD: number, closeMs: number, openMs: number;

    if (s === 'listening') {
      // Reduced blink rate signals attention
      minD = 4000; maxD = 8000; closeMs = 55; openMs = 90;
    } else if (s === 'processing') {
      // Elevated rate signals cognitive load
      minD = 2000; maxD = 4000; closeMs = 70; openMs = 100;
    } else if (s === 'speaking') {
      minD = 3000; maxD = 5000; closeMs = 60; openMs = 100;
    } else {
      // Idle: relaxed natural rate
      minD = 3000; maxD = 6000; closeMs = 65; openMs = 110;
    }

    const delay = minD + Math.random() * (maxD - minD);
    blinkTimer.current = setTimeout(() => {
      blinkProgress.value = withSequence(
        withTiming(1, { duration: closeMs }),
        withTiming(0, { duration: openMs }),
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

  // ── Transition blinks (state change events) ────────────────────
  const prevVoiceStateRef = useRef(voiceState);

  useEffect(() => {
    const prev = prevVoiceStateRef.current;
    prevVoiceStateRef.current = voiceState;

    // "Got it" blink: listening → processing (slow, deliberate)
    if (prev === 'listening' && voiceState === 'processing') {
      blinkProgress.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 150 }),
      );
    }

    // Punctuation blink: speaking → idle (clean closure)
    if (prev === 'speaking' && voiceState === 'idle') {
      blinkProgress.value = withSequence(
        withTiming(1, { duration: 80 }),
        withTiming(0, { duration: 120 }),
      );
    }
  }, [voiceState]);

  // ── Press deformation ──────────────────────────────────────────
  const pressScale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    pressScale.value = withSpring(0.91, { damping: 12, stiffness: 200 });
    iSquash.value = withSpring(1.0, { damping: 12, stiffness: 200 });
  }, []);

  const handlePressOut = useCallback(() => {
    pressScale.value = withSpring(1, { damping: 8, stiffness: 150 });
    iSquash.value = withSpring(0, { damping: 8, stiffness: 150 });
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: breathScale.value * pressScale.value },
      { translateY: breathOffset.value },
    ],
  }));

  // ── Behavior frame callback (gaze + mouth + micro-saccades) ────
  const tick = useSharedValue(0);

  useFrameCallback(() => {
    'worklet';
    // Skip behavior system for mini avatar (invisible at 52px)
    if (isMini) return;

    tick.value += 1;
    const t = tick.value;
    const state = voiceStateSV.value;
    const nrg = iEnergy.value;

    // ── Gaze system ──
    let targetX = 0;
    let targetY = 0;
    let sacAmp = 0;

    if (state < 0.5) {
      // IDLE: Lissajous drift — irrational frequency ratios prevent visible loops
      // Amplitude: 2-4% of eye spacing (0.02-0.04 normalized)
      // Speed: one cycle per 4-7 seconds (~240-420 frames at 60fps)
      targetX = 0.03 * Math.sin(t * 0.0047 + 0.5)
              + 0.012 * Math.sin(t * 0.0031);
      targetY = 0.02 * Math.sin(t * 0.0067)
              + 0.008 * Math.cos(t * 0.0041);
      sacAmp = 0; // no saccades in idle

    } else if (state < 1.5) {
      // LISTENING: center-lock with micro-saccades
      // Eyes aim straight at user (0, 0) with subtle life
      targetX = 0;
      targetY = 0;
      sacAmp = 0.012; // 1-3 per second, 0.5-1.5% amplitude

    } else if (state < 2.5) {
      // PROCESSING: upper-left aversion (humans look up-left when composing)
      // Negative X = left, negative Y = up in Skia screen coords
      targetX = -0.055;
      targetY = -0.035;
      sacAmp = 0.016; // elevated saccade rate

    } else {
      // SPEAKING: 70% center / 30% natural aversion at ~4s boundaries
      // Slow cycle: sin period ~12s, above 0.4 threshold ~30% of time
      const speakCycle = Math.sin(t * 0.008);
      if (speakCycle > 0.4) {
        // Aversion phase: slight upper-left drift
        targetX = -0.035 + 0.02 * Math.sin(t * 0.005);
        targetY = -0.018;
      } else {
        // Center phase: direct engagement
        targetX = 0;
        targetY = 0;
      }
      sacAmp = 0.008;
    }

    // Micro-saccades: sin products create naturally-varying bursts
    // Predominantly horizontal per spec (0.7x vertical scaling)
    const sacX = Math.sin(t * 0.17) * Math.sin(t * 0.31) * sacAmp;
    const sacY = Math.sin(t * 0.23) * Math.sin(t * 0.13) * sacAmp * 0.7;

    // Smooth gaze follow — slower in idle (dreamy), faster when active (attentive)
    const smoothRate = state < 0.5 ? 0.025 : 0.08;
    gazeX.value += (targetX + sacX - gazeX.value) * smoothRate;
    gazeY.value += (targetY + sacY - gazeY.value) * smoothRate;

    // ── Mouth system ──
    // Mouth appears ONLY during speaking, tracks voice amplitude
    if (state > 2.5 && nrg > 0.02) {
      // Speaking: mouth opens with energy (min 15% open to signal "still talking")
      const targetMouth = 0.15 + nrg * 0.75;
      // ~80ms lag via 0.18 smoothing factor at 60fps
      mouthOpenSV.value += (targetMouth - mouthOpenSV.value) * 0.18;
    } else {
      // Not speaking: fade out (~200ms)
      mouthOpenSV.value *= 0.88;
      if (mouthOpenSV.value < 0.005) mouthOpenSV.value = 0;
    }
  });

  // ── Uniform dictionary ─────────────────────────────────────────
  const uniforms = useDerivedValue(() => ({
    iResolution: [dim.canvas, dim.canvas],
    iTime: iTime.value,
    iEnergy: iEnergy.value,
    iBlink: blinkProgress.value,
    iExpression: iExpression.value,
    iSquash: iSquash.value,
    iActive: iActive.value,
    iGazeX: gazeX.value,
    iGazeY: gazeY.value,
    iMouthOpen: mouthOpenSV.value,
  }));

  // ── Render ─────────────────────────────────────────────────────
  if (!sphereEffect) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={isMini ? undefined : handlePressIn}
        onPressOut={isMini ? undefined : handlePressOut}
        style={styles.pressable}
      >
        <Animated.View style={[{ width: dim.canvas, height: dim.canvas }, containerStyle]}>
          <FallbackAvatar
            size={size}
            expressionIndex={expressionIndex}
            energy={energy}
            isActive={isActive}
          />
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={isMini ? undefined : handlePressIn}
      onPressOut={isMini ? undefined : handlePressOut}
      style={styles.pressable}
    >
      <Animated.View style={[{ width: dim.canvas, height: dim.canvas }, containerStyle]}>
        <Canvas style={{ width: dim.canvas, height: dim.canvas }}>
          <Fill>
            <Shader source={sphereEffect} uniforms={uniforms} />
          </Fill>
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
