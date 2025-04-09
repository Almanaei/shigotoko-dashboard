import { renderHook } from '@testing-library/react';
import useMemoized from '../../hooks/useMemoized';

describe('useMemoized', () => {
  // Test basic memoization
  it('should memoize a value', () => {
    // Mock factory function with Jest's fn
    const factory = jest.fn(() => 'test-value');
    
    // Render hook with dependencies
    const { result, rerender } = renderHook(
      (deps) => useMemoized(factory, deps),
      { initialProps: [1, 2] }
    );
    
    // Check initial render
    expect(result.current).toBe('test-value');
    expect(factory).toHaveBeenCalledTimes(1);
    
    // Rerender with same dependencies
    rerender([1, 2]);
    
    // Should use memoized value (factory not called again)
    expect(result.current).toBe('test-value');
    expect(factory).toHaveBeenCalledTimes(1);
  });
  
  // Test dependency change
  it('should recalculate when dependencies change', () => {
    // Create a factory function that returns a new object each time
    const factory = jest.fn((x) => ({ value: x }));
    
    // Initial render with a dependency
    const { result, rerender } = renderHook(
      (deps) => useMemoized(() => factory(deps[0]), deps),
      { initialProps: [5] }
    );
    
    // Check initial render
    expect(result.current).toEqual({ value: 5 });
    expect(factory).toHaveBeenCalledTimes(1);
    expect(factory).toHaveBeenCalledWith(5);
    
    // Rerender with same dependency
    rerender([5]);
    
    // Should use memoized value
    expect(result.current).toEqual({ value: 5 });
    expect(factory).toHaveBeenCalledTimes(1);
    
    // Rerender with different dependency
    rerender([10]);
    
    // Should recalculate
    expect(result.current).toEqual({ value: 10 });
    expect(factory).toHaveBeenCalledTimes(2);
    expect(factory).toHaveBeenCalledWith(10);
  });
  
  // Test with multiple dependencies
  it('should handle multiple dependencies correctly', () => {
    // Factory function that uses multiple dependencies
    const factory = jest.fn((a, b) => ({ sum: a + b }));
    
    // Initial render with dependencies
    const { result, rerender } = renderHook(
      (deps) => useMemoized(() => factory(deps[0], deps[1]), deps),
      { initialProps: [5, 10] }
    );
    
    // Check initial render
    expect(result.current).toEqual({ sum: 15 });
    expect(factory).toHaveBeenCalledTimes(1);
    
    // Change first dependency
    rerender([8, 10]);
    
    // Should recalculate
    expect(result.current).toEqual({ sum: 18 });
    expect(factory).toHaveBeenCalledTimes(2);
    
    // Change second dependency
    rerender([8, 12]);
    
    // Should recalculate
    expect(result.current).toEqual({ sum: 20 });
    expect(factory).toHaveBeenCalledTimes(3);
    
    // No change in dependencies
    rerender([8, 12]);
    
    // Should use memoized value
    expect(result.current).toEqual({ sum: 20 });
    expect(factory).toHaveBeenCalledTimes(3);
  });
}); 