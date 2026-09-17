import type { UnifiedPost } from '../types/blog';

export type LayoutType =
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
}

const LAYOUTS: LayoutConfig[] = [
  { type: 'FEATURED_LEFT', count: 5 },
  { type: 'FEATURED_RIGHT', count: 5 },
  { type: 'DUAL', count: 2 },
  { type: 'TRIPLE', count: 3 },
  { type: 'QUAD', count: 4 },
  { type: 'GRID_6', count: 6 },
  { type: 'SINGLE', count: 1 },
];

const FEATURED_LAYOUT: LayoutConfig = LAYOUTS[0];
const CLOSED_LAYOUTS = LAYOUTS.filter(layout => !layout.type.startsWith('FEATURED'));

export interface PostGroup {
  layout: LayoutType;
  posts: UnifiedPost[];
  isFirst: boolean;
}

export function getLayoutPostCount(layout: LayoutType): number {
  return LAYOUTS.find(config => config.type === layout)?.count ?? 0;
}

function comparePlans(left: LayoutConfig[], right: LayoutConfig[]): number {
  const leftSingles = left.filter(layout => layout.type === 'SINGLE').length;
  const rightSingles = right.filter(layout => layout.type === 'SINGLE').length;

  if (leftSingles !== rightSingles) return leftSingles - rightSingles;
  if (left.length !== right.length) return left.length - right.length;
  return right[0]!.count - left[0]!.count;
}

function createClosedLayoutPlan(postCount: number, previousLayout?: LayoutType): LayoutConfig[] {
  const plans = new Map<string, LayoutConfig[] | null>();

  const plan = (remaining: number, lastLayout?: LayoutType): LayoutConfig[] | null => {
    if (remaining === 0) return [];

    const key = `${remaining}:${lastLayout ?? ''}`;
    if (plans.has(key)) return plans.get(key)!;

    const candidates = CLOSED_LAYOUTS.flatMap(layout => {
      if (layout.count > remaining || layout.type === lastLayout) return [];

      const next = plan(remaining - layout.count, layout.type);
      return next ? [[layout, ...next]] : [];
    });

    const bestPlan = candidates.reduce<LayoutConfig[] | null>(
      (best, candidate) => (!best || comparePlans(candidate, best) < 0 ? candidate : best),
      null,
    );

    plans.set(key, bestPlan);
    return bestPlan;
  };

  return plan(postCount, previousLayout) ?? [];
}

export function generatePostGroups(posts: UnifiedPost[]): PostGroup[] {
  const layoutPlan =
    posts.length >= FEATURED_LAYOUT.count
      ? [
          FEATURED_LAYOUT,
          ...createClosedLayoutPlan(posts.length - FEATURED_LAYOUT.count, FEATURED_LAYOUT.type),
        ]
      : createClosedLayoutPlan(posts.length);

  let offset = 0;

  return layoutPlan.map((layout, index) => {
    const group = {
      layout: layout.type,
      posts: posts.slice(offset, offset + layout.count),
      isFirst: index === 0,
    };

    offset += layout.count;
    return group;
  });
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
      return 'md:col-span-3';

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
