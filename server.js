
var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(12554);
console.log("Server started.");

var SOCKET_LIST = {};

var BreakoutPlayer = function(){
		this.cursors = {
        	left:false,
    	    right:false,
            up:false,
            down:false
        };

        this.input = {
            left:false,
            right:false,
            up:false,
            down:false
        };

        this.game;

        this.ball;

        this.paddle;
        this.bricks;
        this.newBrick;
        this.brickInfo= {
            width: 30,
            height: 15,
            count: {
                row: 7,
                col: 3
            },
            offset: {
                top: 30,
                left: 40
            },
            padding: 10
        };
        this.scoreText;
        this.score = 0;
        this.lives = 3;
        this.livesText;
        this.lifeLostText;
        this.playing = false;
        this.startButton;
        this.key = [];
        this.cursors;
        this.upKey;
        this.downKey;
        this.leftKey;
        this.rightKey;
        this.spaceKey;
}

var Entity = function(){
    var self = {
        x:250,
        y:250,
        spdX:0,
        spdY:0,
        id:"",
    }
    self.update = function(){
        self.updatePosition();
    }
    self.updatePosition = function(){
        self.x += self.spdX;
        self.y += self.spdY;
    }
    self.getDistance = function(pt){
        return Math.sqrt(Math.pow(self.x-pt.x,2) + Math.pow(self.y-pt.y,2));
    }
    return self;
}
 
var Player = function(id){
    var self = Entity();
    self.id = id;
    self.number = "" + Math.floor(10 * Math.random());
    self.pressingRight = false;
    self.pressingLeft = false;
    self.pressingUp = false;
    self.pressingDown = false;
    self.pressingAttack = false;
    self.mouseAngle = 0;
    self.maxSpd = 10;
   
    var super_update = self.update;
    self.update = function(){
        self.updateSpd();
        super_update();
       
        if(self.pressingAttack){
            self.shootBullet(self.mouseAngle);
        }
    }
    self.shootBullet = function(angle){
        var b = Bullet(self.id,angle);
        b.x = self.x;
        b.y = self.y;
    }
   
   
    self.updateSpd = function(){
        if(self.pressingRight)
            self.spdX = self.maxSpd;
        else if(self.pressingLeft)
            self.spdX = -self.maxSpd;
        else
            self.spdX = 0;
       
        if(self.pressingUp)
            self.spdY = -self.maxSpd;
        else if(self.pressingDown)
            self.spdY = self.maxSpd;
        else
            self.spdY = 0;     
    }
    Player.list[id] = self;
    return self;
}
Player.list = {};
Player.onConnect = function(socket){
    var player = Player(socket.id);
    socket.on('keyPress',function(data){
        if(data.inputId === 'left')
            player.pressingLeft = data.state;
        else if(data.inputId === 'right')
            player.pressingRight = data.state;
        else if(data.inputId === 'up')
            player.pressingUp = data.state;
        else if(data.inputId === 'down')
            player.pressingDown = data.state;
        else if(data.inputId === 'attack')
            player.pressingAttack = data.state;
        else if(data.inputId === 'mouseAngle')
            player.mouseAngle = data.state;
    });
}

Player.onDisconnect = function(socket){
    delete Player.list[socket.id];
}

Player.update = function(){
    var pack = [];
    for(var i in Player.list){
        var player = Player.list[i];
        player.update();
        pack.push({
            x:player.x,
            y:player.y,
            number:player.number
        });    
    }
    return pack;
}
 
 
var Bullet = function(parent,angle){
    var self = Entity();
    self.id = Math.random();
    self.spdX = Math.cos(angle/180*Math.PI) * 10;
    self.spdY = Math.sin(angle/180*Math.PI) * 10;
    self.parent = parent;
    self.timer = 0;
    self.toRemove = false;
    var super_update = self.update;
    self.update = function(){
        if(self.timer++ > 100)
            self.toRemove = true;
        super_update();
       
        for(var i in Player.list){
            var p = Player.list[i];
            if(self.getDistance(p) < 32 && self.parent !== p.id){
                //handle collision. ex: hp--;
                self.toRemove = true;
            }
        }
    }
    Bullet.list[self.id] = self;
    return self;
}
Bullet.list = {};
 
