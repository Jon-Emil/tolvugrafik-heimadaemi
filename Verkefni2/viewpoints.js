var canvas;
var gl;

// position of the track
var TRACK_RADIUS = 100.0;
var TRACK_INNER = 90.0;
var TRACK_OUTER = 110.0;
var TRACK_PTS = 100;

var BLUE = vec4( 0.0, 0.0, 1.0, 1.0 );
var RED = vec4( 1.0, 0.0, 0.0, 1.0 );
var GREEN = vec4( 0.0, 1.0, 0.0, 1.0 );
var GRAY = vec4( 0.4, 0.4, 0.4, 1.0 );
var BLACK = vec4( 0.0, 0.0, 0.0, 1.0 );
var CYAN = vec4( 0.0, 1.0, 1.0, 1.0 );
var DARK_GREEN = vec4( 0.0, 0.4, 0.0, 1.0 );
var DARK_GRAY = vec4( 0.7, 0.7, 0.7, 1.0 );

var numCubeVertices  = 36;
var numTrackVertices  = 2*TRACK_PTS + 2;

// camera height
var height = 0.0;

// variables for moving cars
// car1
var car1Direction = 0.0;
var car1XPos = 105.0;
var car1YPos = 0.0;
// car2
var car2Direction = 360.0;
var car2XPos = 95.0;
var car2YPos = 0.0;

// variables for moving plane
var planeDirection = 0.0;
var planeXPos = 0.0;
var planeYPos = 0.0;
var planeRotation = 0.0;

// current viewpoint
var view = 1;

var colorLoc;
var mvLoc;
var pLoc;
var proj;

var cubeBuffer;
var trackBuffer;
var vPosition;

// for viewpoint 0
var movement = false;
var spinY = 0;
var spinX = 0;
var origX;
var origY;
var cameraPositionX = 0;
var cameraPositionY = 0;

// the 36 vertices of the cube
var cVertices = [
    // front side:
    vec3( -0.5,  0.5,  0.5 ), vec3( -0.5, -0.5,  0.5 ), vec3(  0.5, -0.5,  0.5 ),
    vec3(  0.5, -0.5,  0.5 ), vec3(  0.5,  0.5,  0.5 ), vec3( -0.5,  0.5,  0.5 ),
    // right side:
    vec3(  0.5,  0.5,  0.5 ), vec3(  0.5, -0.5,  0.5 ), vec3(  0.5, -0.5, -0.5 ),
    vec3(  0.5, -0.5, -0.5 ), vec3(  0.5,  0.5, -0.5 ), vec3(  0.5,  0.5,  0.5 ),
    // bottom side:
    vec3(  0.5, -0.5,  0.5 ), vec3( -0.5, -0.5,  0.5 ), vec3( -0.5, -0.5, -0.5 ),
    vec3( -0.5, -0.5, -0.5 ), vec3(  0.5, -0.5, -0.5 ), vec3(  0.5, -0.5,  0.5 ),
    // top side:
    vec3(  0.5,  0.5, -0.5 ), vec3( -0.5,  0.5, -0.5 ), vec3( -0.5,  0.5,  0.5 ),
    vec3( -0.5,  0.5,  0.5 ), vec3(  0.5,  0.5,  0.5 ), vec3(  0.5,  0.5, -0.5 ),
    // back side:
    vec3( -0.5, -0.5, -0.5 ), vec3( -0.5,  0.5, -0.5 ), vec3(  0.5,  0.5, -0.5 ),
    vec3(  0.5,  0.5, -0.5 ), vec3(  0.5, -0.5, -0.5 ), vec3( -0.5, -0.5, -0.5 ),
    // left side:
    vec3( -0.5,  0.5, -0.5 ), vec3( -0.5, -0.5, -0.5 ), vec3( -0.5, -0.5,  0.5 ),
    vec3( -0.5, -0.5,  0.5 ), vec3( -0.5,  0.5,  0.5 ), vec3( -0.5,  0.5, -0.5 )
];

// vertices of the track
var tVertices = [];


