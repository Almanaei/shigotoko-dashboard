import { renderHook, act } from '@testing-library/react';
import useAsync from '../../hooks/useAsync';

describe('useAsync', () => {
  // Test successful async function
  it('should handle successful async operations', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockAsyncFn = jest.fn().mockResolvedValue(mockData);
    
    const { result, waitForNextUpdate } = renderHook(() => useAsync(mockAsyncFn));
    
    // Initial state
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBeFalsy();
    expect(result.current.error).toBeNull();
    
    // Execute async function
    let resultPromise;
    act(() => {
      resultPromise = result.current.execute();
    });
    
    // Should be in loading state
    expect(result.current.loading).toBeTruthy();
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    
    // Wait for async operation to complete
    await waitForNextUpdate();
    
    // Should have data and not be loading
    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBeFalsy();
    expect(result.current.error).toBeNull();
    
    // Should return the result
    expect(await resultPromise).toEqual(mockData);
  });
  
  // Test error handling
  it('should handle errors in async operations', async () => {
    const mockError = new Error('Test error');
    const mockAsyncFn = jest.fn().mockRejectedValue(mockError);
    
    const { result, waitForNextUpdate } = renderHook(() => useAsync(mockAsyncFn));
    
    // Execute async function
    let resultPromise;
    act(() => {
      resultPromise = result.current.execute();
    });
    
    // Wait for async operation to complete
    await waitForNextUpdate();
    
    // Should have error and not be loading
    expect(result.current.error).toEqual(mockError);
    expect(result.current.loading).toBeFalsy();
    expect(result.current.data).toBeNull();
    
    // Should return null on error
    expect(await resultPromise).toBeNull();
  });
  
  // Test immediate execution
  it('should execute immediately when immediate flag is true', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockAsyncFn = jest.fn().mockResolvedValue(mockData);
    const mockParams = ['param1', 'param2'];
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useAsync(mockAsyncFn, true, mockParams as any)
    );
    
    // Should be loading initially
    expect(result.current.loading).toBeTruthy();
    
    // Wait for async operation to complete
    await waitForNextUpdate();
    
    // Should have called the function with params
    expect(mockAsyncFn).toHaveBeenCalledWith(...mockParams);
    
    // Should have data and not be loading
    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBeFalsy();
  });
  
  // Test reset function
  it('should reset state when reset is called', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockAsyncFn = jest.fn().mockResolvedValue(mockData);
    
    const { result, waitForNextUpdate } = renderHook(() => useAsync(mockAsyncFn));
    
    // Execute async function
    act(() => {
      result.current.execute();
    });
    
    // Wait for completion
    await waitForNextUpdate();
    
    // Should have data
    expect(result.current.data).toEqual(mockData);
    
    // Reset state
    act(() => {
      result.current.reset();
    });
    
    // Should be back to initial state
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBeFalsy();
    expect(result.current.error).toBeNull();
  });
}); 