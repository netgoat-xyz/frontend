import { useCallback, useRef, useState, useEffect } from "react";

interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isSuccess: boolean;
}

/**
 * Hook for handling async operations with automatic cleanup
 * Prevents memory leaks and handles loading/error states
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: immediate,
    isSuccess: false,
  });

  const mountedRef = useRef(true);

  const execute = useCallback(async () => {
    setState({ data: null, error: null, isLoading: true, isSuccess: false });

    try {
      const result = await asyncFunction();
      if (mountedRef.current) {
        setState({ data: result, error: null, isLoading: false, isSuccess: true });
      }
    } catch (error) {
      if (mountedRef.current) {
        setState({
          data: null,
          error: error instanceof Error ? error : new Error(String(error)),
          isLoading: false,
          isSuccess: false,
        });
      }
    }
  }, [asyncFunction]);

  useEffect(() => {
    const executionTimer = immediate
      ? window.setTimeout(() => {
          void execute();
        }, 0)
      : undefined;

    return () => {
      if (executionTimer !== undefined) {
        window.clearTimeout(executionTimer);
      }
      mountedRef.current = false;
    };
  }, [execute, immediate]);

  return { ...state, execute };
}

/**
 * Hook for caching async function results
 * Prevents redundant API calls
 */
export function useAsyncMemo<T>(
  asyncFunction: () => Promise<T>,
  deps: React.DependencyList
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: true,
    isSuccess: false,
  });

  const cacheRef = useRef<{ value: T; deps: React.DependencyList } | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // Check if dependencies changed and invalidate cache
    const depsChanged =
      !cacheRef.current ||
      cacheRef.current.deps.length !== deps.length ||
      cacheRef.current.deps.some((dep, i) => dep !== deps[i]);

    if (cacheRef.current && !depsChanged) {
      setState({
        data: cacheRef.current.value,
        error: null,
        isLoading: false,
        isSuccess: true,
      });
      return;
    }

    const execute = async () => {
      setState({
        data: cacheRef.current?.value ?? null,
        error: null,
        isLoading: true,
        isSuccess: false,
      });

      try {
        const result = await asyncFunction();
        if (mountedRef.current) {
          cacheRef.current = { value: result, deps };
          setState({
            data: result,
            error: null,
            isLoading: false,
            isSuccess: true,
          });
        }
      } catch (error) {
        if (mountedRef.current) {
          setState({
            data: cacheRef.current?.value ?? null,
            error: error instanceof Error ? error : new Error(String(error)),
            isLoading: false,
            isSuccess: false,
          });
        }
      }
    };

    execute();

    return () => {
      mountedRef.current = false;
    };
    // Callers supply the dependency tuple that defines this memoized request.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `deps` is intentionally dynamic.
  }, deps);

  return state;
}