window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.7, 0.9, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    createTrack();
    
    // VBO for the track
    trackBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, trackBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(tVertices), gl.STATIC_DRAW );

    // VBO for the cube
    cubeBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cubeBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(cVertices), gl.STATIC_DRAW );


    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    colorLoc = gl.getUniformLocation( program, "fColor" );
    
    mvLoc = gl.getUniformLocation( program, "modelview" );

    // set projection
    pLoc = gl.getUniformLocation( program, "projection" );
    proj = perspective( 50.0, 1.0, 1.0, 500.0 );
    gl.uniformMatrix4fv(pLoc, false, flatten(proj));

    document.getElementById("Viewpoint").innerHTML = "1: Fjarlægt sjónarhorn";
    document.getElementById("Height").innerHTML = "Viðbótarhæð: "+ height;

    // Event listener for keyboard
    window.addEventListener("keydown", function(e){
        switch( e.keyCode ) {
            case 49:	// 1: distant and stationary viewpoint
                view = 1;
                document.getElementById("Viewpoint").innerHTML = "1: Fjarlægt sjónarhorn";
                break;
            case 50:	// 2: panning camera inside the track
                view = 2;
                document.getElementById("Viewpoint").innerHTML = "2: Horfa á bílinn innan úr hringnum";
                break;
            case 51:	// 3: panning camera inside the track
                view = 3;
                document.getElementById("Viewpoint").innerHTML = "3: Horfa á bílinn fyrir utan hringinn";
                break;
            case 52:	// 4: driver's point of view
                view = 4;
                document.getElementById("Viewpoint").innerHTML = "4: Sjónarhorn ökumanns";
                break;
            case 53:	// 5: drive around while looking at a house
                view = 5;
                document.getElementById("Viewpoint").innerHTML = "5: Horfa alltaf á eitt hús innan úr bílnum";
                break;
            case 54:	// 6: Above and behind the car
                view = 6;
                document.getElementById("Viewpoint").innerHTML = "6: Fyrir aftan og ofan bílinn";
                break;
            case 55:	// 7: from another car in front
                view = 7;
                document.getElementById("Viewpoint").innerHTML = "7: Horft aftur úr bíl fyrir framan";
                break;
            case 56:	// 8: from beside the car
                view = 8;
                document.getElementById("Viewpoint").innerHTML = "8: Til hliðar við bílinn";
                break;
            case 48:    // 0: "free cam"
                view = 0;
                document.getElementById("Viewpoint").innerHTML = "8: Free cam";
                break;
            case 87:    // W
                if (view == 0) {
                    cameraPositionX += Math.sin( radians(spinX) );
                    cameraPositionY += Math.cos( radians(spinX) );
                }
                break;
            case 65:    // A
                if (view == 0) {
                    cameraPositionX -= Math.cos( radians(spinX) );
                    cameraPositionY += Math.sin( radians(spinX) );
                }
                break;
            case 83:    // S
                if (view == 0) {
                    cameraPositionX -= Math.sin( radians(spinX) );
                    cameraPositionY -= Math.cos( radians(spinX) );
                }
                break;
            case 68:    // D
                if (view == 0) {
                    cameraPositionX += Math.cos( radians(spinX) );
                    cameraPositionY -= Math.sin( radians(spinX) );
                }
                break;
            case 38:    // up arrow
                height += 2.0;
                document.getElementById("Height").innerHTML = "Viðbótarhæð: "+ height;
                break;
            case 40:    // down arrow
                height -= 2.0;
                document.getElementById("Height").innerHTML = "Viðbótarhæð: "+ height;
                break;
        }
    } );

    // stolen from https://hjalmtyr.github.io/forrit25/Angel/cube-js.js
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
        e.preventDefault();         // Disable drag and drop
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement && view == 0) {
    	    spinX = ( spinX - (origX - e.offsetX) ) % 360;
            spinY = ( spinY + (origY - e.offsetY) ) % 360;
            if (spinY > 60) spinY = 60;
            if (spinY < -60) spinY = -60;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    } );

    render();
}


