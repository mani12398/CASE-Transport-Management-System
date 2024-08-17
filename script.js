document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('processExcelBtn').disabled = true;
    document.getElementById('refreshFiltersBtn').disabled = true;

    document.getElementById('fileUpload').addEventListener('change', function () {
        var fileName = this.files[0] ? this.files[0].name : '';
        document.getElementById('fileNameDisplay').innerText = fileName;

        if (fileName) {
            document.getElementById('processExcelBtn').disabled = false;
            document.getElementById('refreshFiltersBtn').disabled = false;
        } else {
            document.getElementById('processExcelBtn').disabled = true;
            document.getElementById('refreshFiltersBtn').disabled = true;
        }
    });

    document.getElementById('fileLabel').addEventListener('mouseover', function () {
        this.style.backgroundColor = '#0056b3'; 
    });

    document.getElementById('fileLabel').addEventListener('mouseout', function () {
        this.style.backgroundColor = '#007bff'; 
    });

    
    document.getElementById('all').addEventListener('change', async function () {
        showLoadingBar(); 
        const allChecked = this.checked;
        document.querySelectorAll('input[type="checkbox"]:not(#all)').forEach(checkbox => {
            checkbox.checked = allChecked;
        });
        await updateMap(); 
        hideLoadingBar(); 
    });

    document.querySelectorAll('input[type="checkbox"]:not(#all)').forEach(checkbox => {
        checkbox.addEventListener('change', async function () {
            showLoadingBar(); 

            if (!this.checked) {
                document.getElementById('all').checked = false;
            }

            
            if (document.querySelectorAll('input[type="checkbox"]:not(#all):checked').length === document.querySelectorAll('input[type="checkbox"]:not(#all)').length) {
                document.getElementById('all').checked = true;
            }

            await updateMap(); 
            hideLoadingBar(); 
        });
    });
});
var map;
var currentLocationMarker;
var markers = [];  
var addresses = []; 
var markerCluster; 
var darkModeStyle = [
    {
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#212121"
            }
        ]
    },
    {
        "elementType": "labels.icon",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#757575"
            }
        ]
    },
    {
        "elementType": "labels.text.stroke",
        "stylers": [
            {
                "color": "#212121"
            }
        ]
    },
    {
        "featureType": "administrative",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#757575"
            }
        ]
    },
    {
        "featureType": "administrative.country",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#9e9e9e"
            }
        ]
    },
    {
        "featureType": "administrative.land_parcel",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#bdbdbd"
            }
        ]
    },
    {
        "featureType": "administrative.neighborhood",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#6d6d6d"
            }
        ]
    },
    {
        "featureType": "poi",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#9e9e9e"
            }
        ]
    },
    {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#181818"
            }
        ]
    },
    {
        "featureType": "poi.park",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#616161"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#2c2c2c"
            }
        ]
    },
    {
        "featureType": "road.arterial",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#ffffff"
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#616161"
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#ffffff"
            }
        ]
    },
    {
        "featureType": "transit",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#2c2c2c"
            }
        ]
    },
    {
        "featureType": "transit.station",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#ffffff"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#000000"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#3d3d3d"
            }
        ]
    }
];

function initMap() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            map = new google.maps.Map(document.getElementById('map'), {
                zoom: 15,
                center: userLocation,
                styles: darkModeStyle
            });

            currentLocationMarker = new google.maps.Marker({
                position: userLocation,
                map: map,
                title: 'Your Location'
            });

        }, function () {
            handleLocationError(true, map.getCenter());
        });
    } else {
        handleLocationError(false, map.getCenter());
    }
}

function handleLocationError(browserHasGeolocation, pos) {
    var infoWindow = new google.maps.InfoWindow({
        map: map,
        position: pos,
        content: browserHasGeolocation ?
            'Error: The Geolocation service failed.' :
            'Error: Your browser doesn\'t support geolocation.'
    });
    map.setCenter(pos);
}

async function processExcel() {
    showLoadingBar();
    console.log('Processing Excel file...');
    
    var fileUpload = document.getElementById('fileUpload');
    var reader = new FileReader();

    reader.onload = async function (e) {
        var data = new Uint8Array(e.target.result);
        var workbook = XLSX.read(data, { type: 'array' });

        var firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        addresses = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        if (currentLocationMarker) {
            currentLocationMarker.setMap(null);
        }

        await updateMap(); 
        console.log('Map updated, hiding loading bar...');
        hideLoadingBar();
    };

    reader.readAsArrayBuffer(fileUpload.files[0]);
}

function initMap() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            map = new google.maps.Map(document.getElementById('map'), {
                zoom: 15,
                center: userLocation,
                styles: darkModeStyle
            });

            currentLocationMarker = new google.maps.Marker({
                position: userLocation,
                map: map,
                title: 'Your Location'
            });

        }, function () {
            handleLocationError(true, map.getCenter());
        });
    } else {
        handleLocationError(false, map.getCenter());
    }
}

function handleLocationError(browserHasGeolocation, pos) {
    var infoWindow = new google.maps.InfoWindow({
        map: map,
        position: pos,
        content: browserHasGeolocation ?
            'Error: The Geolocation service failed.' :
            'Error: Your browser doesn\'t support geolocation.'
    });
    map.setCenter(pos);
}

