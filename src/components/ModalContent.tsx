import React from 'react';
import { Keyboard, Platform, Pressable, View, ViewStyle } from 'react-native';

export function ModalContent({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  if (Platform.OS === 'web') {
    return <View style={style}>{children}</View>;
  }
  return (
    <Pressable style={style} onPress={Keyboard.dismiss}>
      {children}
    </Pressable>
  );
}