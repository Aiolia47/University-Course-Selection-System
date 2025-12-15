import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

// Base query with authentication
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/v1',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;

    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }

    headers.set('content-type', 'application/json');
    return headers;
  },
});

// Base query with error handling
const baseQueryWithAuth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);

  // Handle 401 errors
  if (result.error && result.error.status === 401) {
    // Try to refresh the token
    const refreshResult = await baseQuery(
      {
        url: '/auth/refresh',
        method: 'POST',
        body: {
          refreshToken: (api.getState() as RootState).auth.refreshToken,
        },
      },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      // Store the new token - would need to implement token update action
      // api.dispatch(authSlice.actions.setToken(refreshResult.data.token));

      // Retry the original request
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Token refresh failed, logout the user - would need to dispatch logout action
      // api.dispatch(logoutAsync());

      // Clear invalid tokens from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');

      // Redirect to login page would be handled by the auth slice
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['User', 'Course', 'Selection'],
  endpoints: () => ({}),
});