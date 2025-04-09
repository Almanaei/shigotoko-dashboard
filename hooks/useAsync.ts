import { useState, useCallback, useEffect } from 'react';

/**
 * Interface for the state managed by the useAsync hook
 */
interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Interface for the return value of the useAsync hook
 */
interface AsyncHookResult<T, P extends any[]> {
  execute: (...params: P) => Promise<T | null>;
  data: T | null;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

/**
 * Custom hook for handling asynchronous operations with state management
 * 
 * @param asyncFunction The async function to execute
 * @param immediate Whether to execute the function immediately
 * @param initialParams Initial parameters to pass to the async function if immediate is true
 * @returns Object with execution function, data, loading state, error state, and reset function
 */
function useAsync<T, P extends any[]>(
  asyncFunction: (...params: P) => Promise<T>,
  immediate = false,
  initialParams?: P
): AsyncHookResult<T, P> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  // Function to execute the async function
  const execute = useCallback(
    async (...params: P): Promise<T | null> => {
      setState({ data: null, loading: true, error: null });
      
      try {
        const result = await asyncFunction(...params);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (error) {
        setState({ data: null, loading: false, error: error as Error });
        return null;
      }
    },
    [asyncFunction]
  );

  // Function to reset the state
  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  // Execute immediately if specified
  useEffect(() => {
    if (immediate && initialParams) {
      execute(...initialParams);
    }
  }, [execute, immediate, initialParams]);

  return {
    execute,
    ...state,
    reset,
  };
}

export default useAsync; 