# MYPA Design Specification
## Pixel-Perfect UI Specification Document

> Every measurement, color, and component defined precisely.
> Copy these specs directly into Figma or code.

---

# 🎙️ CORE PHILOSOPHY: VOICE-FIRST, FEELING-RESPONSIVE

> **The AI Hub isn't a screen with an orb. The entire screen IS the AI.**
> 
> When users open MYPA, they should feel like they've stepped into a living space that knows them, responds to them, and feels alive. The whole interface breathes, reacts to voice, and shifts with the user's energy.

---

# SECTION 0: THE LIVING AI HUB (NEW VISION)

## 0.1 Concept: The Screen as a Living Entity

**Traditional approach**: Small orb floating on screen → feels like talking to an object
**MYPA approach**: The ENTIRE screen is alive → feels like being INSIDE the AI's presence

### Visual Metaphor
```
Imagine:
- Standing in a calm, infinite space
- Soft ambient light surrounds you
- When you speak, ripples emanate from where your voice touches
- The space responds to your energy - calm when you're calm, energetic when you're excited
- It feels like the room itself is listening, understanding, responding
```

### Key Principles
1. **No visible "assistant"** - The AI IS the environment
2. **Reactive to voice** - Visuals respond to volume, pitch, emotion
3. **Emotionally aware** - Colors/movement shift with user's energy
4. **Utopian aesthetic** - Dreamy, calm, futuristic, welcoming
5. **Personal** - Feels like YOUR space, not a generic app

## 0.2 The Living Background System

### Base State (Idle/Listening)
```
Background: Animated gradient mesh that slowly breathes

Colors flow between:
- Deep space purple: #0A0A1A
- Soft violet: #1A1030  
- Midnight blue: #0D1B2A
- Subtle magenta hints: #1A0A1A

Animation:
- Subtle flowing movement, like northern lights underwater
- 8-second loop, seamless
- Opacity layers shift independently
- Feels alive but calm, not distracting
```

### Voice Active State (Speaking/Listening)
```
When user speaks OR AI speaks:

VOICE RIPPLES:
- Circular waves emanate from center-bottom (where voice "enters")
- Wave intensity = voice volume
- Wave frequency = speech rhythm
- Color: User voice = soft blue/cyan, AI voice = soft purple/magenta

PARTICLE FIELD:
- 50-100 small glowing particles floating
- React to voice volume - bounce/scatter on loud, drift on soft
- Form subtle constellations when idle
- Colors match the ambient gradient
```

### Energy Responsive States
```
CALM/REFLECTIVE (detected from slow speech, pauses):
- Colors shift cooler (more blue/cyan)
- Particles move slowly, float downward gently
- Ambient light dims slightly
- Feels like a quiet evening

ENERGETIC/EXCITED (detected from fast speech, higher pitch):
- Colors shift warmer (more magenta/pink hints)
- Particles move faster, spiral upward
- Ambient light brightens
- Feels like sunrise energy

STRESSED/OVERWHELMED (detected from speech patterns):
- Colors gradually shift to calming tones
- Particles slow down, organize into soothing patterns
- Subtle breathing animation guides user to breathe
- AI voice becomes softer, slower

FOCUSED/PRODUCTIVE:
- Clean, minimal particle activity
- Stronger center gradient (focus point)
- Crisp, clear ambient feel
```

## 0.3 Visual Elements

### The Greeting Text
```
Position: Centered, upper third of screen
Animation: Fades in softly, words appear sequentially

"Good morning, Alex"
- Font: 34px / 700 weight
- Color: White with very subtle glow
- Appears to float in the space
- Letter spacing: -0.5px

AI's message appears below:
"What's on your mind?"
- Font: 20px / 400 weight  
- Color: #A1A1AA (soft gray)
- Typing animation, then settles
```

### The Voice Indicator (Replacing Orb)
```
Instead of an orb, show a subtle FOCAL POINT in center:

IDLE:
- Soft circular glow, 120px diameter
- Not a hard circle - fuzzy, ethereal edges
- Very subtle pulse (4s loop)
- Opacity: 30%
- Feels like a gentle invitation

LISTENING:
- Glow expands smoothly (120px → 200px)
- Opacity increases (30% → 50%)
- Edge becomes more defined
- Concentric ripples pulse outward
- Inner area shows voice waveform visualization

SPEAKING (AI responding):
- Organic blob animation - the glow morphs shapes
- Size pulses with AI voice volume
- Colors shift through purple spectrum
- Particles around it dance with speech rhythm

TAP ANYWHERE to activate voice (not just center)
```

### Quick Action Pills (Floating)
```
Position: Lower third of screen, floating
Style: Semi-transparent pills that feel part of the environment

"Start Focus" pill:
- Background: rgba(124, 58, 237, 0.2)
- Border: 1px rgba(255, 255, 255, 0.1)
- Backdrop blur: 20px
- Text: 15px / 500, white at 90%
- Border radius: 24px (pill)
- Padding: 12px 20px

Pills gently float/sway (subtle animation)
Tap shows ripple effect spreading through the space
```

### Stats (Ambient Integration)
```
Rather than cards, stats appear as ambient information:

Position: Bottom of screen, above safe area
Style: Minimal, integrated into the environment

"5 tasks · 47 day streak · #2 in circle"
- Single line, centered
- Font: 13px / 400, #71717A
- Fades in/out based on context
- Not always visible - appears when relevant

Or: Stats float as subtle glowing numbers in the particle field
- "47" with tiny flame icon drifting slowly
- Tap to expand into detail
```

## 0.4 Technical Implementation

### React Native + Reanimated + Skia
```typescript
// Libraries needed:
// - @shopify/react-native-skia (for fluid graphics)
// - react-native-reanimated (for smooth animations)
// - expo-av (for audio analysis)

// Voice volume detection for reactivity
const analyzeVoiceInput = () => {
  // Get audio levels from microphone
  // Map volume (0-1) to visual intensity
  // Detect speech patterns for energy classification
};

// Shader for living background
const GradientMeshShader = `
  // GLSL shader for flowing gradient mesh
  // Multiple noise layers with different speeds
  // Color interpolation based on time and audio input
`;

// Particle system reacting to voice
const VoiceReactiveParticles = () => {
  // 50-100 particles with physics
  // Velocity influenced by audio.volume
  // Position influenced by audio.frequency
};
```

### Audio Analysis for Reactivity
```typescript
interface VoiceAnalysis {
  volume: number;        // 0-1, drives visual intensity
  pitch: number;         // Hz, can indicate emotion
  speechRate: number;    // words/min, indicates energy
  pauses: number;        // silence duration, indicates thought
  emotion: 'calm' | 'energetic' | 'stressed' | 'focused';
}

// Simple emotion detection from voice patterns
const detectEmotion = (analysis: VoiceAnalysis): Emotion => {
  if (analysis.speechRate > 180 && analysis.volume > 0.7) return 'energetic';
  if (analysis.pauses > 2000 && analysis.speechRate < 100) return 'calm';
  if (analysis.pitch > userBaseline * 1.3) return 'stressed';
  return 'focused';
};
```

## 0.5 AI Hub Screen Design Prompt (For Figma/AI)

```
Design the AI Hub screen for MYPA - a living, breathing interface.

CONCEPT: The entire screen is the AI. No floating orb - the user is INSIDE the AI's presence.

CANVAS: iPhone 15 Pro (393 × 852px)

BACKGROUND:
- NOT solid black. Living gradient mesh.
- Colors: Deep purples (#0A0A1A, #1A1030), midnight blues (#0D1B2A)
- Appears to slowly flow/breathe like aurora borealis underwater
- Dreamy, utopian, infinite space feeling

PARTICLE FIELD:
- 50-80 small glowing dots scattered across screen
- Colors: Soft white, pale purple, pale cyan
- Different sizes (2-6px) and opacities (20-60%)
- Drift slowly in random directions
- Some form loose constellation patterns

CENTER FOCAL POINT (not an orb):
- Soft, fuzzy circular glow (not hard-edged)
- 120px diameter, very diffuse edges
- Color: Soft purple/white blend
- 30% opacity
- Subtle slow pulse animation
- Feels like an invitation, not a button

GREETING (upper third):
- "Good morning, Alex" - 34px bold white
- Below: "What's on your mind?" - 20px regular, soft gray
- Text appears to float in the space
- Very subtle text glow

QUICK ACTIONS (lower third):
- Two floating pill buttons
- "Start Focus" and "Add Task"
- Semi-transparent with blur backdrop
- Gentle float animation (subtle bob)
- Feel integrated into the environment, not sitting on top

STATS (bottom):
- Single line of minimal stats
- "5 tasks · 47 day streak"
- 13px, very subtle gray
- Almost whispered information

STATES TO SHOW:
1. Idle: Calm, breathing, inviting
2. Listening: Center glow expands, ripples emanate, particles react
3. AI Speaking: Organic movement in center, particles dance

MOOD: Utopian, dreamy, personal, alive, welcoming
NOT: Cold, corporate, app-like, busy, cluttered
```

## 0.6 Voice-Reactive Animation Specs

### When User Starts Speaking
```
Trigger: Microphone detects voice above threshold

Animation (0-300ms):
1. Center glow expands: 120px → 180px
2. Glow opacity: 30% → 50%
3. Particles begin moving toward center (subtle attraction)
4. Background gradient increases saturation slightly
5. Haptic: Light tap

Voice waveform:
- Appears in center glow area
- Real-time visualization of audio
- Smooth, organic line (not sharp bars)
- Color: Soft cyan/white
```

### When User Stops Speaking
```
Trigger: 500ms silence detected

Animation:
1. Waveform fades (200ms)
2. Center shows "processing" state - subtle rotation
3. Particles drift outward slowly
4. Text might appear: "Thinking..." (optional, very subtle)
```

### When AI Responds
```
Trigger: AI audio begins playing

Animation:
1. Center glow morphs into organic blob shape
2. Blob size pulses with AI voice volume
3. Color shifts toward warmer purple/magenta
4. Particles arrange into flowing patterns around center
5. Response text appears above (typed out with voice)

AI Voice:
- OpenAI Realtime API
- Voice: 'ash' (warm, friendly)
- Streams audio while animating
```

### When AI Finishes Speaking
```
Trigger: AI audio ends

Animation (500ms):
1. Blob smoothly returns to soft circle
2. Size: back to 120px
3. Particles return to gentle drift
4. Background settles to calm state
5. Quick actions fade back in
```

---

# SECTION 1: COLOR SPECIFICATION

## 1.1 Background Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| `bg-black` | `#000000` | 0, 0, 0 | Main app background, always |
| `bg-surface-1` | `#0D0D0D` | 13, 13, 13 | Slightly elevated areas, headers |
| `bg-surface-2` | `#161616` | 22, 22, 22 | Cards, list items, modals |
| `bg-surface-3` | `#1C1C1E` | 28, 28, 30 | Interactive elements, inputs, pressed states |
| `bg-surface-4` | `#2C2C2E` | 44, 44, 46 | Hover states, selected items |

## 1.2 Brand Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| `brand-primary` | `#7C3AED` | 124, 58, 237 | Primary buttons, orb core, key accents |
| `brand-secondary` | `#A78BFA` | 167, 139, 250 | Secondary accents, links, highlights |
| `brand-tertiary` | `#C4B5FD` | 196, 181, 253 | Subtle accents, icon tints |
| `brand-muted` | `#4C1D95` | 76, 29, 149 | Dark purple for backgrounds, borders |

## 1.3 Text Colors

| Name | Hex | Opacity | Usage |
|------|-----|---------|-------|
| `text-primary` | `#FFFFFF` | 100% | Headings, important text, titles |
| `text-secondary` | `#A1A1AA` | 100% | Body text, descriptions |
| `text-tertiary` | `#71717A` | 100% | Hints, placeholders, timestamps |
| `text-disabled` | `#52525B` | 100% | Disabled text |
| `text-inverse` | `#000000` | 100% | Text on light backgrounds |

## 1.4 Semantic Colors

| Name | Hex | Light Variant | Usage |
|------|-----|---------------|-------|
| `success` | `#22C55E` | `#22C55E1A` (10%) | Completed tasks, positive feedback |
| `warning` | `#EAB308` | `#EAB3081A` (10%) | Attention needed, due soon |
| `error` | `#EF4444` | `#EF44441A` (10%) | Errors, delete actions, overdue |
| `info` | `#3B82F6` | `#3B82F61A` (10%) | Information, tips |

## 1.5 Gradient Definitions

### Orb Gradient (Primary)
```css
background: conic-gradient(
  from 180deg at 50% 50%,
  #7C3AED 0deg,
  #A78BFA 120deg,
  #C4B5FD 180deg,
  #A78BFA 240deg,
  #7C3AED 360deg
);
```

### Button Gradient
```css
background: linear-gradient(135deg, #7C3AED 0%, #9333EA 100%);
```

### Card Highlight Gradient
```css
background: linear-gradient(
  180deg,
  rgba(124, 58, 237, 0.08) 0%,
  rgba(124, 58, 237, 0) 100%
);
```

### Orb Glow
```css
box-shadow: 
  0 0 60px rgba(124, 58, 237, 0.4),
  0 0 120px rgba(124, 58, 237, 0.2),
  0 0 180px rgba(124, 58, 237, 0.1);
```

