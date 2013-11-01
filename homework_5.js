"use strict";

/* jshint browser: true, devel: true, globalstrict: true */

var g_canvas = document.getElementById("myCanvas");
var g_ctx = g_canvas.getContext("2d");

/*
0        1         2         3         4         5         6         7         8         9
123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890
*/

// =================
// KEYBOARD HANDLING
// =================

var g_keys = [];

function handleKeydown(evt) {
    g_keys[evt.keyCode] = true;
}

function handleKeyup(evt) {
    g_keys[evt.keyCode] = false;
}

// Inspects, and then clears, a key's state
//
// This allows a keypress to be "one-shot" e.g. for toggles
// ..until the auto-repeat kicks in, that is.
//
function eatKey(keyCode) {
    var isDown = g_keys[keyCode];
    g_keys[keyCode] = false;
    return isDown;
}

window.addEventListener("keydown", handleKeydown);
window.addEventListener("keyup", handleKeyup);

// ============
// PADDLE STUFF
// ============

// COMMON PADDLE STUFF

// A generic contructor which accepts an arbitrary descriptor object
function Paddle(descr) {
    for (var property in descr) {
        this[property] = descr[property];
    }
}

// Add these properties to the prototype, where they will serve as
// shared defaults, in the absence of an instance-specific overrides.

Paddle.prototype.halfWidth = 10;
Paddle.prototype.halfHeight = 50;

// Score counters for each paddle
var g_socre_paddle1 = 0, 
    g_socre_paddle2 = 0;    


Paddle.prototype.update = function () {
    if (g_keys[this.GO_UP]) {
        this.cy -= 5;
        // Don't pass the above wall of canvas
        if(this.cy < Paddle.prototype.halfHeight) {
            this.cy += 5;
        }
    } else if (g_keys[this.GO_DOWN]) {
        this.cy += 5;
        // Don't pass the bottom wall canvas
        if(this.cy > g_canvas.height - Paddle.prototype.halfHeight) {
            this.cy -= 5;
        }
    } else if (g_keys[this.GO_RIGHT]) {      // Go to the right
          this.cx += 5;
        // Don't pass throught the right wall of the canvas
        if(this.cx > g_canvas.width - Paddle.prototype.halfWidth) {
            this.cx -= 5;
        }   // Paddle 1 don't move more than 100 px to the right
            if(g_paddle1.cx > g_canvas.width / 4 + Paddle.prototype.halfWidth){
            g_paddle1.cx -= 5;
        }
    } else if (g_keys[this.GO_LEFT]) {       // Go to the left
        this.cx -= 5;
        // Don't pass thought the left wall
        if(this.cx < Paddle.prototype.halfWidth) {
            this.cx += 5;
        }   // Paddle 2 don't move more than 100 px to the left
            if(g_paddle2.cx < g_canvas.width / 1.48 + Paddle.prototype.halfWidth){
                g_paddle2.cx += 5;
        }
    }
};

Paddle.prototype.render = function (ctx) {
    // (cx, cy) is the centre; must offset it for drawing
    ctx.fillRect(this.cx - this.halfWidth,
                 this.cy - this.halfHeight,
                 this.halfWidth * 2,
                 this.halfHeight * 2);
};

Paddle.prototype.collidesWith = function (prevX, prevY, 
                                          nextX, nextY, 
                                          r) {
    var paddleEdge = this.cx;

    // Check X coords
    if ((nextX - r < paddleEdge && prevX - r >= paddleEdge) ||
        (nextX + r > paddleEdge && prevX + r <= paddleEdge)) {
        // Check Y coords
        if (nextY + r >= this.cy - this.halfHeight &&
            nextY - r <= this.cy + this.halfHeight) {
            // It's a hit!
            return true;
        }
    }
    // It's a miss!
    return false;
};

// PADDLE 1

var KEY_W = 'W'.charCodeAt(0);
var KEY_S = 'S'.charCodeAt(0);

// Add right and left for the first paddle 
var KEY_A = 'A'.charCodeAt(0);
var KEY_D = 'D'.charCodeAt(0);

var g_paddle1 = new Paddle({
    cx : 30,
    cy : 100,
    
    GO_UP   : KEY_W,
    GO_DOWN : KEY_S,
    GO_LEFT : KEY_A,  // Add left movement for the pad 1
    GO_RIGHT : KEY_D  // Add right movement for the pad 2
});

// PADDLE 2

var KEY_I = 'I'.charCodeAt(0);
var KEY_K = 'K'.charCodeAt(0);

// Add right and left for the second paddle also
var KEY_J = 'J'.charCodeAt(0);
var KEY_L = 'L'.charCodeAt(0);

var g_paddle2 = new Paddle({
    cx : 370,
    cy : 300,
    
    GO_UP   : KEY_I,
    GO_DOWN : KEY_K,
    GO_LEFT : KEY_J, // Same as above but pad2 'J' for left movement
    GO_RIGHT : KEY_L // pad2 'L' for right movement

});

// ==========
// BALL STUFF
// ==========

// BALL STUFF

// Same logic as above with the other constructor 
function Ball(descr) {
    for (var property in descr) {
        this[property] = descr[property];
    }
}


