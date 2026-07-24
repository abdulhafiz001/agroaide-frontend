import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

import type { LeafletCircle, LeafletMapHandle, LeafletMarker, LeafletPolygon } from './LeafletMap';

type LeafletMapProps = {
  center: { latitude: number; longitude: number };
  zoom?: number;
  markers?: LeafletMarker[];
  circles?: LeafletCircle[];
  polygons?: LeafletPolygon[];
  scrollEnabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

function buildSrcDoc(props: Required<Pick<LeafletMapProps, 'center' | 'zoom' | 'markers' | 'circles' | 'polygons' | 'scrollEnabled'>>) {
  const markersJson = JSON.stringify(
    props.markers.map((m) => ({
      lat: m.latitude,
      lng: m.longitude,
      title: m.title ?? '',
      description: m.description ?? '',
      color: m.color ?? '#57b346',
    })),
  );
  const circlesJson = JSON.stringify(
    props.circles.map((c) => ({
      lat: c.latitude,
      lng: c.longitude,
      radius: c.radiusMeters,
      color: c.color ?? '#e63946',
      fillOpacity: c.fillOpacity ?? 0.2,
    })),
  );
  const polygonsJson = JSON.stringify(
    props.polygons.map((p) => ({
      coords: p.coordinates.map((c) => [c.latitude, c.longitude]),
      color: p.color ?? '#57b346',
      fillOpacity: p.fillOpacity ?? 0.2,
    })),
  );

  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#map{margin:0;height:100%;width:100%}</style>
</head><body><div id="map"></div>
<script>
var map = L.map('map').setView([${props.center.latitude}, ${props.center.longitude}], ${props.zoom});
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
(${markersJson}).forEach(function(m){ L.marker([m.lat,m.lng]).addTo(map).bindPopup((m.title||'')+(m.description?('<br/>'+m.description):'')); });
(${circlesJson}).forEach(function(c){ L.circle([c.lat,c.lng],{radius:c.radius,color:c.color,fillColor:c.color,fillOpacity:c.fillOpacity,weight:1}).addTo(map); });
(${polygonsJson}).forEach(function(p){ L.polygon(p.coords,{color:p.color,fillColor:p.color,fillOpacity:p.fillOpacity,weight:2}).addTo(map); });
window.animateTo = function(lat,lng,zoom){ map.flyTo([lat,lng], zoom||map.getZoom(), {duration:0.6}); };
</script></body></html>`;
}

export const LeafletMap = forwardRef<LeafletMapHandle, LeafletMapProps>(function LeafletMapWeb(
  { center, zoom = 14, markers = [], circles = [], polygons = [], scrollEnabled = true, style },
  ref,
) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const srcDoc = useMemo(
    () => buildSrcDoc({ center, zoom, markers, circles, polygons, scrollEnabled }),
    [center.latitude, center.longitude, zoom, JSON.stringify(markers), JSON.stringify(circles), JSON.stringify(polygons), scrollEnabled],
  );

  useImperativeHandle(ref, () => ({
    animateToRegion: (region) => {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({
          type: 'animateTo',
          lat: region.latitude,
          lng: region.longitude,
          zoom,
        }),
        '*',
      );
      try {
        (iframeRef.current?.contentWindow as any)?.animateTo?.(region.latitude, region.longitude, zoom);
      } catch {
        // ignore
      }
    },
  }));

  useEffect(() => {
    // remount handled by key via srcDoc change
  }, [srcDoc]);

  return (
    <View style={[{ flex: 1, overflow: 'hidden' }, style as any]}>
      {/* @ts-expect-error web-only iframe */}
      <iframe
        ref={iframeRef as any}
        title="map"
        srcDoc={srcDoc}
        style={{ border: 0, width: '100%', height: '100%' }}
      />
    </View>
  );
});

export type { LeafletCircle, LeafletMapHandle, LeafletMarker, LeafletPolygon };
