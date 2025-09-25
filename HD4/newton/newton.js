/////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Búum til bókstafinn H úr þremur teningum
//
//    Hjálmtýr Hafsteinsson, september 2025
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

var numVertices  = 36;

var points = [];
var colors = [];

var rotation1 = 45;
var rotation2 = 0;
var moving_up1 = false;
var moving_up2 = false;
var moving_down1 = true;
var moving_down2 = false;
var rotation_point1 = [ -0.125, 0.875 ];
var rotation_point2 = [ 0.125, 0.875 ];
var max_rotation = 45;

var matrixLoc;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    colorCube();

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.9, 0.9, 0.9, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    matrixLoc = gl.getUniformLocation( program, "transform" );

    render();
}

function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

function quad(a, b, c, d) 
{
    var vertices = [
        vec3( -0.5, -0.5,  0.5 ),
        vec3( -0.5,  0.5,  0.5 ),
        vec3(  0.5,  0.5,  0.5 ),
        vec3(  0.5, -0.5,  0.5 ),
        vec3( -0.5, -0.5, -0.5 ),
        vec3( -0.5,  0.5, -0.5 ),
        vec3(  0.5,  0.5, -0.5 ),
        vec3(  0.5, -0.5, -0.5 )
    ];

    var vertexColors = [
        [ 0.0, 0.0, 0.0, 1.0 ],  // black
        [ 1.0, 0.0, 0.0, 1.0 ],  // red
        [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
        [ 0.0, 1.0, 0.0, 1.0 ],  // green
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
        [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
        [ 1.0, 1.0, 1.0, 1.0 ]   // white
    ];

    //vertex color assigned by the index of the vertex
    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        colors.push(vertexColors[a]);
        
    }
}


function update_rotation() {
    if (moving_up1) {
        if (rotation1 >= 45) {
            moving_down1 = true;
            moving_up1 = false;
            return
        }
        rotation1 += 1;
    }
    else if (moving_down1) {
        if (rotation1 <= 0) {
            moving_down1 = false;
            moving_up2 = true;
            return
        }
        rotation1 -= 1;
    }
    else if (moving_up2) {
        if (rotation2 >= 45) {
            moving_down2 = true;
            moving_up2 = false;
            return
        }
        rotation2 += 1;
    }
    else if (moving_down2) {
        if (rotation2 <= 0) {
            moving_up1 = true;
            moving_down2 = false;
            return
        }
        rotation2 -= 1;
    }
}


function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var mv = mat4();
    update_rotation();

    // calculate rotation for both sets of boxes and strings
    mv1 = mult( mv, translate( rotation_point1[0], rotation_point1[1], 0.0 ) );
    mv1 = mult( mv1, rotateZ(-rotation1));
    mv1 = mult( mv1, translate( -rotation_point1[0], -rotation_point1[1], 0.0 ) );

    mv2 = mult( mv, translate( rotation_point2[0], rotation_point2[1], 0.0 ) );
    mv2 = mult( mv2, rotateZ(rotation2));
    mv2 = mult( mv2, translate( -rotation_point2[0], -rotation_point2[1], 0.0 ) );

    // String 1
    mv3 = mult( mv1, translate( -0.125, 0.375, 0.0 ) );
    mv3 = mult( mv3, scalem( 0.01, 1.0, 0.01 ) );
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv3));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    // String 2
    mv3 = mult( mv2, translate( 0.125, 0.375, 0.0 ) );
    mv3 = mult( mv3, scalem( 0.01, 1.0, 0.01 ) );
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv3));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    // Box 1
    mv3 = mult( mv1, translate( -0.125, -0.25, 0.0 ) );
    mv3 = mult( mv3, scalem( 0.25, 0.25, 0.25 ) );
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv3));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    // Box 2
    mv3 = mult( mv2, translate( 0.125, -0.25, 0.0 ) );
    mv3 = mult( mv3, scalem( 0.25, 0.25, 0.25 ) );
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv3));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    requestAnimFrame( render );
}

