export function displayMap(locations) {
  mapboxgl.accessToken =
    'pk.eyJ1IjoibWFzdGVyaGVpIiwiYSI6ImNsenZncHpqeTA1ZXkyam9kOTB5Z3UxMWoifQ.wqZwyWbu3-6-fnL_MLD0cw';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/masterhei/clzvj9e2v000k01qsafcv1oaq',
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();
  locations.forEach((loc) => {
    const el = document.createElement('div');
    el.className = 'marker';

    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
}
