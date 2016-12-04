var ROWS = 20;
var COLS = 10;
var SIZE = 32;


var canvas = document.getElementById('tetris');
var ctx = canvas.getContext('2d');
var blockImg;
var bgImg; //background image
var gameOverImg;
var curPiece;//Hold reference to the current game piece moving around
var gameData; // 2 Dimensional array that represents the game board
var imgLoader; // Bulk Image Loader
var prevTime;
var curTime;
var isGameOver;
var lineSpan; // Reference to span object in <div id = "score"> lines
var curLines; // The number of lines that the player has
var event;
var speedIncrease = 0;

function onReady()
{
	imgLoader = new BulkImageLoader();
	imgLoader.addImage("client/img/blocks.png", "blocks"); // Loads all images that are going to be used
	imgLoader.addImage("client/img/bg.png", "bg");
	imgLoader.addImage("client/img/over.png", "gameover");
	imgLoader.onReadyCallback = onImagesLoaded;
	imgLoader.loadImages();

	lineSpan = document.getElementById('lines');
	
	prevTime = curTime = 0;
	delete gameData;
	
	document.onkeydown = getInput;
}

function getInput(e)
{
	if (myID == 1) {
		if(!e) { var e = window.event; }

		e.preventDefault();
		
		if(isGameOver != true) // Checks the keys that are pressed and maps them to movement of the pieces
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
	blockImg = imgLoader.getImageAtIndex(0);
	bgImg = imgLoader.getImageAtIndex(1);
	gameOverImg = imgLoader.getImageAtIndex(2);
	delete gameData;
	initGame();
}

function initGame()
{	
	var r, c;
	curLines = 0;
	isGameOver = false;

	ctx.drawImage(bgImg, 0, 0, 320, 640, 0, 0, 320, 640);

	delete gameData;
	
	if(gameData == undefined) // This will loop through the game data array and set everything to zero 
		//if the game doesn't exist
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
	
	curPiece = getRandomPiece();
	
	lineSpan.innerHTML = curLines.toString();
	
	var requestAnimFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
							window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
							
	window.requestAnimationFrame = requestAnimFrame;
	
	requestAnimationFrame(update);

	
}

function update()
{
	if (myID == 1 && playing == true){
		curTime = new Date().getTime();
		if(speedIncrease == 0){
			if(curTime - prevTime > 150)
			{
				//update the game piece
				//Piece is falling down so we add one to y position, if it hit 
				//something, then we copy the data into the game board and then get a new piece
				if( checkMove(curPiece.gridx, curPiece.gridy + 1, curPiece.curState) )
				{
					curPiece.gridy += 1;//check move will check if current piece can move down one

				}
				else
				{

					blockInvis = 0; // Set counter variable to 0 to make it visible
					copyData(curPiece);//If it hits the bottom, we copy game data to our game board
					curPiece = getRandomPiece();
				}
				
				// update time
				prevTime = curTime;
			}
		}
		else{
			if(curTime - prevTime > 50)
			{
				//update the game piece
				//Piece is falling down so we add one to y position, if it hit 
				//something, then we copy the data into the game board and then get a new piece
				if( checkMove(curPiece.gridx, curPiece.gridy + 1, curPiece.curState) )
				{
					curPiece.gridy += 1;//check move will check if current piece can move down one

				}
				else
				{
					if(speedIncrease > 0){
						speedIncrease = speedIncrease - 1;
					}
					blockInvis = 0; // Set counter variable to 0 to make it visible
					copyData(curPiece);//If it hits the bottom, we copy game data to our game board
					curPiece = getRandomPiece();
				}
				
				// update time
				prevTime = curTime;
			}
		}

		socket.emit('PieceUpdate', curPiece);
		socket.emit('DataUpdate', gameData);
		
		ctx.clearRect(0, 0, 320, 640);
		drawBoard();
		drawPiece(curPiece);	
		//Takes in an image to draw, first four values define the 
		//points of the source image. Last four is where you place on the canvas	

	}
	else if(myID == 0 && playing == true){
		ctx.clearRect(0, 0, 320, 640);
		drawBoard();
		drawPiece(curPiece);
	}
	if(isGameOver == false) {
			requestAnimationFrame(update);
		}
}

function copyData(p)
{
	var xpos = p.gridx;
	var ypos = p.gridy;
	var state = p.curState;
	//Loop through piece in current state and draw into board
	
	for(var r = 0, len = p.states[state].length; r < len; r++)
	{ // Takes care of rows
		for(var c = 0, len2 = p.states[state][r].length; c < len2; c++)
		{ // Check if current spot on piece is a one
			if(p.states[state][r][c] == 1 && ypos >= 0)
			{
				gameData[ypos][xpos] = (p.color + 1); // If color is zero, then it's empty
			}
			
			xpos += 1;
		}
		
		xpos = p.gridx; //Once done drawing a row of columns
		ypos += 1;
	}
	
	checkLines();
	
	// If tetris piece pass the top of the board
	if(p.gridy < 0)
	{
		isGameOver = true;
		delete gameData;
		socket.emit('DataUpdate', gameData);
		socket.emit('LoseRound');
		// TetrisLose = true;		
        // LoseImg.style.display = 'inline-block';
		// // ctx.drawImage(gameOverImg, 0, 0, 320, 640, 0, 0, 320, 640);
		// setTimeout(function() {
		// 	// LoseImg.style.display = 'none';
  //           location.reload();
  //       }, 3000);
	}
}

function checkLines()
{
	var lineFound = false;
	var fullRow = true;
	var r = ROWS - 1;
	var c = COLS - 1;
	//Loop backwards between the rows and the columns
	while(r >= 0)
	{
		while(c >= 0)
		{
			if(gameData[r][c] == 0)
			{
				fullRow = false;
				c = -1; // We will then know that the row is false
			}
			c--; // Keep going through the row
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

function zeroRow(row) // Copying the data from the row above down one
{
	var r = row;
	var c = 0;
	
	while(r >= 0)
	{
		while(c < COLS)
		{
			if(r > 0)
				gameData[r][c] = gameData[r-1][c]; // If there is a valid data we copy in
			else
				gameData[r][c] = 0; // Else just make it zero
				
			c++;
		}
		
		c = 0;
		r--; // Go backwards, worry about the lines above and not the lines below
	}
}

function drawBoard()
{
	ctx.drawImage(bgImg, 0, 0, 320, 640, 0, 0, 320, 640);
	//Draw the individual cells
	for(var r = 0; r < ROWS; r++)
	{
		for(var c = 0; c < COLS; c++)
		{
			if(gameData[r][c] != 0)
			{
				ctx.drawImage(blockImg, (gameData[r][c] - 1) * SIZE, 0, SIZE, SIZE, c * SIZE, r * SIZE, SIZE, SIZE);
				//When the pieces hit the bottom of the board,
				//we are going to copy the value of the pieces color into
				//the game board. If the color is zero that is going
				//to represent an empty space
			}
		}
	}
}

function drawPiece(p)
{
	var drawX = p.gridx;
	var drawY = p.gridy;
	var state = p.curState;
	//Loop through piece in current state and draw into board
	if(blockInvis == 0){
	for(var r = 0, len = p.states[state].length; r < len; r++)
	{ // Takes care of the rows
		for(var c = 0, len2 = p.states[state][r].length; c < len2; c++)
		{ // Check if current spot on piece is a one
			if(p.states[state][r][c] == 1 && drawY >= 0)
			{
				ctx.drawImage(blockImg, p.color * SIZE, 0, SIZE, SIZE, drawX * SIZE, drawY * SIZE, SIZE, SIZE);
			}
			
			drawX += 1;
		}
		
		drawX = p.gridx; //Once done drawing a row of columns
		drawY += 1;
	}

  }
}

function checkMove(xpos, ypos, newState)
{ // Checking the position that we want to move the piece to. It's the position that you want to moove it to.
	var result = true;
	var newx = xpos;
	var newy = ypos;
	
	for(var r = 0, len = curPiece.states[newState].length; r < len; r++)
	{ // Check to see if it is in bounds that it isn't too far to the right or left
		for(var c = 0, len2 = curPiece.states[newState][r].length; c < len2; c++)
		{
			if(newx < 0 || newx >= COLS) // If found an invalid move
			{
				result = false;
				c = len2;
				r = len;
			}
			
			if(gameData[newy] != undefined && gameData[newy][newx] != 0
				&& curPiece.states[newState][r] != undefined && curPiece.states[newState][r][c] != 0)
			{ // Checking if the position on the board isn't equal to zero.
		//Need to check the data for the current piece to not be zero.
		//If piece has actual data and game data is actually zero, then two pieces are hitting each other
				result = false;
				c = len2;
				r = len;
			}
			
			newx += 1;
		}
		
		newx = xpos;
		newy += 1;
		
		if(newy > ROWS)
		{//Check to make sure that piece doens't fall below gameboard
			r = len;
			result = false;
		}
	}
	
	return result;
}