// Add properties to the prototype
// From whom we can create as many ojects as we want to
Ball.prototype.update = function () {
    // Remember my previous position
    var prevX = this.cx;
    var prevY = this.cy;
    
    // Compute my provisional new position (barring collisions)
    var nextX = prevX + this.xVel;
    var nextY = prevY + this.yVel;

    // Bounce off the paddles
    if (g_paddle1.collidesWith(prevX, prevY, nextX, nextY, this.radius) ||
        g_paddle2.collidesWith(prevX, prevY, nextX, nextY, this.radius))
    {nextX
        this.xVel *= -1;
    }

    // Bounce off top and bottom edges
    if (nextY < 0 ||                             // top edge
        nextY > g_canvas.height) {               // bottom edge
        this.yVel *= -1;
    }
    // Reset if we fall off the left or right edges
    // ...by more than some arbitrary `margin`
    
    // *Modified Part*
    // Bounce off right and left edges
    if (nextX < 0 || 
        nextX > g_canvas.width) {
        this.xVel *= -1;
    }
    
    // Our little socring system inside update method
    // If the nextX collides with 0, socre for paddel1 and vice versa
    if(nextX < 0) g_socre_paddle2++;
    else if(nextX > g_canvas.width) g_socre_paddle1++;

    // *Actually* update my position 
    // ...using whatever velocity I've ended up with
    //
    this.cx += this.xVel;
    this.cy += this.yVel;
};

/* Stop reseting the ball
Ball.prototype.reset = function () {
    this.cx = 300;
    this.cy = 100;
    this.xVel = -5;
    this.yVel = 4;
}; 
*/

Ball.prototype.render = function (ctx) {
    fillCircle(ctx, this.cx, this.cy, this.radius);
};

var g_ball = new Ball({
    cx: 50,
    cy: 200,
    radius: 10,

    xVel: 5,
    yVel: 4
});

// Ball 2, with the half of the velocity
var g_ball2 = new Ball({
    cx: g_ball.cx * 5,
    cy: g_ball.cy,
    radius: g_ball.radius/2,

    xVel: g_ball.xVel/2,
    yVel: g_ball.yVel/2
});

// Array of objects 
// Creates ramdom balls just to test the score shrink of the paddle scores
var g_i = 1;
var g_balls = 10 + g_i;
var g_arr = [];
for (g_i; g_i <= g_balls; g_i++) {
    g_arr.push(new Ball({cx:g_i ,cy:g_i, radius:g_i, xVel:g_i, yVel:g_i}));
}




// =====
// UTILS
// =====

function clearCanvas(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function fillCircle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
}

// =============
// GATHER INPUTS
// =============

function gatherInputs() {
    // Nothing to do here!
    // The event handlers do everything we need for now.
}

// Helper Function to display the socre
function displayScore(ctx) {

    //Deffault font : size 40px Arial bold
    var fontSize = "40px Arial bold";

    // If the font gets more than 100 shrink the font for 5px
    // So the score will be more visible
    var cfg = 1.36;
    if(g_socre_paddle2 >= 10) {
        cfg += 0.05;            //Move the score of p2 to the left
    } 
        // Shrink to 30px 
    if (g_socre_paddle2 >= 100) {
        fontSize = "30px Arial bold";
    } 
        // Shrink the size to 28px, hope none will play more than 9999
    if(g_socre_paddle2 >= 1000) {
        fontSize = "28px Arial bold";
    }
    ctx.font = fontSize;
    ctx.fillText("p1:" + g_socre_paddle1 , 0, g_canvas.height/12);
    ctx.fillText("p2:" + g_socre_paddle2, g_canvas.width/cfg, g_canvas.height/12);
}

// Update and render the random balls
function randomBalls_update() {
 
        for(var g_i = 1; g_i < g_balls; g_i++){
            g_arr[g_i].update();
        }
}

function randomBalls_render(ctx) {

        for(var g_i = 1; g_i < g_balls; g_i++){
            g_arr[g_i].render(ctx);
        }
}

// =================
// UPDATE SIMULATION
// =================

function updateSimulation() {
    if (shouldSkipUpdate()) return;

    g_ball.update();
    g_ball2.update();

    // Uncoment this to see how the font shinks after 100 and 1000 score of pad2
    //randomBalls_update(); 

    g_paddle1.update();
    g_paddle2.update();
}

// Togglable Pause Mode
//
var KEY_PAUSE = 'P'.charCodeAt(0);
var KEY_STEP  = 'O'.charCodeAt(0);

var g_isUpdatePaused = false;

function shouldSkipUpdate() {
    if (eatKey(KEY_PAUSE)) {
        g_isUpdatePaused = !g_isUpdatePaused;
    }
    return g_isUpdatePaused && !eatKey(KEY_STEP);    
}

// =================
// RENDER SIMULATION
// =================

function renderSimulation(ctx) {
    clearCanvas(ctx);
    
    g_ball.render(ctx);
    g_ball2.render(ctx);
    //o_ball.render(ctx);
    
    // Uncoment to see the effect
    //randomBalls_render(ctx);

    displayScore(ctx);
    
    g_paddle1.render(ctx);
    g_paddle2.render(ctx);
}

// ========
// MAINLOOP
// ========

function mainIter() {
    if (!requestedQuit()) {
        gatherInputs();
        updateSimulation();
        renderSimulation(g_ctx);

    } else {
        window.clearInterval(intervalID);
    }
}

// Simple voluntary quit mechanism
//
var KEY_QUIT = 'Q'.charCodeAt(0);
function requestedQuit() {
    return g_keys[KEY_QUIT];
}

var KEY_RESET = 'R'.charCodeAt(0);
function resetGame() {
}

// ..and this is how we set it all up, by requesting a recurring periodic
// "timer event" which we can use as a kind of "heartbeat" for our game.
//
var intervalID = window.setInterval(mainIter, 16.666);

//window.focus();
