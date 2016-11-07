var ROWS = 20;
var COLS = 10;
var SIZE = 32;


var canvas = document.getElementById('gameCanvas');
var ctx = canvas.getContext('2d');
var blockImg;
var bgImg;
var gameOverImg;
var curPiece;
var gameData;
var imgLoader;
var prevTime;
var curTime;
var isGameOver;
var lineSpan;
var curLines;
var TetrisPlayer;
var event;



// window.onload = onReady;


TetrisPlayer = function(index, game){

	/*this.input =  {
		left:false,
		right:false,
		up:false,
		down:false
	}*/

	this.canvas = canvas;
	this.ctx = ctx;
	this.blockRotate = blockRotate;
	this.blockInvis = blockInvis;
	this.imgLoader = imgLoader;
	imgLoader.addImage("client/blocks.png", "blocks");
	imgLoader.addImage("client/bg.png", "bg");
	imgLoader.addImage("client/over.png", "gameover");
	this.curPiece = getRandomPiece();
	this.gameData;
	this.isGameOver = false;
}

// var tempPiece = getRandomPiece();

var setEventHandlers = function () {
        
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
}

function onReady()
{
	imgLoader = new BulkImageLoader();
	imgLoader.addImage("client/blocks.png", "blocks");
	imgLoader.addImage("client/bg.png", "bg");
	imgLoader.addImage("client/over.png", "gameover");
	imgLoader.onReadyCallback = onImagesLoaded;
	imgLoader.loadImages();

	//ctx = canvas.getContext('2d');
	lineSpan = document.getElementById('lines');
	
	/*prevTime = curTime = player.curTime;*/
	prevTime = curTime = 0;

	setEventHandlers();
	
	document.onkeydown = getInput;
}

function getInput(e)
{
	if (myID == 1) {
		curPiece = player.curPiece;
		isGameOver = player.isGameOver;
		//blockInvis = player.blockInvis;
		//blockRotate = player.blockRotate;
		if(!e) { var e = window.event; }
		/*player.event = e;*/

		e.preventDefault();
		
		if(isGameOver != true)
		{
			switch(e.keyCode)
			{
				case 37:
				{
					if( checkMove(curPiece.gridx - 1, curPiece.gridy, curPiece.curState) )
						curPiece.gridx--;
				}
				break;
				
				case 39:
				{
					if( checkMove(curPiece.gridx + 1, curPiece.gridy, curPiece.curState) )
						curPiece.gridx++;
				}
				break;
				
				case 38:
				{
					var newState = curPiece.curState - 1;
					if(newState < 0)
						newState = curPiece.states.length - 1;
						
					if( checkMove(curPiece.gridx, curPiece.gridy, newState) )
						curPiece.curState = newState;
				}
				break;
				
				case 40:
				{
					if( checkMove(curPiece.gridx, curPiece.gridy + 1, curPiece.curState) )
						curPiece.gridy++;
				}
				break;
				case 87:
				{
					if(blockInvis == 0){
						blockInvis = 1;
					}
					else{
						blockInvis = 0;
					}
				}
			}
		}
		else
		{
			initGame();
		}
	}
}

function onImagesLoaded(e)
{

	/*blockImg = player.blockImg;
	bgImg = player.bgImg;
	gameOverImg = player.gameOverImg;*/
	blockImg = imgLoader.getImageAtIndex(0);
	bgImg = imgLoader.getImageAtIndex(1);
	gameOverImg = imgLoader.getImageAtIndex(2);
	initGame();
}

function initGame()
{
	player = new TetrisPlayer (12,0)
	curPiece = player.curPiece;
	
	var r, c;
	curLines = 0;
	isGameOver = player.isGameOver;
	isGameOver = false;

	ctx.drawImage(bgImg, 0, 0, 320, 640, 0, 0, 320, 640);
	
	if(gameData == undefined)
	{
		gameData = new Array();
		
		for(r = 0; r < ROWS; r++)
		{
			gameData[r] = new Array();
			for(c = 0; c < COLS; c++)
			{
				gameData[r].push(0);
			}
		}		
	}
	else
	{
		for(r = 0; r < ROWS; r++)
		{
			for(c = 0; c < COLS; c++)
			{
				gameData[r][c] = 0;
			}
		}
	}
	
	player.curPiece = getRandomPiece();
	
	lineSpan.innerHTML = curLines.toString();
	
	var requestAnimFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
							window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
							
	window.requestAnimationFrame = requestAnimFrame;
	// gameData = player.gameData;
	
	requestAnimationFrame(update);

	
}

