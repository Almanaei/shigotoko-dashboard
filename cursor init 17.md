# Cursor Init 17 - Document Upload API Fix (Advanced)

## Summary of Actions Taken

This cursor initialization session identified and fixed a deeper issue with the document upload functionality in the Shigotoko Dashboard application. While the previous fix addressed part of the problem by correcting how FormData was being constructed at the API client level, this solution tackles the root cause at the global fetch utility level.

The error message that was still occurring:

```
TypeError: Content-Type was not one of "multipart/form-data" or "application/x-www-form-urlencoded".
    at async POST (app\api\documents\route.ts:108:21)
```

## Root Cause Analysis

After deeper investigation, the problem was identified in the `fetchAPI` utility function in `lib/api.ts` which serves as the foundation for all API calls in the application. 

The issue had two components:

1. **Global Content-Type Default**: The `fetchAPI` function was unconditionally setting a default `Content-Type: application/json` header for all requests.

2. **FormData Auto Headers Interference**: When `FormData` is used with the `fetch` API, browsers need to automatically generate a `Content-Type` header with a special format that includes a unique boundary parameter (e.g., `multipart/form-data; boundary=----WebKitFormBoundaryXYZ123`). The manually set `application/json` header was conflicting with this.

This explains why the error was occurring at line 108 in `app/api/documents/route.ts` when attempting to parse the form data from the request.

## Solution Implemented

The solution was to modify the `fetchAPI` utility function to conditionally set the `Content-Type` header based on the request body type:

```typescript
// Utility function for making API requests
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Initialize headers based on request body type
  let defaultHeaders = {};
  
  // Don't set Content-Type header if FormData is being sent
  // Let the browser set it automatically with the boundary parameter
  if (!(options.body instanceof FormData)) {
    defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }
  
  // ... rest of the function
  
  const response = await fetch(timestampedUrl, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    },
    credentials: 'include',
  });
  
  // ... rest of the function
}
```

This change ensures that:
1. For regular JSON requests, the `Content-Type: application/json` header is set
2. For FormData requests, no Content-Type header is set, allowing the browser to automatically add the correct multipart/form-data header with the boundary parameter

## Technical Details

### How FormData and Content-Type Work Together

When sending a `FormData` object in a fetch request, the browser needs to:

1. Generate a unique boundary string (e.g., `----WebKitFormBoundaryXYZ123`)
2. Format the request body using this boundary to separate form fields
3. Set the Content-Type header to `multipart/form-data; boundary=----WebKitFormBoundaryXYZ123`

This process is automatic, but only works if:
- No Content-Type header is manually specified, OR
- The exact correct Content-Type with matching boundary is specified (which is nearly impossible from the client side since boundaries are generated internally by the browser)

### Why the First Fix Was Incomplete

The previous fix in `documentAPI.upload` removed the headers from that specific function, which helped, but didn't address the root cause in the base `fetchAPI` function. That's why the error might still occur in other areas of the application where FormData is used.

## Testing Results

The document upload functionality now works correctly with these improvements:

1. Files upload successfully from the document upload form
2. The FormData is properly transmitted to the server with the correct Content-Type header
3. The server can successfully parse the form data and extract the file and other fields

## Lessons Learned

1. **Global Utilities Need Special Care**: Base utilities like `fetchAPI` need to accommodate different data formats and special cases.

2. **API Client Implementation Patterns**: When designing API client libraries:
   - Be aware of the special case of FormData uploads
   - Don't assume all requests will be JSON
   - Allow transport mechanisms to set appropriate headers automatically when needed

3. **Error Tracing**: The error stack trace was critical in pinpointing exactly where the issue was occurring (at the form data parsing level on the server).

## Future Recommendations

1. **API Client Refactoring**
   - Consider using a more structured API client library that handles different data formats automatically
   - Add more explicit typing for request and response body types

2. **Monitoring and Logging**
   - Add more detailed logging around file uploads to catch similar issues early
   - Consider implementing client-side telemetry for tracking API call success rates

3. **Enhanced Error Handling**
   - Implement more specific error handling for upload-related issues
   - Add client-side validation to prevent problematic uploads before they reach the server

This fix ensures that not just document uploads, but any future use of FormData throughout the application will work correctly. 