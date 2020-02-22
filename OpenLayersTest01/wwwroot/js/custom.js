PostcodesOSMInterop = {
    ShowMap: (divId, dotNetObject, basePostcode, postcodes) => {
        // Icons
        var baseIconStyle = new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [0.3, 1.2],
                anchorXUnits: 'fraction',
                anchorYUnits: 'fraction',
                scale: 1.6,
                src: 'icons/drop-pin-red.svg' 
            })
        });

        var postcodeIconStyle = new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [0.5, 1],
                anchorXUnits: 'fraction',
                anchorYUnits: 'fraction',
                scale: 1.4,
                src: 'icons/drop-pin-blue.svg'
            })
        });

        var targetIconStyle = new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [0.5, 1],
                anchorXUnits: 'fraction',
                anchorYUnits: 'fraction',
                scale: 1.6,
                src: 'icons/drop-pin-blue-glow.svg'
            })
        });


        // Locations and Vectors
        var baseLocation = new ol.Feature({
            geometry: new ol.geom.Point(ol.proj.transform([basePostcode.longitude, basePostcode.latitude], 'EPSG:4326', 'EPSG:3857')),
            postcode: basePostcode.postcode
        });
        
        var baseLocationVector = new ol.source.Vector({
            features: [baseLocation]
        });

        var postcodesVector = new ol.source.Vector();

        for (var i = 0; i < postcodes.length; i++) {
            var loc = new ol.Feature({
                geometry: new ol.geom.Point(ol.proj.transform([postcodes[i].longitude, postcodes[i].latitude], 'EPSG:4326', 'EPSG:3857')),
                postcode: postcodes[i].postcode
            });

            postcodesVector.addFeature(loc);
        }



        // Layers
        var mapLayer = new ol.layer.Tile({
            source: new ol.source.OSM()
        });

        var baseLocationLayer = new ol.layer.Vector({
            source: baseLocationVector,
            style: baseIconStyle
        });

        var postcodesLayer = new ol.layer.Vector({
            source: postcodesVector,
            style: postcodeIconStyle
        });


        // Mouse wheel requires CTRL keypress - referenced source uses ALT key
        // ref https://github.com/openlayers/openlayers/issues/7666
        var mouseInteraction = new ol.interaction.MouseWheelZoom();

        var oldFn = mouseInteraction.handleEvent;
        mouseInteraction.handleEvent = function (e) {
            var type = e.type;
            if (type !== "wheel" && type !== "wheel") {
                return true;
            }

            if (!e.originalEvent.ctrlKey) {
                return true
            }

            oldFn.call(this, e);
        }


        // The Map!
        var map = new ol.Map({
            interactions: ol.interaction.defaults({ mouseWheelZoom: false }).extend([mouseInteraction]),
            target: divId,
            layers: [mapLayer, postcodesLayer, baseLocationLayer],
            controls: ol.control.defaults({
                attributionOptions: {
                    collapsible: false
                }
            }),
            view: new ol.View({
                center: ol.proj.fromLonLat([basePostcode.longitude, basePostcode.latitude]),
                zoom: 14
            })
        });


        // Feature selection
        var select = new ol.interaction.Select({
            condition: ol.events.condition.click,
            layers: [postcodesLayer],
            style: targetIconStyle
        });

        map.addInteraction(select);

        select.on('select', function (e) {
            if (e.selected.length >= 1)
            {
                var selectedPostcode = e.selected[0].get('postcode');

                document.getElementById('dom-notified').innerHTML = selectedPostcode;

                dotNetObject.invokeMethodAsync('SetClickedPostcode', selectedPostcode)
            }
        });
    }
};