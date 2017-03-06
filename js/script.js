var re = /област/,
	regions = [],
	data,
	sort_ascending = true,
	table = d3.select("#full_table").append("table"),
	thead = table.append("thead").append("tr"),
	tbody = table.append("tbody"),
	table_headers,
	rows,
	indicators,
	formatter = d3.format(",.1f"),
	indicators_map = {},
	general_data,
	y_axis_group,
	area_graph,
	svg,
	line_graph;

var color_scale_full = d3.scaleLinear()
		.range(["rgba(50,205,50,0.3)", "rgba(255,255,255,0.3)", "rgba(255,0,0,0.3)"])
		.clamp(true);
var color_scale_full_reverse = d3.scaleLinear()
		.range(["rgba(255,0,0,0.3)", "rgba(255,255,255,0.3)", "rgba(50,205,50,0.3)"])
		.clamp(true);
var color_scale_green = d3.scaleLinear()
		.range(["rgba(255,255,255,0.3)", "rgba(50,205,50,0.3)"])
		.clamp(true);
var color_scale_red = d3.scaleLinear()
		.range(["rgba(255,255,255,0.3)", "rgba(255,0,0,0.3)"])
		.clamp(true);

var scale_map = {
	"Розничный товарооборот, млн": color_scale_green,
	"Чистая прибыль, млн": color_scale_full_reverse,
	"Заработная плата, руб": color_scale_green,
	"Рентабельность продаж, %": color_scale_full_reverse,
	"Дебиторская задолженность, млн": color_scale_red,
	"Кредиторская задолженность, млн": color_scale_red,
	"Ввод в эксплуатацию жилья, м2": color_scale_green,
	"Импорт товаров, USD тыс": color_scale_green,
	"Экспорт товаров, USD тыс": color_scale_green
}


var general_selector = d3.select("#general")
						.append("select")
						.on("change", function() {
							var selected_value = d3.select(this).node().value;
							redraw_graph(selected_value);
						})
						.selectAll("option");
						

var x_scale = d3.scaleBand()
                .range([0, 950])
                .round(true);
var y_scale = d3.scaleLinear()
				.range([180, 10]);
//
//var formatter = d3.format(",.1f");

var y_axis = d3.axisLeft(y_scale)
				.ticks(5)
			.tickFormat(function(d) { return formatter(d); });

var x_axis = d3.axisBottom(x_scale);

var line = d3.line()
			.x(function(d) { return x_scale(d.period) + 60 + x_scale.bandwidth() / 2; })
			.y(function(d) { return y_scale(+d.amount); });

var area = d3.area()
			//.curve(d3.curveMonotoneX)
			.x(function(d) { return x_scale(d.period) + 60 + x_scale.bandwidth() / 2; })
			.y0(180)
			.y1(function(d) { return y_scale(+d.amount); });



function redraw_graph(selected_value) {
	var selected_data = general_data.filter(function(d) {
		return d.indicator == selected_value;
		});
	var values = selected_data.map(function(d) {
			return d.amount;
			});
	var data_extent = d3.extent(values, function(d) {
		return +d;
		});
	data_extent.sort(function(a, b) {
		return d3.ascending(a, b);
	});
	
	var max = d3.max(data_extent, function(d) { return d; });
	var min = d3.min(data_extent, function(d) { return d; });

	
	
	y_scale.domain([0, data_extent[1]]);
	y_axis_group
			.transition()
			.duration(500)
			.call(y_axis);



	area_graph
		.transition()
		.duration(500)
		.attr("d", area(selected_data));

	line_graph.transition()
		.duration(500)
		.attr("d", line(selected_data))
		.attr("class", "line_graph")
		.attr("fill", "none")
		.attr("stroke", "#2A2F4E")
		.attr("stroke-linejoin", "round")
		.attr("stroke-linecap", "round")
		.attr("stroke-width", 2);
}