// create the vertices that form the car track
function createTrack() {

    var theta = 0.0;
    for( var i=0; i<=TRACK_PTS; i++ ) {
        var p1 = vec3(TRACK_OUTER*Math.cos(radians(theta)), TRACK_OUTER*Math.sin(radians(theta)), 0.0);
        var p2 = vec3(TRACK_INNER*Math.cos(radians(theta)), TRACK_INNER*Math.sin(radians(theta)), 0.0) 
        tVertices.push( p1 );
        tVertices.push( p2 );
        theta += 360.0/TRACK_PTS;
    }
}


// draw a house in location (x, y) of size size
function house( x, y, size, mv ) {
    // first cube "base"
    gl.uniform4fv( colorLoc, RED );
    
    mv1 = mult( mv, translate( x, y, size/2 ) );
    mv1 = mult( mv1, scalem( size, size, size ) );

    gl.bindBuffer( gl.ARRAY_BUFFER, cubeBuffer );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv1));
    gl.drawArrays( gl.TRIANGLES, 0, numCubeVertices );

    // second cube "roof"
    gl.uniform4fv( colorLoc, BLACK );

    mv2 = mult(mv, translate(x, y, size * 1.0));
    mv2 = mult(mv2, rotateX(45));
    mv2 = mult(mv2, scalem(size * 0.99, size * 0.7, size * 0.7));

    gl.uniformMatrix4fv( mvLoc, false, flatten( mv2 ) );
    gl.drawArrays( gl.TRIANGLES, 0, numCubeVertices );
}

// draw a skyscraper house
function skyscraper( x, y, size, height, mv ) {
    gl.uniform4fv( colorLoc, CYAN );
    
    mv = mult( mv, translate( x, y, height/2 ) );
    mv = mult( mv, scalem( size, size, height ) );

    gl.bindBuffer( gl.ARRAY_BUFFER, cubeBuffer );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays( gl.TRIANGLES, 0, numCubeVertices );
}

// draw a tent house
function tent(x, y, size, mv) {
    gl.uniform4fv( colorLoc, DARK_GREEN );
    
    mv = mult( mv, translate( x, y, 0.0 ) );
    mv = mult(mv, rotateX(45));
    mv = mult( mv, scalem( size, size, size ) );

    gl.bindBuffer( gl.ARRAY_BUFFER, cubeBuffer );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays( gl.TRIANGLES, 0, numCubeVertices );
}


function drawGrass(mv) {
    gl.uniform4fv( colorLoc, GREEN );
    
    mv = mult( mv, translate( 0.0, 0.0, -0.01 ) );
    mv = mult( mv, scalem( 1000.0, 1000.0, 0.01 ) );

    gl.bindBuffer( gl.ARRAY_BUFFER, cubeBuffer );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays( gl.TRIANGLES, 0, numCubeVertices );
}


function drawBridge(mv) {
    gl.uniform4fv( colorLoc, DARK_GRAY );

    var size1 = 20.0; // length and depth of pillars
    var height1 = 20.0; // height of pillars
    var length = 40.0; // bridge top middle length
    var height2 = 10.0; // height of bridge top
    
    // init buffer
    gl.bindBuffer( gl.ARRAY_BUFFER, cubeBuffer );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    
    // first pillar
    mv1 = mult( mv, translate( 0.0, -130.0, height1/2 ) );
    mv1 = mult( mv1, scalem( size1, size1, height1 ) );

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv1));
    gl.drawArrays( gl.TRIANGLES, 0, numCubeVertices );

    // second pillar
    mv2 = mult( mv, translate( 0.0, -70.0, height1/2 ) );
    mv2 = mult( mv2, scalem( size1, size1, height1 ) );

    gl.uniformMatrix4fv( mvLoc, false, flatten( mv2 ) );
    gl.drawArrays( gl.TRIANGLES, 0, numCubeVertices );

    // top part
    mv3 = mult( mv, translate( 0.0, -100.0, height1 + height2/2 ) );
    mv3 = mult( mv3, scalem( size1, length + size1 * 2, height2 ) );

    gl.uniformMatrix4fv( mvLoc, false, flatten( mv3 ) );
    gl.drawArrays( gl.TRIANGLES, 0, numCubeVertices );
}
    

