/*


     _____ ______   ___  ________   _______   ________  ___       __   _______   _______   ________  _______   ________     
|\   _ \  _   \|\  \|\   ___  \|\  ___ \ |\   ____\|\  \     |\  \|\  ___ \ |\  ___ \ |\   __  \|\  ___ \ |\   __  \    
\ \  \\\__\ \  \ \  \ \  \\ \  \ \   __/|\ \  \___|\ \  \    \ \  \ \   __/|\ \   __/|\ \  \|\  \ \   __/|\ \  \|\  \   
 \ \  \\|__| \  \ \  \ \  \\ \  \ \  \_|/_\ \_____  \ \  \  __\ \  \ \  \_|/_\ \  \_|/_\ \   ____\ \  \_|/_\ \   _  _\  
  \ \  \    \ \  \ \  \ \  \\ \  \ \  \_|\ \|____|\  \ \  \|\__\_\  \ \  \_|\ \ \  \_|\ \ \  \___|\ \  \_|\ \ \  \\  \| 
   \ \__\    \ \__\ \__\ \__\\ \__\ \_______\____\_\  \ \____________\ \_______\ \_______\ \__\    \ \_______\ \__\\ _\ 
    \|__|     \|__|\|__|\|__| \|__|\|_______|\_________\|____________|\|_______|\|_______|\|__|     \|_______|\|__|\|__|
                                            \|_________|                                                                


*/

var Game = Game || {};