function draw_general() {
	d3.tsv("data/general.tsv", function(data) {
		// Собираем заголовки для первого селектора
		general_data = data.slice(0);
		general_menu_selectors = [];
		general_data.forEach(function(d) {
        if (general_menu_selectors.indexOf(d.indicator) < 0) {
            general_menu_selectors.push(d.indicator);
            };
		})
		// Создаем меню
		general_selector.data(general_menu_selectors)
			.enter()
			.append("option")
			.attr("value", function(d) { return d; })
			.text(function(d) { return d; });
		
		// Создаем график
		svg = d3.select("#general")
			.append("svg")
			.attr("width", 1000)
			.attr("height", 200);
		
		var x_axis_group = d3.select("svg").append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(60, 180)");
		y_axis_group = d3.select("svg").append("g")
			.attr("class", "y axis")
			.attr("transform", "translate(60, 0)");


		// Собираем годы для оси Х
		var years = [];
		general_data.forEach(function(d) {
        if (years.indexOf(d.period) < 0) {
            years.push(d.period);
            };
        });

		x_scale.domain(years);
		x_axis_group
			.transition()
			.duration(500)
			.call(x_axis);
		area_graph = svg.append("path")
						.attr("class", "area_graph");


    line_graph = d3.select("svg")
	.append("path");

        redraw_graph(general_data[0].indicator);
        
        


		// Рисуем график

        });



}

draw_general();





function main() {
    d3.tsv("data/data.tsv", function(loaded_data) {
    // Собираем названия областей для селектора                
        data = loaded_data.slice(0);
        data.forEach(function(d) {
        if (regions.indexOf(d.region) < 0) {
            regions.push(d.region);
            };
        });
        // Отфильтровываем только районы
        data = data.filter(function(d) {
            return d.subject.match(re) == null || d.subject == "Минск";
        });
        regions.sort(function(a, b) { return d3.ascending(a, b); });
        regions.unshift("Вся Беларусь")

		table_headers = d3.map(data[0]).keys();

		// Убираем колонку с названием региона из данных
		table_headers.shift("region");

		var theaders = thead.selectAll("th").data(table_headers);

		theaders.enter()
			.append("th")
			.attr("class", "sortable")
			.text(function(d) { return d; })

		// Создаем цветовую карту
		indicators = table_headers.slice(0);
		indicators.shift("subject");

		for (var i = 0; i < indicators.length; i++) {
			var temp_arr = data.map(function(d) {
				if (d.subject != "г. Минск") {
				return d[indicators[i]];
			}
			});
			var min = d3.min(temp_arr, function(d) { return +d; });
			var max = d3.max(temp_arr, function(d) { return +d; });
			var median = d3.median(temp_arr, function(d) { return +d; });
            min < 0 ? indicators_map[indicators[i]] = {
				"range": [min, median, max], "scale": scale_map[indicators[i]] } :
					indicators_map[indicators[i]] = {
						"range": [min, max], "scale": scale_map[indicators[i]]
					}
		}

	// Вставляем селектор
		var selector = d3.select("thead").select("th")
						.text("")
						.append("select")
						.attr("id", "region-selector")
						.on("change", function() {
							filter_by_region(this.value); 
							});
		selector.selectAll("option")
			.data(regions)
			.enter()
			.append("option")
			.attr("value", function(d) { return d; })
			.text(function(d) { return d; });

	// Снимаем класс с селектора
	d3.select("th").classed("sortable", false);

	var sortable_headers = d3.selectAll(".sortable")
		.on("click", function(d) {

			theaders.classed("sorted asc desc", false);
				if (sort_ascending) {
					tbody.selectAll("tr").sort(function(a, b) {
					return d3.ascending(+a[d], +b[d]);

				});
			sortable_headers.classed("sorted asc desc", false);
			d3.select(this).classed("sorted asc", true);
					sort_ascending = false;
			} else {
				tbody.selectAll("tr").sort(function(a, b) {
				return d3.descending(+a[d], +b[d]);

			});
			sortable_headers.classed("sorted asc desc", false);
			d3.select(this).classed("sorted desc", true);
				sort_ascending = true;
		}
		})
		theaders.exit().remove();
		redraw(data);
		});
		

d3.select("#menu_selector").selectAll("li")
	.on("click", function(d) {
		var selected_item = d3.select(this).attr("class");
		d3.selectAll("#menu_selector li").classed("active", false);
		d3.select(this).classed("active", true);
		d3.selectAll(".tab_content").classed("hidden", true);
		d3.select("#" + selected_item).classed("hidden", false);
	});

d3.select("#full_table").classed("hidden", false);
}