// draw the circular track and a few types of houses
function drawScenery( mv ) {

    // draw track
    gl.uniform4fv( colorLoc, GRAY );
    gl.bindBuffer( gl.ARRAY_BUFFER, trackBuffer );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays( gl.TRIANGLE_STRIP, 0, numTrackVertices );

    drawGrass(mv);
    drawBridge(mv);

    // draw houses    
    house(-20.0, 50.0, 5.0, mv);
    house(0.0, 70.0, 10.0, mv);
    house(20.0, -10.0, 8.0, mv);
    house(40.0, 120.0, 10.0, mv);
    house(-30.0, -50.0, 7.0, mv);
    house(10.0, -60.0, 10.0, mv);
    house(-20.0, 75.0, 8.0, mv);
    house(-40.0, 140.0, 10.0, mv);

    // draw skyscrapers
    skyscraper(-40, 30, 20, 80, mv);
    skyscraper(120, 80, 30, 120, mv);
    skyscraper(-150, -120, 15, 75, mv);
    skyscraper(-200, 30, 25, 60, mv);
    skyscraper(140, -130, 20, 80, mv);

    // draw tents
    tent( -24, 35, 10, mv);
    tent( 12, 41, 30, mv);
    tent( -32, -21, 15, mv);
    tent( 3, -12, 20, mv);
}


// draw car as two blue cubes
function drawCar( mv ) {

    // set color to blue
    gl.uniform4fv( colorLoc, BLUE );
    
    gl.bindBuffer( gl.ARRAY_BUFFER, cubeBuffer );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

    var mv1 = mv;
    // lower body of the car
    mv = mult( mv, scalem( 10.0, 3.0, 2.0 ) );
    mv = mult( mv, translate( 0.0, 0.0, 0.5 ) );

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays( gl.TRIANGLES, 0, numCubeVertices );

    // upper part of the car
    mv1 = mult( mv1, scalem( 4.0, 3.0, 2.0 ) );
    mv1 = mult( mv1, translate( -0.2, 0.0, 1.5 ) );

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv1));
    gl.drawArrays( gl.TRIANGLES, 0, numCubeVertices );
}


