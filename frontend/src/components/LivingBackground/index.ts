/**
 * Living Background Components
 * 
 * The entire AI Hub screen IS the AI - a living, breathing entity.
 * Uses @shopify/react-native-skia for GPU-accelerated graphics.
 * 
 * Components:
 *   - LivingBackground: Main orchestrating component
 *   - GradientMesh: Skia shader for flowing gradient background
 *   - ParticleField: Floating particles that respond to voice
 *   - CenterGlow: Soft focal glow that indicates AI presence
 *   - VoiceWaveform: Circular waveform during listening
 * 
 * Reference: MYPA_FULL_IMPLEMENTATION_GUIDE.md Steps 5.4-5.7
 */

// Main component
export { LivingBackground, type VoiceState } from './LivingBackground';

// Sub-components for granular control
export { GradientMesh } from './GradientMesh';
export { ParticleField } from './ParticleField';
export { CenterGlow } from './CenterGlow';
export { VoiceWaveform, AudioBars } from './VoiceWaveform';