Bullet.update = function(){
    var pack = [];
    for(var i in Bullet.list){
        var bullet = Bullet.list[i];
        bullet.update();
        if(bullet.toRemove)
            delete Bullet.list[i];
        else
            pack.push({
                x:bullet.x,
                y:bullet.y,
            });    
    }
    return pack;
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
	console.log('New player connected to socket server')
    // socket.id = Math.random();
    if (player_id < 2){
	    socket.id = player_id;
	    if (socket.id == 0){
	    	socket.emit('player ID', 0);
	    	console.log('This player ' +socket.id + ' plays Breakout');
	    }
	    else if (socket.id == 1){
	    	socket.emit('player ID', 1);
	    	console.log('This player ' +socket.id + ' plays Tetris');
	    }
	    SOCKET_LIST[socket.id] = socket;
	    player_id++;
	}
    else{
        for(var i in SOCKET_LIST){
            SOCKET_LIST[i].disconnect();
        }
    }
   
    Player.onConnect(socket);

    socket.on('BallUpdate',function(data){
    	// console.log('Ball position update');
        if(SOCKET_LIST[1]){
           // BreakoutBall.x = data.x;
           // BreakoutBall.y = data.y;
    	   SOCKET_LIST[1].emit('BallUpdate', data);
        }
    });

    socket.on('PaddleUpdate',function(data){
        // console.log('Ball position update');
        if(SOCKET_LIST[1]){
            // BreakoutPaddle.x = data.x;
            // BreakoutPaddle.y = data.y;
            SOCKET_LIST[1].emit('PaddleUpdate', data);
        }
    });


    socket.on('BricksUpdate',function(data){
        // console.log('Ball position update');
        if(SOCKET_LIST[1]){
            // BrickData = data;
            SOCKET_LIST[1].emit('BricksUpdate', data);
        }
    });

    socket.on('StartGame',function(data){
        if(SOCKET_LIST[1]){
            // BrickData = data;
            SOCKET_LIST[1].emit('StartGame', data);
        }
    });

    socket.on('MakeInvi',function(){
        if(SOCKET_LIST[1]){
            // BrickData = data;
            SOCKET_LIST[1].emit('MakeInvi');
        }
    });

    socket.on('PieceUpdate',function(data){
        if(SOCKET_LIST[0]){
            // BrickData = data;
            SOCKET_LIST[0].emit('PieceUpdate', data);
        }
    });

    socket.on('BlockUpdate',function(data){
        if(SOCKET_LIST[0]){
            // BrickData = data;
            SOCKET_LIST[0].emit('BlockUpdate', data);
        }
    });

    socket.on('DataUpdate',function(data){
        if(SOCKET_LIST[0]){
            // BrickData = data;
            SOCKET_LIST[0].emit('DataUpdate', data);
        }
    });

    socket.on('AddBrickline',function(){
        if(SOCKET_LIST[0]){
            // BrickData = data;
            console.log('Add Brick line')
            SOCKET_LIST[0].emit('AddBrickline');
        }
    });
   
    //When a client disconnect
    socket.on('disconnect',function(){
    	console.log('One player disconnected')
    	player_id = socket.id;
        delete SOCKET_LIST[socket.id];
        Player.onDisconnect(socket);
    });

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
 
// setInterval(function(){
//     // var pack = {
//     //     player:Player.update(),
//     //     bullet:Bullet.update(),
//     // }
//     // if(SOCKET_LIST[1]){
//     //     // SOCKET_LIST[1].emit('BallUpdate', BreakoutBall);
//     //     // SOCKET_LIST[1].emit('PaddleUpdate', BreakoutPaddle);
//     //     // SOCKET_LIST[1].emit('BricksUpdate', BrickData);
//     // }
//     // for(var i in SOCKET_LIST){
//     //     var socket = SOCKET_LIST[i];
//     //     socket.emit('newPositions',pack);
//     // }
// },1000/60);
 
