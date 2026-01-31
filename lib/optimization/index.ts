/**
 * Optimization utilities index
 * Re-exports all optimization utilities for convenient importing
 */

// Form optimization
export { useOptimizedForm, type UseFormOptions } from "./form";

// Performance utilities
export {
  reportComponentSize,
  createLazyLoadObserver,
  generateCacheKey,
  measureRender,
  estimateObjectSize,
} from "./performance";

// Async utilities
export { useAsync, useAsyncMemo } from "./async";

// Debounce and throttle
export { useDebounce, useThrottle } from "./debounce";

// Style optimization
export {
  CRITICAL_CSS,
  PERFORMANCE_CLASSES,
  RESPONSIVE_BREAKPOINTS,
  ANIMATION_CONFIGS,
} from "./styles";
