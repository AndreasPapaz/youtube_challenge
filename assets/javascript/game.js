//Configure Firebase connection
  var config = {
    apiKey: "AIzaSyDyjAZ5RiWX0Pt5dkiMEJ_tXbY1Z7M63Uc",
    authDomain: "musicchallenge-86176.firebaseapp.com",
    databaseURL: "https://musicchallenge-86176.firebaseio.com",
    projectId: "musicchallenge-86176",
    storageBucket: "musicchallenge-86176.appspot.com",
    messagingSenderId: "666483398318"
  };

firebase.initializeApp(config);
var database = firebase.database();

//Game status database references
var gameStatus = database.ref('/gameStatus');

//Game data stores local data for the player
var gameData = {
    totalPlayers: 0,
    targetStage: 0,
    currentStage: 0,
    videoId: '',
    correctAnswer: null,
    clickedAnswer: false,
    playingGame: false,
    host: null,
    maxAnswers: 5,
    currentVideo: 0,
    awaitingPlayer: false
}

var timer = 15;
var intervalID;
var playersTree = database.ref("players");
var answersTree =  database.ref("answers");
var chatData = database.ref("/chat");
var currentPlayers = null;
var username = "User";
var playerOneOnline = false;
var playerTwoOnline = false;
var playerOneData = null;
var playerTwoData = null;
var playerNum = null;
var total_answer = 0;
var correct_answer = 0;
var multipleChoices = [];
var multipleChoices = [];
var img_url;
var modal = document.getElementById('myModal');

// Action when player 1 clicks "enter the arena" OLD
// $("#start-button").click(function() {
//     if ($("#username").val() !== "") {
//         username = capitalize(($("#userName").val().trim()));
//         enterGame();

//         $("#start-button, #userName").hide();
//         $(".jumbotron, video").slideUp(1000);

//         if(playerNum == 1){ 
//             $(".welcome").show();
//         }
//     }
// });

// OLD
// $("#userName").keypress(function(e){
//     if(e.keyCode === 13 && $("#username").val()!==""){
//         username = capitalize($("#userName").val().trim());
//         enterGame();
        
//         $("#start-button, #userName").hide();
//         $(".jumbotron, video").slideUp(1000);

//         if(playerNum == 1){ 
//             $(".welcome").show();
//         }
//     }
// });

function capitalize(name){
    return name.charAt(0).toUpperCase()+ name.slice(1);
 }

 function activePlayer(){
    //If player has been assigned number and it is 1 or 2
    if(playerNum != null && playerNum <= 2){
        return true;
    } else {
        return false;
    }
 }

// Display player 1 username in "welcome" div
function enterGame() {
    if (currentPlayers < 2) {
        if (playerOneOnline) {
            console.log('assign player 2');
            playerNum = 2;
            gameData.host = false;
            $("#login-switch").hide();
            $(".jumbotron, video").slideUp(1000);
            $(".welcome").show();
        } else {
            playerNum = 1;
            console.log('assign player 1');
            gameData.host = true;
            gameData.targetStage = 0;
            gameData.currentStage = 0;
            $("#login-switch").hide();
            $(".jumbotron, video").slideUp(1000);
            $(".welcome").show();

            //Host player calls hostUpdate to reset Firebase to default values
            hostUpdate(0);
        }
        playerTree = database.ref("/players/" + playerNum);

        playerTree.set({
            name: username,
            wins: 0,
            losses: 0,
            img: img_url
        });

        // Update chat on screen when new message detected - ordered by 'time' value
        chatData.orderByChild("time").on("child_added", function(snapshot) {

        // If idNum is 0, then its a disconnect message and displays accordingly
        // If not - its a user chat message
        if (snapshot.val().idNum === 0) {
        $("#chat-messages").append("<p class=player" + snapshot.val().idNum + "><span>"
        + snapshot.val().name + "</span>: " + snapshot.val().message + "</p>");
        } else {
        $("#chat-messages").append("<p class=player" + snapshot.val().idNum + "><span>"
        + snapshot.val().name + "</span>: " + snapshot.val().message + "</p>");
        }

        // Keeps div scrolled to bottom on each update.
        $("#chat-messages").scrollTop($("#chat-messages")[0].scrollHeight);
        });

        $(".youArePlayer").html("<h2> Hello " + username + " you are player " + playerNum + "</h2>");
        // Send disconnect message to chat with Firebase server generated timestamp 
        // and id of '0' to denote system message
        playerTree.onDisconnect().remove();

        chatDataDisc.onDisconnect().set({
            name: username,
            time: firebase.database.ServerValue.TIMESTAMP,
            message: "has disconnected.",
            idNum: 0
        });

        

        } else {
            //Add a waiting player to database
            playerNum = currentPlayers + 1;
            playerTree = database.ref("/players/" + playerNum);
            playerTree.set({
                name: username,
                status: 'waiting'
            });
            playerTree.onDisconnect().remove();
            $("#login-switch").hide();
            $(".score, #player, .main").show();
            $("#video-placeholder").hide();
            $('.answer').css('visibility', 'hidden');
        }
};

