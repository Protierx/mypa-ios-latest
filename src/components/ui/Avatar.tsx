import React, { useState } from 'react';
import { View, Image, Text, StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';

interface AvatarProps {
  size?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
}

interface AvatarImageProps {
  source: { uri: string };
  style?: ImageStyle;
}

interface AvatarFallbackProps {
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const AvatarContext = React.createContext<{
  size: number;
  imageLoaded: boolean;
  setImageLoaded: (loaded: boolean) => void;
}>({ size: 40, imageLoaded: false, setImageLoaded: () => {} });

export function Avatar({ size = 40, style, children }: AvatarProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <AvatarContext.Provider value={{ size, imageLoaded, setImageLoaded }}>
      <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }, style]}>
        {children}
      </View>
    </AvatarContext.Provider>
  );
}

export function AvatarImage({ source, style }: AvatarImageProps) {
  const { size, setImageLoaded } = React.useContext(AvatarContext);

  return (
    <Image
      source={source}
      style={[styles.image, { width: size, height: size, borderRadius: size / 2 }, style]}
      onLoad={() => setImageLoaded(true)}
      onError={() => setImageLoaded(false)}
    />
  );
}

export function AvatarFallback({ children, style, textStyle }: AvatarFallbackProps) {
  const { size, imageLoaded } = React.useContext(AvatarContext);

  if (imageLoaded) return null;

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }, style]}>
      {typeof children === 'string' ? (
        <Text style={[styles.fallbackText, { fontSize: size * 0.4 }, textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  fallback: {
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontWeight: '500',
    color: '#64748B',
  },
});