---

# SECTION 2: TYPOGRAPHY SPECIFICATION

## 2.1 Font Family

```
Primary: SF Pro Display
Fallback: -apple-system, BlinkMacSystemFont, system-ui
Mono: SF Mono (for timers, numbers)
```

## 2.2 Type Scale (Exact)

| Name | Size | Weight | Line Height | Letter Spacing | Usage |
|------|------|--------|-------------|----------------|-------|
| `display-large` | 48px | 700 | 56px | -1.5px | Timer digits only |
| `display` | 34px | 700 | 40px | -0.5px | Screen titles (rare) |
| `title-1` | 28px | 700 | 34px | -0.3px | Section headers |
| `title-2` | 22px | 600 | 28px | -0.2px | Card titles, modal headers |
| `title-3` | 20px | 600 | 24px | -0.1px | Subsection headers |
| `headline` | 17px | 600 | 22px | -0.4px | Important labels, buttons |
| `body` | 17px | 400 | 24px | -0.4px | Main body text |
| `body-medium` | 17px | 500 | 24px | -0.4px | Emphasized body |
| `callout` | 16px | 400 | 21px | -0.3px | Secondary text |
| `subhead` | 15px | 400 | 20px | -0.2px | Metadata, subtitles |
| `footnote` | 13px | 400 | 18px | -0.1px | Timestamps, hints |
| `caption-1` | 12px | 500 | 16px | 0px | Labels, badges |
| `caption-2` | 11px | 400 | 13px | 0.1px | Tiny labels |

## 2.3 Typography by Screen Element

### AI Home Screen
```
Greeting "Good morning, Alex": title-1, text-primary
AI Message "How can I help?": body, text-secondary
Quick Action Button: headline, text-primary
Stats Card Number: title-2, text-primary
Stats Card Label: caption-1, text-tertiary
Swipe Hint: footnote, text-tertiary
```

### Tasks Screen
```
Screen Title "Tasks": title-1, text-primary
Filter Tab Active: headline, text-primary
Filter Tab Inactive: headline, text-tertiary
Section Header "MORNING": caption-1, text-tertiary, uppercase, letter-spacing 1px
Task Title: body-medium, text-primary
Task Time: subhead, text-tertiary
Task Category Tag: caption-1, text-secondary
AI Duration Estimate: caption-1, brand-secondary
```

### Focus Screen
```
Timer: display-large, text-primary, SF Mono
AI Encouragement: body, text-secondary
Task Label: subhead, text-tertiary
Button Label: headline, text-primary
Session Stats: footnote, text-tertiary
```

### Profile Screen
```
User Name: title-2, text-primary
Streak Badge: caption-1, brand-secondary
Stat Number: title-1, text-primary
Stat Label: caption-1, text-tertiary
Unlock Title: body-medium, text-primary
Unlock Status: subhead, text-secondary
Settings Item: body, text-primary
```

---

# SECTION 3: SPACING SPECIFICATION

## 3.1 Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `space-0` | 0px | None |
| `space-1` | 4px | Tight element spacing |
| `space-2` | 8px | Related element gaps |
| `space-3` | 12px | Component internal padding |
| `space-4` | 16px | Card padding, list item padding |
| `space-5` | 20px | Screen horizontal margin |
| `space-6` | 24px | Section gaps |
| `space-7` | 32px | Major section spacing |
| `space-8` | 40px | Screen top padding (below safe area) |
| `space-9` | 48px | Hero spacing |
| `space-10` | 64px | Large gaps |

## 3.2 Screen Layout

```
Safe Area Top: 59px (iPhone 15 Pro) / 47px (iPhone SE)
Safe Area Bottom: 34px (home indicator) / 0px (iPhone SE)

Screen Horizontal Padding: 20px
Screen Top Padding (below safe area): 16px
Screen Bottom Padding (above safe area): 24px

Content Max Width: 100% (no max on mobile)
```

## 3.3 Component Spacing

### Card Spacing
```
Card Margin (between cards): 12px
Card Padding: 16px
Card Inner Element Gap: 12px
Card Title to Content: 8px
```

### List Spacing
```
List Item Height (single line): 56px
List Item Height (two line): 72px
List Item Horizontal Padding: 16px
List Item Vertical Padding: 12px
List Separator Inset: 16px from left
List Section Header Margin Top: 24px
List Section Header Margin Bottom: 8px
```

### Button Spacing
```
Button Padding (large): 16px 32px
Button Padding (medium): 12px 24px
Button Padding (small): 8px 16px
Button Gap (between buttons): 12px
Button Icon Gap: 8px
```

---

# SECTION 4: BORDER RADIUS SPECIFICATION

| Token | Value | Usage |
|-------|-------|-------|
| `radius-none` | 0px | Sharp corners |
| `radius-sm` | 6px | Small tags, badges |
| `radius-md` | 10px | Buttons, inputs |
| `radius-lg` | 14px | Cards, list items |
| `radius-xl` | 20px | Modals, large cards |
| `radius-2xl` | 28px | Bottom sheets |
| `radius-full` | 9999px | Pills, circular buttons, orb |

---

# SECTION 5: SHADOW SPECIFICATION

## 5.1 Elevation Shadows

```css
/* No shadow - flat design mostly */
shadow-none: none;

/* Subtle lift */
shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.5);

/* Card elevation */
shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);

/* Modal elevation */
shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.5);

/* Floating elements */
shadow-xl: 0 20px 40px rgba(0, 0, 0, 0.6);
```

## 5.2 Glow Shadows (for brand elements)

```css
/* Button glow */
glow-button: 0 4px 14px rgba(124, 58, 237, 0.4);

/* Orb glow - idle */
glow-orb-idle: 
  0 0 40px rgba(124, 58, 237, 0.3),
  0 0 80px rgba(124, 58, 237, 0.15);

/* Orb glow - active */
glow-orb-active:
  0 0 60px rgba(124, 58, 237, 0.5),
  0 0 120px rgba(124, 58, 237, 0.3),
  0 0 180px rgba(124, 58, 237, 0.15);

/* Success glow */
glow-success: 0 0 20px rgba(34, 197, 94, 0.4);
```

---

# SECTION 6: COMPONENT SPECIFICATIONS

## 6.1 Living Background Component (Replaces Orb)

### Overview
The AI Hub no longer uses a traditional orb. Instead, the ENTIRE screen is a living, reactive canvas. This component manages the ambient background, particle system, and voice reactivity.

### Technical Stack
```
Required packages:
- @shopify/react-native-skia (fluid graphics, shaders)
- react-native-reanimated (60fps animations)
- expo-av (audio level analysis)
- expo-linear-gradient (base gradients)
```

### Background Gradient Mesh
```
Colors (flowing between):
- #0A0A1A (deep space purple)
- #1A1030 (soft violet)
- #0D1B2A (midnight blue)
- #12082A (rich purple)

Animation:
- 3-4 gradient blobs moving independently
- Speed: Very slow (10-15s full cycle)
- Movement: Organic, noise-based paths
- Opacity: Each blob 40-60%
- Blend mode: Screen or Add
```

### Particle System
```
Particle Count: 60-80 particles
Particle Size: 2-6px (randomized)
Particle Opacity: 20-60% (randomized)
Particle Colors: 
- 60% white/pale (#FFFFFF, #E0E0E0)
- 25% pale purple (#C4B5FD, #A78BFA)
- 15% pale cyan (#A5F3FC, #67E8F9)

Base Movement:
- Random velocity: 0.1-0.5 px/frame
- Direction: Random, slowly changing
- Some particles loosely orbit center

Voice Reactive:
- Volume > 0.3: Particles accelerate toward center
- Volume > 0.6: Particles bounce/scatter outward
- Silence: Particles drift randomly
```

### Center Focal Glow
```
Idle State:
- Shape: Soft circle, heavily blurred edges
- Size: 120px diameter
- Blur: 40px (very fuzzy)
- Color: White/purple gradient
- Opacity: 25-35%
- Animation: Gentle pulse (scale 1.0 → 1.05 → 1.0, 4s)

Listening State:
- Size expands: 120px → 200px (300ms, ease-out)
- Opacity: 35% → 55%
- Blur reduces slightly: 40px → 30px
- Concentric ripples: Every 400ms, rings expand outward
- Inner area: Voice waveform visualization

AI Speaking State:
- Shape morphs: Circle → organic blob
- Blob vertices: 8-12 points
- Each vertex oscillates with voice frequency bands
- Size pulses: Base 150px, ±30px with volume
- Color shift: More magenta/pink (#A78BFA → #E879F9)
- Particles orbit actively
```

### Voice Waveform Visualization
```
Style: Smooth organic line, not bar graph

When listening:
- Single flowing line across center
- Height maps to voice volume
- Smoothed with bezier curves
- Color: Soft cyan (#67E8F9) at 70%
- Width: 200px
- Updates: 30fps minimum

When AI speaking:
- Similar but emanating outward as waves
- Color: Soft purple (#A78BFA)
- Multiple concentric waves
```

### React Native Implementation Skeleton
```typescript
// src/components/LivingBackground/index.tsx
import { Canvas, Shader, vec, Circle, Blur } from '@shopify/react-native-skia';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';

interface LivingBackgroundProps {
  voiceState: 'idle' | 'listening' | 'speaking' | 'ai-speaking';
  audioLevel: number; // 0-1
}

const LivingBackground: React.FC<LivingBackgroundProps> = ({
  voiceState,
  audioLevel,
}) => {
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);
  
  // Idle breathing animation
  useEffect(() => {
    if (voiceState === 'idle') {
      glowScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 2000 }),
          withTiming(1.0, { duration: 2000 })
        ),
        -1,
        true
      );
    }
  }, [voiceState]);
  
  // Voice reactive expansion
  useEffect(() => {
    if (voiceState === 'listening') {
      glowScale.value = withTiming(1.6, { duration: 300 });
      glowOpacity.value = withTiming(0.55, { duration: 300 });
    }
  }, [voiceState]);
  
  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Gradient Mesh Background */}
      <Canvas style={StyleSheet.absoluteFill}>
        <GradientMeshShader />
      </Canvas>
      
      {/* Particle Field */}
      <ParticleSystem 
        count={70} 
        audioLevel={audioLevel}
        voiceState={voiceState}
      />
      
      {/* Center Focal Glow */}
      <AnimatedFocalGlow 
        scale={glowScale}
        opacity={glowOpacity}
        voiceState={voiceState}
        audioLevel={audioLevel}
      />
      
      {/* Voice Waveform (when active) */}
      {(voiceState === 'listening' || voiceState === 'ai-speaking') && (
        <VoiceWaveform audioLevel={audioLevel} />
      )}
    </View>
  );
};
```

### Gradient Mesh Shader (Skia)
```glsl
// Simplified GLSL for flowing gradient
uniform float time;
uniform vec2 resolution;

vec3 color1 = vec3(0.04, 0.04, 0.1);   // Deep purple
vec3 color2 = vec3(0.1, 0.06, 0.19);   // Soft violet
vec3 color3 = vec3(0.05, 0.11, 0.16);  // Midnight blue

float noise(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  
  // Slow-moving noise layers
  float n1 = noise(uv * 2.0 + time * 0.05);
  float n2 = noise(uv * 3.0 - time * 0.03);
  float n3 = noise(uv * 1.5 + time * 0.04);
  
  // Blend colors based on noise
  vec3 color = mix(color1, color2, n1);
  color = mix(color, color3, n2 * 0.5);
  
  gl_FragColor = vec4(color, 1.0);
}
```

### Design Prompt for This Component
```
Design a "Living Background" component for MYPA's AI Hub.

NOT an orb. The entire screen IS the AI presence.

BACKGROUND LAYER:
- Flowing gradient mesh
- Colors: Deep purples, midnight blues, soft violets
- Moves like aurora borealis underwater
- 10-15 second animation loop
- Feels infinite, dreamy

PARTICLE LAYER:
- 60-80 small glowing dots
- Scattered across entire screen
- Drift slowly, some form loose constellations
- React to voice: scatter on loud, drift on quiet
- Colors: whites, pale purples, pale cyans

CENTER GLOW (not an orb!):
- Soft, fuzzy circle (heavy blur, no hard edge)
- 120px diameter idle, expands when listening
- Barely visible when idle (30% opacity)
- Becomes more prominent when voice active
- Voice waveform appears inside when listening

Show states:
1. Idle: Calm breathing, subtle everything
2. Listening: Glow expands, ripples, particles react
3. AI Speaking: Glow morphs into blob, pulses with voice

FEEL: You're inside a living, aware space
NOT: Looking at an app with an orb
```

---

## 6.2 Mini Orb Component (For Secondary Screens)

### Concept
The Mini Orb appears on secondary screens (Tasks, Social) as a persistent voice access point. It's a smaller version of the AI presence - a reminder that MYPA is always available.

### Dimensions
```
Size: 44 × 44px
Border Radius: 22px (full circle)
Position: Header area, opposite side from title
```

