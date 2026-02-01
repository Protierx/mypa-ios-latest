import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { ProofCameraScreenProps } from './types';
import { styles } from './styles';
import { Header, CameraPreview, CameraControls } from './components';
import { useProofCameraData } from './hooks';

export function ProofCameraScreen({ navigation }: ProofCameraScreenProps) {
  const { isCapturing, handleCapture } = useProofCameraData(navigation);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Header onClose={() => navigation?.goBack()} />
        <CameraPreview />
        <CameraControls isCapturing={isCapturing} onCapture={handleCapture} />
        <Text style={styles.hint}>Take a photo to verify task completion</Text>
      </SafeAreaView>
    </View>
  );
}

export default ProofCameraScreen;
