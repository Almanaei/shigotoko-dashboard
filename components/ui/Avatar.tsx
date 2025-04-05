import Image from 'next/image';

interface AvatarProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}

export function Avatar({ src, alt, size = 40, className = '' }: AvatarProps) {
  return (
    <div 
      className={`relative overflow-hidden rounded-full bg-gray-200 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={src || '/avatar-placeholder.png'}
        alt={alt}
        width={size}
        height={size}
        className="object-cover h-full w-full"
      />
    </div>
  );
} 