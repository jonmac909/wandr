'use client';

import { useState, useEffect } from 'react';

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
      setImgSrc(null); // No fallback - show placeholder on error
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Show placeholder if no image or loading
  if (!imgSrc || isLoading) {
    return (
      <div className={`${className} bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse`} />
    );
  }

  // Show placeholder on error
  if (hasError) {
    return (
      <div className={`${className} bg-gradient-to-br from-violet-100 to-purple-50 flex items-center justify-center`}>
        <span className="text-3xl">📍</span>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={handleError}
      onLoad={handleLoad}
    />
  );
}
