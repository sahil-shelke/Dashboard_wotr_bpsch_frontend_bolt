export interface MapLayer {
  id: string;
  name: string;
  path: string;
  color: string;
  fillColor: string;
  weight: number;
  fillOpacity: number;
  level: 'state' | 'district';
}

export const mapLayers: MapLayer[] = [
  {
    id: 'maharashtra',
    name: 'Maharashtra',
    path: '/geojson/maharashtra.geojson',
    color: '#000000',
    fillColor: 'transparent',
    weight: 3,
    fillOpacity: 0,
    level: 'state'
  },
  {
    id: 'districts',
    name: 'Districts',
    path: '/geojson/districts.geojson',
    color: '#000000',
    fillColor: 'transparent',
    weight: 2,
    fillOpacity: 0,
    level: 'district'
  }
];

export const MAHARASHTRA_CENTER: [number, number] = [19.7515, 75.7139];
export const MAHARASHTRA_ZOOM = 7;