### Visual Spec
```
┌──────────────────────────────────────┐
│                                      │
│   ╭──────╮                           │
│   │  ●   │  44px Mini Orb            │
│   │ glow │                           │
│   ╰──────╯                           │
│                                      │
└──────────────────────────────────────┘

IDLE STATE:
- Background: conic-gradient(from 180deg, #7C3AED 0deg, #A78BFA 180deg, #7C3AED 360deg)
- Shadow: 0 0 16px rgba(124, 58, 237, 0.3)
- Subtle pulse animation (scale 1.0 → 1.03 → 1.0, 3s loop)

TAPPED STATE:
- Scale: 0.92
- Shadow increases: 0 0 24px rgba(124, 58, 237, 0.5)
- Haptic: Light tap

LISTENING STATE:
- Scale: 1.1
- Shadow expands: 0 0 32px rgba(124, 58, 237, 0.5)
- Inner ripple animation
- Shows voice waveform (simplified, 3 bars)
```

### Mini Orb Design Prompt
```
Design a Mini AI Orb component for MYPA app.

SIZE: 44×44px circle

GRADIENT:
- conic-gradient rotating through purples
- Start: #7C3AED (primary purple)
- Mid: #A78BFA (light purple)
- End: #7C3AED (back to primary)

GLOW:
- Box shadow: 0 0 16px rgba(124, 58, 237, 0.3)
- Subtle, not overpowering

STATES:
1. Idle: Gentle pulse animation (3s cycle, scale 1.0-1.03)
2. Tapped: Scale down to 0.92, glow increases
3. Listening: Scale up to 1.1, show 3 audio bars inside

PURPOSE: Tap to activate voice on secondary screens (Tasks, Social)
FEEL: Small but alive, consistent with main Living Background AI presence
```

---

## 6.3 Task Card Component

### Dimensions
```
Width: 100% - 40px (20px margin each side)
Min Height: 72px
Padding: 16px
Border Radius: 14px
Background: #161616
```

### Layout
```
┌────────────────────────────────────────────────────┐
│ 16px padding                                       │
│  ┌──────┐                                          │
│  │  ○   │ 12px  Task Title Here                   │
│  │ 24px │  gap  9:00 AM · Work · ~25 min          │
│  └──────┘                                          │
│ 16px padding                                       │
└────────────────────────────────────────────────────┘

Checkbox: 24px × 24px
Checkbox Border: 2px, #52525B
Checkbox Checked: Fill #22C55E, checkmark #000000

Title: body-medium (17px/500), #FFFFFF
Metadata Line: subhead (15px/400), #71717A
Category Tag: caption-1 (12px/500), #A1A1AA, background #2C2C2E, padding 4px 8px, radius 6px
Duration Estimate: caption-1, #A78BFA
```

### States
```
Default:
- Background: #161616
- No border

Pressed:
- Background: #1C1C1E
- Scale: 0.98

Completed:
- Title: strikethrough, #71717A
- Checkbox: filled green with checkmark
- Background: #161616 (same)

Overdue:
- Left border: 3px solid #EF4444
- Time text: #EF4444

AI Suggested:
- Left border: 3px solid #7C3AED
- Small "AI" badge top right
```

### Swipe Actions
```
Swipe Left Reveals (from right):
- Complete: Green (#22C55E) background, checkmark icon
- Delete: Red (#EF4444) background, trash icon
- Action width: 80px each

Swipe Right Reveals (from left):
- Defer: Orange (#EAB308) background, arrow-right icon
- Action width: 80px
```

### Task Card Design Prompt
```
Design a task card component for a dark productivity app.

SPECIFICATIONS:
- Width: Full width minus 40px margins
- Height: Auto, minimum 72px
- Background: #161616
- Border radius: 14px
- Padding: 16px all sides

LAYOUT (left to right):
1. Checkbox (24×24px):
   - Unchecked: 2px border #52525B, transparent fill
   - Checked: Solid #22C55E fill, black checkmark
   
2. Content (12px gap from checkbox):
   - Title: 17px semibold white
   - Metadata: 15px regular #71717A
   - Format: "9:00 AM · Category · ~25 min"
   - Category is a small tag with #2C2C2E background

STATES TO SHOW:
1. Default task
2. Completed (strikethrough title, green checkbox)
3. Overdue (red left border, red time)
4. AI suggested (purple left border, "AI" badge)
5. Pressed (darker background, slight scale down)

SWIPE PREVIEW:
- Show card mid-swipe revealing green "Complete" action

Background: Pure black
Style: Clean, scannable, minimal
```

---

## 6.3 Stats Card Component

### Dimensions
```
Width: Flexible, typically 25% of screen - gaps (for 4-column grid)
       Or 80px fixed width
Height: 80px
Padding: 12px
Border Radius: 14px
Background: #161616
```

### Layout
```
┌─────────────┐
│    156      │  Number: title-1 (28px/700), centered, #FFFFFF
│   tasks     │  Label: caption-1 (12px/500), centered, #71717A
└─────────────┘
```

### Variants
```
Standard:
- Background: #161616
- Number + Label

With Icon:
- Small icon (16px) top-left corner
- Icon color: brand-secondary

Highlighted:
- Background: linear-gradient(180deg, rgba(124,58,237,0.1) 0%, #161616 100%)
- Subtle purple top glow

With Trend:
- Small arrow icon next to number
- Green arrow up = positive
- Red arrow down = negative
```

### Stats Card Design Prompt
```
Design a stats card component for a productivity app.

SPECIFICATIONS:
- Size: 80px × 80px (square) or flexible width
- Background: #161616
- Border radius: 14px
- Padding: 12px

CONTENT (vertically centered):
- Number: 28px bold white, centered
- Label: 12px medium #71717A, centered, below number

VARIANTS:
1. Basic: Just number + label (e.g., "156" / "tasks")
2. With icon: 16px icon in top-left (#A78BFA tint)
3. Highlighted: Subtle purple gradient at top
4. With trend: Small up/down arrow next to number

EXAMPLE VALUES:
- "156 tasks" (with checkmark icon)
- "42h focus" (with timer icon)
- "47 days" (with flame icon, highlighted)
- "2.4k XP" (with star icon)

Background: Black
Style: Compact, glanceable, premium
```

---

## 6.4 Button Components

### Primary Button
```
Height: 56px
Padding: 16px 32px
Border Radius: 14px
Background: linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)
Shadow: 0 4px 14px rgba(124, 58, 237, 0.4)

Text: headline (17px/600), #FFFFFF, centered
Icon (optional): 20px, #FFFFFF, 8px gap from text

States:
- Default: As above
- Pressed: Scale 0.97, shadow reduced
- Disabled: Opacity 0.5, no shadow
- Loading: Spinner replaces text
```

### Secondary Button
```
Height: 56px
Padding: 16px 32px
Border Radius: 14px
Background: #1C1C1E
Border: 1px solid #3F3F46

Text: headline (17px/600), #FFFFFF

States:
- Default: As above
- Pressed: Background #2C2C2E
- Disabled: Opacity 0.5
```

### Ghost Button
```
Height: 48px
Padding: 12px 24px
Border Radius: 10px
Background: transparent

Text: headline (17px/600), #A78BFA

States:
- Default: As above
- Pressed: Background rgba(124, 58, 237, 0.1)
- Disabled: Text opacity 0.5
```

### Icon Button
```
Size: 44px × 44px
Border Radius: 22px (circle)
Background: #1C1C1E
Icon: 24px, #FFFFFF

States:
- Default: As above
- Pressed: Background #2C2C2E
- Active: Background #7C3AED, icon #FFFFFF
```

### Small Button (Tags, Actions)
```
Height: 32px
Padding: 8px 16px
Border Radius: 8px
Background: #1C1C1E

Text: caption-1 (12px/500), #A1A1AA

States:
- Default: As above
- Selected: Background #7C3AED, text #FFFFFF
```

### Button Design Prompt
```
Design a button system for a dark premium app.

PRIMARY BUTTON:
- Height: 56px
- Background: Purple gradient (#7C3AED to #9333EA)
- Text: 17px semibold white
- Border radius: 14px
- Shadow: Purple glow underneath
- Pressed: Slight scale down (0.97)

SECONDARY BUTTON:
- Height: 56px
- Background: #1C1C1E
- Border: 1px solid #3F3F46
- Text: 17px semibold white
- Pressed: Darker background

GHOST BUTTON:
- Height: 48px
- Background: Transparent
- Text: 17px semibold purple (#A78BFA)
- Pressed: Subtle purple background tint

ICON BUTTON:
- Size: 44×44px (circular)
- Background: #1C1C1E
- Icon: 24px white
- Active state: Purple background

Show all buttons in:
- Default state
- Pressed state
- Disabled state (50% opacity)

Background: Black
```

---

## 6.5 Input Field Component

### Text Input
```
Height: 56px
Padding: 16px
Border Radius: 12px
Background: #161616
Border: 1px solid #3F3F46

Text: body (17px/400), #FFFFFF
Placeholder: body (17px/400), #52525B

States:
- Default: Border #3F3F46
- Focused: Border #7C3AED, glow 0 0 0 3px rgba(124,58,237,0.2)
- Error: Border #EF4444, error message below
- Disabled: Opacity 0.5
```

### Search Input
```
Height: 48px
Padding: 12px 16px 12px 44px (extra left for icon)
Border Radius: 24px (pill shape)
Background: #1C1C1E
Border: none

Search Icon: 20px, #71717A, positioned 12px from left
Clear Button: 20px, #71717A, appears when has value
Placeholder: "Search..." in #52525B
```

### Input Field Design Prompt
```
Design input field components for a dark app.

TEXT INPUT:
- Height: 56px
- Background: #161616
- Border: 1px solid #3F3F46
- Border radius: 12px
- Padding: 16px
- Text: 17px white
- Placeholder: 17px #52525B

States:
1. Default: Gray border
2. Focused: Purple border (#7C3AED) with subtle glow
3. Error: Red border with error message below
4. With value: White text visible

SEARCH INPUT:
- Height: 48px
- Background: #1C1C1E
- Border radius: 24px (pill)
- Search icon on left (gray)
- Clear X button on right (when has text)
- Placeholder: "Search..."

Background: Black
```

---

## 6.6 Filter Tabs Component

### Dimensions
```
Container Height: 44px
Tab Padding: 12px 16px
Tab Border Radius: 22px (pill)
Tab Gap: 8px
```

### States
```
Inactive Tab:
- Background: transparent
- Text: headline (17px/600), #71717A

Active Tab:
- Background: #7C3AED
- Text: headline (17px/600), #FFFFFF

Pressed (inactive):
- Background: rgba(124, 58, 237, 0.1)
```

### Filter Tabs Design Prompt
```
Design horizontal filter tabs for a dark app.

SPECIFICATIONS:
- Container: Full width, horizontal scroll if needed
- Tab shape: Pill (fully rounded)
- Tab padding: 12px horizontal, 8px vertical
- Gap between tabs: 8px

INACTIVE TAB:
- Background: Transparent
- Text: 17px semibold #71717A

ACTIVE TAB:
- Background: #7C3AED (solid purple)
- Text: 17px semibold white

Example tabs: "Today" (active), "Tomorrow", "All", "High Priority"

Background: Black
Style: Clean, touch-friendly
```

---

## 6.7 List Item Component

### Standard List Item
```
Height: 56px
Padding: 16px horizontal
Background: transparent
Separator: 1px solid #1C1C1E, inset 16px from left

Content:
- Left Icon (optional): 24px, #A1A1AA, 12px gap to text
- Title: body (17px/400), #FFFFFF
- Right Chevron: 16px, #52525B
- Right Value (optional): subhead (15px/400), #71717A

Pressed: Background #161616
```

### List Section Header
```
Height: 32px
Padding: 16px horizontal, 8px vertical
Background: transparent

Text: caption-1 (12px/500), #71717A, uppercase, letter-spacing 1px
```

### List Item Design Prompt
```
Design list item components for a dark settings-style list.

STANDARD ITEM:
- Height: 56px
- Padding: 16px horizontal
- Background: Transparent (black shows through)

Content layout:
- Optional icon on left (24px, gray)
- Title in white (17px regular)
- Optional value text on right (15px gray)
- Chevron on far right (16px, dark gray)

Separator: Thin line (#1C1C1E), inset from left

SECTION HEADER:
- Height: 32px
- Text: 12px medium, gray, UPPERCASE
- Letter spacing: 1px

States:
- Default: Transparent background
- Pressed: Dark background (#161616)

Background: Black
```

---

## 6.8 Badge Components

### Count Badge
```
Min Width: 20px
Height: 20px
Padding: 4px 6px
Border Radius: 10px (full)
Background: #EF4444 (notifications) or #7C3AED (count)

Text: caption-2 (11px/400), #FFFFFF, centered
Position: Absolute, top-right of parent, offset -4px
```

### Status Badge
```
Height: 24px
Padding: 4px 10px
Border Radius: 12px
Background: Semantic color at 15% opacity

Text: caption-1 (12px/500), semantic color full

Examples:
- "Active": Background #22C55E26, text #22C55E
- "Due Soon": Background #EAB30826, text #EAB308
- "Overdue": Background #EF444426, text #EF4444
```

### Category Tag
```
Height: 24px
Padding: 4px 10px
Border Radius: 6px
Background: #2C2C2E

Text: caption-1 (12px/500), #A1A1AA
Icon (optional): 12px, before text, 4px gap
```

