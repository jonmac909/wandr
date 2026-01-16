'use client';

import { useState, useEffect } from 'react';

const FALLBACK_IMAGE = 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600';

interface CityImageProps {
  src?: string | null;
  alt: string;
  className?: string;
}

export function CityImage({ src, alt, className = '' }: CityImageProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(src || null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(!src);

  // Update imgSrc when src prop changes
  useEffect(() => {
    if (src && src !== imgSrc && !hasError) {
      setImgSrc(src);
      setIsLoading(false);
    }
  }, [src, imgSrc, hasError]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(FALLBACK_IMAGE);
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Show loading skeleton while waiting for image
  if (!imgSrc || isLoading) {
    return (
      <div className={`${className} bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse`} />
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
    />
  );
}