//Runs whenever players are modified in Firebase
playersTree.on("value", function(snapshot) {
    currentPlayers = snapshot.numChildren();

    playerOneOnline = snapshot.child("1").exists();
    playerTwoOnline = snapshot.child("2").exists();
    playerOneData = snapshot.child("1").val();
    playerTwoData = snapshot.child("2").val();
    
    if (currentPlayers >= 2 && !gameData.playingGame) {

        if(activePlayer()){
            $("#login-switch").hide();
            $("#start-button, #userName").hide();
            $(".welcome").hide();
            gameData.playingGame = true;
            countdown();
        } else {
            startTrivia();
        }
    } else if (currentPlayers < 2){
        gameData.targetStage = 0;
        gameData.currentStage = 0;

    //This part loads if a new player enters while in waiting stage
    } else if (currentPlayers === 2 && gameData.awaitingPlayer){
        gameData.awaitingPlayer = false;
        stop();
        gameStatus.set({
            gameStage: 9,
            videoId: gameData.videoId
        });
    }

    if (playerOneOnline) {
        $("#player1-name").text(playerOneData.name);
        $("#player1-wins").text("WINS : " + playerOneData.wins);
        $("#player1-losses").text("LOSSES : " + playerOneData.losses);
    } else {
        $("#player1-name").text("Offline");
        $("#player1-wins").text("x");
        $("#player1-losses").text("x");
        searchForPlayer(1);

        if(currentPlayers === 1){
            gameStatus.set({
                gameStage: 10,
                videoId: gameData.videoId
            });
        }
    }
    if (playerTwoOnline) {
        $("#player2-name").text(playerTwoData.name);
        $("#player2-wins").text("WINS : " + playerTwoData.wins);
        $("#player2-losses").text("LOSSES : " + playerTwoData.losses);
    } else {
        $("#player2-name").text("Offline");
        $("#player2-wins").text("x");
        $("#player2-losses").text("x");
        searchForPlayer(2);

        if(currentPlayers === 1){
            gameStatus.set({
                gameStage: 10,
                videoId: gameData.videoId
            });
        }
    }
});

// Get firebase ajax call, add the fetched imagin to DOM
function getfirebase_info(){
    $.ajax({
        url : "https://musicchallenge-86176.firebaseio.com/.json",
        method : "GET"
    }).done(function(response){
        if (response.players.length === 2){
            $("#player1-image").attr("src",response.players[1].img);
            console.log("this is 1");
        }
        else if (response.players.length === 3){
            $("#player1-image").attr("src",response.players[1].img);
            $("#player2-image").attr("src",response.players[2].img);
            console.log("this is 2");
        }             
    })
}

playersTree.on('child_added',getfirebase_info);

function searchForPlayer(slotNum){
    if(playerNum >= 3){

        if(playerNum === 3){
            console.log(currentPlayers);
            playerTree.remove();

            playerNum = slotNum;
            playerTree = database.ref("/players/" + playerNum);

             $('.answer').css('visibility', 'visible');

            playerTree.set({
                name: username,
                wins: 0,
                losses: 0,
                img: img_url
            });

            playerTree.onDisconnect().remove();

            if(playerNum === 1){
                gameData.host = true;
            }
            gameData.playingGame = true;

            gameStatus.set({
                gameStage: 9,
                videoId: gameData.videoId
            });

        //If there were more than 1 player waiting, they decrease in slot line
        } else if(playerNum > 3){
            playerNum--;
        }
    }
}