function update()
{
	if (myID == 1 && playing == true){
		curTime = new Date().getTime();
		curPiece = player.curPiece;
		isGameOver = player.isGameOver;
		if(curTime - prevTime > 200)
		{
			// update the game piece
			if( checkMove(curPiece.gridx, curPiece.gridy + 1, curPiece.curState) )
			{
				curPiece.gridy += 1;
			}
			else
			{
				blockInvis = 0;
				copyData(curPiece);
				player.curPiece = getRandomPiece();
			}
			
			// update time
			prevTime = curTime;
		}

		socket.emit('PieceUpdate', curPiece);
		socket.emit('DataUpdate', gameData);
		
		ctx.clearRect(0, 0, 320, 640);
		drawBoard();
		drawPiece(curPiece);		

	}
	else if(myID == 0){
		// ctx.clearRect(0, 0, 320, 640);
		drawBoard();
		drawPiece(curPiece);
		// requestAnimationFrame(update);
	}
	if(isGameOver == false)
		{
			requestAnimationFrame(update);
		}
	else
		ctx.drawImage(gameOverImg, 0, 0, 320, 640, 0, 0, 320, 640);
}

function copyData(p)
{
	var xpos = p.gridx;
	var ypos = p.gridy;
	var state = p.curState;
	// gameData = player.gameData;
	isGameOver = player.isGameOver;
	
	for(var r = 0, len = p.states[state].length; r < len; r++)
	{
		for(var c = 0, len2 = p.states[state][r].length; c < len2; c++)
		{
			if(p.states[state][r][c] == 1 && ypos >= 0)
			{
				gameData[ypos][xpos] = (p.color + 1);
			}
			
			xpos += 1;
		}
		
		xpos = p.gridx;
		ypos += 1;
	}
	
	checkLines();
	
	if(p.gridy < 0)
	{
		isGameOver = true;
	}
}

function checkLines()
{
	var lineFound = false;
	var fullRow = true;
	var r = ROWS - 1;
	var c = COLS - 1;
	// gameData = player.gameData;
	
	while(r >= 0)
	{
		while(c >= 0)
		{
			if(gameData[r][c] == 0)
			{
				fullRow = false;
				c = -1;
			}
			c--;
		}
		
		if(fullRow == true)
		{
			zeroRow(r);
			r++;
			lineFound = true;
			curLines++;

			++lineClear;
			if(lineClear == 1){
				socket.emit('AddBrickline');
				lineClear = 0;
			}
		}
		
		fullRow = true;
		c = COLS - 1;
		r--;
	}
	
	if(lineFound)
	{
		lineSpan.innerHTML = curLines.toString();
	}
}

function zeroRow(row)
{
	var r = row;
	var c = 0;
	// gameData = player.gameData;
	
	while(r >= 0)
	{
		while(c < COLS)
		{
			if(r > 0)
				gameData[r][c] = gameData[r-1][c];
			else
				gameData[r][c] = 0;
				
			c++;
		}
		
		c = 0;
		r--;
	}
}

function drawBoard()
{
	// gameData = player.gameData;
	ctx.drawImage(bgImg, 0, 0, 320, 640, 0, 0, 320, 640);
	
	for(var r = 0; r < ROWS; r++)
	{
		for(var c = 0; c < COLS; c++)
		{
			if(gameData[r][c] != 0)
			{
				ctx.drawImage(blockImg, (gameData[r][c] - 1) * SIZE, 0, SIZE, SIZE, c * SIZE, r * SIZE, SIZE, SIZE);
			}
		}
	}
}

function drawPiece(p)
{
	var drawX = p.gridx;
	var drawY = p.gridy;
	var state = p.curState;
	
	if(blockInvis == 0){
	for(var r = 0, len = p.states[state].length; r < len; r++)
	{
		for(var c = 0, len2 = p.states[state][r].length; c < len2; c++)
		{
			if(p.states[state][r][c] == 1 && drawY >= 0)
			{
				ctx.drawImage(blockImg, p.color * SIZE, 0, SIZE, SIZE, drawX * SIZE, drawY * SIZE, SIZE, SIZE);
			}
			
			drawX += 1;
		}
		
		drawX = p.gridx;
		drawY += 1;
	}

  }
}

function checkMove(xpos, ypos, newState)
{
	var result = true;
	var newx = xpos;
	var newy = ypos;
	curPiece = player.curPiece;
	// gameData = player.gameData;
	
	for(var r = 0, len = curPiece.states[newState].length; r < len; r++)
	{
		for(var c = 0, len2 = curPiece.states[newState][r].length; c < len2; c++)
		{
			if(newx < 0 || newx >= COLS)
			{
				result = false;
				c = len2;
				r = len;
			}
			
			if(gameData[newy] != undefined && gameData[newy][newx] != 0
				&& curPiece.states[newState][r] != undefined && curPiece.states[newState][r][c] != 0)
			{
				result = false;
				c = len2;
				r = len;
			}
			
			newx += 1;
		}
		
		newx = xpos;
		newy += 1;
		
		if(newy > ROWS)
		{
			r = len;
			result = false;
		}
	}
	
	return result;
}