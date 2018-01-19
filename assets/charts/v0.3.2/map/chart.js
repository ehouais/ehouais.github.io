define(['leaflet'], function(L) {
    return function(container, params) {
        var $map = document.createElement('div'),
            map,
            markers = L.layerGroup();

        $map.setAttribute('id', 'map');
        container.appendChild($map);

        map = L.map('map').setView([46.86, 2.75], 5);
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        map.addLayer(markers);

        return {
            update: function(dataset) {
                var locations = [];
                markers.clearLayers();

                dataset.rows.forEach(function(row) {
                    var lat = row[0],
                        lng = row[1];

                    locations.push({lat: lat, lng: lng});
                    markers.addLayer(L.marker([lat, lng]).addTo(map).bindPopup(row[2]));
                });
                map.fitBounds(new L.LatLngBounds(locations), {padding: [50, 50]});
            },
            resize: function() {
                map.invalidateSize();
            }
        };
    };
});
