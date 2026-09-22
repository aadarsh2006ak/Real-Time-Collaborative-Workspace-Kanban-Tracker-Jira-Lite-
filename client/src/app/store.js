// client/src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import projectsReducer from '../features/projects/projectsSlice';
import tasksReducer from '../features/tasks/tasksSlice';
import uiReducer from '../features/ui/uiSlice';
import presenceReducer from '../features/presence/presenceSlice';
import commentsReducer from '../features/comments/commentsSlice';
import activityReducer from '../features/activity/activitySlice';
import notificationsReducer from '../features/notifications/notificationsSlice';
import analyticsReducer from '../features/analytics/analyticsSlice';
import { injectStore } from '../lib/api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectsReducer,
    tasks: tasksReducer,
    ui: uiReducer,
    presence: presenceReducer,
    comments: commentsReducer,
    activity: activityReducer,
    notifications: notificationsReducer,
    analytics: analyticsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Inject store instance into Axios interceptor to avoid circular dependency
injectStore(store);

export default store;
