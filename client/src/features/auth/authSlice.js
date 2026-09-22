// client/src/features/auth/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login', credentials);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || { message: 'Login failed' });
  }
});

export const restoreSession = createAsyncThunk('auth/restore', async (_, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/refresh');
    const data = res.data.data;
    if (!data.user && data.accessToken) {
      const meRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${data.accessToken}` },
      });
      data.user = meRes.data.data.user;
    }
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || { message: 'Session expired' });
  }
});

const getSavedUser = () => {
  try {
    return JSON.parse(localStorage.getItem('jl_user') || 'null');
  } catch {
    return null;
  }
};

const initialState = {
  user: getSavedUser(),
  accessToken: null,
  status: 'idle', // 'idle' | 'loading' | 'authenticated' | 'unauthenticated'
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    tokenRefreshed: (state, action) => {
      state.accessToken = action.payload;
      state.status = 'authenticated';
    },
    loggedOut: (state) => {
      state.user = null;
      state.accessToken = null;
      state.status = 'unauthenticated';
      state.error = null;
      try {
        localStorage.removeItem('jl_user');
      } catch {
        // ignore
      }
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, { payload }) => {
        state.user = payload.user;
        state.accessToken = payload.accessToken;
        state.status = 'authenticated';
        state.error = null;
        if (payload.user) {
          try {
            localStorage.setItem('jl_user', JSON.stringify(payload.user));
          } catch {
            // ignore
          }
        }
      })
      .addCase(login.rejected, (state, { payload }) => {
        state.status = 'unauthenticated';
        state.error = payload;
        try {
          localStorage.removeItem('jl_user');
        } catch {
          // ignore
        }
      })
      .addCase(restoreSession.fulfilled, (state, { payload }) => {
        if (payload.user) {
          state.user = payload.user;
          try {
            localStorage.setItem('jl_user', JSON.stringify(payload.user));
          } catch {
            // ignore
          }
        }
        state.accessToken = payload.accessToken;
        state.status = 'authenticated';
      })
      .addCase(restoreSession.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.status = 'unauthenticated';
        try {
          localStorage.removeItem('jl_user');
        } catch {
          // ignore
        }
      });
  },
});

export const { tokenRefreshed, loggedOut, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
