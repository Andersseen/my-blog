import type { UnifiedPost } from '../types/blog';

type LayoutType =
  | 'FEATURED_LEFT'
  | 'FEATURED_RIGHT'
  | 'DUAL'
  | 'TRIPLE'
  | 'QUAD'
  | 'SINGLE'
  | 'GRID_6';

interface LayoutConfig {
  type: LayoutType;
  count: number;
  minRequired: number;
}

const LAYOUTS: LayoutConfig[] = [
  { type: 'FEATURED_LEFT', count: 5, minRequired: 5 },
  { type: 'FEATURED_RIGHT', count: 5, minRequired: 5 },
  { type: 'DUAL', count: 2, minRequired: 2 },
  { type: 'TRIPLE', count: 3, minRequired: 3 },
  { type: 'QUAD', count: 4, minRequired: 4 },
  { type: 'GRID_6', count: 6, minRequired: 6 },
  { type: 'SINGLE', count: 1, minRequired: 1 },
];

export interface PostGroup {
  layout: LayoutType;
  posts: UnifiedPost[];
  isFirst: boolean;
}

/**
 * Genera grupos de posts con layouts dinámicos
 * No repite patrones - cada grupo puede tener un layout diferente
 */
export function generatePostGroups(posts: UnifiedPost[]): PostGroup[] {
  const groups: PostGroup[] = [];
  let remaining = [...posts];
  let isFirst = true;
  let lastLayout: LayoutType | null = null;

  while (remaining.length > 0) {
    const availableLayouts = LAYOUTS.filter(
      l => l.minRequired <= remaining.length && (groups.length === 0 || l.type !== lastLayout), // Evitar repetir el mismo layout consecutivamente
    );

    if (availableLayouts.length === 0) {
      // Fallback: usar el layout más pequeño disponible
      const fallback = LAYOUTS.find(l => l.minRequired <= remaining.length);
      if (!fallback) break;
      availableLayouts.push(fallback);
    }

    // Seleccionar layout (primero siempre es featured, luego aleatorio ponderado)
    let selected: LayoutConfig;
    if (isFirst) {
      selected =
        availableLayouts.find(l => ['FEATURED_LEFT', 'FEATURED_RIGHT'].includes(l.type)) ||
        availableLayouts[0];
    } else {
      // Preferir layouts que usen más posts cuando hay muchos disponibles
      const sorted = availableLayouts.sort((a, b) => b.count - a.count);
      // 60% probabilidad de usar el que más posts consume, 40% de usar uno aleatorio
      selected =
        Math.random() > 0.4 ? sorted[0] : sorted[Math.floor(Math.random() * sorted.length)];
    }

    const postsForGroup = remaining.slice(0, selected.count);
    remaining = remaining.slice(selected.count);

    groups.push({
      layout: selected.type,
      posts: postsForGroup,
      isFirst,
    });

    lastLayout = selected.type;
    isFirst = false;
  }

  return groups;
}

/**
 * Obtiene clases de grid según el tipo de layout
 */
export function getLayoutClasses(layout: LayoutType): string {
  const baseClasses = 'grid grid-cols-1 gap-5 md:grid-cols-12';

  switch (layout) {
    case 'FEATURED_LEFT':
    case 'FEATURED_RIGHT':
      return `${baseClasses} md:auto-rows-[210px]`;
    case 'DUAL':
      return `${baseClasses} md:auto-rows-[420px]`;
    case 'TRIPLE':
      return `${baseClasses} md:auto-rows-[320px]`;
    case 'QUAD':
      return `${baseClasses} md:auto-rows-[280px]`;
    case 'GRID_6':
      return `${baseClasses} md:auto-rows-[200px]`;
    case 'SINGLE':
      return `${baseClasses} md:auto-rows-[420px]`;
    default:
      return baseClasses;
  }
}

/**
 * Obtiene clases de columna para un post en un layout específico
 */
export function getPostClasses(layout: LayoutType, postIndex: number, _totalPosts: number): string {
  switch (layout) {
    case 'FEATURED_LEFT':
      if (postIndex === 0) return 'md:col-span-8 md:row-span-2';
      if (postIndex === 1) return 'md:col-span-4 md:row-span-2';
      return 'md:col-span-4';

    case 'FEATURED_RIGHT':
      if (postIndex === 0) return 'md:col-span-4 md:row-span-2';
      if (postIndex === 1) return 'md:col-span-8 md:row-span-2';
      return 'md:col-span-4';

    case 'DUAL':
      return 'md:col-span-6 md:row-span-1';

    case 'TRIPLE':
      return 'md:col-span-4 md:row-span-1';

    case 'QUAD':
      if (postIndex < 2) return 'md:col-span-6 md:row-span-1';
      return 'md:col-span-6 md:row-span-1';

    case 'GRID_6':
      if (postIndex < 2) return 'md:col-span-6';
      return 'md:col-span-4';

    case 'SINGLE':
      return 'md:col-span-12 md:row-span-1';

    default:
      return 'md:col-span-4';
  }
}

/**
 * Determina si un post debe mostrarse como "featured" (más grande)
 */
export function isFeatured(layout: LayoutType, postIndex: number): boolean {
  if (['FEATURED_LEFT', 'FEATURED_RIGHT'].includes(layout)) {
    return postIndex === 0 || postIndex === 1;
  }
  if (layout === 'SINGLE') return true;
  return false;
}

/**
 * Determina el tamaño de fuente del título según el layout
 */
export function getTitleSize(layout: LayoutType, postIndex: number): string {
  if (isFeatured(layout, postIndex)) {
    if (['FEATURED_LEFT', 'FEATURED_RIGHT'].includes(layout) && postIndex === 0) {
      return 'text-3xl md:text-4xl';
    }
    return 'text-xl md:text-2xl';
  }
  return 'text-lg';
}

/**
 * Determina si mostrar descripción
 */
export function shouldShowDescription(layout: LayoutType, postIndex: number): boolean {
  return isFeatured(layout, postIndex);
}