### Badge Design Prompt
```
Design badge components for a dark app.

COUNT BADGE (for notifications):
- Size: 20px minimum width, 20px height
- Background: Red (#EF4444) or Purple (#7C3AED)
- Text: 11px white, centered
- Shape: Pill/circle
- Position: Top-right corner of parent element

STATUS BADGE:
- Height: 24px
- Padding: 4px 10px
- Border radius: 12px (pill)
- Background: Semantic color at 15% opacity
- Text: 12px semibold in full semantic color

Show: "Active" (green), "Due Soon" (yellow), "Overdue" (red)

CATEGORY TAG:
- Height: 24px
- Padding: 4px 10px
- Background: #2C2C2E
- Border radius: 6px
- Text: 12px gray

Show: "Work", "Personal", "Health" with optional icons

Background: Black
```

---

## 6.9 Modal / Bottom Sheet

### Bottom Sheet
```
Border Radius: 28px (top corners only)
Background: #0D0D0D
Handle: 36px × 4px, #3F3F46, centered, 8px from top

Padding:
- Top: 24px (below handle)
- Horizontal: 20px
- Bottom: 34px + safe area

Shadow: 0 -10px 40px rgba(0, 0, 0, 0.5)
Backdrop: #000000 at 60% opacity
```

### Center Modal
```
Width: 90% of screen, max 340px
Border Radius: 24px
Background: #161616
Padding: 24px

Shadow: 0 20px 60px rgba(0, 0, 0, 0.6)
Backdrop: #000000 at 70% opacity
```

### Modal Design Prompt
```
Design modal components for a dark app.

BOTTOM SHEET:
- Slides up from bottom
- Background: #0D0D0D
- Top corners: 28px radius
- Drag handle: 36×4px gray bar, centered at top
- Padding: 24px top, 20px sides, 34px bottom (+ safe area)
- Backdrop: Black at 60% opacity

CENTER MODAL:
- Centered on screen
- Background: #161616
- Border radius: 24px
- Padding: 24px
- Max width: 340px
- Backdrop: Black at 70% opacity

Show example:
- Celebration modal with icon, title, description, button

Background: Black
```

---

## 6.10 Progress Bar

### Standard Progress Bar
```
Height: 8px
Border Radius: 4px
Background (track): #1C1C1E
Background (fill): linear-gradient(90deg, #7C3AED 0%, #A78BFA 100%)
```

### Thin Progress Bar
```
Height: 4px
Border Radius: 2px
Same colors as standard
```

### Progress Bar Design Prompt
```
Design progress bar components.

STANDARD (8px height):
- Track: #1C1C1E
- Fill: Purple gradient (#7C3AED to #A78BFA)
- Border radius: 4px

THIN (4px height):
- Same colors, smaller size

Show at: 0%, 33%, 66%, 100% fill states

Optional: Animated shimmer effect on fill
```

---

# SECTION 7: SCREEN DESIGNS (DETAILED)

## 7.1 AI Hub Screen (Living Interface)

### Concept
The AI Hub is NOT a traditional screen with components on it. The ENTIRE screen is a living, breathing entity. The user is INSIDE the AI's presence, not looking at an app.

### Layer Structure (back to front)
```
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 1: GRADIENT MESH BACKGROUND                               │
│ - Flowing gradient of deep purples, blues, violets              │
│ - Constantly moving, like aurora borealis                       │
│ - Never static                                                  │
├─────────────────────────────────────────────────────────────────┤
│ LAYER 2: PARTICLE FIELD                                         │
│ - 60-80 floating glowing particles                              │
│ - Drift slowly, react to voice                                  │
│ - Creates sense of depth and life                               │
├─────────────────────────────────────────────────────────────────┤
│ LAYER 3: CENTER FOCAL GLOW                                      │
│ - Soft, fuzzy circle (NOT hard-edged orb)                       │
│ - Expands and morphs with voice activity                        │
│ - Voice waveform appears here when active                       │
├─────────────────────────────────────────────────────────────────┤
│ LAYER 4: UI ELEMENTS (minimal, floating)                        │
│ - Greeting text                                                 │
│ - Quick action pills                                            │
│ - Ambient stats (subtle)                                        │
│ - All feel like they float in the space                         │
└─────────────────────────────────────────────────────────────────┘
```

### Exact Layout Measurements
```
┌─────────────────────────────────────┐
│ [LIVING GRADIENT MESH BACKGROUND]   │ Fills entire screen
│ Safe Area Top (59px)                │
├─────────────────────────────────────┤
│                                     │
│     [PARTICLES floating across]     │ 60-80 particles
│                                     │
│ 60px                                │
│                                     │
│     "Good morning, Alex"            │ title-1 (28px/700), #FFFFFF
│                                     │ Subtle text glow
│ 12px                                │
│                                     │
│    "What's on your mind?"           │ body (17px/400), #A1A1AA
│                                     │
│                                     │
│ 48px                                │
│                                     │
│            ╭───────╮                │
│           ╱  ░░░░   ╲               │ FOCAL GLOW: 120px
│          │  ░░░░░░░  │              │ Fuzzy edges, 30% opacity
│           ╲  ░░░░   ╱               │ Pulses gently
│            ╰───────╯                │
│                                     │
│      [Voice waveform when active]   │
│                                     │
│                                     │
│ flexible space                      │
│                                     │
│                                     │
│   ┌─────────────┐  ┌─────────────┐ │ Quick Actions: Floating pills
│   │  ▶ Focus    │  │   + Task    │ │ Semi-transparent + blur
│   └─────────────┘  └─────────────┘ │ Subtle float animation
│                                     │
│ 32px                                │
│                                     │
│      5 tasks  ·  47 day streak      │ Ambient stats: 13px, #52525B
│                                     │ Very subtle, almost whispered
│                                     │
│ 24px                                │
├─────────────────────────────────────┤
│ Safe Area Bottom (34px)             │
└─────────────────────────────────────┘
```

### Interaction Model
```
TAP ANYWHERE → Activates voice (not just center)
- Entire screen is tappable for voice
- Ripple emanates from tap point
- Focal glow expands
- Begin listening

LONG PRESS → Quick actions menu
SWIPE EDGES → Navigate to other screens (Tasks, Social, Profile)

No need to "aim" for an orb - the whole space responds to you
```

### States Visualization

**IDLE STATE**
```
- Background: Slow flowing gradient
- Particles: Gentle drift
- Focal glow: 120px, 30% opacity, slow pulse
- Quick actions: Visible, gentle float
- Feel: Calm, welcoming, waiting
```

**LISTENING STATE**
```
- Background: Slightly more saturated
- Particles: Drift toward center (subtle attraction)
- Focal glow: Expands to 200px, 55% opacity
- Concentric ripples pulse outward every 400ms
- Voice waveform appears in center
- Quick actions: Fade to 30% (reduce distraction)
- Feel: Attentive, engaged
```

**AI SPEAKING STATE**
```
- Background: Warmer tones (subtle magenta shift)
- Particles: Dance actively, orbit center
- Focal glow: Morphs into organic blob shape
- Blob size pulses with AI voice volume
- Colors shift through purple-magenta spectrum
- Response text types out above (optional)
- Feel: Alive, communicating
```

**PROCESSING STATE** (between user stop and AI start)
```
- Focal glow: Subtle rotation/shimmer
- Particles: Organize into spiral pattern briefly
- "Thinking..." text optional (very subtle)
- Duration: Usually <1 second with Realtime API
```

### Design Prompt for AI Hub
```
Design MYPA's AI Hub - a living, breathing interface where the user is INSIDE the AI.

CANVAS: iPhone 15 Pro (393 × 852px)
STYLE: Utopian, dreamy, premium, alive, personal
REFERENCE: Calm app meditation screen, Apple TV+ screensavers, northern lights, Blade Runner 2049 holograms

THIS IS NOT A NORMAL APP SCREEN - the user is stepping INTO a living space.

BACKGROUND (most important - spend time here):
- NOT solid color. Living gradient mesh with multiple layers.
- Colors flowing between: Deep purple (#0A0A1A), violet (#1A1030), midnight blue (#0D1B2A)
- Movement like aurora borealis underwater - slow, organic, mesmerizing
- Think: Standing in an infinite calm space, not looking at a screen
- Should feel dreamy, infinite, intelligent

PARTICLES (creates sense of life and depth):
- 60-80 small glowing dots scattered across entire screen
- Colors: Primarily white (#FFFFFF), some pale purple (#C4B5FD), some pale cyan (#A5F3FC)
- Sizes: 2-6px, random
- Opacities: 20-60%, random  
- Some form loose constellation-like patterns
- All drifting slowly, always moving
- Creates depth and aliveness

CENTER FOCAL POINT (NOT a hard orb - this is critical):
- Soft, fuzzy circular glow (heavy gaussian blur, 40px+)
- NO hard edges - should fade smoothly into background
- 120px diameter, only 30% opacity
- Color: White center fading to pale purple edges
- Subtle breathing pulse animation (scale 1.0 → 1.05 → 1.0, 4 seconds)
- This is where voice visualizations appear when active
- Think: Gentle invitation, not a button

GREETING (floating in the space):
- "Good evening, Khalid" - 28px bold white (SF Pro Display)
- Very subtle text glow/shadow for depth
- Position: Upper third, centered
- Below: "What's on your mind?" - 17px regular #A1A1AA
- Both should feel like they FLOAT in the environment, not sit on it

QUICK ACTIONS (floating glass pills):
- Two pill-shaped buttons, side by side
- "▶ Focus" and "+ Task"
- Background: rgba(124, 58, 237, 0.15) - very translucent purple
- Border: 1px rgba(255, 255, 255, 0.1)
- Backdrop blur: 20px (glassmorphism)
- Padding: 12px 20px
- Border radius: 24px (pill)
- Text: 15px medium white
- Gentle floating/bobbing animation (subtle, 6s cycle)
- Position: Lower third, centered, 16px gap between them

AMBIENT STATS (barely there - whispered information):
- Single line at bottom: "5 tasks · 47 day streak"
- 13px regular, color #52525B (very low contrast)
- Should almost disappear into the environment
- Not demanding attention, just ambient awareness

STATES TO DESIGN:
1. IDLE: Calm breathing, subtle everything, welcoming
2. LISTENING: Glow expands to 200px, ripples emanate, particles attracted to center
3. AI SPEAKING: Glow morphs into organic blob, pulses with voice

MOOD: You've stepped into a personal, intelligent universe that knows you
NOT: Looking at an app with an orb, corporate, clinical, standard UI
```STATES TO DESIGN:
1. IDLE: Calm, breathing, inviting
2. LISTENING: Center expands, ripples, particles attracted
3. AI SPEAKING: Center morphs to organic blob, pulses with voice

MOOD: Utopian, dreamy, personal, alive, intelligent, calm
NOT: App-like, corporate, busy, clinical, standard UI

The user should feel like they've stepped into a personal, intelligent space - not opened an app.
```

---

## 7.2 Tasks Screen

### Exact Layout Measurements
```
┌─────────────────────────────────────┐
│ Safe Area Top                       │
├─────────────────────────────────────┤
│ 20px │ Tasks                   ◉ │ 20px
│      │                              │
│ Header: title-1 left, mini orb right│
├─────────────────────────────────────┤
│ 16px                                │
│ ┌─────────────────────────────────┐ │
│ │ Today | Tomorrow | All | High  │ │ Filter tabs
│ └─────────────────────────────────┘ │
│ 24px                                │
│ MORNING                             │ Section header
│ 8px                                 │
│ ┌─────────────────────────────────┐ │
│ │ ○  Review project brief         │ │ Task card 1
│ │    9:00 AM · Work               │ │
│ └─────────────────────────────────┘ │
│ 12px                                │
│ ┌─────────────────────────────────┐ │
│ │ ○  Team standup call            │ │ Task card 2
│ │    10:00 AM · Work              │ │
│ └─────────────────────────────────┘ │
│ 24px                                │
│ AFTERNOON                           │
│ 8px                                 │
│ ┌─────────────────────────────────┐ │
│ │ ○  Gym session                  │ │ Task card 3
│ │    2:00 PM · Health  ~45 min    │ │
│ └─────────────────────────────────┘ │
│                                     │
│                              ┌───┐  │
│                              │ + │  │ FAB
│                              └───┘  │
├─────────────────────────────────────┤
│ Safe Area Bottom                    │
└─────────────────────────────────────┘
```

### Tasks Screen Design Prompt
```
Design the Tasks screen for MYPA app - exact specifications.

CANVAS: iPhone 15 Pro (393 × 852px)
BACKGROUND: #000000 (pure black, not dark gray)
ACCESS: User swiped LEFT from AI Hub to get here
STYLE: Dark mode, minimal, productivity-focused, iOS native feel
REFERENCE: Inspired by Things 3, Todoist dark mode, Apple Reminders

