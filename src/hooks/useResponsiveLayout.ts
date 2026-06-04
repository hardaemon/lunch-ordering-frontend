import { useWindowDimensions } from 'react-native';

export function useResponsiveLayout() {
  const { width } = useWindowDimensions();
  const isWide = width > 768;
  return {
    width,
    isWide,
    contentMaxWidth: isWide ? 600 : undefined,
    horizontalPadding: isWide ? 32 : 16,
  };
}