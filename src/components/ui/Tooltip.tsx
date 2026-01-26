import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ViewStyle, TextStyle, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom';
  style?: ViewStyle;
}

export function Tooltip({ content, children, side = 'top', style }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0, width: 0 });
  const triggerRef = React.useRef<View>(null);

  const handleLongPress = () => {
    triggerRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setPosition({ x: pageX, y: pageY + (side === 'bottom' ? height + 8 : -40), width });
      setVisible(true);
    });
  };

  return (
    <>
      <TouchableOpacity
        ref={triggerRef}
        onLongPress={handleLongPress}
        onPressOut={() => setVisible(false)}
        activeOpacity={0.9}
        style={style}
      >
        {children}
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View
            style={[
              styles.tooltip,
              {
                left: Math.max(8, Math.min(position.x, SCREEN_WIDTH - 180)),
                top: position.y,
              },
            ]}
          >
            <Text style={styles.content}>{content}</Text>
            <View
              style={[
                styles.arrow,
                side === 'top' ? styles.arrowBottom : styles.arrowTop,
              ]}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    maxWidth: 200,
  },
  content: {
    fontSize: 13,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  arrow: {
    position: 'absolute',
    width: 10,
    height: 10,
    backgroundColor: '#0F172A',
    transform: [{ rotate: '45deg' }],
    left: 20,
  },
  arrowTop: {
    top: -5,
  },
  arrowBottom: {
    bottom: -5,
  },
});
