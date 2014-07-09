/*
This file is part of iPipet.
copyright (c) 2014 Dina Zielinski (dina@wi.mit.edu)

	iPipet is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published by
	the Free Software Foundation, either version 3 of the License, or any later version.

	iPipet is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU Affero General Public License
	along with iPipet.  If not, see <http://www.gnu.org/licenses/agpl-3.0.html>.
*/


/*
 Testing code for Drawing/Manipulating 384-Well Plate using D3.

 Typical usage:

	<div id="from_plate"></div>
	<script>
	d3_generate_plate384_data("from_plate",52);
	var well_color = "red";
	set_well_color("from_plate","A01",well_color);
	set_well_color("from_plate","A24",well_color);
	set_well_color("from_plate","P01",well_color);
	set_well_color("from_plate","P24",well_color);
	</script>

*/

/* Returns the width in CM of this plate. */
function d3_plate_width()
{
     return 11.5;
}

/* returns the height in CM of this plate */
function d3_plate_height()
{
     return 8;
}

function assert(condition, message) {
    if (!condition)
        throw Error("Assert failed" + (typeof message !== "undefined" ? ": " + message : ""));
}

/* Given a Well number (1 to 384)
   returns the Well's corresponding Row number (1-16) */
function well_to_row(well)
{
	assert(well>=1 && well<=384, "well_to_row(): invalid 'well' value: " + well);
	return (well-1)%16+1;
}

/* Given a row number (1 to 16)
   returns the row name ("A" to "P") */
function row_name(row)
{
	var names = [ "A", "B", "C", "D","E", "F", "G","H","I","J","K","L","M","N","O","P"];
	assert( Math.floor(row)==row && row>=1 && row<=16,
		"row_name(): invalid 'row' value: " + row);
	return names[row-1];
}

/* Given a Well number (1 to 384)
   returns the Well's corresponding Column number (1-24) */
function well_to_column(well)
{
	assert(well>=1 && well<=384, "well_to_column(): invalid 'well' value: " + well);
	return Math.floor((well-1)/16)+1;
}

function well_to_id(well)
{
	assert(well>=1 && well<=384, "well_to_id(): invalid 'well' value: " + well);
	var col = well_to_column(well);
	if (col<10) { col = "0" + col ; }
	return row_name( well_to_row(well) ) + col;
}

/* Helper function:
     Given the ID of the parent <DIV>,
     returns the ID of it's child <SVG> object,
     as generated by 'd3_generate_plate_data()'
*/
function svg_plate_id(plate_id)
{
	return "plate_" + plate_id + "_SVG";
}

/* Helper function:
     Given the ID of the plate <DIV>,
     And the ID of the well (e.g. "C04"),
     returns a unique ID of the well element.

     This well element can be modified directly in D3.

     Example:
	id = svg_plate_well_id("myplate","A05");
        d3.select("#" + id).attr("fill","blue");
*/
function svg_plate_well_id(plate_id,well_id)
{
	return "plate_" + plate_id + "_well_" + well_id;
}

/* Function to change the size of the SVG in a plate diagram,
 * according to the specified PPCM (Pixels-Per-CM)
 */
function d3_plate_change_resolution_cm(plate_id, new_ppcm)
{
 /* NOTE: The hard-coded sizes must match the sizes
  * in 'd3_generate_plate_data()'
  */
	var plate_width_cm = d3_plate_width();
	var plate_height_cm = d3_plate_height();

	var pixels_per_cm = new_ppcm ;
	var device_width_pixels = pixels_per_cm * plate_width_cm;
	var device_height_pixels = pixels_per_cm * plate_height_cm;

	var id = svg_plate_id(plate_id);
	d3.select("#" + id)
	  .attr("width", device_width_pixels)
	  .attr("height", device_height_pixels);
}
function d3_plate_change_resolution_dpi(plate_id, new_dpi)
{
	d3_plate_change_resolution_cm(plate_id,new_dpi/2.54)
}

