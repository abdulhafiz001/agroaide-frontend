import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import { sanitizeMapColor, sanitizeMapText, serializeForInlineScript } from '@/utils/mapSecurity';

export type LeafletMarker = {
  id?: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  color?: string;
};

export type LeafletCircle = {
  id?: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  color?: string;
  fillOpacity?: number;
};

export type LeafletPolygon = {
  coordinates: { latitude: number; longitude: number }[];
  color?: string;
  fillOpacity?: number;
  label?: string;
};

export type LeafletMapHandle = {
  animateToRegion: (
    region: { latitude: number; longitude: number; latitudeDelta?: number; longitudeDelta?: number },
    _duration?: number,
  ) => void;
  fitToPolygons: () => void;
};

type LeafletMapProps = {
  center: { latitude: number; longitude: number };
  zoom?: number;
  markers?: LeafletMarker[];
  circles?: LeafletCircle[];
  polygons?: LeafletPolygon[];
  scrollEnabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

function buildHtml({
  center,
  zoom,
  markers,
  circles,
  polygons,
  scrollEnabled,
}: Required<
  Pick<LeafletMapProps, 'center' | 'zoom' | 'markers' | 'circles' | 'polygons' | 'scrollEnabled'>
>): string {
  const markersJson = serializeForInlineScript(
    markers.map((m) => ({
      lat: m.latitude,
      lng: m.longitude,
      title: sanitizeMapText(m.title),
      description: sanitizeMapText(m.description),
      color: sanitizeMapColor(m.color, '#57b346'),
    })),
  );
  const circlesJson = serializeForInlineScript(
    circles.map((c) => ({
      lat: c.latitude,
      lng: c.longitude,
      radius: c.radiusMeters,
      color: sanitizeMapColor(c.color, '#e63946'),
      fillOpacity: c.fillOpacity ?? 0.2,
    })),
  );
  const polygonsJson = serializeForInlineScript(
    polygons.map((p) => ({
      coords: p.coordinates.map((c) => [c.latitude, c.longitude]),
      color: sanitizeMapColor(p.color, '#57b346'),
      fillOpacity: p.fillOpacity ?? 0.2,
      label: sanitizeMapText(p.label),
    })),
  );

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src https://unpkg.com 'unsafe-inline'; style-src https://unpkg.com 'unsafe-inline'; img-src https://*.tile.openstreetmap.org data:; connect-src 'none'; font-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #e8f5e9; }
    .leaflet-control-attribution { font-size: 10px; }
    .field-label {
      background: rgba(255,255,255,0.92);
      border: 1px solid #57b346;
      border-radius: 8px;
      padding: 2px 8px;
      font: 600 11px/1.3 system-ui, sans-serif;
      color: #1a3d12;
      box-shadow: 0 1px 4px rgba(0,0,0,.2);
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var scrollEnabled = ${scrollEnabled ? 'true' : 'false'};
    var map = L.map('map', {
      zoomControl: scrollEnabled,
      dragging: scrollEnabled,
      scrollWheelZoom: scrollEnabled,
      doubleClickZoom: scrollEnabled,
      boxZoom: scrollEnabled,
      keyboard: scrollEnabled
    }).setView([${center.latitude}, ${center.longitude}], ${zoom});

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    function markerIcon(color) {
      return L.divIcon({
        className: '',
        html: '<div style="width:18px;height:18px;border-radius:50%;background:' + color + ';border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });
    }

    var markers = ${markersJson};
    markers.forEach(function (m) {
      var marker = L.marker([m.lat, m.lng], { icon: markerIcon(m.color) }).addTo(map);
      var html = '';
      if (m.title) html += '<strong>' + m.title + '</strong>';
      if (m.description) html += (html ? '<br/>' : '') + m.description;
      if (html) marker.bindPopup(html);
    });

    var circles = ${circlesJson};
    circles.forEach(function (c) {
      L.circle([c.lat, c.lng], {
        radius: c.radius,
        color: c.color,
        fillColor: c.color,
        fillOpacity: c.fillOpacity,
        weight: 1
      }).addTo(map);
    });

    var polygons = ${polygonsJson};
    var polyLayers = [];
    polygons.forEach(function (p) {
      var poly = L.polygon(p.coords, {
        color: p.color,
        fillColor: p.color,
        fillOpacity: p.fillOpacity,
        weight: 2
      }).addTo(map);
      polyLayers.push(poly);
      if (p.label) {
        poly.bindTooltip(p.label, {
          permanent: true,
          direction: 'center',
          className: 'field-label',
          opacity: 1
        });
      }
      poly.on('click', function () {
        fitAll();
        try {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'farmTap' }));
          }
        } catch (e) {}
      });
    });

    function fitAll() {
      if (polyLayers.length === 0) {
        map.setView([${center.latitude}, ${center.longitude}], ${zoom});
        return;
      }
      var group = L.featureGroup(polyLayers);
      try { map.fitBounds(group.getBounds().pad(0.22), { animate: true, duration: 0.6 }); } catch (e) {}
    }

    if (polyLayers.length > 0) {
      fitAll();
    }

    setTimeout(function () { map.invalidateSize(); }, 120);

    function animateTo(lat, lng, zoomLevel) {
      map.flyTo([lat, lng], zoomLevel || map.getZoom(), { duration: 0.6 });
    }
    window.animateTo = animateTo;
    window.fitAll = fitAll;

    document.addEventListener('message', function (event) {
      try {
        var data = JSON.parse(event.data);
        if (data.type === 'animateTo') animateTo(data.lat, data.lng, data.zoom);
        if (data.type === 'fitAll') fitAll();
      } catch (e) {}
    });
    window.addEventListener('message', function (event) {
      try {
        var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.type === 'animateTo') animateTo(data.lat, data.lng, data.zoom);
        if (data.type === 'fitAll') fitAll();
      } catch (e) {}
    });
  </script>
</body>
</html>`;
}

export const LeafletMap = forwardRef<LeafletMapHandle, LeafletMapProps>(function LeafletMap(
  {
    center,
    zoom = 14,
    markers = [],
    circles = [],
    polygons = [],
    scrollEnabled = true,
    style,
  },
  ref,
) {
  const webRef = useRef<WebView>(null);

  const html = useMemo(
    () =>
      buildHtml({
        center,
        zoom,
        markers,
        circles,
        polygons,
        scrollEnabled,
      }),
    [center, zoom, markers, circles, polygons, scrollEnabled],
  );

  useImperativeHandle(ref, () => ({
    animateToRegion: (region) => {
      const nextZoom =
        region.latitudeDelta && region.latitudeDelta > 0
          ? Math.max(3, Math.min(18, Math.round(Math.log2(360 / region.latitudeDelta))))
          : zoom;
      webRef.current?.injectJavaScript(
        `window.animateTo && window.animateTo(${region.latitude}, ${region.longitude}, ${nextZoom}); true;`,
      );
    },
    fitToPolygons: () => {
      webRef.current?.injectJavaScript(`window.fitAll && window.fitAll(); true;`);
    },
  }));

  return (
    <WebView
      ref={webRef}
      originWhitelist={['about:blank', 'https://*']}
      source={{ html }}
      style={[{ flex: 1, backgroundColor: '#e8f5e9' }, style]}
      scrollEnabled={false}
      javaScriptEnabled
      domStorageEnabled={false}
      mixedContentMode="never"
      allowFileAccess={false}
      allowUniversalAccessFromFileURLs={false}
      onShouldStartLoadWithRequest={(request) => request.url === 'about:blank'}
      setSupportMultipleWindows={false}
      androidLayerType="hardware"
    />
  );
});
