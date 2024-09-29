import Image from 'next/image';

export function GemsIcon({ size = 20 }: { size?: number }) {
  return <Image width={size} height={size} src='/images/profile/icons/hex-gem-icon.svg' alt='' />;
}

export function PointsIcon({ size = 20, color }: { size?: number; color?: 'orange' }) {
  const src = color === 'orange' ? '/images/profile/scout-game-orange-icon.svg' : '/images/profile/scout-game-icon.svg';
  return <Image width={size} height={size} src={src} alt='' />;
}
