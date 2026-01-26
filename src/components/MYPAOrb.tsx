import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface MYPAOrbProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showGlow?: boolean;
}

const sizeConfig = {
  sm: { container: 56 },
  md: { container: 80 },
  lg: { container: 128 },
  xl: { container: 192 },
};

export function MYPAOrb({ size = 'lg', showGlow = true }: MYPAOrbProps) {
  const config = sizeConfig[size];

  return (
    <View style={[styles.container, { width: config.container, height: config.container }]}>
      {showGlow && (
        <View
          style={[
            styles.glow,
            {
              width: config.container * 1.15,
              height: config.container * 1.15,
              borderRadius: (config.container * 1.15) / 2,
            },
          ]}
        />
      )}
      <Image
        source={require('../../assets/mypa-orb.png')}
        style={{
          width: config.container,
          height: config.container,
          borderRadius: config.container / 2,
        }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    backgroundColor: 'rgba(181, 140, 255, 0.3)',
  },
});
