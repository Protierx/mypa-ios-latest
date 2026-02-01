import React from 'react';
import { View, Text, Image } from 'react-native';
import { styles } from '../styles';

export const Logo: React.FC = () => (
  <View style={styles.logoContainer}>
    <View style={styles.orbGlow} />
    <Image
      source={require('../../../../assets/mypa-orb.png')}
      style={styles.orb}
      resizeMode="contain"
    />
    <Text style={styles.title}>MYPA</Text>
    <Text style={styles.subtitle}>Your AI Life Assistant</Text>
  </View>
);