HEADER (below safe area, 59px):
- Height: 56px
- Padding: 20px horizontal
- Left: "Tasks" - 28px bold white (SF Pro Display)
- Right: Mini AI orb (44×44px circle)
  - Background: conic-gradient purple (#7C3AED → #A78BFA → #7C3AED)
  - Subtle purple glow: 0 0 20px rgba(124,58,237,0.3)
  - Tap to activate voice command for adding tasks

FILTER TABS (16px below header):
- Horizontal scroll container
- Padding: 0 20px
- Tabs: "Today" (active), "Tomorrow", "All", "High Priority"
- Active: #7C3AED background, white text, pill shape
- Inactive: Transparent, #71717A text
- Tab padding: 12px 16px
- Tab gap: 8px

SECTION HEADERS:
- "MORNING", "AFTERNOON", "EVENING"
- 12px medium, #71717A, uppercase
- Letter spacing: 1px
- Margin: 24px top, 8px bottom
- Padding: 0 20px

TASK CARDS:
- Width: Full width - 40px (20px margins)
- Background: #161616
- Radius: 14px
- Padding: 16px
- Gap between cards: 12px

Card content:
- Checkbox: 24×24px, 2px border #52525B, 12px gap to text
- Title: 17px medium white
- Metadata: 15px regular #71717A
- Category tag: 12px, #2C2C2E background, 6px radius
- AI estimate: 12px #A78BFA (e.g., "~45 min")

Card states:
- Show one completed (strikethrough, green checkbox)
- Show one with purple left border (AI suggested)

FAB (Floating Action Button):
- Size: 56×56px
- Position: Bottom right, 20px from edges, above safe area
- Background: Purple gradient
- Icon: Plus, 24px white
- Shadow: Purple glow

Show swipe action preview on one card (green complete action revealed)
```

---

## 7.3 Focus Screen (Modal)

### Exact Layout Measurements
```
┌─────────────────────────────────────┐
│                                     │
│          ────────                   │ Drag handle: 36×4px, #3F3F46
│                                     │
│ 48px                                │
│                                     │
│             25:00                   │ Timer: display-large (48px), SF Mono
│                                     │
│ 40px                                │
│                                     │
│            ┌───────┐                │
│            │  ORB  │                │ 120px orb (medium)
│            └───────┘                │
│                                     │
│ 32px                                │
│                                     │
│     "Stay focused, you're          │ body (17px), #A1A1AA, centered
│         doing great"               │ Max width: 280px
│                                     │
│ 24px                                │
│                                     │
│   Working on: Project Brief         │ subhead (15px), #71717A
│                                     │
│ 48px                                │
│                                     │
│   ┌──────────┐    ┌──────────┐     │
│   │  Pause   │    │   End    │     │
│   └──────────┘    └──────────┘     │
│                                     │
│ 24px                                │
│                                     │
│      18:32 elapsed · +25 XP         │ footnote (13px), #52525B
│                                     │
├─────────────────────────────────────┤
│ Safe Area Bottom                    │
└─────────────────────────────────────┘
```

### Focus Screen Design Prompt
```
Design the Focus Timer modal for MYPA app - exact specifications.

PRESENTATION: Bottom sheet, 90% screen height
BACKGROUND: #0D0D0D
TOP CORNERS: 28px radius

DRAG HANDLE:
- 36×4px, #3F3F46, centered
- 12px from top

TIMER (48px below handle):
- "25:00" format
- Font: SF Mono, 48px bold white
- Centered
- Subtle pulsing glow when active

AI ORB (40px below timer):
- 120×120px (medium size)
- Same gradient as main orb
- Gentler animation during focus
- Centered

AI MESSAGE (32px below orb):
- Encouraging text, changes every few minutes
- Examples: "Stay focused, you're doing great", "Almost there!", "Deep work mode"
- 17px regular #A1A1AA
- Centered, max width 280px

TASK LABEL (24px below message):
- "Working on: [Task Name]"
- Or "General focus session" if no task
- 15px regular #71717A
- Centered

CONTROL BUTTONS (48px below task):
- Two buttons side by side, 16px gap
- Width: 140px each
- "Pause": Secondary style (dark bg, border)
- "End Session": Ghost style (outline, no fill)
- Centered as group

SESSION STATS (24px below buttons):
- "18:32 elapsed · +25 XP"
- 13px regular #52525B
- Centered

BACKDROP: Black at 60% opacity over previous screen
```

---

## 7.4 Social View (Swipe Right from AI Hub)

### Concept
Social View shows your circles, active challenges, and friend activity. Access by swiping RIGHT from AI Hub. Mini orb in corner for voice commands.

### Exact Layout Measurements
```
┌─────────────────────────────────────┐
│ Safe Area Top                       │
├─────────────────────────────────────┤
│ ◉ │ Social                        → │
│ mini orb                  swipe hint│
│ Header: Mini orb left, title right  │
├─────────────────────────────────────┤
│ 16px                                │
│ ┌─────────────────────────────────┐ │
│ │ 🤖 AI SUMMARY                   │ │ AI insight card
│ │ "Work circle is crushing it.   │ │ 
│ │  Sarah's on a 12-day streak!"  │ │
│ └─────────────────────────────────┘ │
│ 24px                                │
│ ACTIVE CHALLENGES                   │ Section header
│ 8px                                 │
│ ┌─────────────────────────────────┐ │
│ │ 🏃 7-Day Workout      2nd/5    │ │ Challenge card
│ │ ████████░░ 3 days left         │ │ Progress bar
│ │ Sarah leads · You: 4 workouts  │ │
│ └─────────────────────────────────┘ │
│ 12px                                │
│ ┌─────────────────────────────────┐ │
│ │ 📚 Reading Challenge   1st/3   │ │ Challenge card 2
│ │ ██████████ Complete! 🏆        │ │ Winner badge
│ └─────────────────────────────────┘ │
│ 24px                                │
│ YOUR CIRCLES                        │ Section header
│ 8px                                 │
│ ┌─────────────────────────────────┐ │
│ │ 💼 Work Circle        5 members │ │ Circle card
│ │ 👤👤👤 3 online · Active today  │ │
│ └─────────────────────────────────┘ │
│ 12px                                │
│ ┌─────────────────────────────────┐ │
│ │ 👨‍👩‍👧 Family           3 members │ │ Circle card
│ │ 👤 1 online · Quiet this week  │ │
│ └─────────────────────────────────┘ │
│ 24px                                │
│ RECENT ACTIVITY                     │ Section header
│ 8px                                 │
│   Sarah completed "Q4 Report" · 5m  │ Activity item
│   Mike started focus mode · 12m     │ Activity item
│   You overtook Alex! · 1h           │ Activity item
│                                     │
│                              ┌───┐  │
│                              │ + │  │ FAB: Create/Join
│                              └───┘  │
├─────────────────────────────────────┤
│ Safe Area Bottom                    │
└─────────────────────────────────────┘
```

### Social View Design Prompt
```
Design the Social View screen for MYPA app - exact specifications.

CANVAS: iPhone 15 Pro (393 × 852px)
BACKGROUND: #000000
ACCESS: User swiped RIGHT from AI Hub to get here
STYLE: Dark mode, premium, minimal, iOS native feel

HEADER (below safe area, 59px):
- Height: 56px
- Padding: 20px horizontal
- Left: Mini AI orb (44×44px circle)
  - Background: conic-gradient purple (#7C3AED → #A78BFA → #7C3AED)
  - Subtle glow shadow
  - Tap to activate voice
- Center-Right: "Social" - 28px bold white
- Far left edge: Subtle "←" chevron (swipe left to go back to Hub)

AI SUMMARY CARD (16px below header):
- Full width - 40px margins
- Background: linear-gradient(135deg, rgba(124,58,237,0.15) 0%, #161616 100%)
- Border: 1px solid rgba(124,58,237,0.3)
- Radius: 14px
- Padding: 16px
- Small sparkle icon (16px) + "AI Summary" label (12px #A78BFA)
- Summary text: 15px #A1A1AA
- Example: "Work circle is crushing it. Sarah's on a 12-day streak!"

SECTION HEADERS:
- "ACTIVE CHALLENGES", "YOUR CIRCLES", "RECENT ACTIVITY"
- 12px medium #71717A, uppercase
- Letter spacing: 1px
- Margin: 24px top, 8px bottom

CHALLENGE CARDS:
- Width: Full - 40px
- Background: #161616
- Radius: 14px
- Padding: 16px
- Gap: 12px

Challenge card content:
- Row 1: Emoji + Challenge name (17px medium white) + Position badge (e.g., "2nd/5")
- Row 2: Progress bar (8px height, purple gradient fill)
- Row 3: Leader info + your progress (13px #71717A)
- Winner state: Gold border, trophy emoji, "Complete!" badge

CIRCLE CARDS:
- Similar to challenge cards
- Content:
  - Row 1: Emoji + Circle name (17px medium) + Member count (13px #71717A)
  - Row 2: Avatar stack (3 small circles, 24px each, overlapping) + online count + activity hint

ACTIVITY FEED:
- No cards, just list items
- Each item: Text (15px #A1A1AA) + timestamp (13px #52525B)
- Subtle separator line between items

FAB:
- Size: 56×56px
- Bottom right, 20px margins
- Purple gradient
- Icon: Plus (for create circle/challenge)
- Shadow: Purple glow

INTERACTION: Swipe left to return to AI Hub (screen slides right to reveal Hub)
```

---

## 7.5 Profile View (Swipe Down from AI Hub)

### Concept
Profile View shows your stats, level, streaks, AI insights, and unlocked features. Access by swiping DOWN from AI Hub.

### Exact Layout Measurements
```
┌─────────────────────────────────────┐
│ Safe Area Top                       │
├─────────────────────────────────────┤
│                                     │
│             ┌──────┐                │
│             │ 👤   │                │ Avatar: 80×80px circle
│             └──────┘                │ Or user's photo
│                                     │
│              @khalid                │ Username: 17px medium white
│                                     │
│        Level 12 · 47-day streak 🔥  │ 15px #A78BFA (level) + #71717A
│                                     │
├─────────────────────────────────────┤
│ 24px                                │
│ ┌─────────────────────────────────┐ │
│ │ 🤖 AI INSIGHT                   │ │ AI insight card
│ │                                 │ │
│ │ "You're most productive 9-11am │ │
│ │  with an 85% completion rate.  │ │
│ │  Focus sessions up 20% vs      │ │
│ │  last week. Keep it up!"       │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│ 24px                                │
│ ┌────────┐ ┌────────┐ ┌────────┐   │
│ │  4,230 │ │   156  │ │  42h   │   │ Stats grid
│ │   XP   │ │ tasks  │ │ focus  │   │
│ └────────┘ └────────┘ └────────┘   │
│ 24px                                │
│ UNLOCKED ABILITIES                  │ Section header
│ 8px                                 │
│ ┌────────┐ ┌────────┐ ┌────────┐   │
│ │ ⏰     │ │ 📊     │ │ 🔮     │   │ Ability cards
│ │ Peak   │ │Priority│ │Predict │   │
│ │ Hours  │ │ Sort   │ │ 🔒     │   │ Last one locked
│ └────────┘ └────────┘ └────────┘   │
│ 12px                                │
│ ┌────────┐ ┌────────┐ ┌────────┐   │
│ │ 😰     │ │ ⏱️     │ │ 🧠     │   │ More abilities
│ │Overwhelm│ │Duration│ │ Deep   │   │
│ │  🔒    │ │  🔒    │ │ 🔒     │   │ All locked
│ └────────┘ └────────┘ └────────┘   │
│                                     │
│ 24px                                │
│ ┌─────────────────────────────────┐ │
│ │ ⚙️  Settings                  → │ │ Settings row
│ ├─────────────────────────────────┤ │
│ │ ❓  Help & Support            → │ │ Help row
│ ├─────────────────────────────────┤ │
│ │ 🚪  Sign Out                    │ │ Sign out row
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│ Safe Area Bottom                    │
└─────────────────────────────────────┘
```

### Profile View Design Prompt
```
Design the Profile View screen for MYPA app - exact specifications.

CANVAS: iPhone 15 Pro (393 × 852px)
BACKGROUND: #000000
ACCESS: User swiped DOWN from AI Hub to get here
STYLE: Dark mode, premium, achievement-focused, iOS native feel
REFERENCE: Inspired by Strava profile, Duolingo achievements, Whoop stats

PROFILE HEADER (centered, below safe area):
- Avatar: 80×80px circle
  - Default: Gradient background with user initial
  - Or: User's photo with 2px purple border
- Username: "@khalid" - 17px medium white, 8px below avatar
- Level badge: "Level 12 · 47-day streak 🔥"
  - "Level 12" in #A78BFA
  - Rest in #71717A
  - 4px below username

AI INSIGHT CARD (24px below header):
- Full width - 40px margins
- Background: linear-gradient(135deg, rgba(124,58,237,0.15) 0%, #161616 100%)
- Border: 1px solid rgba(124,58,237,0.3)
- Radius: 14px
- Padding: 16px
- Header: Sparkle icon + "AI Insight" (12px #A78BFA)
- Content: Multi-line text (15px #A1A1AA)
- AI speaks in first person, personalized insights

STATS ROW (24px below insight):
- 3 stats cards in a row
- Each card: ~100px wide, auto height
- Background: #161616
- Radius: 14px
- Padding: 12px
- Number: 22px bold white, centered
- Label: 12px #71717A, centered below

Stats to show:
- "4,230 XP" (with star icon tint)
- "156 tasks" (with checkmark icon tint)
- "42h focus" (with timer icon tint)

UNLOCKED ABILITIES SECTION (24px below stats):
- Section header: "UNLOCKED ABILITIES" - 12px #71717A, uppercase
- Grid: 3 columns, 2 rows
- Card size: ~100px × 80px
- Background: #161616 (unlocked) or #0D0D0D (locked)
- Radius: 14px
- Icon: 24px, centered
- Label: 12px, centered below icon

Unlocked abilities (colored icons):
- "Peak Hours" ⏰
- "Priority Sort" 📊

Locked abilities (grayed + lock overlay):
- "Predict" 🔮🔒
- "Overwhelm" 😰🔒
- "Duration" ⏱️🔒
- "Deep Patterns" 🧠🔒

Tap locked → Shows unlock requirements modal

SETTINGS LIST (24px below abilities):
- Full width - 40px margins
- Background: #161616
- Radius: 14px
- Each row: 56px height, 16px padding
- Icon (20px) + Label (17px white) + Chevron right
- Divider: 1px #2C2C2E, inset 52px from left

Rows:
- "Settings" ⚙️
- "Help & Support" ❓
- "Sign Out" 🚪 (text in #EF4444, no chevron)

INTERACTION: Swipe up to return to AI Hub
```

---

## 7.6 Circle Home (Tap Circle Card)

### Concept
Detailed view of a single circle. Shows members, leaderboard, activity feed, and active challenges within the circle.

### Exact Layout Measurements
```
┌─────────────────────────────────────┐
│ Safe Area Top                       │
├─────────────────────────────────────┤
│ ← │     Work Circle          ⚙️ │  │
│ back      title             settings│
├─────────────────────────────────────┤
│                                     │
│   👤 👤 👤 👤 👤                    │ Member avatars (32px each)
│     5 members · 3 online            │ 13px #71717A
│                                     │
│ 24px                                │
│ THIS WEEK'S LEADERBOARD             │
│ 8px                                 │
│ ┌─────────────────────────────────┐ │
│ │ 🥇 Sarah         1,240 XP  +180│ │ #1 - gold accent
│ ├─────────────────────────────────┤ │
│ │ 🥈 You           1,120 XP  +95 │ │ #2 - silver accent, highlighted
│ ├─────────────────────────────────┤ │
│ │ 🥉 Mike            980 XP  +45 │ │ #3 - bronze accent
│ ├─────────────────────────────────┤ │
│ │ 4. Alex            820 XP  +30 │ │ Regular rows
│ ├─────────────────────────────────┤ │
│ │ 5. Emma            750 XP  +20 │ │
│ └─────────────────────────────────┘ │
│ 24px                                │
│ CIRCLE CHALLENGES                   │
│ 8px                                 │
│ ┌─────────────────────────────────┐ │
│ │ 🏃 7-Day Workout      2nd/5    │ │
│ │ ████████░░ 3 days left         │ │
│ └─────────────────────────────────┘ │
│ 24px                                │
│ ACTIVITY                            │
│ 8px                                 │
│   Sarah finished "Q4 Report" · 5m   │
│   Mike started a focus session · 12m│
│   You completed 3 tasks · 1h        │
│   Alex joined the circle · 2d       │
│                                     │
│           ┌─────────────────┐       │
│           │  Start Challenge │       │ Secondary button
│           └─────────────────┘       │
│                                     │
├─────────────────────────────────────┤
│ Safe Area Bottom                    │
└─────────────────────────────────────┘
```

### Circle Home Design Prompt
```
Design the Circle Home screen for MYPA app - exact specifications.

CANVAS: iPhone 15 Pro (393 × 852px)
BACKGROUND: #000000 (pure black)
ACCESS: Tap a circle card from Social View
STYLE: Dark mode, social/competitive, achievement-focused
REFERENCE: Strava clubs, Peloton leaderboards, Discord server view

HEADER:
- Height: 56px
- Left: Back chevron "<" (24px white, tap to return to Social)
- Center: Circle name "Work Circle" (20px semibold white)
- Right: Settings gear (24px, #A1A1AA, tap for circle settings)

MEMBER ROW (16px below header):
- Horizontal avatar stack, centered
- 5 avatars × 32px each, -8px overlap
- Online indicator: 8px green dot on avatar border
- Below: "5 members · 3 online" (13px #71717A)

LEADERBOARD SECTION (24px below members):
- Section header: "THIS WEEK'S LEADERBOARD"
- Card with list inside
- Background: #161616
- Radius: 14px
- Each row: 56px height

Row content:
- Position: Medal emoji (🥇🥈🥉) or number
- Avatar: 32px circle
- Name: 17px medium white
- XP: 17px #A78BFA, right aligned
- Weekly change: 13px #22C55E (green if positive)

Your row highlighted:
- Background: rgba(124,58,237,0.1)
- Left border: 3px #7C3AED

CIRCLE CHALLENGES (24px below leaderboard):
- Same card style as Social View challenges
- Only shows challenges within this circle

ACTIVITY FEED (24px below challenges):
- No card wrapper, just list
- Each item: Avatar (24px) + Text (15px #A1A1AA) + Time (13px #52525B)
- Subtle divider between items

BOTTOM ACTION (24px above safe area):
- "Start Challenge" - Secondary button style
- Centered
- Opens challenge creation flow
```

---

## 7.7 Settings Screen

### Concept
Full settings and preferences. Accessed from Profile View. Clean, organized by category.

### Exact Layout Measurements
```
┌─────────────────────────────────────┐
│ Safe Area Top                       │
├─────────────────────────────────────┤
│ ← │        Settings                 │
│ back                                │
├─────────────────────────────────────┤
│ 24px                                │
│ ACCOUNT                             │ Section header
│ 8px                                 │
│ ┌─────────────────────────────────┐ │
│ │ 👤  Edit Profile              → │ │
│ ├─────────────────────────────────┤ │
│ │ 🔔  Notifications             → │ │
│ ├─────────────────────────────────┤ │
│ │ 🔒  Privacy                   → │ │
│ └─────────────────────────────────┘ │
│ 24px                                │
│ AI & VOICE                          │
│ 8px                                 │
│ ┌─────────────────────────────────┐ │
│ │ 🎙️  Voice Settings            → │ │
│ ├─────────────────────────────────┤ │
│ │ 🤖  AI Personality            → │ │
│ ├─────────────────────────────────┤ │
│ │ 📊  AI Data & Learning        → │ │
│ └─────────────────────────────────┘ │
│ 24px                                │
│ APP                                 │
│ 8px                                 │
│ ┌─────────────────────────────────┐ │
│ │ 🎨  Appearance                → │ │
│ ├─────────────────────────────────┤ │
│ │ ⏰  Focus Timer               → │ │
│ ├─────────────────────────────────┤ │
│ │ 🔗  Integrations              → │ │
│ └─────────────────────────────────┘ │
│ 24px                                │
│ SUBSCRIPTION                        │
│ 8px                                 │
│ ┌─────────────────────────────────┐ │
│ │ ⭐  MYPA Pro           Active  │ │ Status badge
│ │     Manage subscription       → │ │
│ └─────────────────────────────────┘ │
│ 24px                                │
│ SUPPORT                             │
│ 8px                                 │
│ ┌─────────────────────────────────┐ │
│ │ ❓  Help Center               → │ │
│ ├─────────────────────────────────┤ │
│ │ 💬  Contact Support           → │ │
│ ├─────────────────────────────────┤ │
│ │ ⭐  Rate MYPA                 → │ │
│ └─────────────────────────────────┘ │
│                                     │
│         Version 1.0.0 (42)          │ 13px #52525B, centered
│                                     │
├─────────────────────────────────────┤
│ Safe Area Bottom                    │
└─────────────────────────────────────┘
```

### Settings Screen Design Prompt
```
Design the Settings screen for MYPA app - exact specifications.

CANVAS: iPhone 15 Pro (393 × 852px)
BACKGROUND: #000000 (pure black)
ACCESS: Tap Settings from Profile View
STYLE: Dark mode, clean, iOS Settings inspired but premium
REFERENCE: iOS Settings app structure, Spotify settings, premium app feel

HEADER:
- Height: 56px
- Left: Back chevron "<" (24px, white, tap to go back)
- Center: "Settings" (20px semibold white, SF Pro Display)

SECTION GROUPS:
Each group has:
- Section header: 12px #71717A, uppercase, letter-spacing 1px
- Margin: 24px top, 8px bottom
- Card containing rows

SETTINGS CARDS:
- Full width - 40px margins
- Background: #161616
- Radius: 14px

SETTINGS ROWS:
- Height: 56px
- Padding: 16px horizontal
- Icon: 20px, left side (colored or #A1A1AA)
- Label: 17px white
- Value/Chevron: Right side
- Divider: 1px #2C2C2E between rows (inset 52px)

Row types:
1. Navigation: Label + chevron right
2. Toggle: Label + iOS-style toggle
3. Value: Label + value text (#71717A) + chevron
4. Status: Label + status badge (green "Active", gray "Free")

SECTION GROUPS:

ACCOUNT:
- Edit Profile (user icon)
- Notifications (bell icon)
- Privacy (lock icon)

AI & VOICE:
- Voice Settings (mic icon)
- AI Personality (robot icon)
- AI Data & Learning (chart icon)

APP:
- Appearance (palette icon)
- Focus Timer (clock icon)
- Integrations (link icon)

SUBSCRIPTION:
- Special card with status
- "MYPA Pro" with "Active" green badge
- "Manage subscription" sub-label

SUPPORT:
- Help Center (question icon)
- Contact Support (chat icon)
- Rate MYPA (star icon)

VERSION (24px below last section):
- "Version 1.0.0 (42)"
- 13px #52525B
- Centered
```

---

## 7.8 Gesture Navigation Hints

### Concept
Subtle visual hints showing users the available swipe directions. Shown on first launch and can be re-enabled in settings.

### Overlay Design (First Launch)
```
┌─────────────────────────────────────┐
│                                     │
│              ↑ Swipe up             │ Arrow points UP (swipe gesture)
│              Profile                │ Label (destination)
│                                     │
│                                     │
│    → Swipe                Swipe ←   │ Arrows show gesture direction
│  Tasks        ┌───────┐    Social   │ Labels show destination
│               │  AI   │             │
│               │  Hub  │             │
│               └───────┘             │
│                                     │
│             ↓ Swipe down            │ Arrow points DOWN
│               Focus                 │
│                                     │
│                                     │
│     Tap anywhere to talk to MYPA    │ Center hint
│                                     │
│         ┌───────────────────┐       │
│         │     Got it!       │       │
│         └───────────────────┘       │
│                                     │
└─────────────────────────────────────┘
```

### Edge Hints (Always Visible - Subtle)
```
┌─────────────────────────────────────┐
│                 ▼                   │ Top edge: 4px line, centered
│                                     │ Shows: Profile available
│                                     │
│                                     │
│ ◂                               ▸   │ Side edges: 4px lines
│                                     │ Left: Tasks, Right: Social
│                                     │
│                                     │
│                                     │
│                 ▲                   │ Bottom edge: 4px line
│                                     │ Shows: Focus available
└─────────────────────────────────────┘

Edge hint specs:
- Size: 40px wide × 4px tall (horizontal) or 4px × 40px (vertical)
- Color: #FFFFFF at 10% opacity (very subtle)
- Position: Centered on each edge
- Animation: Gentle pulse on first 3 app opens
- Disappears when user has swiped in that direction once
```

### Gesture Hints Design Prompt
```
Design gesture navigation hints for MYPA app - two variants.

VARIANT 1: FIRST LAUNCH OVERLAY

CANVAS: iPhone 15 Pro (393 × 852px)
BACKGROUND: Black at 80% opacity over AI Hub

CENTER: Semi-transparent representation of AI Hub

ARROWS: 4 directional arrows pointing outward from center
- Style: Simple line arrows, 32px
- Color: White at 70%
- Position: Pointing toward each edge

LABELS (show gesture direction + destination):
- Top: "↑ Swipe up" with "Profile" below (swipe UP to see profile)
- Bottom: "↓ Swipe down" with "Focus" below (swipe DOWN to start focus)  
- Left: "→" with "Tasks" (swipe RIGHT to see tasks)
- Right: "←" with "Social" (swipe LEFT to see social)
- Gesture arrows: 24px, white at 80%
- Destination labels: 15px medium white

CENTER LABEL:
- "Tap anywhere to talk to MYPA"
- 17px regular #A1A1AA
- Centered

DISMISS BUTTON:
- "Got it!" - Secondary button style
- Centered, bottom third
- Dismisses overlay permanently

Animation:
- Arrows gently pulse/breathe
- Labels fade in sequentially (300ms each)


VARIANT 2: SUBTLE EDGE HINTS (Always visible)

Show on AI Hub edges only (not on other screens):
- 4 small bars indicating swipe availability
- Top center: 40×4px horizontal bar
- Bottom center: 40×4px horizontal bar  
- Left center: 4×40px vertical bar
- Right center: 4×40px vertical bar

Style:
- Color: #FFFFFF at 8% opacity (barely visible)
- Border radius: 2px
- Position: 8px from screen edge

Behavior:
- Pulse gently on first 3 app opens after install
- After user swipes a direction once, that hint fades away
- Can be re-enabled in Settings > Appearance
```

---

## 7.9 Unlock Celebration Modal

### Exact Layout
```
┌─────────────────────────────────────┐
│                                     │
│           ✨ 🎊 ✨                   │ Confetti animation
│                                     │
│            ┌─────┐                  │
│            │  ⚡  │                 │ Icon: 48px, in 80px circle
│            └─────┘                  │ Circle: #7C3AED20 bg, purple glow
│                                     │
│        New AI Ability!              │ title-2 (22px), white
│                                     │
│        Peak Hours                   │ title-3 (20px), #A78BFA
│          Detection                  │
│                                     │
│   "I now know when you're most     │ body (17px), #A1A1AA
│    productive. I'll suggest your   │ Max width: 280px, centered
│    important tasks during your     │
│    peak focus hours."              │
│                                     │
│         ┌────────────────┐         │
│         │    Awesome!    │         │ Primary button, full width - 48px
│         └────────────────┘         │
│                                     │
└─────────────────────────────────────┘
```

### Unlock Celebration Design Prompt
```
Design the Unlock Celebration modal for MYPA - exact specifications.

MODAL TYPE: Center modal
SIZE: 320px wide, auto height
BACKGROUND: #161616
RADIUS: 24px
PADDING: 32px

CONFETTI:
- Particle animation at top
- Colors: #7C3AED, #A78BFA, #EAB308, #FFFFFF
- 50-80 particles falling
- Duration: 3 seconds

ICON CONTAINER:
- 80×80px circle
- Background: #7C3AED at 20%
- Icon: 48px, white (use bolt/lightning for this unlock)
- Subtle purple glow around circle
- Centered

TITLE (16px below icon):
- "New AI Ability!"
- 22px semibold white
- Centered

FEATURE NAME (8px below title):
- "Peak Hours Detection"
- 20px semibold #A78BFA
- Centered

DESCRIPTION (16px below name):
- AI explanation in first person
- 17px regular #A1A1AA
- Max width: 280px
- Centered, multi-line

BUTTON (24px below description):
- "Awesome!"
- Primary style (purple gradient)
- Full width minus 48px padding
- Height: 56px

BACKDROP: Black at 70%

Animation sequence:
1. Modal scales up from 0.8 to 1.0 (200ms)
2. Confetti starts
3. Icon pulses once
4. Text fades in sequentially (100ms each)
```

---

## 7.10 Welcome & Onboarding Screens

### Concept
First-time user experience. Introduces MYPA's unique voice-first, gesture-based interaction. Should feel magical and premium.

### 7.10.1 Welcome Screen (App First Launch)

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│     [Living gradient background     │
│      with floating particles]       │
│                                     │
│                                     │
│            ╭───────╮                │
│           ╱  MYPA   ╲               │ Logo: 120px
│          │   logo    │              │ Soft glow
│           ╲         ╱               │
│            ╰───────╯                │
│                                     │
│              MYPA                   │ 34px bold white
│                                     │
│     Your AI productivity partner    │ 17px #A1A1AA
│                                     │
│                                     │
│                                     │
│      ┌────────────────────────┐     │
│      │    Continue with Apple │     │ Apple Sign In button
│      └────────────────────────┘     │
│                                     │
│      ┌────────────────────────┐     │
│      │   Continue with Email  │     │ Secondary button
│      └────────────────────────┘     │
│                                     │
│  By continuing, you agree to our    │ 13px #52525B
│  Terms of Service & Privacy Policy  │ Links underlined
│                                     │
└─────────────────────────────────────┘
```

### Welcome Screen Design Prompt
```
Design the Welcome screen for MYPA app - first thing users see.

CANVAS: iPhone 15 Pro (393 × 852px)
STYLE: Premium, magical, inviting, dark mode
REFERENCE: Calm app welcome, Headspace onboarding, Apple TV+ style

BACKGROUND:
- Living gradient mesh (same as AI Hub)
- Deep purples #0A0A1A, violets #1A1030, blues #0D1B2A
- Slow flowing animation
- 30-40 floating particles (white, pale purple)

LOGO (center, upper-middle):
- MYPA logo or stylized "M" mark
- 120×120px
- Purple gradient with subtle glow
- Soft breathing animation

APP NAME (below logo, 24px):
- "MYPA" - 34px bold white, letter-spacing -1px
- Subtle text glow

TAGLINE (below name, 8px):
- "Your AI productivity partner"
- 17px regular #A1A1AA

BUTTONS (bottom third, 20px margins):

Apple Sign In:
- Full width - 40px
- Height: 56px
- Background: #FFFFFF
- Text: "Continue with Apple" - 17px semibold black
- Apple logo left of text
- Radius: 14px

Email Button (12px below):
- Full width - 40px
- Height: 56px
- Background: transparent
- Border: 1px #3F3F46
- Text: "Continue with Email" - 17px semibold white
- Radius: 14px

LEGAL TEXT (24px below buttons):
- "By continuing, you agree to our Terms of Service & Privacy Policy"
- 13px #52525B
- "Terms of Service" and "Privacy Policy" as tappable links
- Centered

FEEL: You're being welcomed into something special, not just signing up for an app
```

### 7.10.2 Onboarding Flow (3 Screens)

**Screen 1: Voice First**
```
┌─────────────────────────────────────┐
│                                     │
│  [Animated voice wave visual]       │
│                                     │
│           🎙️                        │ Large icon or animation
│                                     │
│       Talk, don't tap               │ 28px bold white
│                                     │
│   MYPA listens naturally. Just      │ 17px #A1A1AA
│   say what's on your mind and      │ Max width 300px
│   I'll handle the rest.            │ Centered
│                                     │
│                                     │
│         ●  ○  ○                     │ Page dots
│                                     │
│      ┌────────────────────┐         │
│      │       Next         │         │ Primary button
│      └────────────────────┘         │
│                                     │
│            Skip                     │ Ghost text link
│                                     │
└─────────────────────────────────────┘
```

**Screen 2: Gesture Navigation**
```
┌─────────────────────────────────────┐
│                                     │
│  [Animated gesture diagram]         │
│                                     │
│        ← Tasks  AI  Social →        │ Visual showing swipes
│               ↕                     │
│                                     │
│      Swipe to navigate              │ 28px bold white
│                                     │
│   No buttons needed. Swipe in       │ 17px #A1A1AA
│   any direction to explore your    │
│   tasks, social, and profile.      │
│                                     │
│                                     │
│         ○  ●  ○                     │ Page dots
│                                     │
│      ┌────────────────────┐         │
│      │       Next         │         │
│      └────────────────────┘         │
│                                     │
│            Skip                     │
│                                     │
└─────────────────────────────────────┘
```

**Screen 3: AI Learns You**
```
┌─────────────────────────────────────┐
│                                     │
│  [Animated brain/learning visual]   │
│                                     │
│           🧠✨                       │
│                                     │
│       I learn and grow              │ 28px bold white
│                                     │
│   The more you use MYPA, the        │ 17px #A1A1AA
│   smarter I become. New abilities   │
│   unlock as I understand you.       │
│                                     │
│                                     │
│         ○  ○  ●                     │ Page dots
│                                     │
│      ┌────────────────────┐         │
│      │    Let's Begin     │         │ Primary button
│      └────────────────────┘         │
│                                     │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

### Onboarding Design Prompt
```
Design a 3-screen onboarding flow for MYPA app.

CANVAS: iPhone 15 Pro (393 × 852px) × 3 screens
STYLE: Premium, educational, exciting
BACKGROUND: Living gradient (consistent with app)

LAYOUT (same for all 3):
- Illustration/animation area: Top 40% of screen
- Title: 28px bold white, centered
- Description: 17px #A1A1AA, centered, max 300px width
- Page dots: 3 dots, 8px each, 12px gap, active = white, inactive = #3F3F46
- Primary button: Purple gradient, full width - 80px, 56px height
- Skip link: 15px #71717A (not on last screen)

SCREEN 1 - VOICE FIRST:
- Illustration: Animated sound wave or voice ripples
- Icon: Microphone with glow
- Title: "Talk, don't tap"
- Text: "MYPA listens naturally. Just say what's on your mind and I'll handle the rest."

SCREEN 2 - GESTURE NAVIGATION:
- Illustration: Diagram showing AI Hub in center with arrows pointing in 4 directions
- Labels on arrows: Tasks (left), Social (right), Focus (down), Profile (up)
- Title: "Swipe to navigate"
- Text: "No buttons needed. Swipe in any direction to explore your tasks, social, and profile."

SCREEN 3 - AI LEARNS:
- Illustration: Brain or neural network with sparkles, or unlock icons
- Title: "I learn and grow"
- Text: "The more you use MYPA, the smarter I become. New abilities unlock as I understand you."
- Button changes to: "Let's Begin" (no skip link)

TRANSITIONS: Swipe or button to advance, smooth crossfade
```

---

## 7.11 Add Task Modal

### Concept
Quick task creation modal. Can be triggered by voice ("Add task..."), tapping FAB on Tasks screen, or Quick Action pill on AI Hub.

### Exact Layout
```
┌─────────────────────────────────────┐
│                                     │
│          ────────                   │ Drag handle
│                                     │
│    Add Task                    ✕    │ Title + close button
│                                     │
│  ┌─────────────────────────────┐    │
│  │ What needs to be done?      │    │ Text input
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌───────┐ ┌───────┐ ┌───────┐     │
│  │📅 Today│ │⏰ Time │ │🏷 Tag  │     │ Quick option pills
│  └───────┘ └───────┘ └───────┘     │
│                                     │
│  AI Suggestion:                     │ 12px #A78BFA
│  "Schedule for 9am? That's your    │ 15px #A1A1AA
│   peak productivity time."         │
│                                     │
│      ┌────────────────────┐         │
│      │     Add Task       │         │ Primary button
│      └────────────────────┘         │
│                                     │
└─────────────────────────────────────┘
```

### Add Task Modal Design Prompt
```
Design the Add Task modal for MYPA app.

CANVAS: iPhone 15 Pro (393 × 852px)
PRESENTATION: Bottom sheet, 50% screen height (expandable)
BACKGROUND: #0D0D0D
RADIUS: 28px (top corners)

DRAG HANDLE:
- 36×4px, #3F3F46, centered, 12px from top

HEADER (16px below handle):
- Left: "Add Task" - 20px semibold white
- Right: Close "✕" button - 24px, #71717A

TEXT INPUT (24px below header):
- Full width - 40px margins
- Background: #161616
- Border: 1px #2C2C2E (focused: 1px #7C3AED)
- Radius: 14px
- Padding: 16px
- Placeholder: "What needs to be done?" - 17px #52525B
- Input text: 17px white
- Min height: 56px (auto-expand for multi-line)

QUICK OPTIONS (16px below input):
- Horizontal scroll row of pills
- Each pill: 
  - Background: #1C1C1E
  - Border: 1px #2C2C2E
  - Radius: 20px
  - Padding: 8px 16px
  - Icon (16px) + Label (15px white)
- Options: "📅 Today", "📅 Tomorrow", "⏰ Set Time", "🏷 Add Tag", "⚡ Priority"
- Gap: 8px

AI SUGGESTION (16px below options):
- Only shows when AI has a suggestion
- Label: "AI Suggestion:" - 12px #A78BFA
- Text: Suggestion content - 15px #A1A1AA
- Tappable to accept

ADD BUTTON (24px below suggestion):
- Full width - 40px margins
- Height: 56px
- Purple gradient background
- "Add Task" - 17px semibold white
- Disabled state: 50% opacity when input empty

KEYBOARD: When input focused, sheet expands and sticks above keyboard
```

---

# SECTION 8: ICONOGRAPHY

## 8.1 SF Symbols Mapping

### Navigation Icons
```
Tasks view:      checklist (filled when active)
Social view:     person.2.fill
Profile view:    person.circle.fill
Focus view:      timer
AI Home:         sparkles
```

### Action Icons
```
Add/Create:      plus
Complete:        checkmark
Delete:          trash
Edit:            pencil
Share:           square.and.arrow.up
Close:           xmark
Back:            chevron.left
Forward:         chevron.right
More:            ellipsis
Settings:        gearshape.fill
```

### Status Icons
```
Streak/Fire:     flame.fill
XP/Star:         star.fill
Trophy:          trophy.fill
Lock:            lock.fill
Unlock:          lock.open.fill
Clock:           clock.fill
Calendar:        calendar
Notification:    bell.fill
```

### Voice Icons
```
Microphone:      mic.fill
Listening:       waveform
Speaker:         speaker.wave.2.fill
Mute:            speaker.slash.fill
```

## 8.2 Icon Sizes

```
Navigation bar:   24px, 2px stroke
In buttons:       20px
In list items:    24px
Tab bar:          28px
Feature icons:    32px
Hero icons:       48px
```

## 8.3 Icon Colors

```
Default:          #A1A1AA (text-secondary)
Active:           #FFFFFF
Brand:            #A78BFA (brand-secondary)
Disabled:         #52525B
Success:          #22C55E
Warning:          #EAB308
Error:            #EF4444
```

---

# SECTION 9: ANIMATION SPECIFICATIONS

## 9.1 Timing Functions

```javascript
// Standard ease
ease: 'cubic-bezier(0.4, 0, 0.2, 1)'

// Ease in (acceleration)
easeIn: 'cubic-bezier(0.4, 0, 1, 1)'

// Ease out (deceleration)
easeOut: 'cubic-bezier(0, 0, 0.2, 1)'

// Spring (for gestures)
spring: {
  damping: 20,
  stiffness: 200,
  mass: 1
}

// Bounce (for celebrations)
bounce: {
  damping: 10,
  stiffness: 400,
  mass: 0.5
}
```

## 9.2 Duration Scale

```
instant:    0ms    (color changes)
fast:       100ms  (micro-interactions)
normal:     200ms  (standard transitions)
slow:       300ms  (complex transitions)
slower:     500ms  (entrance animations)
slowest:    1000ms (dramatic effects)
```

## 9.3 Specific Animations

### Button Press
```javascript
{
  scale: [1, 0.97, 1],
  duration: 150,
  easing: 'ease-out'
}
```

### Card Appear (staggered list)
```javascript
{
  opacity: [0, 1],
  translateY: [20, 0],
  duration: 200,
  delay: index * 50,
  easing: 'ease-out'
}
```

### Screen Swipe Transition
```javascript
{
  translateX: [fromX, toX],
  spring: { damping: 20, stiffness: 200 }
}
// Peek: show 15% of target screen at swipe start
// Threshold: 100px to complete transition
```

### Orb Idle Pulse
```javascript
{
  scale: [1, 1.03, 1],
  opacity: [0.8, 1, 0.8], // glow
  duration: 4000,
  easing: 'ease-in-out',
  loop: true
}
```

### Orb Listening Pulse
```javascript
{
  scale: [1, 1.08, 1],
  duration: 800,
  easing: 'ease-in-out',
  loop: true
}
// Plus: sound wave rings every 400ms
```

### Confetti Particle
```javascript
{
  translateY: [0, screenHeight + 100],
  translateX: randomRange(-50, 50),
  rotate: randomRange(0, 720),
  scale: [1, 0],
  duration: randomRange(2000, 3000),
  easing: 'ease-in'
}
```

### Success Checkmark Draw
```javascript
{
  pathLength: [0, 1],
  duration: 300,
  easing: 'ease-out'
}
// Then: scale bounce [0, 1.2, 1] over 200ms
```

### Modal Entrance
```javascript
{
  scale: [0.9, 1],
  opacity: [0, 1],
  duration: 200,
  easing: 'ease-out'
}
```

### Toast Notification
```javascript
// Enter from top
{
  translateY: [-100, 0],
  opacity: [0, 1],
  duration: 300,
  easing: 'spring'
}
// Auto dismiss after 3s
{
  translateY: [0, -100],
  opacity: [1, 0],
  duration: 200,
  easing: 'ease-in'
}
```

---

# SECTION 10: DESIGN TOKENS EXPORT

## 10.1 JSON Export (for React Native)

```json
{
  "colors": {
    "background": {
      "primary": "#000000",
      "surface1": "#0D0D0D",
      "surface2": "#161616",
      "surface3": "#1C1C1E",
      "surface4": "#2C2C2E"
    },
    "brand": {
      "primary": "#7C3AED",
      "secondary": "#A78BFA",
      "tertiary": "#C4B5FD",
      "muted": "#4C1D95"
    },
    "text": {
      "primary": "#FFFFFF",
      "secondary": "#A1A1AA",
      "tertiary": "#71717A",
      "disabled": "#52525B"
    },
    "semantic": {
      "success": "#22C55E",
      "successMuted": "#22C55E1A",
      "warning": "#EAB308",
      "warningMuted": "#EAB3081A",
      "error": "#EF4444",
      "errorMuted": "#EF44441A",
      "info": "#3B82F6"
    }
  },
  "spacing": {
    "0": 0,
    "1": 4,
    "2": 8,
    "3": 12,
    "4": 16,
    "5": 20,
    "6": 24,
    "7": 32,
    "8": 40,
    "9": 48,
    "10": 64
  },
  "borderRadius": {
    "none": 0,
    "sm": 6,
    "md": 10,
    "lg": 14,
    "xl": 20,
    "2xl": 28,
    "full": 9999
  },
  "typography": {
    "displayLarge": {
      "fontSize": 48,
      "fontWeight": "700",
      "lineHeight": 56,
      "letterSpacing": -1.5
    },
    "display": {
      "fontSize": 34,
      "fontWeight": "700",
      "lineHeight": 40,
      "letterSpacing": -0.5
    },
    "title1": {
      "fontSize": 28,
      "fontWeight": "700",
      "lineHeight": 34,
      "letterSpacing": -0.3
    },
    "title2": {
      "fontSize": 22,
      "fontWeight": "600",
      "lineHeight": 28,
      "letterSpacing": -0.2
    },
    "title3": {
      "fontSize": 20,
      "fontWeight": "600",
      "lineHeight": 24,
      "letterSpacing": -0.1
    },
    "headline": {
      "fontSize": 17,
      "fontWeight": "600",
      "lineHeight": 22,
      "letterSpacing": -0.4
    },
    "body": {
      "fontSize": 17,
      "fontWeight": "400",
      "lineHeight": 24,
      "letterSpacing": -0.4
    },
    "bodyMedium": {
      "fontSize": 17,
      "fontWeight": "500",
      "lineHeight": 24,
      "letterSpacing": -0.4
    },
    "callout": {
      "fontSize": 16,
      "fontWeight": "400",
      "lineHeight": 21,
      "letterSpacing": -0.3
    },
    "subhead": {
      "fontSize": 15,
      "fontWeight": "400",
      "lineHeight": 20,
      "letterSpacing": -0.2
    },
    "footnote": {
      "fontSize": 13,
      "fontWeight": "400",
      "lineHeight": 18,
      "letterSpacing": -0.1
    },
    "caption1": {
      "fontSize": 12,
      "fontWeight": "500",
      "lineHeight": 16,
      "letterSpacing": 0
    },
    "caption2": {
      "fontSize": 11,
      "fontWeight": "400",
      "lineHeight": 13,
      "letterSpacing": 0.1
    }
  },
  "shadows": {
    "sm": {
      "shadowColor": "#000000",
      "shadowOffset": { "width": 0, "height": 1 },
      "shadowOpacity": 0.5,
      "shadowRadius": 2
    },
    "md": {
      "shadowColor": "#000000",
      "shadowOffset": { "width": 0, "height": 4 },
      "shadowOpacity": 0.4,
      "shadowRadius": 6
    },
    "lg": {
      "shadowColor": "#000000",
      "shadowOffset": { "width": 0, "height": 10 },
      "shadowOpacity": 0.5,
      "shadowRadius": 25
    },
    "glow": {
      "shadowColor": "#7C3AED",
      "shadowOffset": { "width": 0, "height": 4 },
      "shadowOpacity": 0.4,
      "shadowRadius": 14
    }
  },
  "animation": {
    "duration": {
      "instant": 0,
      "fast": 100,
      "normal": 200,
      "slow": 300,
      "slower": 500
    },
    "spring": {
      "default": { "damping": 20, "stiffness": 200, "mass": 1 },
      "bounce": { "damping": 10, "stiffness": 400, "mass": 0.5 }
    }
  }
}
```

## 10.2 CSS Variables Export

```css
:root {
  /* Background */
  --bg-primary: #000000;
  --bg-surface-1: #0D0D0D;
  --bg-surface-2: #161616;
  --bg-surface-3: #1C1C1E;
  --bg-surface-4: #2C2C2E;
  
  /* Brand */
  --brand-primary: #7C3AED;
  --brand-secondary: #A78BFA;
  --brand-tertiary: #C4B5FD;
  --brand-muted: #4C1D95;
  
  /* Text */
  --text-primary: #FFFFFF;
  --text-secondary: #A1A1AA;
  --text-tertiary: #71717A;
  --text-disabled: #52525B;
  
  /* Semantic */
  --success: #22C55E;
  --warning: #EAB308;
  --error: #EF4444;
  --info: #3B82F6;
  
  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-7: 32px;
  --space-8: 40px;
  --space-9: 48px;
  --space-10: 64px;
  
  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
  --radius-2xl: 28px;
  --radius-full: 9999px;
}
```

---

# SECTION 11: FIGMA SETUP PROMPTS

## 11.1 Create Design System File

```
Prompt for Figma/AI design tool:

Create a Figma design system file for MYPA app with these exact specifications:

PAGE 1: FOUNDATIONS
- Color styles for all colors listed (backgrounds, brand, text, semantic)
- Text styles for all typography levels (display through caption)
- Effect styles for shadows and glows

PAGE 2: COMPONENTS
Create these components with variants:

1. AI Orb
   - Variants: large (160px), medium (120px), mini (44px)
   - States: idle, listening, processing, speaking

2. Buttons
   - Variants: primary, secondary, ghost, icon
   - Sizes: large (56px), medium (48px), small (32px)
   - States: default, pressed, disabled, loading

3. Task Card
   - States: default, completed, overdue, AI-suggested, pressed
   - Include swipe action preview

4. Stats Card
   - Variants: basic, with-icon, highlighted

5. Input Fields
   - Variants: text, search
   - States: default, focused, error, disabled

6. Filter Tabs
   - States: active, inactive, pressed

7. List Item
   - Variants: standard, with-icon, with-chevron
   - States: default, pressed

8. Badges
   - Variants: count, status, category

9. Modal
   - Variants: bottom-sheet, center

10. Progress Bar
    - Variants: standard (8px), thin (4px)

PAGE 3: SCREENS
- AI Home
- Tasks View
- Social View
- Profile View
- Focus Modal
- Unlock Celebration

All on iPhone 15 Pro frames (393 × 852px)
Background: #000000 for all
```

## 11.2 Component-Specific Prompts

### AI Orb Component Prompt
```
Create the AI Orb component for MYPA app.

LARGE VERSION (160×160px):
- Outer glow: 200px wide, #7C3AED at 30% opacity, 60px blur
- Outer ring: 168px, 2px stroke #C4B5FD at 30%
- Main circle: 160px with conic gradient
  Gradient stops: #7C3AED 0°, #A78BFA 120°, #C4B5FD 180°, #A78BFA 240°, #7C3AED 360°
- Inner core: 80px, solid #7C3AED, 20px blur
- Highlight: 24px circle, white at 40%, position top-left (x: 40px, y: 35px from center)

MEDIUM VERSION (120×120px):
- Same structure, scaled proportionally
- Glow: 150px, 40px blur
- Core: 60px

MINI VERSION (44×44px):
- Simplified: Just gradient fill + small glow
- Glow: 52px, 20px blur
- No inner details

STATES:
Show all 4 states for large orb:
1. Idle: As described, subtle scale animation implied
2. Listening: Brighter glow (50%), sound wave rings
3. Processing: Gradient appears rotating, particles around
4. Speaking: Pulse visualization, output waves
```

### Task Card Component Prompt
```
Create the Task Card component for MYPA with exact specs.

DIMENSIONS:
- Width: 353px (full width minus 40px margins)
- Height: auto, min 72px
- Padding: 16px
- Border radius: 14px
- Background: #161616

LAYOUT:
Left section:
- Checkbox: 24×24px
- Border: 2px #52525B
- Border radius: 6px

Content section (12px gap from checkbox):
- Title: "Review project brief"
  Font: 17px/500 #FFFFFF
  
- Metadata row (4px below title):
  "9:00 AM" - 15px/400 #71717A
  " · " - separator
  Category tag: "Work" - 12px/500 #A1A1AA, bg #2C2C2E, padding 4px 8px, radius 6px
  " · " - separator (if AI estimate exists)
  "~30 min" - 12px/500 #A78BFA

VARIANTS:
1. Default (as above)
2. Completed:
   - Checkbox: filled #22C55E, white checkmark
   - Title: strikethrough, color #71717A
3. Overdue:
   - Left border: 3px #EF4444
   - Time text: #EF4444
4. AI Suggested:
   - Left border: 3px #7C3AED
   - Badge: "AI" top-right, 12px #7C3AED on #7C3AED20 bg
5. Pressed:
   - Background: #1C1C1E
   - Scale: 0.98

SWIPE PREVIEW:
Show card shifted 60px left, revealing:
- Green area (#22C55E) with checkmark icon
```

### Button System Prompt
```
Create the Button system for MYPA with exact specs.

PRIMARY BUTTON:
- Height: 56px
- Padding: 16px 32px
- Background: linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)
- Border radius: 14px
- Shadow: 0 4px 14px #7C3AED66
- Text: 17px/600 #FFFFFF, centered
- Icon (optional): 20px, 8px gap from text

States:
- Default: as above
- Pressed: scale 0.97, shadow reduced to 8px blur
- Disabled: opacity 50%, no shadow
- Loading: spinner icon replacing text

SECONDARY BUTTON:
- Height: 56px
- Padding: 16px 32px
- Background: #1C1C1E
- Border: 1px #3F3F46
- Border radius: 14px
- Text: 17px/600 #FFFFFF

States:
- Pressed: bg #2C2C2E
- Disabled: opacity 50%

GHOST BUTTON:
- Height: 48px
- Padding: 12px 24px
- Background: transparent
- Text: 17px/600 #A78BFA
- Border radius: 10px

States:
- Pressed: bg #7C3AED1A
- Disabled: text opacity 50%

ICON BUTTON:
- Size: 44×44px (circle)
- Background: #1C1C1E
- Icon: 24px #FFFFFF

States:
- Pressed: bg #2C2C2E
- Active: bg #7C3AED

Show all buttons in a grid with all states visible.
```

---

This specification document provides every exact measurement, color, and animation needed to build MYPA's UI pixel-perfect. Use the Figma prompts to generate components, and use the JSON tokens directly in code.
