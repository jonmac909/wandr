'use client';

import { useState, useEffect } from 'react';

const FALLBACK_IMAGE = 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600';

interface CityImageProps {
  src?: string;
  alt: string;
  className?: string;
}

export function CityImage({ src, alt, className = '' }: CityImageProps) {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK_IMAGE);
  const [hasError, setHasError] = useState(false);

  // Update imgSrc when src prop changes (fixes issue where initial undefined src
  // would stay as fallback even after parent provides the real URL)
  useEffect(() => {
    if (src && src !== imgSrc && !hasError) {
      setImgSrc(src);
    }
  }, [src, imgSrc, hasError]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(FALLBACK_IMAGE);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
}
