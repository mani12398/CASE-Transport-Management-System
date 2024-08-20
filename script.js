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
var map = null;
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
            console.log(map);  
            if (!(map instanceof google.maps.Map)) {
                console.error("The map is not a valid Google Maps instance.");
            }
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
document.addEventListener('DOMContentLoaded', initMap);
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

    var allFiltersUnchecked = !filters.male && !filters.female &&
        !filters.ug && !filters.g && !filters.pg &&
        !filters.cs && !filters.ee && !filters.mg && !filters.sh && !filters.amhs;

    if (allFiltersUnchecked) {
        return false;
    }


    var genderMatch = (!filters.male && !filters.female) || (gender === 'M' && filters.male) || (gender === 'F' && filters.female);
    var degreeMatch = (!filters.ug && !filters.g && !filters.pg) || (degreeLevel === 'UG' && filters.ug) || (degreeLevel === 'G' && filters.g) || (degreeLevel === 'PG' && filters.pg);
    var departmentMatch = (!filters.cs && !filters.ee && !filters.mg && !filters.sh && !filters.amhs) ||
        (departmentName === 'CS' && filters.cs) ||
        (departmentName === 'EE' && filters.ee) ||
        (departmentName === 'MG' && filters.mg) ||
        (departmentName === 'SH' && filters.sh) ||
        (departmentName === 'AMHS' && filters.amhs);


    return genderMatch && degreeMatch && departmentMatch;
}

var locationCounts = {};
function geocodeAddress(address, degreeLevel, departmentName, gender, studentName, mobileNo, rollNo, callback) {
    var geocoder = new google.maps.Geocoder();

    geocoder.geocode({ 'address': address }, function (results, status) {
        if (status === 'OK') {
            var lat = results[0].geometry.location.lat();
            var lng = results[0].geometry.location.lng();
            var formattedAddress = results[0].formatted_address;

            var locationKey = `${lat},${lng}`;


            if (locationCounts[locationKey]) {
                locationCounts[locationKey] += 1;
            } else {
                locationCounts[locationKey] = 1;
            }


            var offset = 0.0001 * locationCounts[locationKey];
            lat += offset;
            lng += offset;

            var contentString = `
                <div style="
                    font-size: 13px;
                    max-width: 240px;
                    padding: 10px;
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 240, 240, 0.9) 100%);
                    border-radius: 10px;
                    box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.2);
                    font-family: 'Arial', sans-serif;
                    color: #333;
                ">
                    <p style="
                        margin: 8px 0;
                        font-weight: bold;
                        font-size: 16px;
                        color: #2c3e50;
                        text-align: center;
                        border-bottom: 1px solid #ddd;
                        padding-bottom: 8px;
                    ">Name: ${studentName}</p>
                    <p style="
                        margin: 8px 0;
                        font-size: 14px;
                        color: #555;
                    "><strong>Mobile:</strong> ${mobileNo}</p>
                    <p style="
                        margin: 8px 0;
                        font-size: 14px;
                        color: #555;
                    "><strong>Roll No:</strong> ${rollNo}</p>
                    <p style="
                        margin: 8px 0;
                        font-size: 14px;
                        color: #555;
                    "><strong>Address:</strong> ${formattedAddress}</p>
                    <p style="
                        margin: 8px 0;
                        font-size: 14px;
                        color: #555;
                    "><strong>Degree:</strong> ${degreeLevel}</p>
                    <p style="
                        margin: 8px 0;
                        font-size: 14px;
                        color: #555;
                    "><strong>Department:</strong> ${departmentName}</p>
                    <p style="
                        margin: 8px 0;
                        font-size: 14px;
                        color: #555;
                    "><strong>Gender:</strong> ${gender}</p>
                </div>
            `;
            if (map instanceof google.maps.Map) {
                var marker = new google.maps.Marker({
                    position: { lat: lat, lng: lng },
                    map: map
                });

                markers.push(marker);

                var infoWindow = new google.maps.InfoWindow({
                    content: contentString
                });

                marker.addListener('click', function () {
                    if (activeInfoWindow) {
                        activeInfoWindow.close();
                    }
                    infoWindow.open(map, marker);
                    activeInfoWindow = infoWindow;
                });

                callback(lat, lng, formattedAddress, contentString);
            } else {
                console.error("Invalid map instance, marker not set.");
            }
        } else {
            console.error('Geocode was not successful for the following reason:', status);
            callback(null, null, address, null);
        }
    });
}

function updateMap() {
    return new Promise((resolve) => {
        clearMarkers();
        var filters = getFilters();
        var validMarkers = [];
        var tableBody = document.querySelector('#addressTable tbody');
        tableBody.innerHTML = '';

        let serialNumber = 1; 
        let geocodePromises = [];
        let activeInfoWindow = null;

        addresses.forEach((row, index) => {
            if (index === 0) return; 
            var address = row[0];
            var degreeLevel = row[1];
            var departmentName = row[2];
            var gender = row[3];
            var studentName = row[4];
            var mobileNo = row[5];
            var rollNo = row[6];
            if (!address || !degreeLevel || !departmentName || !gender || !studentName || !mobileNo || !rollNo) {
                console.warn(`Skipping row ${index + 1} due to missing data:`, row);
                return;
            }
            mobileNo = mobileNo.toString().padStart(11, '0');
            mobileNo = mobileNo.replace(/^(\d{4})(\d{7})$/, '$1-$2');

            if (applyFilters(degreeLevel, departmentName, gender, filters)) {

                geocodePromises.push(
                    new Promise((resolveGeocode) => {
                        geocodeAddress(address, degreeLevel, departmentName, gender, studentName, mobileNo, rollNo, function (lat, lng, formattedAddress, contentString) {
                            var tableRow = document.createElement('tr');
                            tableRow.innerHTML = `
                                <td>${serialNumber++}</td>
                                <td>${formattedAddress}</td>
                                <td>${degreeLevel}</td>
                                <td>${departmentName}</td>
                                <td>${gender}</td>
                                <td>${studentName}</td>
                                <td>${mobileNo}</td>
                                <td>${rollNo}</td>
                            `;
                            tableBody.appendChild(tableRow);

                            if (lat !== null && lng !== null) {
                                var marker = new google.maps.Marker({
                                    position: { lat: lat, lng: lng },
                                    map: map
                                });
                                markers.push(marker);
                                validMarkers.push(marker);

                                var infoWindow = new google.maps.InfoWindow({
                                    content: contentString
                                });

                                marker.addListener('click', function () {
                                    if (activeInfoWindow) {
                                        activeInfoWindow.close();
                                    }
                                    infoWindow.open(map, marker);
                                    activeInfoWindow = infoWindow;
                                });
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
            document.getElementById('countDisplay').innerText = `Total Students: ${serialNumber - 1}`;

            markerCluster = new MarkerClusterer({
                markers: validMarkers, 
                map: map 
            });
            console.log('All geocoding promises resolved.');
            resolve();
        }).catch((error) => {
            console.error('Error in processing geocoding promises:', error);
            resolve();
        });
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
    if (markerCluster && map instanceof google.maps.Map) {
        markerCluster.clearMarkers();
    } else {
        console.error("Invalid map instance or markerCluster not initialized.");
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