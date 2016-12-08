// Нужна проверка на отричательные значения и отдельная логика для них. Иначе масштаб будет стартовать не с нуля, а произвольно.

var jdata;
var fill = d3.scale.category10();

var margin = { top: 20, right: 30, bottom: 20, left: 50 };
var width = 800 - margin.left - margin.right,
	height = 300 - margin.top - margin.bottom;
var svg = d3.select("#grafik")
			.append("svg")
			.attr({
				width: width + margin.left + margin.right,
				height: height + margin.top + margin.bottom,
			})
			.append("g")
			.attr("transform", "translate(" + margin.left + ", "
					+ margin.top + ")");

var x_scale = d3.scale.ordinal()
			.rangeRoundBands([0, width - margin.right]);
var y_scale = d3.scale.linear()
				.range([height, 0]);
var x_axis = d3.svg.axis()
				.scale(x_scale)
				.orient("bottom");
var y_axis = d3.svg.axis()
				.scale(y_scale)
				.orient("left")
				.ticks(8)
				
var line = d3.svg.line()
	.x(function(d) { return x_scale(d.year) + x_scale.rangeBand() / 2; })
	.y(function(d) { return y_scale(d.amount); });

var legend = svg.append("g")
				.attr("class", "legend")
				.attr("transform", "translate(" + (width - 40) + ", "
						+ 0 + ")")

function draw_legend(countries) {
	var target = legend.selectAll("rect")
		.data(countries);

	target.enter()
		.append("rect");

	target.attr({
			id: function(d) { return d; },
			x: 0,
			y: function(d, i) { return i * 20; },
			width: 12,
			height: 12,
			fill: function(d) { return fill(d); },
			class: "on",
		});
	target.exit()
		.remove();

	var labels = legend.selectAll("text")
					.data(countries);
	labels.enter()
		.append("text");
	labels.attr({
		x: 16,
		y: function(d, i) { return (i * 20) + 12; },
		class: "label"
	})
	.text(function(d) { return d; });

	labels.exit()
		.remove()
	legend.selectAll("rect").on("click", function() {
		var selected_legend_item = d3.select(this).attr("id");
		d3.select(this).classed("on", false)
		console.log(selected_legend_item);
	});
}

function toggle_data_lables() {
	var target = d3.select("#menu").append("label").text("Значения");
	target.append("input").attr({
			type: "checkbox",
			name: "data_labels",
			value: "toggle",
		});
	d3.select("input").on("change", function() {
		var selected = d3.select(this).value;
		var data_labels = d3.selectAll(".data_label");
		if (this.checked) { data_labels.classed("invisible", false) } else { data_labels.classed("invisible", true); }
	})
}

function draw_menu(data) {
	d3.select("#menu")
		.append("ul")
		.selectAll("li")
		.data(data)
		.enter()
		.append("li")
		.text(function(d) { return d; });
	d3.select("li").attr("class", "active");
}

function redraw(selected_menu_item) {

	var countries = Array.from(new Set(jdata[selected_menu_item].map(function(d) { return d.country; })));

	selection_data = jdata[selected_menu_item];

	var all_data = []
for (var i = 0; i < selection_data.length; i++) {
		var extent = d3.extent(selection_data[i].data, function(d) { return d.amount; });
		for (var b = 0; b < extent.length; b++) {
			all_data.push(extent[b]);
		}
	}
	var max = d3.max(all_data, function(d) { return d; });
	var min = d3.min(all_data, function(d) { return d; });


	if (max < 0) {
		y_scale.domain([min, 0 ]);
	} else {
		y_scale.domain([0, max * 1.1 ]);
	}

	x_scale.domain(selection_data[0].data.map(function(d) { return d.year; }));
	//y_scale.domain([0, max * 1.1 ]); // Понижаем уровень верхней линии


	svg.select(".x.axis")
		.transition()
		.duration(300)
		.call(x_axis)
	svg.select(".y.axis")
		.transition()
		.duration(300)
		.call(y_axis)

	var country_lines = svg.selectAll(".country_line")
		.data(selection_data);
		
		country_lines.enter()
		.append("g");
		
		//country_lines.transition()
			//.duration(300)
			//.attr("class", "country_line");

		//country_lines.exit()
					//.remove()

	country_lines.select("path")
		.transition()
		.duration(300)
		//.attr("class", "line")
		//.attr("stroke", function(d) { return fill(d.country); })
		.attr("d", function(d) { return line(d.data); });

	var data_points = svg.selectAll(".data_point")
			.data(selection_data);
			
		data_points.enter()
			.append("g");
			
		data_points.transition()
			.duration(300)
			.attr("class", "data_point");
	
	var circles = data_points.selectAll("circle")
	.data(function(d) { return d.data; });
	
	circles.enter()
	.append("circle")
				.on("mouseover", function(d) {
                    var xPos = d3.event.pageX + "px";
                    var yPos = d3.event.pageY + "px";
                    d3.select("#tooltip")
                      .style("left", xPos)
                      .style("top", yPos)
                      .classed("hidden", false);
                    d3.select("#datum")
                      .text(d.amount);
            })
         .on("mouseout", function(d) {
                    d3.select("#tooltip")
                        .classed("hidden", true)
                      });

	circles.transition()
		.duration(300)
		.attr({
			cx: function(d) { return x_scale(d.year) + x_scale.rangeBand() / 2; },
			cy: function(d) { return y_scale(d.amount); },
			r: 3
		});

	circles.exit().remove();

var data_labels = data_points
					.selectAll("text")
					.data(function(d) { return d.data; });
		
	data_labels.enter()
					.append("text");
					
	data_labels.attr({
						class: "data_label invisible",
						x: function(d) { return x_scale(d.year); },
						y: function(d, i) { return (i % 2 == 0) ? y_scale(d.amount) - 15 : y_scale(d.amount) + 15; }
					})
						
					.text(function(d) { return d.amount; });
data_labels.exit().remove();
}

