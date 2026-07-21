export type NotificationRoute =
  | { pathname: '/(app)/outbreak-map'; params?: Record<string, string> }
  | { pathname: '/(app)/weather-detail'; params?: Record<string, string> }
  | { pathname: '/(app)/(tabs)/calendar'; params?: Record<string, string> }
  | { pathname: '/(app)/farm-scan'; params?: Record<string, string> }
  | { pathname: '/(app)/(tabs)/advisor'; params?: Record<string, string> }
  | { pathname: '/(app)/notifications'; params?: Record<string, string> };

export function routeForNotification(
  type?: string,
  data?: Record<string, unknown> | null,
  extras?: { title?: string; message?: string },
): NotificationRoute {
  const title = extras?.title ? String(extras.title) : undefined;
  const message = extras?.message ? String(extras.message) : undefined;

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
