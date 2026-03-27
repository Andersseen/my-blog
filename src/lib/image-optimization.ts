import type { UnifiedPost } from '@/types/blog';

interface ImageSize {
  width: number;
  suffix: string;
}

const MEDIUM_SIZES: ImageSize[] = [
  { width: 320, suffix: '320' },
  { width: 640, suffix: '640' },
  { width: 1024, suffix: '1024' },
];

/**
 * Genera un srcset para imágenes de Medium CDN
 * Medium soporta redimensionamiento via URL: /max/{width}/
 */
export function generateMediumSrcSet(originalUrl: string): string {
  if (!originalUrl.includes('cdn-images-1.medium.com')) {
    return originalUrl;
  }

  return MEDIUM_SIZES.map(size => {
    const url = originalUrl.replace(/\/max\/\d+\//, `/max/${size.suffix}/`);
    return `${url} ${size.width}w`;
  }).join(', ');
}

/**
 * Determina el tamaño de imagen óptimo según el layout y posición
 */
export function getOptimalImageSize(
  layout: string,
  postIndex: number,
  isFeatured: boolean,
): number {
  if (isFeatured) {
    return 1024;
  }

  // Para layouts tipo grid
  if (layout.includes('GRID') || layout.includes('TRIPLE') || layout.includes('QUAD')) {
    return 640;
  }

  return 640;
}

/**
 * Genera atributo sizes para responsive images
 */
export function generateSizes(layout: string, postIndex: number): string {
  const isFirstTwo = postIndex < 2;

  if (isFirstTwo) {
    return '(max-width: 768px) 100vw, 50vw';
  }

  return '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
}