async function processExcel() {
    showLoadingBar();
    console.log('Processing Excel file...');
    
    var fileUpload = document.getElementById('fileUpload');
    var reader = new FileReader();

    reader.onload = async function (e) {
        var data = new Uint8Array(e.target.result);
        var workbook = XLSX.read(data, { type: 'array' });

        var firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        addresses = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        if (currentLocationMarker) {
            currentLocationMarker.setMap(null);
        }

        await updateMap(); 
        console.log('Map updated, hiding loading bar...');
        hideLoadingBar();
    };

    reader.readAsArrayBuffer(fileUpload.files[0]);
}

function updateMap() {
    return new Promise((resolve) => {
        clearMarkers(); 
        var filters = getFilters();
        var count = 0;
        var validMarkers = [];
        var tableBody = document.querySelector('#addressTable tbody');
        tableBody.innerHTML = ''; 

        let geocodePromises = [];

        addresses.forEach((row, index) => {
            if (index === 0) return; 
            var address = row[0];
            var degreeLevel = row[1];
            var departmentName = row[2];
            var gender = row[3];
            var studentName = row[4]; 
            var mobileNo = row[5];
             
            mobileNo = mobileNo.toString().padStart(11, '0');
            mobileNo = mobileNo.replace(/^(\d{4})(\d{7})$/, '$1-$2');

            if (applyFilters(degreeLevel, departmentName, gender, filters)) {
                count++;
                console.log('Geocoding address:', address);

                geocodePromises.push(
                    new Promise((resolveGeocode) => {
                        geocodeAddress(address, function (lat, lng, formattedAddress) {
                            console.log('Geocoded address:', formattedAddress, 'Lat:', lat, 'Lng:', lng);

                            var tableRow = document.createElement('tr');
                            tableRow.innerHTML = `
                                <td>${formattedAddress}</td>
                                <td>${degreeLevel}</td>
                                <td>${departmentName}</td>
                                <td>${gender}</td>
                                <td>${studentName}</td>
                                <td>${mobileNo}</td>
                            `;
                            tableBody.appendChild(tableRow);

                            if (lat !== null && lng !== null) {
                                var marker = new google.maps.Marker({
                                    position: { lat: lat, lng: lng },
                                    map: map
                                });
                                markers.push(marker); 
                                validMarkers.push(marker);
                            }

                            resolveGeocode();
                        });
                    }).catch((error) => {
                        console.error('Error in geocoding:', error);
                        resolveGeocode(); 
                    })
                );
            }
        });

        Promise.all(geocodePromises).then(() => {
            document.getElementById('countDisplay').innerText = `Total Students: ${count}`;

            markerCluster = new MarkerClusterer(map, validMarkers, {
                imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
            });

            console.log('All geocoding promises resolved.');
            resolve(); 
        }).catch((error) => {
            console.error('Error in processing geocoding promises:', error);
            resolve(); 
        });
    });
}

function getFilters() {
    return {
        male: document.getElementById('male').checked,
        female: document.getElementById('female').checked,
        ug: document.getElementById('ug').checked,
        g: document.getElementById('g').checked,
        pg: document.getElementById('pg').checked,
        cs: document.getElementById('cs').checked,
        ee: document.getElementById('ee').checked,
        mg: document.getElementById('mg').checked,
        sh: document.getElementById('sh').checked,
        amhs: document.getElementById('amhs').checked,
    };
}

function applyFilters(degreeLevel, departmentName, gender, filters) {
    var genderMatch = (gender === 'M' && filters.male) || (gender === 'F' && filters.female);
    var degreeMatch = (degreeLevel === 'UG' && filters.ug) || (degreeLevel === 'G' && filters.g) || (degreeLevel === 'PG' && filters.pg);
    var departmentMatch = (departmentName === 'CS' && filters.cs) ||
        (departmentName === 'EE' && filters.ee) ||
        (departmentName === 'MG' && filters.mg) ||
        (departmentName === 'SH' && filters.sh) ||
        (departmentName === 'AMHS' && filters.amhs);

    return genderMatch && degreeMatch && departmentMatch;
}

function geocodeAddress(address, callback) {
    var geocoder = new google.maps.Geocoder();

    geocoder.geocode({ 'address': address }, function (results, status) {
        if (status === 'OK') {
            var lat = results[0].geometry.location.lat();
            var lng = results[0].geometry.location.lng();
            var formattedAddress = results[0].formatted_address; 
            callback(lat, lng, formattedAddress); 
        } else {
            console.error('Geocode was not successful for the following reason:', status);
            callback(null, null, address); 
        }
    });
}

function addMarker(lat, lng) {
    var location = { lat: lat, lng: lng };
    var marker = new google.maps.Marker({
        position: location,
        map: map  
    });

    markers.push(marker);  

    return marker; 
}

function clearMarkers() {
    if (markerCluster) {
        markerCluster.clearMarkers(); 
    }
    markers.forEach(marker => marker.setMap(null)); 
    markers = [];  
}

async function refreshFilters() {
    showLoadingBar();
    console.log('Refreshing filters...');
    
    document.getElementById('all').checked = true;
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = true;
    });

    var tableBody = document.querySelector('#addressTable tbody');
    tableBody.innerHTML = '';

    await updateMap(); 
    console.log('Filters refreshed, hiding loading bar...');
    hideLoadingBar();
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const debouncedUpdateMap = debounce(updateMap, 300);


function showLoadingBar() {
    console.log('Showing loading bar...');
    document.getElementById('loading-bar').style.display = 'block';
}


function hideLoadingBar() {
    console.log('Hiding loading bar...');
    document.getElementById('loading-bar').style.display = 'none';
}