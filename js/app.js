var map;
// Create a new blank array for all the listing markers.
var markers = [];
var markersMap = [];
//var $wikiElem = $('#wikipedia-links');

// These are the locations that will be shown to the user
var initialLocations = [
	{
		title: 'Empire State Building',
		location: {lat: 40.748817, lng: -73.985428}
	},
	{
		title: 'Rockefeller Center',
		location: {lat: 40.75861, lng: -73.978209}
	},
	{
		title: 'World Trade Center',
		location: {lat: 40.711801, lng: -74.01312}
	},
	{
		title: 'The Met',
		location: {lat: 40.779437, lng: -73.963244}
	},
	{
		title: 'Columbus Circle',
		location: {lat: 40.76803, lng: -73.982371}
	}]

	var Location = function(data){
	this.title = ko.observable(data.title);
	this.position = ko.observable(data.location);
}


var ViewModel = function(){
	var self = this;

	var infoWindow = new google.maps.InfoWindow();

	// Constructor creates a new map - only center and zoom are required.
	map = new google.maps.Map(document.getElementById('map'),{
		center: {lat: 40.7413549, lng: -73.9980244},
          zoom: 13
	});

	//an array to store all the locations in
	this.locationList = ko.observableArray([]);

	//the list that will appear when being filtered by a keyword
	this.filter = ko.observable();


	//looping through each item in initialLocations and
	//adding it to the array
	initialLocations.forEach(function(locationItem){
		self.locationList.push( new Location(locationItem));
	});

	// The following group uses the location array to create an array of markers on initialize.
	for(var i = 0; i < initialLocations.length; i++){
		// Get the position from the location array.
		var position = initialLocations[i].location;
		var title = initialLocations[i].title;

		// Create a marker per location, and put into markers array.
		var marker = new google.maps.Marker({
			map: map,
			position: position,
			title: title,
			animation: google.maps.Animation.DROP,
			id: i
		});

		// Push the marker to our array of markers.
		markers.push(marker);
		location.marker = marker;

		var key = "" + position.lat + "_" + position.lng;

		markersMap[key] = marker;

		// Create an onclick event to open an infowindow at each marker.
		marker.addListener('click', function(){
			populateInfoWindow(this, infoWindow);
			toogleBounce(this);
		});


	}


	this.setInfoWindow = function(place){
		//var highlightedIcon = makeMarkerIcon('0091ff');
		var key = "" + place.position().lat + "_" + place.position().lng;
		console.log(key);
		console.log(markersMap);

		var marker = markersMap[key];
		console.log(marker);

		if(undefined !== marker){
			populateInfoWindow(marker, infoWindow);
			toogleBounce(marker);
		}
	}

}

// This function populates the infowindow when the marker is clicked. We'll only allow
      // one infowindow which will open at the marker that is clicked, and populate based
      // on that markers position.
function populateInfoWindow(marker, infowindow){
	console.log('1');
	var contentString = '<div><b>' + marker.title + '</b></div><div id="pano"></div><div class="wikipedia-container"><b>' + '<h4>Relevant Wikipedia Links</h4>' + '</b><ul id="wikipedia-links"></ul></div>';
	var wikiUrl = 'http://en.wikipedia.org/w/api.php?action=opensearch&search='+ marker.title +'&format=json&callback=wikiCallback';
	var wikiRequestTimeout = setTimeout(function(){
		alert("failed to load Wikipedia Links");
	}, 8000);

	$.ajax({

		url: wikiUrl,
		dataType: "jsonp",

		success: function(response){
			var $wikiElem = $('#wikipedia-links');
			console.log('2');
			console.log(response);
			var articleList = response[1];
			var urlList = response[3];
			console.log(articleList);

			for(var i = 0; i < articleList.length; i++){
				articleStr = articleList[i];
				urlStr = urlList[i];
				var url = urlStr;
				$wikiElem.append('<li><a href="' + url + '">' + articleStr + '</a></li>');
			};

			clearTimeout(wikiRequestTimeout);
		}
	});


	// Check to make sure the infowindow is not already opened on this marker.
	if(infowindow.marker != marker){
		infowindow.marker = marker;
		infowindow.setContent('');
		//infowindow.open(map, marker);

		var streetViewService = new google.maps.StreetViewService();
		var radius = 50;

		function getStreetView(data, status){
			console.log('3');
			if(status == google.maps.StreetViewStatus.OK){
				var nearStreetViewLocation = data.location.latLng;
				var heading = google.maps.geometry.spherical.computeHeading(
					nearStreetViewLocation, marker.position);

				infowindow.setContent(contentString);
				var panoramaOptions = {
					position: nearStreetViewLocation,
					pov: {
						heading: heading,
						pitch: 30
					}
				}
				var panorama = new google.maps.StreetViewPanorama(document.getElementById('pano'), panoramaOptions);
			}
		}

	streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);

	infowindow.open(map, marker);
}

}


function toogleBounce(marker){
	console.log(marker);
	if(marker.getAnimation() !== null){
		marker.setAnimation(null);
	} else {
		marker.setAnimation(google.maps.Animation.BOUNCE);
		setTimeout(function(){
			marker.setAnimation(null);
		}, 2500);

		}
}


// This function will loop through the listings and hide them all.
function hideMarkers(){
	for(var i = 0; i < markers.length; i++){
		markers[i].setMap(null);
	}
}


function showMarkers(a){
	title = a.innerHTML;
	for(var i = 0; i < markers.length; i++){
		if(markers[i].title == title){
			console.log(markers[i].title);
			markers[i].setMap(map);
		};
	};
}


// This function will loop through the markers array and display them all.
function showListings(){
	for(var i = 0; i < markers.length; i++){
		markers[i].setMap(map);
	}
}


function filterLocations(){
	var input, filter, ul, li, a;

	input = document.getElementById('myInput').value;
	filter = input.toUpperCase();
	ul = document.getElementById('locations-list');
	li = ul.getElementsByTagName('li');

	for(var i = 0; i < li.length; i++){
		a = li[i].getElementsByTagName('a')[0];
		if(a.innerHTML.toUpperCase().indexOf(filter) > -1){
			li[i].style.display = "";
			hideMarkers();
			showMarkers(a);
		} else{
			li[i].style.display = "none";
		}
	}

}

function initMap(){
	ko.applyBindings(new ViewModel());
}

function googleError(){
	alert("Failed to load Google Maps.");
}

var main = document.querySelector(
	'.main');
var drawer = document.querySelector(
	'#drawer');

//when the menu icon is clicked, the filter menu slides in
//and the map/menu shift to the right
this.openMenu = function() {
	console.log('ho');
	drawer.classList.toggle('open');
	main.classList.toggle('moveRight');
};