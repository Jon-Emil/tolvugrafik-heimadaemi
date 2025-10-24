/////////////////////////////////////////////////////////////////
//    S�nislausn � d�mi 4 � heimad�mum 4 � T�lvugraf�k
//     S�nir hillueininguna KALLAX b�ina til �r sex teningum.
//
//    Hj�lmt�r Hafsteinsson, september 2025
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

var NumVertices  = 36;

var points = [];
var normalsArray = [];

var movement = false;     // Do we rotate?
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var zDist = -2.0;

var fovy = 50.0;
var near = 0.2;
var far = 100.0;

var va = vec4(0.0, 0.0, -1.0,1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333,1);
    
var lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.6, 0.2, 1.0 );
var materialDiffuse = vec4( 1.0, 0.6, 0.2, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 350.0;

var ctm;
var ambientColor, diffuseColor, specularColor;

var mv, projectionMatrix;
var modelViewLoc, projectionMatrixLoc;

var normalMatrix, normalMatrixLoc;

var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    colorCube();

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.95, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    var dypi = gl.getParameter(gl.DEPTH_BITS);
    var gildi = gl.getParameter(gl.DEPTH_CLEAR_VALUE);
    var bil = gl.getParameter(gl.DEPTH_RANGE);
    gl.enable(gl.CULL_FACE);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    modelViewLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );

    projectionMatrix = perspective( fovy, 1.0, near, far );

    
    gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct) );	
    gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, "shininess"), materialShininess );


    //event listeners for mouse
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
        if(movement) {
    	    spinY = ( spinY + (e.offsetX - origX) ) % 360;
            spinX = ( spinX + (origY - e.offsetY) ) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    } );


    // Event listener for mousewheel
     window.addEventListener("wheel", function(e){
         if( e.deltaY > 0.0 ) {
             zDist += 0.2;
         } else {
             zDist -= 0.2;
         }
     }  );  
       
    
    render();
}

function colorCube()
{
    quad( 1, 0, 3, 2, 0 );
    quad( 2, 3, 7, 6, 1 );
    quad( 3, 0, 4, 7, 2 );
    quad( 6, 5, 1, 2, 3 );
    quad( 4, 5, 6, 7, 4 );
    quad( 5, 4, 0, 1, 5 );
}

function quad(a, b, c, d, n) 
{
    var vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5, -0.5, -0.5, 1.0 )
    ];

    var faceNormals = [
        vec4( 0.0, 0.0,  1.0, 0.0 ),  // front
        vec4(  1.0, 0.0, 0.0, 0.0 ),  // right
        vec4( 0.0, -1.0, 0.0, 0.0 ),  // down
        vec4( 0.0,  1.0, 0.0, 0.0 ),  // up
        vec4( 0.0, 0.0, -1.0, 0.0 ),  // back
        vec4( -1.0, 0.0, 0.0, 0.0 )   // left
    ];

    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        normalsArray.push(faceNormals[n]);
    }
}


function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var mv = lookAt( vec3(0.0, 0.0, zDist), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0) );
    mv = mult( mv, rotateX(spinX) );
    mv = mult( mv, rotateY(spinY) ) ;

    // Sm��a hilluna
    // Fyrst hli�arnar..
    mv1 = mult( mv, translate( -0.4, 0.0, 0.0 ) );
    mv1 = mult( mv1, scalem( 0.04, 0.8, 0.5 ) );
    normalMatrix = [
        vec3(mv1[0][0], mv1[0][1], mv1[0][2]),
        vec3(mv1[1][0], mv1[1][1], mv1[1][2]),
        vec3(mv1[2][0], mv1[2][1], mv1[2][2])
    ];
	normalMatrix.matrix = true;
            
    gl.uniformMatrix4fv(modelViewLoc, false, flatten(mv1) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );
        
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

    mv1 = mult( mv, translate( 0.4, 0.0, 0.0 ) );
    mv1 = mult( mv1, scalem( 0.04, 0.8, 0.5 ) );
    normalMatrix = [
        vec3(mv1[0][0], mv1[0][1], mv1[0][2]),
        vec3(mv1[1][0], mv1[1][1], mv1[1][2]),
        vec3(mv1[2][0], mv1[2][1], mv1[2][2])
    ];
	normalMatrix.matrix = true;
            
    gl.uniformMatrix4fv(modelViewLoc, false, flatten(mv1) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );
        
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

    // svo toppurinn..
    mv1 = mult( mv, translate( 0.0, 0.38, 0.0 ) );
    mv1 = mult( mv1, scalem( 0.8, 0.04, 0.5 ) );
    normalMatrix = [
        vec3(mv1[0][0], mv1[0][1], mv1[0][2]),
        vec3(mv1[1][0], mv1[1][1], mv1[1][2]),
        vec3(mv1[2][0], mv1[2][1], mv1[2][2])
    ];
	normalMatrix.matrix = true;
            
    gl.uniformMatrix4fv(modelViewLoc, false, flatten(mv1) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );
        
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

    // og botninn..
    mv1 = mult( mv, translate( 0.0, -0.38, 0.0 ) );
    mv1 = mult( mv1, scalem( 0.8, 0.04, 0.5 ) );
    normalMatrix = [
        vec3(mv1[0][0], mv1[0][1], mv1[0][2]),
        vec3(mv1[1][0], mv1[1][1], mv1[1][2]),
        vec3(mv1[2][0], mv1[2][1], mv1[2][2])
    ];
	normalMatrix.matrix = true;
            
    gl.uniformMatrix4fv(modelViewLoc, false, flatten(mv1) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );
        
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
    
    // krossinn � mi�junni..
    mv1 = mult( mv, scalem( 0.8, 0.015, 0.5 ) );
    normalMatrix = [
        vec3(mv1[0][0], mv1[0][1], mv1[0][2]),
        vec3(mv1[1][0], mv1[1][1], mv1[1][2]),
        vec3(mv1[2][0], mv1[2][1], mv1[2][2])
    ];
	normalMatrix.matrix = true;
            
    gl.uniformMatrix4fv(modelViewLoc, false, flatten(mv1) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );
        
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

    mv1 = mult( mv, scalem( 0.015, 0.8, 0.5 ) );
    normalMatrix = [
        vec3(mv1[0][0], mv1[0][1], mv1[0][2]),
        vec3(mv1[1][0], mv1[1][1], mv1[1][2]),
        vec3(mv1[2][0], mv1[2][1], mv1[2][2])
    ];
	normalMatrix.matrix = true;
            
    gl.uniformMatrix4fv(modelViewLoc, false, flatten(mv1) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );
        
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

    window.requestAnimFrame(render);
}
