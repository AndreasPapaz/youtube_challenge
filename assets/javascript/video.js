//Author: Matthew Sells
//YouTube Data API key  AIzaSyApk9cJ6LxO_taHUxiG8kftlhs1ilr7LpQ

//Base query URL: https://www.googleapis.com/youtube/v3/search?
//Reference: https://developers.google.com/youtube/v3/docs/search/list

//Variables specific to player so as not to pollute global scope
var videoPlayer = {
	key: 'AIzaSyApk9cJ6LxO_taHUxiG8kftlhs1ilr7LpQ',
	playlistId: 'PL30BFB50685A0252B',
	//List will be populated with YouTube video IDs on page load
	videoList: []
}

//Must be global scope for YouTube
var player;
var done = false;

//When video is loaded, play it
function onPlayerReady(event) {
	event.target.playVideo();
}

//If the video is done playing, stop the video motion
function onPlayerStateChange(event) {
	if(event.data == 0){
		videoOver();
	}
}

//Initialize the YouTube player
function onYouTubeIframeAPIReady() {
	player = new YT.Player('player', {
		playerVars: {
		    modestbranding: true
		},
		height: '390',
		width: '640',
		videoId: '',
		events: {
			'onReady': onPlayerReady,
			'onStateChange': onPlayerStateChange
		}
	});
}

//Adds playlist video IDs to videoList[]
function loadVideos(){
	//See how many items are in the playlist.
	//You have to look at playlist info because you need 'next page token' to continue past 50
	var queryURL = 'https://www.googleapis.com/youtube/v3/playlists';
	queryURL += '?key=' + videoPlayer.key;
	queryURL += '&part=contentDetails&id='+videoPlayer.playlistId;

	var items;

	$.ajax({
		url: queryURL,
		method: 'GET'
	}).done(function(response){
		items = response.items[0].contentDetails.itemCount;

		//Now that number of items are known, add the individual items to the videoList array in videoPlayer
		var queryURL = 'https://www.googleapis.com/youtube/v3/playlistItems';
		queryURL += '?key=' + videoPlayer.key;
		queryURL += '&part=contentDetails&playlistId='+videoPlayer.playlistId+'&maxResults=50';

		$.ajax({
			url: queryURL,
			method: 'GET'
		}).done(function(response){
			//Load each video into the videoList array
			for(var i = 0; i < items; i++){
				//For now, cut at 50 (page item limit for YouTube response)
				if(i === 50){
					break;
				}
				videoPlayer.videoList.push(response.items[i].contentDetails.videoId);
			}
			shuffleVideos();
		});
	});
}

function shuffleVideos(){
	var totalVideos = videoPlayer.videoList.length;

	//Randomly shuffle order of questions
	for(var i = 0; i < totalVideos; i++){
		var randomPlace = Math.floor(Math.random() * totalVideos);
		var temp = videoPlayer.videoList[randomPlace];
		videoPlayer.videoList[randomPlace] = videoPlayer.videoList[i];
		videoPlayer.videoList[i] = temp;
	}
}

//Returns video ID of video in list
function selectVideoByNumber(num){
	return videoPlayer.videoList[num];
}

//Load a video into the player and start playing
function playVideoById(vidId){
	done = false;
	player.loadVideoById(vidId);
	player.playVideo();
}

function isPlayable(vidId){
	var queryURL = 'https://www.googleapis.com/youtube/v3/videos';
    queryURL += '?key=' + videoPlayer.key;
    queryURL += '&part=contentDetails&id='+vidId;
    queryURL += '&videoEmbeddable=true&videoSyndicated=true'

    $.ajax({
    	url: queryURL,
    	method: 'GET'
    }).done(function(response){
    	var licensed = response.items[0].contentDetails.licensedContent;
    });
}

//Stop the video playback
function stopVideo() {
	player.stopVideo();
}

//This will run when the video finishes. Maybe replace the video with an image or something?
function videoOver(){
	console.log('video has finished playing');
}

//Returns the year the video was uploaded
function getVideoYear(vidId){
	var queryURL = 'https://www.googleapis.com/youtube/v3/videos';
	queryURL += '?key=' + videoPlayer.key;
	queryURL += '&part=snippet&id='+vidId;

	var year;

	$.ajax({
		url: queryURL,
		method: 'GET'
	}).done(function(response){
		year = response.items[0].snippet.publishedAt;
		year = parseInt(year.substr(0, 4));
		gameData.correctAnswer = year;
		generate_multipleChoices(year);
		AddChoice_to_DOM();
	});
}

loadVideos();