function draw(data) {
	jdata = data;

	var data_categories = Object.keys(data);
	draw_menu(data_categories);
	toggle_data_lables();

	var countries = Array.from(new Set(jdata[data_categories[0]].map(function(d) { return d.country; })));

	selection_data = jdata[data_categories[0]];


	var all_data = []
	for (var i = 0; i < selection_data.length; i++) {
		var extent = d3.extent(selection_data[i].data, function(d) { return d.amount; });
		for (var b = 0; b < extent.length; b++) {
			all_data.push(extent[b]);
		}
	}


	//var extent = d3.extent(all_data, function(d) { return d; });
	//console.log("last ", extent);

	var max = d3.max(all_data, function(d) { return d; });
	var min = d3.min(all_data, function(d) { return d; });

if (max < 0) {
	y_scale.domain([min, 0]);
} else {
	y_scale.domain([0, max * 1.1 ]);
}

	x_scale.domain(selection_data[0].data.map(function(d) { return d.year; }));
	//y_scale.domain(extent); // Понижаем уровень верхней линии

	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0, "  + height + ")")
		.call(x_axis);

	svg.append("g")
		.attr("class", "y axis")
		.call(y_axis);

		draw_legend(countries);

	var country_lines = svg.selectAll(".country_line")
		.data(selection_data)
		.enter()
		.append("g")
		.attr("class", "country_line");

	country_lines.append("path")
		.attr("class", "line")
		.attr("stroke", function(d) { return fill(d.country); })
		.attr("d", function(d) { return line(d.data); });

	var data_points = svg.selectAll(".data_point")
			.data(selection_data)
			.enter()
			.append("g")
			.attr("class", "data_point");
	
	data_points.selectAll("circle")
	.data(function(d) { return d.data; })
	.enter()
	.append("circle")
		.attr({
			cx: function(d) { return x_scale(d.year) + x_scale.rangeBand() / 2; },
			cy: function(d) { return y_scale(d.amount); },
			r: 3
		})
		.on("mouseover", function(d) {
                    var xPos = d3.event.pageX + "px";
                    var yPos = d3.event.pageY + "px";
                    d3.select("#tooltip")
                      .style("left", xPos)
                      .style("top", yPos)
                      .classed("hidden", false);
                    d3.select("#datum")
                      .text(d.amount);
            })
         .on("mouseout", function(d) {
                    d3.select("#tooltip")
                        .classed("hidden", true)
                      });

var data_labels = data_points
					.selectAll("text")
					.data(function(d) { return d.data; })
					.enter()
					.append("text")
					.attr({
						class: "data_label invisible",
						x: function(d) { return x_scale(d.year); },
						y: function(d, i) { return (i % 2 == 0) ? y_scale(d.amount) - 18 : y_scale(d.amount) + 15; }
					})
						
					.text(function(d) { return d.amount; });

	d3.select("#menu")
		.selectAll("li")
		.on("click", function() {
			d3.select("#menu input").property("checked", false);
			d3.select("#menu").selectAll("li").classed("active", false);
			d3.select(this).classed("active", true);
			var selected_menu_item = d3.select(this).text();
			redraw(selected_menu_item);
		});
}

d3.json("data/data.json", draw);
