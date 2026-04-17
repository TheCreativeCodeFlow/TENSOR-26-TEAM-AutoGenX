const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const CoastalMap = ({ lat = 9.62, lng = 79.31, title = "Coastal map" }) => {
  // Keep map centered only within Indian maritime region.
  const clampedLat = clamp(Number(lat) || 15.0, 5.0, 25.0);
  const clampedLng = clamp(Number(lng) || 80.0, 66.0, 94.0);

  const halfLng = 0.55;
  const halfLat = 0.4;
  const bbox = `${(clampedLng - halfLng).toFixed(4)}%2C${(clampedLat - halfLat).toFixed(4)}%2C${(clampedLng + halfLng).toFixed(4)}%2C${(clampedLat + halfLat).toFixed(4)}`;
  const marker = `${clampedLat.toFixed(6)}%2C${clampedLng.toFixed(6)}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`;

  return (
    <div className="coastal-map-shell" aria-label={title}>
      <iframe title={title} src={src} className="coastal-map-frame" loading="lazy" />
    </div>
  );
};

export default CoastalMap;
