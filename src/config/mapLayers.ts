export interface MapLayer {
  id: string;
  name: string;
  path: string;
  color: string;
  fillColor: string;
  weight: number;
  fillOpacity: number;
  level: 'state' | 'district' | 'cluster';
}

export const mapLayers: MapLayer[] = [
  {
    id: 'maharashtra',
    name: 'Maharashtra',
    path: '/geojson/maharashtra.geojson',
    color: '#1B5E20',
    fillColor: '#66BB6A',
    weight: 3,
    fillOpacity: 0.1,
    level: 'state'
  },
  {
    id: 'districts',
    name: 'Districts',
    path: '/geojson/districts.geojson',
    color: '#2E7D32',
    fillColor: '#81C784',
    weight: 2,
    fillOpacity: 0.2,
    level: 'district'
  },
  {
    id: 'cluster1',
    name: 'Cluster 1',
    path: '/geojson/cluster1.geojson',
    color: '#388E3C',
    fillColor: '#A5D6A7',
    weight: 2,
    fillOpacity: 0.3,
    level: 'cluster'
  },
  {
    id: 'cluster2',
    name: 'Cluster 2',
    path: '/geojson/cluster2.geojson',
    color: '#43A047',
    fillColor: '#C8E6C9',
    weight: 2,
    fillOpacity: 0.3,
    level: 'cluster'
  },
  {
    id: 'cluster3',
    name: 'Cluster 3',
    path: '/geojson/cluster3.geojson',
    color: '#66BB6A',
    fillColor: '#DCEDC8',
    weight: 2,
    fillOpacity: 0.3,
    level: 'cluster'
  },
  {
    id: 'cluster4',
    name: 'Cluster 4',
    path: '/geojson/cluster4.geojson',
    color: '#7CB342',
    fillColor: '#E8F5E9',
    weight: 2,
    fillOpacity: 0.3,
    level: 'cluster'
  },
  {
    id: 'cluster5',
    name: 'Cluster 5',
    path: '/geojson/cluster5.geojson',
    color: '#8BC34A',
    fillColor: '#F1F8E9',
    weight: 2,
    fillOpacity: 0.3,
    level: 'cluster'
  },
  {
    id: 'cluster6',
    name: 'Cluster 6',
    path: '/geojson/cluster6.geojson',
    color: '#9CCC65',
    fillColor: '#C5E1A5',
    weight: 2,
    fillOpacity: 0.3,
    level: 'cluster'
  },
  {
    id: 'cluster7',
    name: 'Cluster 7',
    path: '/geojson/cluster7.geojson',
    color: '#AED581',
    fillColor: '#DCE775',
    weight: 2,
    fillOpacity: 0.3,
    level: 'cluster'
  }
];

export const MAHARASHTRA_CENTER: [number, number] = [19.7515, 75.7139];
export const MAHARASHTRA_ZOOM = 7;
