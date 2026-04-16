const CoastalMap = ({ lat = 9.62, lng = 79.31, zoom = 9, title = "Coastal map" }) => {
  const bbox = `${lng - 0.25}%2C${lat - 0.18}%2C${lng + 0.25}%2C${lat + 0.18}`;
  const marker = `${lat}%2C${lng}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`;

  return (
    <div className="coastal-map-shell" aria-label={title}>
      <iframe title={title} src={src} className="coastal-map-frame" loading="lazy" />
    </div>
  );
};

export default CoastalMap;
