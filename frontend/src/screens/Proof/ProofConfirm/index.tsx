import React from 'react';
import { View, SafeAreaView } from 'react-native';
import { ProofConfirmScreenProps } from './types';
import { DEFAULT_TASK } from './constants';
import { styles } from './styles';
import { Header, ImagePreview, TaskCard, ActionButtons } from './components';

export function ProofConfirmScreen({ navigation }: ProofConfirmScreenProps) {
  const handleConfirm = () => {
    navigation?.navigate('Hub');
  };

  const handleRetake = () => {
    navigation?.goBack();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Header onBack={() => navigation?.goBack()} />
        <ImagePreview />
        <TaskCard task={DEFAULT_TASK} />
        <ActionButtons onRetake={handleRetake} onConfirm={handleConfirm} />
      </SafeAreaView>
    </View>
  );
}

export default ProofConfirmScreen;