function filter_by_region(region) {

		if ( region == "Вся Беларусь") {
			filtered_data = data;
		} else {
			filtered_data = data.filter(function(d) {
				return d.region == region;
			});
		}
		redraw(filtered_data);

    }

function redraw(data) {
	
	rows = tbody.selectAll("tr").data(data);
	rows.enter()
        .append("tr");
	rows.exit().remove();

    var cells = tbody.selectAll("tr").selectAll("td")
        .data(function(d) {
            return table_headers.map(function(header) {
                return d[header];
			});
        })
    cells.enter()
        .append("td")
        .text(function(d) { return (isNaN(d) ? d : formatter(d)); })
        .attr("class", function(d) { return (isNaN(d) ? "normal" : "number"); });
	cells.text(function(d) { return (isNaN(d) ? d : formatter(d)); })
		.attr("style", function(d, i) {

			i > 0 ? indicators[i] : "normal";
			});
    cells.exit().remove();

// Раскрашиваем таблицу
	tbody.selectAll("tr")
		.selectAll(".number")
		.style("background-color", function(d, i) {
			return indicators_map[indicators[i]]["range"].length > 2 ? indicators_map[indicators[i]]["scale"].domain(indicators_map[indicators[i]]["range"])(parseInt(d)) : indicators_map[indicators[i]]["scale"].domain(indicators_map[indicators[i]]["range"])(parseInt(d))
        });

		// Показательная сортировка первой колонки таблицы при первой загрузке
		tbody.selectAll("tr").sort(function(a, b) {
				return d3.descending(+a[table_headers[1]], +b[table_headers[1]]);
			});
		thead.selectAll(".sortable").classed("desc asc", false);
		thead.selectAll(".sortable")._groups[0][0].className += " sorted desc";
		
}
	main();

// Карта

var height = 600,
	width = 800;
var selected_category;
var data_loaded = false;
				
var projection = d3.geoMercator().center([27.9, 53.7]).scale(2800)
                    .translate([250, 220]);
var path = d3.geoPath().projection(projection);
var color = d3.scaleQuantile()
              .range(['#f2f0f7','#cbc9e2','#9e9ac8','#6a51a3']);
var formatter = d3.format(",.1f");

