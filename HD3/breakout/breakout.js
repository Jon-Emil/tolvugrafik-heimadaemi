var canvas;
var gl;

// Núverandi staðsetning miðju ferningsins
var box = vec2( 0.0, 0.0 );

// Stefna (og hraði) fernings
var dX;
var dY;

// Svæðið er frá -maxX til maxX og -maxY til maxY
var maxX = 1.0;
var maxY = 1.0;

// Hálf breidd/hæð ferningsins
var boxRad = 0.05;

// Hversu mikið spaðinn hefur hreyfst á x ás
var xmove = 0.0;

// Allir hnútar
var vertices = [ 
        vec2( -0.05, -0.05 ), 
        vec2( 0.05, -0.05 ), 
        vec2( 0.05, 0.05 ), 
        vec2( -0.05, 0.05 ),
        vec2( -0.1, -0.9 ),
        vec2( -0.1, -0.86 ),
        vec2(  0.1, -0.86 ),
        vec2(  0.1, -0.9 )
    ];

// Hversu langt er frá miðju spaðar til brúnar fyrir báða ása
var spade_padding = vec2( 0.1, 0.02 );

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );
    
    // Gefa ferningnum slembistefnu í upphafi
    dX = Math.random()*0.1-0.05;
    dY = Math.random()*0.1-0.05;

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.DYNAMIC_DRAW );

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    locBox = gl.getUniformLocation( program, "boxPos" );

    // Meðhöndlun örvalykla
    window.addEventListener("keydown", function(e){
        switch( e.keyCode ) {
            case 38:	// upp ör
                dX *= 1.1;
                dY *= 1.1;
                break;
            case 40:	// niður ör
                dX /= 1.1;
                dY /= 1.1;
                break;
            case 37:	// vinstri ör
                xmove += -0.04;
                break;
            case 39:	// hægri ör
                xmove += 0.04;
                break;
        }
    } );

    render();
}


function render() {
    var box_pos = vec2( box[0] + dX, box[1] + dY );
    var spade_pos = vec2( xmove, -0.88 );
    
    // Láta ferninginn skoppa af veggjunum
    if ( Math.abs( box_pos[0] ) > maxX - boxRad ) dX = -dX;
    if ( Math.abs( box_pos[1] ) > maxY - boxRad ) dY = -dY;

    var box_rectangle = vec4( box_pos[0] - boxRad, box_pos[1] + boxRad, box_pos[0] + boxRad, box_pos[1] - boxRad );
    var spade_rectangle = vec4( spade_pos[0] - spade_padding[0], spade_pos[1] + spade_padding[1], spade_pos[0] + spade_padding[0], spade_pos[1] - spade_padding[1] );

    if (check_collision(box_rectangle, spade_rectangle)) {
        dY = -dY;
    }

    // Uppfæra staðsetningu
    box[0] += dX;
    box[1] += dY;
    
    gl.clear( gl.COLOR_BUFFER_BIT );
    
    gl.uniform2fv( locBox, flatten(box) );

    gl.drawArrays( gl.TRIANGLE_FAN, 0, 4 );

    var spade_delta = vec2( xmove, 0.0 );

    gl.uniform2fv( locBox, flatten( spade_delta ) );

    gl.drawArrays( gl.TRIANGLE_FAN, 4, 4 );

    window.requestAnimFrame(render);
}

// import from verk1
function check_collision( rectangle1, rectangle2 ) {
    // check the x coords
    var check1 = rectangle1[0] < rectangle2[2];
    var check2 = rectangle1[2] > rectangle2[0];
    // check the y coords
    var check3 = rectangle1[3] < rectangle2[1];
    var check4 = rectangle1[1] > rectangle2[3];
    // return true if all are true
    return check1 && check2 && check3 && check4
}