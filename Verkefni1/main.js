
var gl;
var static_vertices = [];
var dynamic_vertices = [];

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    
    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Load the data into the GPU
    
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, 500*7*4, gl.DYNAMIC_DRAW ); // allocate enough space for 500 vertices

    // Associate out shader variables with our data buffer
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 28, 0 );
    gl.enableVertexAttribArray( vPosition );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 28, 12 );
    gl.enableVertexAttribArray( vColor );

    start_game();
    render();
};


function set_up_static_vertices() {
    create_background();
    gl.bufferSubData( gl.ARRAY_BUFFER, 0, new Float32Array(static_vertices) );
}


// set up listeners
window.addEventListener( "keydown", function(e) {
    switch ( e.keyCode ) {
        case 65: // a
            // overflows into case 37 so no duplicate code needed
        case 37: // left arrow
            player_next_movement = player_movement_options[0];
            break;

        case 87: // w
        case 38: // up arrow
            player_next_movement = player_movement_options[1];
            break;

        case 68: // d
        case 39: // right arrow
            player_next_movement = player_movement_options[2];
            break;

        case 83: // s
        case 40: // down arrow
            player_next_movement = player_movement_options[3];
            break;
        
        case 32:
            if ( !is_game_over ) {
                stop_game();
                start_game();
            }
            else {
                start_game();
            }

        default:
            break
    }

    if ( is_game_over ) {
        return
    }

    update_player();
} );


// takes in an array where the final result goes then the rectangle coords which is just a vec4, its color and its z coords
function add_rectangle( array, rectangle, color, z ) {
    // first triangle
    var vertex1 = [ rectangle[0], rectangle[1] ]; // top left
    var vertex2 = [ rectangle[2], rectangle[1] ]; // top right
    var vertex3 = [ rectangle[0], rectangle[3] ]; // bottom left
    add_triangle( array, vertex1, vertex2, vertex3, color, z);

    // second triangle
    var vertex4 = [ rectangle[2], rectangle[1] ]; // top right
    var vertex5 = [ rectangle[2], rectangle[3] ]; // bottom right
    var vertex6 = [ rectangle[0], rectangle[3] ]; // bottom left
    add_triangle( array, vertex4, vertex5, vertex6, color, z );
}
    

// takes in 3 vertices and nomalizes their coords and adds them to the array specified
function add_triangle( array, v1, v2, v3, color, z ) {
    add_vertex( array, [ ( v1[0] / ( canvas_size[0] / 2) ) - 1, ( v1[1] / ( canvas_size[1] / 2) ) - 1, z, color[0], color[1], color[2], color[3] ] );
    add_vertex( array, [ ( v2[0] / ( canvas_size[0] / 2) ) - 1, ( v2[1] / ( canvas_size[1] / 2) ) - 1, z, color[0], color[1], color[2], color[3] ] );
    add_vertex( array, [ ( v3[0] / ( canvas_size[0] / 2) ) - 1, ( v3[1] / ( canvas_size[1] / 2) ) - 1, z, color[0], color[1], color[2], color[3] ] );
}


// adds a vertex to the array specified
function add_vertex( array, new_vertex_info ) {
    array.push( ...new_vertex_info );
}


function render_dynamic_vertices() {
    gl.bufferSubData( gl.ARRAY_BUFFER, static_vertices.length * 4, new Float32Array(dynamic_vertices) );
}


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, ( static_vertices.length + dynamic_vertices.length ) / 7 );
    requestAnimationFrame(render)
}


function change_canvas_visibility( show_canvas ) {
    const canvas = document.getElementById( "gl-canvas" );
    canvas.style.display = show_canvas ? "block" : "none";
}


function update_info_text( main_string, extra_string ) {
    document.getElementById( "main-text" ).textContent = main_string;
    document.getElementById( "extra-text" ).textContent = extra_string;
}