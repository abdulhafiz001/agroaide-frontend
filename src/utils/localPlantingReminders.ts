import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

type LocalScheduleItem = {
  id: string;
  title: string;
  body: string;
  triggerAt: string;
};

/** Schedule local backup notifications for planting reminders (C: FCM + local). */
export async function scheduleLocalPlantingReminders(items: LocalScheduleItem[]): Promise<void> {
  if (Constants.appOwnership === 'expo') return;

  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      if (req.status !== 'granted') return;
    }

    for (const item of items) {
      const when = new Date(item.triggerAt);
      if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) continue;

      await Notifications.scheduleNotificationAsync({
        identifier: item.id,
        content: {
          title: item.title,
          body: item.body,
          data: { type: 'planting_reminder' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes?.DATE ?? 'date',
          date: when,
        },
      });
    }
  } catch {
    // Local scheduling is best-effort backup.
  }
}
