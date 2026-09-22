// client/src/features/projects/projectsSlice.js
import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

export const projectsAdapter = createEntityAdapter({
  selectId: (project) => project._id,
});

export const fetchProjects = createAsyncThunk('projects/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/projects');
    return res.data.data.projects;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || { message: 'Failed to fetch projects' });
  }
});

export const createProject = createAsyncThunk('projects/create', async (projectData, { rejectWithValue }) => {
  try {
    const res = await api.post('/projects', projectData);
    return res.data.data.project;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || { message: 'Failed to create project' });
  }
});

export const fetchProjectById = createAsyncThunk('projects/fetchById', async (projectId, { rejectWithValue }) => {
  try {
    const res = await api.get(`/projects/${projectId}`);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || { message: 'Failed to fetch project' });
  }
});

const projectsSlice = createSlice({
  name: 'projects',
  initialState: projectsAdapter.getInitialState({
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    currentId: null,
    currentRole: null,
    error: null,
  }),
  reducers: {
    setCurrentProject: (state, action) => {
      state.currentId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchProjects.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProjects.fulfilled, (state, { payload }) => {
        projectsAdapter.setAll(state, payload);
        state.status = 'succeeded';
      })
      .addCase(fetchProjects.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error = payload;
      })
      // Create Project
      .addCase(createProject.fulfilled, (state, { payload }) => {
        projectsAdapter.addOne(state, payload);
      })
      // Fetch By ID
      .addCase(fetchProjectById.fulfilled, (state, { payload }) => {
        projectsAdapter.upsertOne(state, payload.project);
        state.currentId = payload.project._id;
        state.currentRole = payload.currentUserRole;
      });
  },
});

export const { setCurrentProject } = projectsSlice.actions;

export const {
  selectAll: selectAllProjects,
  selectById: selectProjectById,
  selectIds: selectProjectIds,
} = projectsAdapter.getSelectors((state) => state.projects);

export default projectsSlice.reducer;
