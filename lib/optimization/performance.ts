/**
 * Performance optimization utilities for settings pages
 * Includes memoization, virtualization hints, and bundle analysis
 */

/**
 * Calculate and report component bundle size
 * Used for monitoring performance impact
 */
export function reportComponentSize(
  componentName: string,
  estimatedSize: number
): void {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    const threshold = 50000; // 50KB warning threshold
    if (estimatedSize > threshold) {
      console.warn(
        `[Performance] ${componentName} is ${(estimatedSize / 1000).toFixed(2)}KB - consider splitting`
      );
    }
  }
}

/**
 * Intersection Observer hook for lazy loading
 * Loads content only when it enters viewport
 */
export function createLazyLoadObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
): IntersectionObserver {
  return new IntersectionObserver(callback, {
    threshold: 0.1,
    rootMargin: "50px",
    ...options,
  });
}

/**
 * Cache key generator for memoization
 * Creates stable cache keys from props
 */
export function generateCacheKey(props: Record<string, any>): string {
  return JSON.stringify(props);
}

/**
 * Measure rendering performance
 * Tracks component render times in development
 */
export function measureRender(componentName: string): () => void {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "development") {
    return () => {};
  }

  const startTime = performance.now();

  return () => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    if (renderTime > 16) {
      // Longer than one frame at 60fps
      console.warn(
        `[Performance] ${componentName} took ${renderTime.toFixed(2)}ms to render`
      );
    }
  };
}

/**
 * Estimate memory usage of objects
 * Useful for detecting memory leaks
 */
export function estimateObjectSize(obj: any): number {
  const objectList: any[] = [];
  const stack = [obj];
  let bytes = 0;

  while (stack.length) {
    const value = stack.pop();

    if (typeof value === "boolean") {
      bytes += 4;
    } else if (typeof value === "string") {
      bytes += value.length * 2;
    } else if (typeof value === "number") {
      bytes += 8;
    } else if (typeof value === "object" && value !== null) {
      if (objectList.indexOf(value) === -1) {
        objectList.push(value);

        for (const key in value) {
          if (value.hasOwnProperty(key)) {
            stack.push(value[key]);
          }
        }
      }
    }
  }

  return bytes;
}
