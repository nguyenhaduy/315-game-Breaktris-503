var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(12555);
console.log("Server started.");

var SOCKET_LIST = {};
var PLAYER_LIST = {};
var ROOM_LIST = {};

function Player (id){
    this.id = id;
    this.number = "" + Math.floor(10 * Math.random());
    this.opponent;
    this.playgame = 0;
    this.numberofwin = 0;
    this.room;
}
// Player.list = {};

function GameRoom(roomID, player){
    this.player1 = player;
    this.player2;
    this.NumberOfGames = 0;
    this.player1win = 0;
    this.player2win = 0;
    this.playable = false;
    this.id = roomID;
}

Player.onConnect = function(socket){
    var player = new Player(socket.id);
    console.log('New Player ID: ' + player.id);
    PLAYER_LIST[player.id] = player;

    socket.on('CreateRoom',function(data){
        var temp1 = false;
        if (!ROOM_LIST[data]){
            temp1 = true;
            console.log('Created Room: ' + data);
            var room = new GameRoom(data, player);
            player.room = room;
            ROOM_LIST[data] = room;
            SOCKET_LIST[player.id].emit('player ID', 0);
        }
        socket.emit('CreateRoom', temp1);
    });

    socket.on('JoinRoom',function(data){
        console.log('Join Room: ' + data);
        var temp2 = false;
        if (ROOM_LIST[data]){
            temp2 = true;
            ROOM_LIST[data].player2 = player;   // Set join player as player 2
            player.opponent = ROOM_LIST[data].player1;
            console.log('Player 1 ID : ' + ROOM_LIST[data].player1.id);            
            player.room = ROOM_LIST[data];
            ROOM_LIST[data].player1.opponent = player;
            ROOM_LIST[data].playable = true;
            SOCKET_LIST[player.id].emit('player ID', 1);
            console.log('Player 1 opponent ID : ' + player.opponent.id);
            console.log('Player 2 opponent ID : ' + player.opponent.opponent.id);
        }
        socket.emit('JoinRoom', temp2);
    });
    

        socket.on('BallUpdate',function(data){
            // console.log('Ball position update');
            // console.log('Player ID: ' + player.id);
            if (player.room === undefined || player.opponent === undefined){}
            else{
                if(player.room.playable){
                    // console.log('Ball position update');
                    SOCKET_LIST[player.opponent.id].emit('BallUpdate', data);
                }
            }
        });

        socket.on('PaddleUpdate',function(data){
            // console.log('Ball position update');
            if (player.room === undefined || player.opponent === undefined){}
            else{
                if(player.room.playable){
                    if (SOCKET_LIST[player.opponent.id])
                        SOCKET_LIST[player.opponent.id].emit('PaddleUpdate', data);
                }
            }
        });


        socket.on('BricksUpdate',function(data){
            if (player.room === undefined || player.opponent === undefined){}
            else{
                if(player.room.playable){
                    if (SOCKET_LIST[player.opponent.id])
                        SOCKET_LIST[player.opponent.id].emit('BricksUpdate', data);
                }
            }
        });

        socket.on('StartGame',function(data){
            console.log('Game Start.');
            if (player.room === undefined || player.opponent === undefined){}
            else{
                if(player.room.playable){
                    player.room.NumberOfGames += 1;
                    if (SOCKET_LIST[player.opponent.id])
                        SOCKET_LIST[player.opponent.id].emit('StartGame', data);
                }
            }
        });

        socket.on('MakeInvi',function(){
            console.log('Current Tetris Piece is Invisible.');
            if (player.room === undefined || player.opponent === undefined){}
            else{
                if(player.room.playable){
                    if (SOCKET_LIST[player.opponent.id])
                        SOCKET_LIST[player.opponent.id].emit('MakeInvi');
                }
            }
        });

        socket.on('MakeSpeed',function(){
            console.log('Increase Current Tetris Piece Speed.');
            if (player.room === undefined || player.opponent === undefined){}
            else{
                if(player.room.playable){
                    if (SOCKET_LIST[player.opponent.id])
                        SOCKET_LIST[player.opponent.id].emit('MakeSpeed');
                }
            }
        });
        
        socket.on('BreakoutLose',function(){
            console.log('Breakout Player Lose. Tetris Player Win.');
            player.opponent.numberofwin += 1;
            if (player.room === undefined || player.opponent === undefined){}
            else{
                if(player.room.playable){
                    // player.room.playable = false;
                    if (SOCKET_LIST[player.id])
                        SOCKET_LIST[player.id].emit('NextGame');
                    if (SOCKET_LIST[player.opponent.id])
                        SOCKET_LIST[player.opponent.id].emit('NextGame');
                    // if (SOCKET_LIST[player.opponent.id])
                    //     SOCKET_LIST[player.opponent.id].emit('BreakoutLose');
                }
            }
        });

        socket.on('PieceUpdate',function(data){
            if (player.room === undefined || player.opponent === undefined){}
            else{
                if(player.room.playable){
                    if (SOCKET_LIST[player.opponent.id])
                        SOCKET_LIST[player.opponent.id].emit('PieceUpdate', data);
                }
            }
        });

        socket.on('BlockUpdate',function(data){
            if (player.room === undefined || player.opponent === undefined){}
            else{
                if(player.room.playable){
                    if (SOCKET_LIST[player.opponent.id])
                        SOCKET_LIST[player.opponent.id].emit('BlockUpdate', data);
                }
            }
        });

        socket.on('DataUpdate',function(data){
            if (player.room === undefined || player.opponent === undefined){}
            else{
                if(player.room.playable){
                    if (SOCKET_LIST[player.opponent.id])
                        SOCKET_LIST[player.opponent.id].emit('DataUpdate', data);
                }
            }
        });

        socket.on('AddBrickline',function(){
            if (player.room === undefined || player.opponent === undefined){}
            else{
                if(player.room.playable){
                    console.log('Add Brick Line.');
                    if (SOCKET_LIST[player.opponent.id])
                        SOCKET_LIST[player.opponent.id].emit('AddBrickline');
                }
            }
        });
        
        socket.on('Lose',function(){
            console.log('Tetris Player Lose. Breakout Player Win');
            player.opponent.numberofwin += 1;
            if (player.room.NumberOfGames < 2) {
                if (player.room === undefined || player.opponent === undefined){}
                else{
                    if(player.room.playable){
                        // player.room.playable = false;
                        if (SOCKET_LIST[player.id])
                            SOCKET_LIST[player.id].emit('NextGame');
                        if (SOCKET_LIST[player.opponent.id])
                            SOCKET_LIST[player.opponent.id].emit('NextGame');
                        // if (SOCKET_LIST[player.opponent.id])
                        //     SOCKET_LIST[player.opponent.id].emit('TetrisLose');
                    }
                }
            }
            else {
                if (player.opponent.numberofwin >= 2){
                    if (player.room === undefined || player.opponent === undefined){}
                    else{
                        if(player.room.playable){
                            player.room.playable = false;
                            if (SOCKET_LIST[player.id])
                                SOCKET_LIST[player.id].emit('YouLose');
                            if (SOCKET_LIST[player.opponent.id])
                                SOCKET_LIST[player.opponent.id].emit('YouWin');
                            // if (SOCKET_LIST[player.opponent.id])
                            //     SOCKET_LIST[player.opponent.id].emit('TetrisLose');
                        }
                    }
                } else {
                    player.room.playable = false;
                    if (SOCKET_LIST[player.id])
                        SOCKET_LIST[player.id].emit('YouDraw');
                    if (SOCKET_LIST[player.opponent.id])
                        SOCKET_LIST[player.opponent.id].emit('YouDraw');
                    }
                
                
            }
        });

        //When a client disconnect
        socket.on('disconnect',function(){
            console.log('One player disconnected.')
            // player_id = socket.id;
            // Player.onDisconnect(socket);
            if (!(player.opponent === undefined)){
                if (SOCKET_LIST[player.opponent.id])
                    SOCKET_LIST[player.opponent.id].disconnect();
            }
            if (!(player.room === undefined)){
                delete ROOM_LIST[player.room.id];
            }
            delete PLAYER_LIST[player.id];
            delete SOCKET_LIST[player.id];
        });

    socket.on('sendMsgToServer',function(data){
        var playerName = ("" + socket.id).slice(2,7);
        for(var i in SOCKET_LIST){
            SOCKET_LIST[i].emit('addToChat',playerName + ': ' + data);
        }
    });
}

Player.onDisconnect = function(socket){
    // player.room = false;
    // delete Player.list[socket.id];
}

var DEBUG = true;
var player_id = 0;
var BreakoutBall = {
    x:0,
    y:0,
}
var BreakoutPaddle = {
    x:0,
    y:0,
}
var BrickData;
 
var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
	console.log('New player connected to socket server.')
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;
   
    Player.onConnect(socket);    

    socket.on('sendMsgToServer',function(data){
        var playerName = ("" + socket.id).slice(2,7);
        for(var i in SOCKET_LIST){
            SOCKET_LIST[i].emit('addToChat',playerName + ': ' + data);
        }
    });
   
   	//Debugging
    socket.on('evalServer',function(data){
        if(!DEBUG)
            return;
        var res = eval(data);
        socket.emit('evalAnswer',res);     
    });
      
   
});
