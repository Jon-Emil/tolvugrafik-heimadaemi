/*
    This file will define functions and classes that the main.js file then uses
*/

const canvas_size = [ 1400, 700 ];
const lane_buffer = 200;
const car_height = 80; // car height in pixels
const car_vertices = 6; // how many vertices each car is made of
var all_cars = [];
const amount_of_lanes = 7;
const lane_height = 100;
const lane_seperation_height = 10;

// player info
const player_size = [ 50, 50 ];
const player_speed = [ 50, 50 ];
const player_color = [ 0.75, 1.0, 0.75, 1.0 ];
var player_rectangle = [ 0, 0, 0, 0 ];
var is_player_moving_up = true;
var player_movement_options = ["left", "up", "right", "down" ];
var player_next_movement = "";

// game info
var game_loop; // reference to the game loop so we can stop it later
var is_game_over = false;
var score = 0;


class Car { // doesnt need this much just vec4 for rectangle drawing, color, direction and speed
    constructor( x, lane, width, color, is_moving_right, speed ) {
        this.rectangle = [ 
            x - width / 2,
            lane_height * ( lane + 1) - ( lane_height - car_height ) / 2,
            x + width / 2,
            lane_height * lane + ( lane_height - car_height ) / 2
        ];

        this.width = width;
        this.color = color;
        this.is_moving_right = is_moving_right;
        this.speed = speed;
    }

    move() {
        if ( this.rectangle[0] + this.width / 2 <= 0 - lane_buffer ) {
            this.rectangle[0] = canvas_size[0] + lane_buffer - this.width / 2;
            this.rectangle[2] = canvas_size[0] + lane_buffer + this.width / 2;
        }
        else if ( this.rectangle[2] - this.width / 2 >= canvas_size[0] + lane_buffer ) {
            this.rectangle[0] = 0 - lane_buffer - this.width / 2;
            this.rectangle[2] = 0 - lane_buffer + this.width / 2;
        }

        var delta = this.is_moving_right ? this.speed : -this.speed
        this.rectangle[0] += delta;
        this.rectangle[2] += delta;
    }
}


// creates the background
function create_background() {
    const grass_color = [ 0.5, 1.0, 0.5, 1.0 ] // light green
    const road_color = [ 0.2, 0.2, 0.2, 1.0 ] // grey
    const seperation_color = [ 1.0, 1.0, 1.0, 1.0 ] // white
    const transition_color = [ 0.25, 0.5, 0.25, 1.0 ] // dark green

    var grass_rectangles = [
        [ 0, 700, canvas_size[0], 605 ], // array has coords of two vertices top left and bottom right that is the simplest way to define a rectangle
        [ 0, 95, canvas_size[0], 0 ]     // and i didn't want to write each vertex down so i decided to do this instead
    ];

    var transition_rectangles = [
        [ 0, 605, canvas_size[0], 595 ],
        [ 0, 105, canvas_size[0], 95 ]
    ];

    var road_rectangles = [
        [ 0, 595, canvas_size[0], 505 ],
        [ 0, 495, canvas_size[0], 405 ],
        [ 0, 395, canvas_size[0], 305 ],
        [ 0, 295, canvas_size[0], 205 ],
        [ 0, 195, canvas_size[0], 105 ]
    ];

    var seperation_rectangles = [
        [ 0, 505, canvas_size[0], 495 ],
        [ 0, 405, canvas_size[0], 395 ],
        [ 0, 305, canvas_size[0], 295 ],
        [ 0, 205, canvas_size[0], 195 ]
    ];

    // function that changes this hard coded info into actual vertices and then add them to buffer with color as a uniform for each vertex
    render_background( 
        [ grass_rectangles, transition_rectangles, road_rectangles, seperation_rectangles ], 
        [ grass_color, transition_color, road_color, seperation_color ] 
    );
}


// goes through all rectangles and renders them
function render_background( rectangle_arrays, color_array ) {
    let array_length = rectangle_arrays.length;

    for ( let i = 0; i < array_length; i++ ) {
        let rectangles = rectangle_arrays[i];
        let rectangle_amount = rectangles.length;
        let color = color_array[i];

        for ( let j = 0; j < rectangle_amount; j++ ) {
            let rectangle = rectangles[j];
            
            add_rectangle( static_vertices, rectangle, color, 0.0 );
        }
    }
}


