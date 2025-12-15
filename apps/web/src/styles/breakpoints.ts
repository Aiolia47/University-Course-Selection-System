// Breakpoint configuration
export const breakpoints = {
  xs: '480px',
  sm: '576px',
  md: '768px',
  lg: '992px',
  xl: '1200px',
  xxl: '1600px',
};

export const mediaQueries = {
  xs: `@media (max-width: ${breakpoints.xs})`,
  sm: `@media (max-width: ${breakpoints.sm})`,
  md: `@media (max-width: ${breakpoints.md})`,
  lg: `@media (max-width: ${breakpoints.lg})`,
  xl: `@media (max-width: ${breakpoints.xl})`,
  xxl: `@media (max-width: ${breakpoints.xxl})`,

  // Min-width queries
  minXs: `@media (min-width: ${breakpoints.xs})`,
  minSm: `@media (min-width: ${breakpoints.sm})`,
  minMd: `@media (min-width: ${breakpoints.md})`,
  minLg: `@media (min-width: ${breakpoints.lg})`,
  minXl: `@media (min-width: ${breakpoints.xl})`,
  minXXl: `@media (min-width: ${breakpoints.xxl})`,

  // Range queries
  smOnly: `@media (min-width: ${breakpoints.sm}) and (max-width: ${breakpoints.md})`,
  mdOnly: `@media (min-width: ${breakpoints.md}) and (max-width: ${breakpoints.lg})`,
  lgOnly: `@media (min-width: ${breakpoints.lg}) and (max-width: ${breakpoints.xl})`,
  xlOnly: `@media (min-width: ${breakpoints.xl}) and (max-width: ${breakpoints.xxl})`,
};

// Hook to get current breakpoint
export const getCurrentBreakpoint = (): keyof typeof breakpoints => {
  if (typeof window === 'undefined') return 'lg';

  const width = window.innerWidth;

  if (width <= 480) return 'xs';
  if (width <= 576) return 'sm';
  if (width <= 768) return 'md';
  if (width <= 992) return 'lg';
  if (width <= 1200) return 'xl';
  return 'xxl';
};

// Responsive value helper
export const responsive = <T>(values: Partial<Record<keyof typeof breakpoints, T>>): T | undefined => {
  const breakpoint = getCurrentBreakpoint();

  // Return value for current breakpoint or the nearest larger one
  const breakpointOrder: (keyof typeof breakpoints)[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
  const currentIndex = breakpointOrder.indexOf(breakpoint);

  for (let i = currentIndex; i < breakpointOrder.length; i++) {
    const bp = breakpointOrder[i];
    if (values[bp] !== undefined) {
      return values[bp];
    }
  }

  return undefined;
};

// CSS-in-JS responsive helper
export const responsiveStyle = <T extends Record<string, any>>(
  styles: T
): T => {
  const responsive: any = {};

  Object.entries(styles).forEach(([key, value]) => {
    responsive[key] = value;

    if (typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([bp, bpValue]) => {
        if (bp in breakpoints) {
          const query = `(max-width: ${breakpoints[bp as keyof typeof breakpoints]})`;
          if (!responsive[`@media ${query}`]) {
            responsive[`@media ${query}`] = {};
          }
          responsive[`@media ${query}`][key] = bpValue;
        }
      });
    }
  });

  return responsive;
};

export type Breakpoint = keyof typeof breakpoints;