/* Given an ID of an existing <DIV>,
   Generate (using D3) an SVG object inside the <DIV>,
   with column/row names and 96 wells, positioned correctly
   based on the given PPCM (Pixels-Per-CM).

   See here for list of common ppcm:
    http://en.wikipedia.org/wiki/List_of_displays_by_pixel_density#Apple
   Example:
    iPad = 52
    iPad Retina/Air = 104

   The generated SVG will be 13cm in size.
*/
function d3_generate_plate_data(plate_id,ppcm)
{
        var rows = [ 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16 ];
	var columns = [ 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24 ];

	var wells = Array(384);
	for (var i=0; i<384; ++i) wells[i] = i+1;

	var plate_width_cm = d3_plate_width();
	var plate_height_cm = d3_plate_height();

	var pixels_per_cm = ppcm ;
	var device_width_pixels = pixels_per_cm * plate_width_cm;
	var device_height_pixels = pixels_per_cm * plate_height_cm;

	var well_radius = 1.00; //in mm
	var well_gap = 4.5; // in mm
	var well_border_left = 8.4; //in mm
	var well_border_top = 4; // in mm
	var plate_column_header_offset = 0 ; // in mm
	var plate_row_header_offset = 0 ; // in mm

	var tmp  = document.getElementById(plate_id);
	assert(tmp !== null,"d3_generate_plate_data(): error: can't find HTML element with id: "+plate_id);

	// in MM
	var viewBox = "0 0 " + (plate_width_cm*10) + " " + (plate_height_cm*10);

	/* Create an SVG, with the 'ViewBox' set to 130 MM .
           If the width/height (in pixels) are calculated correctly,
           then all the SVG elements created later on can be specified in
           "user" units, and those will be treated as MM units. */
	var svg = d3.select("#" + plate_id).append("svg")
	  .attr("id", svg_plate_id(plate_id))
	  .attr("viewBox", viewBox)
	  .attr("width", device_width_pixels)
	  .attr("height", device_height_pixels);


	if (0) {
		/* Debugging: draw a border around the entire SVG */
		var foo = [ 1 ];
		svg.selectAll(".foo")
		  .data(foo)
		.enter().append("rect")
		  .attr("x",0)
		  .attr("y",0)
		  .attr("width",plate_width_cm*10)
		  .attr("height",plate_height_cm*10)
		  .attr("fill","white")
		  .attr("stroke","black")
		;
	}

	/* Draw Column Headers */
	svg.selectAll(".column_headers")
	    .data(columns)
	   .enter().append("text")
	    .attr("class","column_headers")
	    //.attr("id", function(d) { return "column_header_" + d; })
	    .attr("x", function(d) {
			var column = (d-1) ;
			return plate_row_header_offset + well_border_left + column * well_gap ; })
	    .attr("y", -1)
	    .attr("fill", "red")
	    .attr("font-size", 3)
	    .attr("font-family","sans-serif")
	    .attr("text-anchor","middle")
	    .attr("alignment-baseline","hanging")
	    .text(function(d) { return d ; });

	/* Draw Row Headers */
	svg.selectAll(".row_headers")
	    .data(rows)
	   .enter().append("text")
	    .attr("class","row_headers")
	    //.attr("id", function(d) { return "column_header_" + d; })
	    .attr("x", 0)
	    .attr("y", function(d) {
			return plate_column_header_offset + well_border_top + (d-1) * well_gap + 1; })
	    .attr("fill", "red")
	    .attr("font-size", 3)
	    .attr("font-family","sans-serif")
	    .attr("alignment-baseline","middle")
	    .text(function(d) { return row_name(d) ; });

	/* Generate 96 wells, positioned correctly (in terms of MM alignment, 
           compated to a real-world 96-well plate.
	   Each well starts as empty with black border.
           Each well is given a unique ID, which can be later retried with
           'svg_plate_well_id()'. */
	svg.selectAll(".well")
	    .data(wells)
	  .enter().append("circle")
	    .attr("class","well")
	    .attr("r", well_radius)
	    .attr("id", function(d) { return svg_plate_well_id(plate_id,well_to_id(d)); })
	    .attr("cx", function(d) {
			var column = well_to_column(d)-1;
			return plate_row_header_offset + well_border_left + column * well_gap ; })
	    .attr("cy", function(d) {
			var row = well_to_row(d)-1;
			return plate_column_header_offset + well_border_top + row * well_gap ; })
	    .attr("stroke","black")
	    .attr("stroke-width",0.1)
	    .attr("fill", "white");
}

/* Given a plate_id of a <DIV>,
   resets all the wells to color white. */
function reset_plate_wells(plate_id)
{
	var id = svg_plate_id(plate_id);
	d3.select("#" + id).selectAll(".well")
		.attr("fill","white");

}

/* Given a well_id (e.g. "A12"), returns the row num*/
function get_well_row(well_id)
{
	return well_id.substr(0,1);	
	
}



/* Given a well_id (e.g. "A12"), returns the column num*/
function get_well_column(well_id)
{
	return well_id.substr(1);
	
}


/* Given a plate id of a <DIV>, and a Well ID (e.g. "D11"),
   and a valid HTML color (e.g. "red" or "#543FFA"),
   Sets the well to this color */
function set_well_color(plate_id,well_id,well_color)
{
	/*use for loops to highlight entire row and entire column for given well id*/
	var row = get_well_row(well_id);
	
	for (var i=1; i<=24; i += 1) {
		var id = row + i;
		if (i < 10) {
			id = row + "0" + i;
		}
		d3.select("#" + svg_plate_well_id(plate_id,id)).attr("fill",well_color);
			
	}

	var column = get_well_column(well_id); 
		
	for (var a=1; a<=16; a += 1) {
		var id = row_name(a) + column;
		
		d3.select("#" + svg_plate_well_id(plate_id,id)).attr("fill",well_color);
		
	}
	/*to highlight actual well; cyan works best with red but purple with both red and green*/
	d3.select("#" + svg_plate_well_id(plate_id,well_id)).attr("fill","#944DFF");
}

/* Given a Plate ID of a <DIV>,
   resets all wells to White, and the four wells in the corners to well_color.
   */
function set_plate_alignment_mode(plate_id,well_color)
{
	reset_plate_wells(plate_id)
	set_well_color(plate_id,"A01",well_color);
	set_well_color(plate_id,"A24",well_color);
	set_well_color(plate_id,"P01",well_color);
	set_well_color(plate_id,"P24",well_color);
}
