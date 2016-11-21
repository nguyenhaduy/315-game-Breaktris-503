// window.onload = function(){
var BreakoutRun = function(){   
    // Initialize phaser engine
    game = new Phaser.Game(320, 640, Phaser.CANVAS, 'breakout', {
      preload: preload, create: create, update: update
    });

    var breakout;

    var ball;   // Ball object
    var paddle; // Paddle object
    var bricks; // Bricks objects
    var newBrick;
    var brickInfo;
    var scoreText;
    var score = 0;
    var lives = 1;
    var livesText;
    var lifeLostText;
    var startButton;
    var key = [];
    var cursors;
    var upKey;
    var downKey;
    var leftKey;
    var rightKey;
    var spaceKey;
    var BreakoutPlayer;
	var gameover;

    var IntervalLoop;

    // Information to create brick
    var brickInfo = {
            width: 30,
            height: 15,
            count: {
                row: 7,
                col: 5
            },
            offset: {
                top: 30,
                left: 40
            },
            padding: 10
        };
    
        // Event Handler Function
    var setEventHandlers = function () {

        // Update Ball
        socket.on('BallUpdate', function(data){
            // console.log('Ball Position Update');
            ball.x = data.x;
            ball.y = data.y;
        })

        // Update Paddle
        socket.on('PaddleUpdate', function(data){
            // console.log('Paddle Position Update');
            paddle.x = data.x;
            paddle.y = data.y;
        })

        // Update Bricks
        socket.on('BricksUpdate', copyBrick)

        // Start game
        socket.on('StartGame', function(data){
            // console.log('Block Update');
            playing = data;
        })

        // Add 1 more breakline
        socket.on('AddBrickline', function(){
            console.log('Add Brick line');
            addBrickLine = 1;
            // addBricks();
        })

        // Update Tetris Piece
        socket.on('PieceUpdate', function(data){
            // console.log('Tetris Position Update');
            curPiece = data;
        })

        //Update gameData
        socket.on('DataUpdate', function(data){
            // console.log('Game Data Update');
            gameData = data;
        })

        socket.on('StartGame', function(data){
            // console.log('Block Update');
            playing = data;
        })

        socket.on('MakeInvi', function(){
            // console.log('Block Update');
            blockInvis = 1;
        })

        socket.on('MakeSpeed', function(){
            // console.log('Block Update');
            speedIncrease = speedIncrease + 2;
        })

        socket.on('NextGame', function(){  
            console.log('Next Game');          
            playing = false;
            isGameOver = false; 
            if (myID == 1)
                myID = 0;
            else if (myID == 0)
                myID = 1;
            Round2Img.style.display = 'inline-block';
            ball.destroy();
            paddle.destroy();
            bricks.destroy();

            // delete ball;   // Ball object
            // delete paddle; // Paddle object
            // delete bricks; // Bricks objects
            delete newBrick;
            delete scoreText;
            score = 0;
            lives = 1;
            delete livesText;
            delete lifeLostText;
            delete startButton;
            delete cursors;
            delete upKey;
            delete downKey;
            delete leftKey;
            delete rightKey;
            delete spaceKey;
            delete BreakoutPlayer;
            delete gameover;

            preload();
            create();
            setTimeout(function() {                
                Round2Img.style.display = 'none';
            }, 3000);
        });

        socket.on('TetrisLose', function(){
            console.log('Tetris Lose');
            playing = false;
            isGameOver = true;          
            WinImg.style.display = 'inline-block';
            setTimeout(function() {
                // WinImg.style.display = 'none';
                location.reload();
            }, 3000);
        })

        socket.on('BreakoutLose', function(){
            console.log('BreakoutLose');
            playing = false;
            isGameOver = true;
            WinImg.style.display = 'inline-block';            
            setTimeout(function() {
                // WinImg.style.display = 'none';
                location.reload();
            }, 3000);
        });
    }
    
    // Loading data for the game
    function preload() {
        // onReady();  // Calling onReady Tetris function
        game.scale.scaleMode = Phaser.ScaleManager.NO_SCALE;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;
        game.stage.backgroundColor = '#eee';
        game.load.spritesheet('ball', 'client/img/wobble.png', 20, 20);
        game.load.image('paddle', 'client/img/paddle.png');
        game.load.image('brick', 'client/img/brick.png');
        game.load.spritesheet('button', 'client/img/button.png', 120, 40);
		game.load.image('gameover','client/img/over.png')
    }

    //Creating game objects
    function create() {        
                       
        onReady();
        console.log('ID is ' + myID);
        if (myID == 0) {    // If the player play breakout
            // Initialize phaser physics engine
            game.physics.startSystem(Phaser.Physics.ARCADE);

            // Uncheck collision for the bottom screen
            game.physics.arcade.checkCollision.down = false;
            console.log('Playing');

            // Create new player
            // player = new BreakoutPlayer(myID, game, breakout);

            // Create ball object and set its attributes
            ball = game.add.sprite(game.world.width*0.5, game.world.height*0.5, 'ball');
            ball.animations.add('wobble', [0,1,0,2,0,1,0,2,0], 24);
            ball.anchor.set(0.5);
            game.physics.enable(ball, Phaser.Physics.ARCADE);
            ball.body.collideWorldBounds = true;
            ball.body.bounce.set(1);
            ball.checkWorldBounds = true;
            ball.events.onOutOfBounds.add(ballLeaveScreen, this);

            // Create paddle object
            paddle = game.add.sprite(game.world.width*0.5, game.world.height-5, 'paddle');
            paddle.anchor.set(0.5,1);
            game.physics.enable(paddle, Phaser.Physics.ARCADE);
            paddle.body.immovable = true;;
            // paddle = player.paddle;

            initBrick();

            textStyle = { font: '18px Arial', fill: '#0095DD' };
            scoreText = game.add.text(5, 5, 'Points: 0', textStyle);
            livesText = game.add.text(game.world.width-5, 5, 'Lives: '+lives, textStyle);
            livesText.anchor.set(1,0);
            lifeLostText = game.add.text(game.world.width*0.5, game.world.height*0.5, 'Life lost, click to continue', textStyle);
            lifeLostText.anchor.set(0.5);
            lifeLostText.visible = false;

            startButton = game.add.button(game.world.width*0.5, game.world.height*0.5, 'button', startGame, this, 1, 0, 2);
            startButton.anchor.set(0.5);
			
			gameover = game.add.sprite(game.world.width*0.5, game.world.height*0.5, 'gameover');
			gameover.anchor.set(0.5);
			gameover.visible = false;

            // cursors = player.cursors;
            upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
            downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
            leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
            rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
            spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
            
        }
        else if(myID ==1){  // If the player play tetris
            console.log('Watching');
            ball = game.add.sprite(game.world.width*0.5, game.world.height*0.5, 'ball');
            ball.animations.add('wobble', [0,1,0,2,0,1,0,2,0], 24);
            ball.anchor.set(0.5);

            paddle = game.add.sprite(game.world.width*0.5, game.world.height-5, 'paddle');
            paddle.anchor.set(0.5,1);

            initBrick();

            textStyle = { font: '18px Arial', fill: '#0095DD' };
            scoreText = game.add.text(5, 5, 'Points: 0', textStyle);
            livesText = game.add.text(game.world.width-5, 5, 'Lives: '+lives, textStyle);
            livesText.anchor.set(1,0);
            lifeLostText = game.add.text(game.world.width*0.5, game.world.height*0.5, 'Life lost, click to continue', textStyle);
            lifeLostText.anchor.set(0.5);
            lifeLostText.visible = false;
            
        }

        // Start event handler
        setEventHandlers();
    }   

    var flipFlop;
    function update() {
        if (myID == 0 && playing){
            game.physics.arcade.collide(ball, paddle, ballHitPaddle);
            game.physics.arcade.collide(ball, bricks, ballHitBrick);
            if(playing) {
                if (rightKey.isDown){
                    if (paddle.x < 320)
                        paddle.x = paddle.x + 5;
                }
                if (leftKey.isDown){
                    if (paddle.x > 0)
                        paddle.x = paddle.x - 5;
                }
                
                if (spaceKey.isDown){
                    if (!flipFlop) {
                        addBricks();
                        flipFlop = true;
                    }
                }   
                if (spaceKey.isUp) {
                    flipFlop = false;
                }
            }

            if (addBrickLine == 1){
                console.log('More Bricks')
                addBricks();
                addBricks();
                addBricks();
                addBricks();
                addBricks();
                addBrickLine = 0;
            }
        }
        // else if (myID == 1){
        // }
    }

    function startGame() {
        if (myID == 0){
            startButton.destroy();
            // initBrick();
            ball.body.velocity.set(0, 150);        
            // ball.body.gravity.y = 100;
            playing = true;
            socket.emit('StartGame', playing);
            IntervalLoop = setInterval(function(){
                var ballposition = {
                    x:ball.x,
                    y:ball.y
                }
                socket.emit('BallUpdate', ballposition);

                var paddleposition = {
                    x:paddle.x,
                    y:paddle.y
                }
                socket.emit('PaddleUpdate', paddleposition);

                var brickdata = [];
                for (var i = 0; i < bricks.children.length; i++) {
                    brickdata.push({x:bricks.children[i].x,y:bricks.children[i].y});
                }
                socket.emit('BricksUpdate', brickdata);

            },1000/60);
        }
        else if(myID == 1){

        }
    }

    function initBrick() {
        if (myID ==0){
        
            bricks = game.add.group();

            for (i=0; i<brickInfo.count.col; ++i){
                for (j=0; j<brickInfo.count.row; ++j){
                    var brickX = (j*(brickInfo.width+brickInfo.padding)) + brickInfo.offset.left;
                    var brickY = (i*(brickInfo.height+brickInfo.padding)) + brickInfo.offset.top;
                    newBrick = game.add.sprite(brickX, brickY, 'brick');
                    game.physics.enable(newBrick, Phaser.Physics.ARCADE);
                    newBrick.body.immovable = true;
                    newBrick.anchor.set(0.5);
                    bricks.add(newBrick);
                }
            }
        }
        else if (myID == 1){

        }
    }

    function copyBrick(brickdata){
        // delete bricks;
        if(bricks){
            for (var i = bricks.children.length - 1 ; i >= 0; --i) {
                bricks.children[i].destroy();
            }
            // bricks.destroy();
        }
        bricks = game.add.group();
        for (var i = 0; i < brickdata.length; i++) {
            var brickX = brickdata[i].x;
            var brickY = brickdata[i].y;
            newBrick = game.add.sprite(brickX, brickY, 'brick');
            newBrick.anchor.set(0.5);
            // newbrick.visible = true;
            bricks.add(newBrick);
        }

    }

    function addBricks(){
        len = bricks.children.length;
        for (var i = 0; i < len; i++) {
            bricks.children[i].y += 25;
        }
        for (i=0; i<7; ++i){
            var brickX = (i*(brickInfo.width+brickInfo.padding))+brickInfo.offset.left;
            var brickY = (0*(brickInfo.height+brickInfo.padding))+brickInfo.offset.top;
            newBrick = game.add.sprite(brickX, brickY, 'brick');
            game.physics.enable(newBrick, Phaser.Physics.ARCADE);
            newBrick.body.immovable = true;
            newBrick.anchor.set(0.5);
            bricks.add(newBrick);
        }
    }

    function ballHitPaddle(ball, paddle) {
        if (myID == 0) {
            ball.animations.play('wobble');
            // ball.body.velocity.x = -1*5*(paddle.x-ball.x);
            var diff = 0;

            if (ball.x < paddle.x)
            {
                //  Ball is on the left-hand side of the paddle
                diff = paddle.x - ball.x;
                ball.body.velocity.x = (-5 * diff);
            }
            else if (ball.x > paddle.x)
            {
                //  Ball is on the right-hand side of the paddle
                diff = ball.x -paddle.x;
                ball.body.velocity.x = (5 * diff);
            }
            else
            {
                //  Ball is perfectly in the middle
                //  Add a little random X to stop it bouncing straight up!
                ball.body.velocity.x = 2 + Math.random() * 8;
            }
        }
        else if (myID ==1){
        }
    }

    function ballHitBrick(ball, brick){
        if (myID == 0){
            ball.animations.play('wobble');
            var killTween = game.add.tween(brick.scale);
            killTween.to({x:0,y:0}, 200, Phaser.Easing.Linear.None);
            killTween.onComplete.addOnce(function(){
                // brick.kill();
                brick.destroy();
            }, this);
            killTween.start();

            score += 10;
            scoreText.setText('Point: ' + score);

            var count_alive = 0;
            for (i = 0; i <bricks.children.length; i++){
                if (bricks.children[i].alive == true){
                    count_alive++;
                }
            }

            if (count_alive == 0) {
                alert('You won the game, congratulations!');
                location.reload();
            }
            
            ++bricksClear;
            if ((bricksClear % 2) == 0){
                socket.emit('MakeSpeed');
            }
            if (bricksClear == 5){
                bricksClear = 0;
                socket.emit('MakeInvi');
            }
        }
        else if (myID == 1){

        }
    }

    function ballLeaveScreen() {
        if (myID == 0){

            lives--;
            if(lives) {
                livesText.setText('Lives: ' + lives);
                lifeLostText.visible = true;
                ball.reset(game.world.width*0.5, game.world.height*0.5);
                paddle.reset(game.world.width*0.5, game.world.height-5);
                game.input.onDown.addOnce(function(){
                    lifeLostText.visible = false;
                    ball.body.velocity.set(0, 450);
                    // ball.body.gravity.y = 100;
                }, this);
            }
            else {
                playing = false;
                clearInterval(IntervalLoop);
				socket.emit('BreakoutLose');
                
                LoseImg.style.display = 'inline-block';                
                // ball.destroy();
                // paddle.destroy();
                // bricks.destroy();
                setTimeout(function() {
                    // LoseImg.style.display = 'none';
                    location.reload();
                }, 3000);
            }
        }
        else if (myID == 1){

        }   
    }

}