function drawPlane( mv ) {
    gl.uniform4fv( colorLoc, RED );
    
    gl.bindBuffer( gl.ARRAY_BUFFER, cubeBuffer );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

    // body
    mv1 = mult( mv, translate( 0.0, 0.0, 100.0 ) );
    mv1 = mult( mv1, scalem( 50.0, 15.0, 15.0 ) );

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv1));
    gl.drawArrays( gl.TRIANGLES, 0, numCubeVertices );

    // wings
    mv2 = mult( mv, translate( 0.0, 0.0, 100.0 ) );
    mv2 = mult( mv2, scalem( 10.0, 50.0, 5.0 ) );

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv2));
    gl.drawArrays( gl.TRIANGLES, 0, numCubeVertices );

    // tail
    mv3 = mult( mv, translate( -18.0, 0.0, 106.0 ) );
    mv3 = mult( mv3, rotateY( 45 ) );
    mv3 = mult( mv3, scalem( 8.0, 8.0, 8.0 ) );

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv3));
    gl.drawArrays( gl.TRIANGLES, 0, numCubeVertices );
}
    

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    car1Direction += 3.0;
    if ( car1Direction > 360.0 ) car1Direction = 0.0;

    car2Direction -= 3.0;
    if ( car2Direction < 0.0 ) car2Direction = 360.0;

    planeDirection += 1.0;
    if ( planeDirection > 360.0 ) planeDirection = 0.0;

    car1XPos = TRACK_RADIUS * Math.sin( radians( car1Direction ) ) * 0.95;
    car1YPos = TRACK_RADIUS * Math.cos( radians( car1Direction ) ) * 0.95;
    
    car2XPos = TRACK_RADIUS * Math.sin( radians( car2Direction ) ) * 1.05;
    car2YPos = TRACK_RADIUS * Math.cos( radians( car2Direction ) ) * 1.05;

    planeXPos = 100.0 * Math.sin( radians( planeDirection ) );
    planeYPos = 100.0 * Math.sin( radians( planeDirection ) ) * Math.cos( radians( planeDirection ) );
    // this works but might be an extreme overcomplication idk
    planeRotation = Math.atan2( Math.cos( 2 * radians( planeDirection ) ), Math.cos( radians( planeDirection ) ) );
    // convert from radians to degrees
    planeRotation *= 180 / Math.PI;

    var mv = mat4();
    switch( view ) {
        case 1:
            // Distant and stationary viewpoint
	        mv = lookAt( vec3(250.0, 0.0, 100.0+height), vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0) );
	        drawScenery( mv );
	        mv1 = mult( mv, translate( car1XPos, car1YPos, 0.0 ) );
	        mv1 = mult( mv1, rotateZ( -car1Direction ) );
	        drawCar( mv1 );
            mv2 = mult( mv, translate( car2XPos, car2YPos, 0.0 ) );
	        mv2 = mult( mv2, rotateZ( -car2Direction ) );
	        drawCar( mv2 );
            mv3 = mult( mv, translate( planeXPos, planeYPos, 0.0 ) );
            mv3 = mult( mv3, rotateZ( planeRotation ) );
            drawPlane( mv3 );
	        break;
	    case 2:
	        // Static viewpoint inside the track; camera follows car
	        mv = lookAt( vec3(75.0, 0.0, 5.0+height), vec3(car1XPos, car1YPos, 0.0), vec3(0.0, 0.0, 1.0 ) );
	        drawScenery( mv );
	        mv1 = mult( mv, translate( car1XPos, car1YPos, 0.0 ) );
	        mv1 = mult( mv1, rotateZ( -car1Direction ) ) ;
	        drawCar( mv1 );
            mv2 = mult( mv, translate( car2XPos, car2YPos, 0.0 ) );
	        mv2 = mult( mv2, rotateZ( -car2Direction ) ) ;
	        drawCar( mv2 );
            mv3 = mult( mv, translate( planeXPos, planeYPos, 0.0 ) );
            mv3 = mult( mv3, rotateZ( planeRotation ) );
            drawPlane( mv3 );
	        break;
	    case 3:
	        // Static viewpoint outside the track; camera follows car
	        mv = lookAt( vec3(125.0, 0.0, 5.0+height), vec3(car1XPos, car1YPos, 0.0), vec3(0.0, 0.0, 1.0 ) );
	        drawScenery( mv );
	        mv1 = mult( mv, translate( car1XPos, car1YPos, 0.0 ) );
	        mv1 = mult( mv1, rotateZ( -car1Direction ) ) ;
	        drawCar( mv1 );
            mv2 = mult( mv, translate( car2XPos, car2YPos, 0.0 ) );
	        mv2 = mult( mv2, rotateZ( -car2Direction ) ) ;
	        drawCar( mv2 );
            mv3 = mult( mv, translate( planeXPos, planeYPos, 0.0 ) );
            mv3 = mult( mv3, rotateZ( planeRotation ) );
            drawPlane( mv3 );
	        break;
	    case 4:
	        // Driver's point of view.
	        mv = lookAt( vec3(-3.0, 0.0, 5.0+height), vec3(12.0, 0.0, 2.0+height), vec3(0.0, 0.0, 1.0 ) );
	        drawCar( mv );
	        mv = mult( mv, rotateZ( car1Direction ) );
	        mv = mult( mv, translate(-car1XPos, -car1YPos, 0.0) );
	        drawScenery( mv );
            mv2 = mult( mv, translate( car2XPos, car2YPos, 0.0 ) );
	        mv2 = mult( mv2, rotateZ( -car2Direction ) ) ;
	        drawCar( mv2 );
            mv3 = mult( mv, translate( planeXPos, planeYPos, 0.0 ) );
            mv3 = mult( mv3, rotateZ( planeRotation ) );
            drawPlane( mv3 );
	        break;
	    case 5:
	        // Drive around while looking at a house at (40, 120)
	        mv = rotateY( -car1Direction );
	        mv = mult( mv, lookAt( vec3(3.0, 0.0, 5.0+height), vec3(40.0-car1XPos, 120.0-car1YPos, 0.0), vec3(0.0, 0.0, 1.0 ) ) );
	        drawCar( mv );
	        mv = mult( mv, rotateZ( car1Direction ) );
	        mv = mult( mv, translate(-car1XPos, -car1YPos, 0.0) );
	        drawScenery( mv );
            mv2 = mult( mv, translate( car2XPos, car2YPos, 0.0 ) );
	        mv2 = mult( mv2, rotateZ( -car2Direction ) ) ;
	        drawCar( mv2 );
            mv3 = mult( mv, translate( planeXPos, planeYPos, 0.0 ) );
            mv3 = mult( mv3, rotateZ( planeRotation ) );
            drawPlane( mv3 );
	        break;
	    case 6:
	        // Behind and above the car
	        mv = lookAt( vec3(-12.0, 0.0, 6.0+height), vec3(15.0, 0.0, 4.0), vec3(0.0, 0.0, 1.0 ) );
	        drawCar( mv );
	        mv = mult( mv, rotateZ( car1Direction ) );
	        mv = mult( mv, translate(-car1XPos, -car1YPos, 0.0) );
	        drawScenery( mv );
            mv2 = mult( mv, translate( car2XPos, car2YPos, 0.0 ) );
	        mv2 = mult( mv2, rotateZ( -car2Direction ) ) ;
	        drawCar( mv2 );
            mv3 = mult( mv, translate( planeXPos, planeYPos, 0.0 ) );
            mv3 = mult( mv3, rotateZ( planeRotation ) );
            drawPlane( mv3 );
	        break;
	    case 7:
	        // View backwards looking from another car
	        mv = lookAt( vec3(25.0, 5.0, 5.0+height), vec3(0.0, 0.0, 2.0), vec3(0.0, 0.0, 1.0 ) );
	        drawCar( mv );
	        mv = mult( mv, rotateZ( car1Direction ) );
	        mv = mult( mv, translate(-car1XPos, -car1YPos, 0.0) );
	        drawScenery( mv );
            mv2 = mult( mv, translate( car2XPos, car2YPos, 0.0 ) );
	        mv2 = mult( mv2, rotateZ( -car2Direction ) ) ;
	        drawCar( mv2 );
            mv3 = mult( mv, translate( planeXPos, planeYPos, 0.0 ) );
            mv3 = mult( mv3, rotateZ( planeRotation ) );
            drawPlane( mv3 );
	        break;
	    case 8:
	        // View from beside the car
	        mv = lookAt( vec3(2.0, 20.0, 5.0+height), vec3(2.0, 0.0, 2.0), vec3(0.0, 0.0, 1.0 ) );
	        drawCar( mv );
	        mv = mult( mv, rotateZ( car1Direction ) );
	        mv = mult( mv, translate(-car1XPos, -car1YPos, 0.0) );
	        drawScenery( mv );
            mv2 = mult( mv, translate( car2XPos, car2YPos, 0.0 ) );
	        mv2 = mult( mv2, rotateZ( -car2Direction ) ) ;
	        drawCar( mv2 );
            mv3 = mult( mv, translate( planeXPos, planeYPos, 0.0 ) );
            mv3 = mult( mv3, rotateZ( planeRotation ) );
            drawPlane( mv3 );
	        break; 
        case 0:
            // Convert to radians
            var radY = radians(spinY);
            var radX = radians(spinX);

            // configure lookAt
            var eye = vec3(cameraPositionX, cameraPositionY, 5.0 + height);
            var lookDir = vec3(
                Math.cos(radY) * Math.sin(radX),
                Math.cos(radY) * Math.cos(radX),
                Math.sin(radY)  
            );
            var lookingAt = add(eye, lookDir);
            var up = vec3(0.0, 0.0, 1.0);

            mv = lookAt(eye, lookingAt, up);

            drawScenery( mv );
	        mv1 = mult( mv, translate( car1XPos, car1YPos, 0.0 ) );
	        mv1 = mult( mv1, rotateZ( -car1Direction ) ) ;
	        drawCar( mv1 );
            mv2 = mult( mv, translate( car2XPos, car2YPos, 0.0 ) );
	        mv2 = mult( mv2, rotateZ( -car2Direction ) ) ;
	        drawCar( mv2 );
            mv3 = mult( mv, translate( planeXPos, planeYPos, 0.0 ) );
            mv3 = mult( mv3, rotateZ( planeRotation ) );
            drawPlane( mv3 );
            break;
    }
    
    
    requestAnimFrame( render );
}