//Player 1 (host) updates the relevant data in Firebase
function hostUpdate(stageAddition){
    //The function is called by both players but only the host player will send game data
    if(gameData.host){
        //Add stages based on parameter
        gameData.targetStage += stageAddition;
        //Set info in Firebase
        gameStatus.set({
            gameStage: gameData.targetStage,
            videoId: gameData.videoId
        });
    }
}

function endScreen() {
    if (playerOneData.wins > playerTwoData.wins) {
        $('.endWins1').text(playerOneData.name + " WON");
    }
    else if (playerTwoData.wins > playerOneData.wins) {
        $('.endWins1').text(playerTwoData.name + " WON");
    }
    else if (playerTwoData.wins === playerOneData.wins) {
       $('.endWins1').text("TIE"); 
    }
};

//Runs whenever the game status is updated in Firebase
gameStatus.on('value', function(splash){

    if(gameData.playingGame){
        //Get the current stage of the game as stored in Firebase
        var stage = splash.val().gameStage;

        //If the player's current stage is different than the one directed in Firebase, run stage-specific functions
        if(stage != gameData.currentStage){
            gameData.currentStage = stage;
            //Stage 1: Host sends video. Opponent awaits video.
            if(stage === 1  && activePlayer()){
                if(gameData.host){
                    //Get next video ID from video.js
                    var newVideo = selectVideoByNumber(gameData.currentVideo);
                    gameData.videoId = newVideo;
                    gameData.currentVideo++;

                    isPlayable(newVideo);
                }

                hostUpdate(1);

            //Stage 2: Both players retrieve video ID pushed to Firebase in previous stage
            } else if(stage === 2){
                //Retrieve video ID for both players
                gameData.videoId = splash.val().videoId;

                //gameData.correctAnswer will be detailed in video.js / getVideoYear()
                getVideoYear(gameData.videoId);
                hostUpdate(1);

            //Stage 3: Begin playing the video and register that no answers have been provided
            } else if(stage === 3){
                playVideoById(gameData.videoId);
                gameData.clickedAnswer = false;
                gameData.totalAnswers = 0;

            //Stage 4: One answer from either player recieved.
            } else if(stage === 4  && activePlayer()){
                if(gameData.clickedAnswer){
                    $("#gameTimer").text('Waiting for other player...');
                }

            //Stage 5: Responses from both players received
            } else if(stage === 5  && activePlayer()){
                hostUpdate(1);

            //Stage 6: Stop timer for both players and countdown to next round
            } else if(stage === 6){
                stop();
                $("#gameTimer").text("Next round about to begin!");
                setTimeout(startTrivia, 1000 * 3);

            //Stage 7: Test if max videos viewed
            } else if(stage === 7){
                //If max answers not completed, reset to stage 1
                if(total_answer != gameData.maxAnswers){
                    gameData.targetStage = 0;
                }
                hostUpdate(1);

            //Stage 8: Game is over
            } else if(stage === 8){
                $("#question").text("Game over!");                
                stop();
                // showEndGame();
                modal.style.display = "block";
                endScreen();

            //Stage 9: Player disconnected and a new one was found
            } else if(stage === 9){
                $("#question").text("Found a new player!");
                stop();
                gameData.clickedAnswer = true;
                setTimeout(startTrivia, 5200);

            //Stae 10: No players to battle. Wait for one.
            } else if(stage === 10){
                $("#question").text("Opponent has left :(");
                 $("#gameTimer").text("Waiting for an opponent...");
                stop();
                gameData.clickedAnswer = true;
                gameData.awaitingPlayer = true;
            }
        }
    }
});

// Action after player 2 signs in and clicks "enter" - only runs once
function countdown() {
    timer = 5;
    intervalID = setInterval(decrement1, 1000);
    $("#timer").text("We will begin the match in:" + (" ") + timer + (" ") + "seconds");  
    $(".main").show();
    $("#video-placeholder").fadeOut(5000);
    $("#player, .answer, .score").hide();
    $(".welcome").hide();
    $(".answerPlaceholder").empty();
}

// This is our timer countdown function for the pre-game clock
function decrement1() {
    timer--;
    $("#timer").text("We will begin the match in:" + (" ") + timer + (" ") + "seconds");
    if (timer === 0) {
        stop();
        startTrivia();
    }
}

