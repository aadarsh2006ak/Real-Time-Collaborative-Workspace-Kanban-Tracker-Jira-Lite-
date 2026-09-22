// client/src/hooks/useProjectSocket.js
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { connectSocket } from '../lib/socket';
import { taskReceived, taskRemoved, fetchTasks } from '../features/tasks/tasksSlice';
import {
  presenceSet,
  userLeft,
  typingSet,
  clearPresence,
} from '../features/presence/presenceSlice';
import {
  commentReceived,
  commentUpdated,
  commentRemoved,
} from '../features/comments/commentsSlice';
import { activityReceived } from '../features/activity/activitySlice';
import { notificationReceived } from '../features/notifications/notificationsSlice';

/**
 * Custom hook connecting Socket.io, joining project rooms, handling real-time CRUD and presence
 */
export function useProjectSocket(projectId) {
  const dispatch = useDispatch();
  const accessToken = useSelector((state) => state.auth.accessToken);

  useEffect(() => {
    if (!projectId || !accessToken) return;

    const socket = connectSocket(() => accessToken);

    const joinRoom = () => {
      socket.emit('project:join', { projectId }, (res) => {
        if (!res || !res.ok) return;

        // Sync online presence
        dispatch(presenceSet(res.online));

        // Resync tasks to catch any updates that occurred during disconnect
        dispatch(fetchTasks(projectId));
      });
    };

    socket.on('connect', joinRoom);
    if (socket.connected) {
      joinRoom();
    }

    // Real-time Event Subscriptions
    const handlers = {
      'task:created': (p) => p?.task && dispatch(taskReceived(p.task)),
      'task:updated': (p) => p?.task && dispatch(taskReceived(p.task)),
      'task:moved': (p) => p?.task && dispatch(taskReceived(p.task)),
      'task:deleted': (p) => p?.taskId && dispatch(taskRemoved(p.taskId)),
      'comment:created': (p) => p?.comment && dispatch(commentReceived(p.comment)),
      'comment:updated': (p) => p?.comment && dispatch(commentUpdated(p.comment)),
      'comment:deleted': (p) => p?.commentId && dispatch(commentRemoved(p.commentId)),
      'activity:new': (p) => p?.activity && dispatch(activityReceived(p.activity)),
      'notification:new': (p) => p?.notification && dispatch(notificationReceived(p.notification)),
      'presence:update': (p) => p?.online && dispatch(presenceSet(p.online)),
      'presence:left': (p) => p?.userId && dispatch(userLeft(p.userId)),
      'typing': (p) => dispatch(typingSet(p)),
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    // Cleanup listeners and leave room on unmount to prevent memory leaks
    return () => {
      socket.off('connect', joinRoom);
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
      socket.emit('project:leave', { projectId });
      dispatch(clearPresence());
    };
  }, [projectId, accessToken, dispatch]);
}
