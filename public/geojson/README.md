# GeoJSON Files Directory

Place your GeoJSON files in this directory with the following names:

## Required Files

1. `maharashtra.geojson` - Maharashtra state boundary
2. `districts.geojson` - District boundaries
3. `cluster1.geojson` - Cluster 1 boundaries
4. `cluster2.geojson` - Cluster 2 boundaries
5. `cluster3.geojson` - Cluster 3 boundaries
6. `cluster4.geojson` - Cluster 4 boundaries
7. `cluster5.geojson` - Cluster 5 boundaries
8. `cluster6.geojson` - Cluster 6 boundaries
9. `cluster7.geojson` - Cluster 7 boundaries

## File Format

All files should be valid GeoJSON format:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Example Name",
        "id": "example_id"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[...]]
      }
    }
  ]
}
```

## Customization

To customize layer names, colors, or add more layers, edit:
`src/config/mapLayers.ts`
