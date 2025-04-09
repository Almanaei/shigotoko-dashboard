import { useRef, useEffect, DependencyList } from 'react';

/**
 * Custom hook for memoizing a value with proper dependency tracking
 * Useful for expensive calculations or deep object comparisons
 * 
 * @param factory Function that creates the value to be memoized
 * @param deps Dependency array that determines when to recalculate the value
 * @returns The memoized value
 */
function useMemoized<T>(factory: () => T, deps: DependencyList): T {
  // Use ref to store the memoized value
  const ref = useRef<{ value: T; deps: DependencyList }>({
    value: undefined as unknown as T, // Will be set in the first effect run
    deps: [] 
  });

  // Check if deps have changed
  const depsChanged = 
    !ref.current.deps.length || // First run
    deps.length !== ref.current.deps.length || // Different length
    deps.some((dep, i) => !Object.is(dep, ref.current.deps[i])); // Different values

  // Update the value if deps have changed
  if (depsChanged) {
    ref.current = {
      value: factory(),
      deps
    };
  }

  // In development mode, verify the deps with useEffect
  // This helps catch missed dependencies and inconsistent renders
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
      ref.current = {
        value: factory(),
        deps
      };
    }, deps);
  }

  return ref.current.value;
}

export default useMemoized; 