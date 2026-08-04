import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { routeForNotification } from './notificationRouting';

describe('routeForNotification', () => {
  it('routes disease outbreak and warning to outbreak map', () => {
    const outbreak = routeForNotification('disease_outbreak', {
      disease: 'Late Blight',
      crop: 'Tomato',
      level: 'outbreak',
    }, { title: 'Outbreak alert', message: 'Act now' });

    assert.equal(outbreak.pathname, '/(app)/outbreak-map');
    assert.equal(outbreak.params?.disease, 'Late Blight');
    assert.equal(outbreak.params?.title, 'Outbreak alert');

    const warning = routeForNotification('disease_warning', { disease: 'Rust' });
    assert.equal(warning.pathname, '/(app)/outbreak-map');
  });

  it('routes weather alerts to weather detail with payload', () => {
    const route = routeForNotification(
      'weather',
      { severity: 'High' },
      { title: 'Heavy rain', message: 'Delay spraying' },
    );

    assert.equal(route.pathname, '/(app)/weather-detail');
    assert.equal(route.params?.title, 'Heavy rain');
    assert.equal(route.params?.severity, 'High');
  });

  it('routes scan results and task reminders', () => {
    assert.equal(
      routeForNotification('scan_result', { scanId: '42' }).pathname,
      '/(app)/farm-scan',
    );
    assert.equal(
      routeForNotification('scan_result', { scanId: '42' }).params?.scanId,
      '42',
    );
    assert.equal(routeForNotification('task_reminder').pathname, '/(app)/(tabs)/calendar');
  });

  it('routes crop watch planting alerts to notification detail', () => {
    const route = routeForNotification(
      'crop_watch_planting',
      { crop: 'Maize', bestPlantDate: '2026-05-01', canSetReminder: true, watchId: 3 },
      { title: 'Plant maize', message: 'Good window', id: 9 },
    );
    assert.equal(route.pathname, '/(app)/notification-detail');
    assert.equal(route.params?.crop, 'Maize');
    assert.equal(route.params?.bestPlantDate, '2026-05-01');
    assert.equal(route.params?.id, '9');
  });

  it('falls back to notifications list for unknown types', () => {
    assert.equal(routeForNotification('unknown_type').pathname, '/(app)/notifications');
  });
});
