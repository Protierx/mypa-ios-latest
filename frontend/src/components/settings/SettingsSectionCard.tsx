/**
 * Settings Section Card
 *
 * iOS-grouped card container for a section of setting rows.
 * Renders a section header label + rounded card with dividers between children.
 */

import React, { ReactNode, Children } from 'react';
import { View, Text } from 'react-native';

interface Props {
  title: string;
  children: ReactNode;
  /** Optional helper text below the card */
  footer?: string;
}

export function SettingsSectionCard({ title, children, footer }: Props) {
  const childArray = Children.toArray(children).filter(Boolean);

  return (
    <View style={{ marginBottom: 24 }}>
      {/* Section header */}
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: '#8E8E93',
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          paddingHorizontal: 20,
          marginBottom: 8,
        }}
        accessibilityRole="header"
      >
        {title}
      </Text>

      {/* Card */}
      <View
        style={{
          marginHorizontal: 16,
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#E5E5EA',
          overflow: 'hidden',
        }}
      >
        {childArray.map((child, i) => (
          <React.Fragment key={i}>
            {child}
            {i < childArray.length - 1 && (
              <View
                style={{
                  height: 1,
                  backgroundColor: '#E5E5EA',
                  marginLeft: 56,
                }}
              />
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Footer */}
      {footer ? (
        <Text
          style={{
            fontSize: 12,
            color: '#8E8E93',
            paddingHorizontal: 32,
            marginTop: 6,
            lineHeight: 16,
          }}
        >
          {footer}
        </Text>
      ) : null}
    </View>
  );
}
