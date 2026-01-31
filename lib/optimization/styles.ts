/**
 * CSS optimization utilities for settings pages
 * Includes critical CSS extraction and lazy loading
 */

/**
 * Critical CSS for above-the-fold content
 * This should be inlined in the HTML head for faster First Contentful Paint
 */
export const CRITICAL_CSS = `
  .settings-nav {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .settings-section {
    border-radius: 0.5rem;
    background-color: rgba(24, 24, 27, 0.3);
    overflow: hidden;
    border: 1px solid rgb(39, 39, 42);
  }

  .settings-field {
    width: 100%;
    padding: 0.5rem 0.75rem;
    background-color: rgb(39, 39, 42);
    border: 1px solid rgb(63, 63, 70);
    border-radius: 0.5rem;
    color: white;
    font-size: 0.875rem;
  }

  .settings-field:focus {
    outline: none;
    ring: 2px;
    ring-color: rgb(59, 130, 246);
  }
`;

/**
 * Utility classes for optimal rendering
 */
export const PERFORMANCE_CLASSES = {
  // Prevent layout shift
  keepAspectRatio: "aspect-video",
  
  // Enable GPU acceleration
  gpuAccelerate: "will-change-transform transform translate-z-0",
  
  // Optimize scrolling
  scrollOptimize: "scroll-smooth",
  
  // Reduce paint areas
  containmentOptimize: "contain-strict",
};

/**
 * Media query utilities for responsive optimization
 */
export const RESPONSIVE_BREAKPOINTS = {
  xs: "320px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

/**
 * Animation optimization utilities
 */
export const ANIMATION_CONFIGS = {
  // Use transform instead of position changes
  slideIn: {
    keyframes: `
      @keyframes slideIn {
        from { transform: translateX(-10px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `,
    duration: "300ms",
    timingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
  },

  // Smooth fade effect
  fadeIn: {
    keyframes: `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `,
    duration: "200ms",
    timingFunction: "ease-in-out",
  },

  // Pulse for loading states
  pulse: {
    keyframes: `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `,
    duration: "2000ms",
    timingFunction: "cubic-bezier(0.4, 0, 0.6, 1)",
  },
};