Game = (function (document, window) {
    'use strict';

    var properties = {

        canvas: null,
        context: null,
        gameover: false,
        clock: '',
        elapsedTime: 0,
        firstClick: 1,
        gameUtilities: {
            totalFlags: 0,
            mineMap: [],
            flagMap: [],
            revealedMap: [],
            tilePerimeter: [
                {
                    x: -1,
                    y: -1
            },
                {
                    x: 0,
                    y: -1
            },
                {
                    x: 1,
                    y: -1
            },
                {
                    x: 1,
                    y: 0
            },
                {
                    x: 1,
                    y: 1
            },
                {
                    x: 0,
                    y: 1
            },
                {
                    x: -1,
                    y: 1
            },
                {
                    x: -1,
                    y: 0
            }
            ],
        },

        gameboard: {
            numberTilesX: 10,
            numberTilesY: 10,
            width: 400,
            height: 400,
            tileSize: 40,
        },

        assets: {
            imageElement: {
                number: null,
                mine: null,
                emptyTile: null,
                flag: null
            },
            imageSrc: {
                number: 'img/num.jpg',
                mine: 'img/mine.jpg',
                emptyTile: 'img/empty.jpg',
                flag: 'img/flag.png'
            }

        },

        /* Dynamicly created properties will be stored within the "container" object */
        containers: {}

    },

    methods = {

        drawTile: function (x, y) {

            x = x * properties.gameboard.tileSize;
            y = y * properties.gameboard.tileSize;

            properties.context.beginPath();
            properties.context.rect(x, y, properties.gameboard.tileSize, properties.gameboard.tileSize);
            properties.context.strokeStyle = "black";
            properties.context.stroke();

        },

        placeTile: function (img, x, y) {

            x = x * properties.gameboard.tileSize;
            y = y * properties.gameboard.tileSize;

            properties.context.drawImage(img, x, y, properties.gameboard.tileSize, properties.gameboard.tileSize);

        },

        placeText: function (text, x, y) {

            x = x * properties.gameboard.tileSize + 20;
            y = y * properties.gameboard.tileSize + 25;

            properties.context.font = '13px Sans-Serif';
            properties.context.textAlign = 'center';
            properties.context.fillStyle = 'white';
            properties.context.fillText(text, x, y);

        },

        createGameBoard: function () {

            for (var i = 0; i <= properties.gameboard.width; i++) {
                for (var j = 0; j <= properties.gameboard.height; j++) {
                    methods.drawTile(i, j);
                }
            }

        },

        createMines: function () {

            for (var i = 0; i < properties.gameboard.numberTilesX; i++) {
                properties.gameUtilities.mineMap[i] = {
                    x: Math.floor(Math.random() * properties.gameboard.numberTilesX),
                    y: Math.floor(Math.random() * properties.gameboard.numberTilesX)
                };
            }

        },

        dropFlag: function (x, y) {

            // To do - make this work a little better
            //            if (typeof properties.gameUtilities.revealedMap[x] !== 'undefined' && typeof properties.gameUtilities.revealedMap[x][y] !== 'undefined' && properties.gameUtilities.revealedMap[x][y] === 1) {
            //                return false;
            //            }

            var coords = properties.gameUtilities.flagMap[x][y];

            // If flag has been dropped
            if (coords) {

                methods.placeTile(properties.assets.imageElement.emptyTile, x, y);
                properties.gameUtilities.flagMap[x][y] = undefined;
                properties.gameUtilities.totalFlags--;
                properties.containers.totalFlags.innerHTML = parseInt(properties.containers.totalFlags.innerHTML) + 1;

                // drop flag
            } else {

                methods.placeTile(properties.assets.imageElement.flag, x, y);
                properties.gameUtilities.flagMap[x][y] = {
                    x: x,
                    y: y
                };
                properties.gameUtilities.totalFlags++;
                properties.containers.totalFlags.innerHTML = parseInt(properties.containers.totalFlags.innerHTML) - 1;

            }

            methods.calculateWin();


        },

        checkForMine: function (x, y) {

            var isMineTriggered = false,
                length = properties.gameUtilities.mineMap.length;

            // Iterate over all mines cheching if one was hit
            for (var i = 0; i < length; i++) {

                if (x === properties.gameUtilities.mineMap[i].x && y === properties.gameUtilities.mineMap[i].y) {
                    isMineTriggered = true;
                }
            }

            // If no mine was hit - the game continues
            if (!isMineTriggered) {

                methods.calculateSurroundingMines(x, y);

            } else { // Mine was hit - Game over

                methods.revealAllMines();
                methods.gameover('Ouch, maybe next time :(');

            }

        },

        clickHandler: function (e) {

            /* 
                Init the game only if the game is still in play
            */
            if (properties.gameover) {
                methods.gameover('Have another go!');
                return;
            }

            properties.canvas.className = '';
            
            // Get clicked positions
            var clickedX = e.pageX - properties.canvas.offsetLeft - 1,
                clickedY = e.pageY - properties.canvas.offsetTop - 1,

                x = Math.floor(clickedX / properties.gameboard.tileSize),
                y = Math.floor(clickedY / properties.gameboard.tileSize);


            // Left mouse was used to clicked 
            if (e.which === 1) {

                // This will initiate on a players first click
                if (properties.firstClick === 1) {

                    methods.createMines(); // Generate mines only once

                    properties.firstClick = 0;

                }

                if (typeof properties.gameUtilities.flagMap[x] !== 'undefined' && typeof properties.gameUtilities.flagMap[x][y] !== 'undefined' && properties.gameUtilities.flagMap[x][y].x === x && properties.gameUtilities.flagMap[x][y].y === y) {
                    methods.dropFlag(x, y);
                }

                methods.checkForMine(x, y);


            } else if (e.which === 3) { // Right mouse was used to click

                /* The player must first left click to init the game - before a flag can be placed */
                if (properties.firstClick !== 0) {
                    return;
                }

                // Drop flag
                methods.dropFlag(x, y);


            }


        },

        bindings: function () {

            // Bind default (left click) event to the Canvas
            properties.canvas.addEventListener('click', function (e) {

                methods.clickHandler(e);

            });

            // Right click triggered
            properties.canvas.oncontextmenu = function (e) {
                e.preventDefault();

                methods.clickHandler(e);

            };

            // New game button clicked
            properties.containers.newGame.onclick = function () {
                methods.reset();
            };


        },

        arraySetup: function () {

            for (var i = 0; i < properties.gameboard.numberTilesX; i++) {
                properties.gameUtilities.flagMap[i] = [];
                properties.gameUtilities.revealedMap[i] = [];
            }

        },

        reset: function () {

            // Clear the timer
            window.clearInterval(properties.clock);

            // Clear Canvas
            properties.context.clearRect(0, 0, properties.gameboard.width, properties.gameboard.height);

            // Reset Globals
            properties.elapsedTime = 0;
            properties.firstClick = 1;
            properties.gameover = false;
            properties.gameUtilities.mineMap = [];
            properties.gameUtilities.flagMap = [];
            properties.gameUtilities.revealedMap = [];

            // Default certain containers
            properties.containers.timer.innerHTML = '0s';
            properties.containers.newGame.innerHTML = 'New Game';
            properties.containers.statusMessage.innerHTML = 'Status Message';
            properties.containers.totalFlags.innerHTML = properties.gameboard.numberTilesX;
            properties.containers.gameOverScreen.style.display = 'none';
            properties.canvas.className = 'twerk';

            methods.init();

        },

        revealAllMines: function () {

            var mineMapLength = properties.gameUtilities.mineMap.length;

            if (mineMapLength > 0) {
                for (var i = 0; i < mineMapLength; i++) {
                    methods.placeTile(properties.assets.imageElement.mine, properties.gameUtilities.mineMap[i].x, properties.gameUtilities.mineMap[i].y);
                }

            }

        },

        calculateSurroundingMines: function (x, y, counter) {


            if (typeof properties.gameUtilities.revealedMap[x] !== 'undefined' && typeof properties.gameUtilities.revealedMap[x][y] !== 'undefined' && properties.gameUtilities.revealedMap[x][y] === 1) {
                return false;
            } else {

                properties.gameUtilities.revealedMap[x][y] = 1;

                var numberOfSurroundingMines = 0,
                    tilePermiterLength = properties.gameUtilities.tilePerimeter.length,
                    mineMapLength = properties.gameUtilities.mineMap.length,
                    isMineTriggered = false;

                counter = counter || 0;
                counter++;

                // Iterate over all mines checking if one was hit
                for (var m = 0; m < mineMapLength; m++) {
                    if (x === properties.gameUtilities.mineMap[m].x && y === properties.gameUtilities.mineMap[m].y) {
                        isMineTriggered = true;
                    }
                }

                if (isMineTriggered) {
                    return false;
                }

                // check mines surrounding clicked tile
                for (var i = 0; i < tilePermiterLength; i++) {

                    var permiterX = x + properties.gameUtilities.tilePerimeter[i].x,
                        permiterY = y + properties.gameUtilities.tilePerimeter[i].y;


                    for (var j = 0; j < mineMapLength; j++) {
                        if (properties.gameUtilities.mineMap[j].x === permiterX && properties.gameUtilities.mineMap[j].y === permiterY) {
                            numberOfSurroundingMines++;
                        }
                    }

                }

                if (numberOfSurroundingMines === 0) {

                    methods.placeTile(properties.assets.imageElement.emptyTile, x, y);

                    // At least 1 mine surrounds the tile clicked
                } else {

                    methods.placeTile(properties.assets.imageElement.number, x, y);
                    methods.placeText(numberOfSurroundingMines, x, y);
                }


                // Help the player by pre filling a few tiles
                for (var k = -1; k <= 1; k++) {
                    for (var l = -1; l <= 1; l++) {

                        // If a neighboring square is also not surrounded by mines, remove his neighbors also; and repeat
                        if (x + k >= 0 && y + l >= 0 && x + k <= properties.gameboard.numberTilesX && y + l <= properties.gameboard.numberTilesY && counter < 3) {
                            methods.calculateSurroundingMines(x + k, y + l, counter);
                        }
                    }
                }

            }

        },

        calculateWin: function () {

            // First check if flags dropped are equal to the number of mines
            var mineMapLength = properties.gameUtilities.mineMap.length;

            if (properties.gameUtilities.totalFlags === mineMapLength) {

                var count = 0;

                for (var i = 0; i < properties.gameboard.numberTilesX; i++) {

                    var mineMapCoords = properties.gameUtilities.mineMap[i];
                    var flagMapCoords = properties.gameUtilities.flagMap[mineMapCoords.x][mineMapCoords.y];

                    if (JSON.stringify(mineMapCoords) === JSON.stringify(flagMapCoords)) {
                        count++;
                    }

                }

                if (count === mineMapLength) {
                    methods.gameover('Winner!');
                }

            }

        },

        gameover: function (statusMessage) {

            properties.gameover = true;
            properties.containers.statusMessage.innerHTML = statusMessage;
            properties.containers.gameOverScreen.style.display = 'block';
            window.clearInterval(properties.clock);

        },

        timer: function () {

            properties.clock = setInterval(function () {
                properties.elapsedTime++;
                properties.containers.timer.innerHTML = properties.elapsedTime + 's';

            }, 1000);
        },

        init: function () {

            // Ready the canvas 
            properties.canvas = document.getElementById('board');
            properties.context = properties.canvas.getContext('2d');


            // Create images
            properties.assets.imageElement.number = new Image();
            properties.assets.imageElement.emptyTile = new Image();
            properties.assets.imageElement.flag = new Image();
            properties.assets.imageElement.mine = new Image();


            // Add image source
            properties.assets.imageElement.number.src = properties.assets.imageSrc.number;
            properties.assets.imageElement.emptyTile.src = properties.assets.imageSrc.emptyTile;
            properties.assets.imageElement.flag.src = properties.assets.imageSrc.flag;
            properties.assets.imageElement.mine.src = properties.assets.imageSrc.mine;


            // Setup containers
            properties.containers.timer = document.getElementById('timer');
            properties.containers.newGame = document.getElementById('new-game');
            properties.containers.statusMessage = document.getElementById('status-message');
            properties.containers.totalFlags = document.getElementById('total-flags');
            properties.containers.gameOverScreen = document.getElementById('game-overlay');


            // Setup defaults
            properties.gameUtilities.flagMap = [];
            properties.gameUtilities.revealedMap = [];
            properties.containers.totalFlags.innerHTML = properties.gameboard.numberTilesX;


            methods.arraySetup();


            methods.createGameBoard();


            methods.bindings();


            methods.timer();


        }


    };


    var expose = {
        
        play: methods.init
        
    };


    return expose;


}(document, window));