d3.json("data/rajony.geojson", function(karta) {
	
	// Собираем названия категорий для селектора

    d3.csv("data/goroda.csv", function(goroda) {
	data_loaded = true;

var category_names = d3.map(data[0]).keys();
	category_names.shift("region");
	category_names.shift("subject");

	

	var category_selector = d3.select("#map").append("select")
			.attr("id", "map_selector")

var svg_map = d3.select("#map")
				.append("svg")
				.attr("viewBox", "0 0 800 600")
				.attr("preserveAspectRatio", "xMidYMid");
				//.attr("width", 800)
				//.attr("height", height);

var legend = svg_map.append("g")
            .attr("id", "legend")
            .attr("transform", "translate(40, 40)");

category_selector.on("change", function() {

					selected_category = this.value
					redraw_map(selected_category);
				})

	category_selector.selectAll("option")
		.data(category_names)
		.enter()
		.append("option")
		.attr("value", function(d) { return d; })
		.text(function(d) { return d; });
		

function redraw_map(selected_category) {

    for (var i = 0; i < data.length; i++ ) {
      for (var j = 0; j < karta.features.length; j++) {
        if (data[i].subject == karta.features[j].properties.rajon) {
          karta.features[j].properties.amount = +data[i][selected_category];
          break;
        }
      }
    };

	color.domain(d3.extent(data, function(d) {
		if (d.subject != "г. Минск") { return +d[selected_category];
			}
		}));
    var paths = svg_map.selectAll("path")
      .data(karta.features)
	
	paths.enter()
      .append("path")
      .attr("d", path)
	.attr("fill", function(d) {
			if (d.properties.amount) {
				return color(d.properties.amount);
            } else {
				return "white"
            }
    })
    .on("mouseover", function(d) {
        var xPos = d3.event.pageX + "px";
        var yPos = d3.event.pageY + "px";
        d3.select("#tooltip")
			.style("left", xPos)
            .style("top", yPos)
            .classed("hidden", false);
        d3.select("#rajon")
			.text(d.properties.rajon + " район" );        
        d3.select("#amount")
			.text(selected_category + " : " + formatter(d.properties.amount));
    })
    .on("mouseout", function(d) {
		d3.select("#tooltip")
			.classed("hidden", true)
                      });
                                  
    paths.on("mouseover", function(d) {
                    var xPos = d3.event.pageX + "px";
                    var yPos = d3.event.pageY + "px";
                    d3.select("#tooltip")
                      .style("left", xPos)
                      .style("top", yPos)
                      .classed("hidden", false);
                    d3.select("#rajon")
                      .text(d.properties.rajon + " район" );
                    
                      d3.select("#amount")
                      .text(selected_category + " : " + formatter(d.properties.amount));
        })
        .on("mouseout", function(d) {
			d3.select("#tooltip")
				.classed("hidden", true)
        });
      
    paths.transition()
		.duration(500)
		.attr("fill", function(d) { return color(+d.properties.amount); });

      // Легенда

    var legend_rects = legend.selectAll("rect")
            .data(color.range());
            
    legend_rects.enter()
        .append("rect")
        .attr("x", 30)
        .attr("y", function(d, i) { return i * 15; })
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", function(d) { return d; })
        .attr("stroke", "black");
            
    var legend_texts = legend.selectAll("text")
            .data(color.range());
            
    legend_texts.enter()
            .append("text")
            .text(function(d) { return "<" + " " + formatter(d3.max(color.invertExtent(d), function(d) { return d; })); })
            .attr("x", 45)
            .attr("y", function(d, i) { return (i * 15) + 10; });
  
	legend_texts.transition()
		.duration(500)
		.text(function(d) { return "<" + " " + formatter(d3.max(color.invertExtent(d), function(d) { return d; })); })
  
        var cities = svg_map.selectAll("circle")
                          .data(goroda);
                    
                    cities.enter()
                       .append("circle")
                       .attr("class", "city")
                       .attr("cx", function(d) {
                         return projection([d.lon, d.lat])[0];
                       })
                       .attr("cy", function(d) {
                         return projection([d.lon, d.lat])[1];
                       })
                       .attr("r", function(d) {
                         if (d.city == "г. Минск") {
                           return 7;
                         } else {
                           return 5;
                         };})                    
                    .attr("fill", function(d) { 
                                var colorCircle;
                                for (var q = 0; q < data.length; q++) {
                                  if (d.city == data[q].subject) {
                                      colorCircle = color(data[q][selected_category]);
                                      d.amount = data[q][selected_category];
                                    } else {
                                      continue;
                                  };
                                };
                                return colorCircle;
                                })
                    .on("mouseover", function(d) {
                    var xPos = d3.event.pageX + "px";
                    var yPos = d3.event.pageY + "px";
                    d3.select("#tooltip")
                      .style("left", xPos)
                      .style("top", yPos)
                      .classed("hidden", false);
                    d3.select("#rajon")
                      .text(d.city );
                    
                      d3.select("#amount")
                      .text(selected_category + " : " + formatter(d.amount));
            })
                    .on("mouseout", function(d) {
                      d3.select("#tooltip")
                        .classed("hidden", true)
                      });
   
        cities.transition()
			.duration(500)
			.attr("fill", function(d) { 
                                var colorCircle;
                                for (var q = 0; q < data.length; q++) {
                                  if (d.city == data[q].subject) {
                                      colorCircle = color(data[q][selected_category]);
                                      d.amount = data[q][selected_category];
                                    } else {
                                      continue;
                                  };
                                };
                                return colorCircle;
                                });
                
        cities.on("mouseover", function(d) {
                    var xPos = d3.event.pageX + "px";
                    var yPos = d3.event.pageY + "px";
                    d3.select("#tooltip")
                      .style("left", xPos)
                      .style("top", yPos)
                      .classed("hidden", false);
                    d3.select("#rajon")
                      .text(d.city );
                    
                      d3.select("#amount")
                      .text(selected_category + " : " + formatter(d.amount));
            })
                    .on("mouseout", function(d) {
                      d3.select("#tooltip")
                        .classed("hidden", true)
                      });
                      
	}

redraw_map(category_names[0])

});

});
