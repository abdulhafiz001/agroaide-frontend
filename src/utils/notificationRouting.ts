export type NotificationRoute =
  | { pathname: '/(app)/outbreak-map'; params?: Record<string, string> }
  | { pathname: '/(app)/weather-detail'; params?: Record<string, string> }
  | { pathname: '/(app)/(tabs)/calendar'; params?: Record<string, string> }
  | { pathname: '/(app)/farm-scan'; params?: Record<string, string> }
  | { pathname: '/(app)/(tabs)/advisor'; params?: Record<string, string> }
  | { pathname: '/(app)/notification-detail'; params?: Record<string, string> }
  | { pathname: '/(app)/notifications'; params?: Record<string, string> };

export function routeForNotification(
  type?: string,
  data?: Record<string, unknown> | null,
  extras?: { title?: string; message?: string; id?: string | number },
): NotificationRoute {
  const title = extras?.title ? String(extras.title) : undefined;
  const message = extras?.message ? String(extras.message) : undefined;
  const id = extras?.id != null ? String(extras.id) : undefined;

  const detailTypes = new Set([
    'crop_watch_planting',
    'crop_watch_season_passed',
    'crop_watch_invalid',
    'planting_window',
    'planting_reminder',
  ]);

  if (type && detailTypes.has(type)) {
    return {
      pathname: '/(app)/notification-detail',
      params: {
        ...(id ? { id } : {}),
        ...(type ? { type } : {}),
        ...(title ? { title } : {}),
        ...(message ? { message } : {}),
        ...(data?.crop ? { crop: String(data.crop) } : {}),
        ...(data?.analysis ? { analysis: String(data.analysis) } : {}),
        ...(data?.bestPlantDate ? { bestPlantDate: String(data.bestPlantDate) } : {}),
        ...(data?.plantOn ? { bestPlantDate: String(data.plantOn) } : {}),
        ...(data?.canSetReminder != null ? { canSetReminder: String(data.canSetReminder) } : {}),
        ...(data?.watchId ? { watchId: String(data.watchId) } : {}),
      },
    };
  }

  switch (type) {
    case 'disease_outbreak':
    case 'disease_warning':
      return {
        pathname: '/(app)/outbreak-map',
        params: {
          ...(data?.disease ? { disease: String(data.disease) } : {}),
          ...(data?.crop ? { crop: String(data.crop) } : {}),
          ...(data?.level ? { level: String(data.level) } : {}),
          ...(title ? { title } : {}),
          ...(message ? { message } : {}),
        },
      };
    case 'task_reminder':
      return { pathname: '/(app)/(tabs)/calendar' };
    case 'scan_result':
      return {
        pathname: '/(app)/farm-scan',
        params: data?.scanId ? { scanId: String(data.scanId) } : undefined,
      };
    case 'ai_insight':
    case 'ai':
      return { pathname: '/(app)/(tabs)/advisor' };
    case 'weather':
      return {
        pathname: '/(app)/weather-detail',
        params: {
          ...(title ? { title } : {}),
          ...(message ? { message } : {}),
          ...(data?.severity ? { severity: String(data.severity) } : {}),
        },
      };
    default:
      return { pathname: '/(app)/notifications' };
  }
}
