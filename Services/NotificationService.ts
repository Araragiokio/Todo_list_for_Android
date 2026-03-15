import cancelAllScheduledNotificationsAsync from "expo-notifications/build/cancelAllScheduledNotificationsAsync";
import cancelScheduledNotificationAsync from "expo-notifications/build/cancelScheduledNotificationAsync";
import getAllScheduledNotificationsAsync from "expo-notifications/build/getAllScheduledNotificationsAsync";
import { getPermissionsAsync, requestPermissionsAsync } from "expo-notifications/build/NotificationPermissions";
import scheduleNotificationAsync from "expo-notifications/build/scheduleNotificationAsync";

export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permission denied');
      return false;
    }
    return true;
  } catch (error) {
    console.log('Error requesting notification permission:', error);
    return false;
  }
};

export const checkNotificationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.log('Error checking notification permission:', error);
    return false;
  }
};

export const scheduleNotification = async (
  title: string,
  body: string,
  date: Date,
  taskId: string
): Promise<string | null> => {
  try {
    const permitted = await checkNotificationPermission();
    if (!permitted || date <= new Date()) return null;

    const id = await scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        data: { taskId },
      },
      trigger: {
        type: 'date' as any,
        date,
      },
    });
    return id;
  } catch (error) {
    console.log('Error scheduling notification:', error);
    return null;
  }
};

export const cancelNotification = async (notificationId: string): Promise<void> => {
  try {
    await cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.log('Error canceling scheduled notification:', error);
  }
};

export const cancelTaskNotifications = async (taskId: string): Promise<void> => {
  try {
    const notifications = await getAllScheduledNotificationsAsync();
    await Promise.all(
      notifications
        .filter(n => n.content.data?.taskId === taskId)
        .map(n => cancelScheduledNotificationAsync(n.identifier))
    );
  } catch (error) {
    console.log('Error canceling task notifications:', error);
  }
};

export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.log('Error canceling all scheduled notifications:', error);
  }
};