// This is our timer countdown for the trivia questions. We will need a loop
// around this eventually I think, to get to the final page after 15 rounds.
function startTrivia() {

    $("#question").text("What year was this video released?");
    if(activePlayer()){
        $("#gameTimer").text("You have:" + (" ") + timer + (" ") + "seconds");
    } else {
        $("#gameTimer").text('Waiting until next game...');
    }
    $("#timer").hide();
    $(".answerPlaceholder").remove();
    $(".score, #player").show();

    if(activePlayer()){
        timer = 15;
        intervalID = setInterval(decrement2, 1000);
        $(".answer").show();

        //With 2 players, trigger hostUpdate() to start game stage advancing
        gameData.clickedAnswer = false;
        hostUpdate(1);
    } else {
        $(".answer").show();
        gameData.playingGame = true;
    }
}

// This is the clock counting down and restarting
function decrement2() {
    timer--;
    $("#gameTimer").text("You have:" + (" ") + timer + (" ") + "seconds");
    if (timer === 0) {
        //If timer runs our, player automatically loses round
        stop();
        //Don't allow for any more clicks
        gameData.clickedAnswer = true;

        //Force incorrect answer
        total_answer ++;
        playerTree.update({
            wins:correct_answer,
            losses:total_answer - correct_answer
        });

        //Force stage to advance
        gameData.targetStage++;
        gameStatus.update({
            gameStage: gameData.targetStage
        });

        $("#gameTimer").text("Time's up!");
    }
}

function stop() {
    console.log('stopped timer');
    clearInterval(intervalID);
}

var generate_multipleChoices = function(correct_answer){
    multipleChoices = [correct_answer];
    var index = 0;
    while (index < 3){
        var randomNumber = correct_answer + math.randomInt(-5, 5);
        if (multipleChoices.indexOf(randomNumber) === -1 && randomNumber < 2018){
            multipleChoices.push(randomNumber);
            index ++;
        }
    }
    multipleChoices.sort();
}

var AddChoice_to_DOM =  function(){
    for(var i = 1; i <= 4; i++){
        $("#answer" + i).html("<i class='fa fa-circle-o fa-1.5x' aria-hidden='true'></i>" + multipleChoices[i-1]);
    }
}

$(".answer").on("click", function() {
    if(!gameData.clickedAnswer){
        gameData.clickedAnswer = true;
        stop();

        //Force a single stage update
        gameData.targetStage++;
        gameStatus.update({
            gameStage: gameData.targetStage
        });

        total_answer ++;
        if ($(this).text().trim()==gameData.correctAnswer){
            $("#question").html("<div class='correctSelect'>" + "You're correct!" + "</div>");
            correct_answer ++;
            playerTree.update({
                wins: correct_answer,
                losses: total_answer - correct_answer
            });
        } else {
            $("#question").html("<div class='incorrectSelect'>" + "Wrong! The correct answer is " + gameData.correctAnswer + "</div>");
            playerTree.update({
                wins:correct_answer,
                losses:total_answer - correct_answer
            });
        }
    }
});

function showEndGame(){
    if(activePlayer()){
        //This will happen for players 1 and 2
    } else {
        //This will happen for waiting players
    }
}

function restartGame(){
    //The following needs to happen at some point to restart the game
    //Maybe change text and set this on a timer?
    total_answer = 0;
    gameData.currentStage = 0;
    gameData.targetStage = 0;
    gameData.currentVideo = 0;
    startTrivia();
    //
}

// A few divs we have to hide at the start of the game
$(".main, .welcome").hide();


// User clicks "send" button to push input to Firebase
// chat feats...
$("#chat-send").click(function() {

  if ($("#chat-input").val() !== "") {

    var message = $("#chat-input").val();

    chatData.push({
        name: username,
        message: message,
        time: firebase.database.ServerValue.TIMESTAMP,
        idNum: playerNum
    });

    $("#chat-input").val("");
  }
});

// Chatbox input listener
$("#chat-input").keypress(function(e) {
  if (e.keyCode === 13 && $("#chat-input").val() !== "") {
    var message = $("#chat-input").val();
    chatData.push({
        name: username,
        message: message,
        time: firebase.database.ServerValue.TIMESTAMP,
        idNum: playerNum
    });
    $("#chat-input").val("");
  }
});