import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../styles';

interface ProofCameraScreenProps {
  navigation?: any;
}

export function ProofCameraScreen({ navigation }: ProofCameraScreenProps) {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCapture = () => {
    setIsCapturing(true);
    setTimeout(() => {
      setIsCapturing(false);
      navigation?.navigate('ProofConfirm');
    }, 500);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.title}>Proof of Completion</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.cameraPlaceholder}>
          <View style={styles.cameraFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Ionicons name="camera" size={64} color="rgba(255,255,255,0.3)" />
          <Text style={styles.cameraText}>Camera preview</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.flashButton}>
            <Ionicons name="flash-off" size={24} color={colors.white} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.captureButton, isCapturing && styles.capturing]}
            onPress={handleCapture}
            activeOpacity={0.8}
          >
            <View style={styles.captureInner} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.flipButton}>
            <Ionicons name="camera-reverse" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>Take a photo to verify task completion</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.white,
  },
  cameraPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.base,
    marginVertical: spacing.lg,
  },
  cameraFrame: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    bottom: 40,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  cameraText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: spacing.xl,
  },
  flashButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.white,
  },
  capturing: {
    transform: [{ scale: 0.95 }],
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
  },
  hint: {
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    paddingBottom: spacing.xl,
  },
});

export default ProofCameraScreen;