function initialize_cars() {
    const car_distribution = [ 1, 2, 3, 2, 1 ]; // how many cars in each lane

    for ( let i = 0; i < 5; i++ ) {
        let amount_of_cars = car_distribution[i];
        let lane_speed = Math.ceil( Math.random() * 5 ) + 5 + 2 * i;
        let lane_direction = !( i % 2 ) // flips the direction every time we go to a new lane

        for ( let j = 0; j < amount_of_cars; j++ ) {
            var new_width = Math.ceil( Math.random() * 50 ) + 50; // gets us a random width of our car in the range of 50-100
            var new_color = [ 0.5 * ( 1 + Math.random() ), 0.5 * ( 1 + Math.random() ), 0.5 * ( 1 + Math.random() ), 1.0 ]; // gets us a random color that is fairly colorful
            var starting_postion = Math.ceil( ( ( canvas_size[0] + lane_buffer * 2 ) / amount_of_cars ) * j - 80 * Math.random() )
            var new_car = new Car( starting_postion, i + 1, new_width, new_color, lane_direction, lane_speed ); // create new car we us j here to figure out its initial position and direction
            all_cars.push(new_car) // add the car to the main list
        }

    }

    all_cars.forEach( ( car ) => {
        add_rectangle( dynamic_vertices, car.rectangle, car.color, 0.5 );
    } )
}


function update_cars() {
    all_cars.forEach( ( car ) => {
        car.move();
        add_rectangle( dynamic_vertices, car.rectangle, car.color, 0.5 );
    } )
}


function start_game() {
    is_game_over = false;
    is_player_moving_up = true;
    player_next_movement = "";
    score = 0;

    initialize_player();
    set_up_static_vertices();
    initialize_cars();

    change_canvas_visibility( true );
    update_info_text( "", "" );

    game_loop = setInterval(() => {
        game_update();
    }, 1000 / 30 );
}


function game_update() {
    dynamic_vertices = [];

    render_player();
    update_cars();
    check_all_collisions();
    display_score();

    render_dynamic_vertices();
}


function initialize_player() {
    player_rectangle = [
        ( canvas_size[0] - player_size[0] ) / 2,
        ( lane_height + player_size[1] ) / 2,
        ( canvas_size[0] + player_size[0] ) / 2,
        ( lane_height - player_size[1] ) / 2
    ]
    render_player();
}


function render_player() {
    if ( is_player_moving_up ) {
        var vertex1 = [ player_rectangle[0] + player_size[0] / 2, player_rectangle[1] ];
        var vertex2 = [ player_rectangle[0], player_rectangle[3] ];
        var vertex3 = [ player_rectangle[2], player_rectangle[3] ];
        add_triangle( dynamic_vertices, vertex1, vertex2, vertex3, player_color, 1.0 );
    }
    else {
        var vertex1 = [ player_rectangle[0], player_rectangle[1] ];
        var vertex2 = [ player_rectangle[2], player_rectangle[1] ];
        var vertex3 = [ player_rectangle[0] + player_size[0] / 2, player_rectangle[3] ];
        add_triangle( dynamic_vertices, vertex1, vertex2, vertex3, player_color, 1.0 );
    }
}


function update_player() {
    switch ( player_next_movement ) {
        case "left":
            if ( player_rectangle[0] <= 0 + player_size[0] / 2 ) {
                break;
            }
            player_rectangle[0] -= player_speed[0];
            player_rectangle[2] -= player_speed[0];
            break;

        case "up":
            if ( player_rectangle[1] >= canvas_size[1] - player_size[1] / 2 ) {
                break;
            }
            player_rectangle[1] += player_speed[1];
            player_rectangle[3] += player_speed[1];
            break;

        case "right":
            if ( player_rectangle[2] >= canvas_size[0] - player_size[0] / 2 ) {
                break;
            }
            player_rectangle[0] += player_speed[0];
            player_rectangle[2] += player_speed[0];
            break;

        case "down":
            if ( player_rectangle[3] <= 0 + player_size[1] / 2 ) {
                break;
            }
            player_rectangle[1] -= player_speed[1];
            player_rectangle[3] -= player_speed[1];
            break;

        default:
            return
    }
    player_next_movement = "";

    if ( is_player_moving_up && player_rectangle[1] > canvas_size[1] - lane_height / 2 ) {
        is_player_moving_up = false;
        increase_score();
    }
    else if ( !is_player_moving_up && player_rectangle[3] < 0 + lane_height / 2 ) {
        is_player_moving_up = true;
        increase_score();
    }
}


function check_all_collisions() {
    all_cars.forEach( ( car ) => {
        if ( check_collision( player_rectangle, car.rectangle ) ) { // if they are colliding
            stop_game();
            return
        }
    } );
}


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


function stop_game( is_game_won = false ) {
    clearInterval( game_loop );
    is_game_over = true;
    static_vertices = [];
    dynamic_vertices = [];
    all_cars = [];

    change_canvas_visibility( false );
    if ( is_game_won ) {
        update_info_text( "You Win", "press space to play again" );
    }
    else {
        update_info_text( "You Lose", "press space to try again" );
    }
}


function increase_score() {
    score += 1;
    if ( score >= 10 ) {
        stop_game( true );
        return
    }
}


function display_score() {
    var base_position = [ 10, 690, 20, 670 ];
    var color = [ 1.0, 1.0, 1.0, 1.0 ];
    for ( let i = 0; i < score; i++ ) {
        let new_position = [ base_position[0] + 20*i, base_position[1], base_position[2] + 20*i, base_position[3] ];
        add_rectangle( dynamic_vertices, new_position, color, 0.75 );
    }
}