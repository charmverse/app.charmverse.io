import Image from 'next/image';

export function GemsIcon({ size = 20 }: { size?: number }) {
  return <Image width={size} height={size} src='/images/profile/icons/hex-gem-icon.svg' alt='' />;
}

const pointsSrc = {
  orange: '/images/profile/scout-game-orange-icon.svg',
  green: '/images/profile/scout-game-green-icon.svg',
  blue: '/images/profile/scout-game-blue-icon.svg',
  default: '/images/profile/scout-game-icon.svg'
} as const;

export function PointsIcon({ size = 20, color }: { size?: number; color?: 'orange' | 'green' | 'blue' }) {
  const src = (color && pointsSrc[color]) || pointsSrc.default;
  return <Image width={size} height={size} src={src} alt='' />;
}
