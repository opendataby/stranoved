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
	indicators_map = {};

var color_scale = d3.scaleQuantize()
				.range(["rgba(239,237,245,0.3)", "rgba(188,189,220,0.3)", "rgba(117,107,177,0.3)"]);

function main() {
    d3.csv("data/data.csv", function(loaded_data) {
    // Собираем названия областей для селектора                
        data = loaded_data.slice(0);
        data.forEach(function(d) {
        if (regions.indexOf(d.region) < 0) {
            regions.push(d.region);
            };
        });
        // Отфильтровываем только районы
        data = data.filter(function(d) {
            return d.subject.match(re) == null;
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
				return d[indicators[i]];
			});
			var min = d3.min(temp_arr, function(d) { return +d; });
			var max = d3.max(temp_arr, function(d) { return +d; });
			indicators_map[indicators[i]] = [min, max];
		}

	// Вставляем селектор
		var selector = d3.select("thead").select("th")
						.text("")
						.append("select")
						.attr("id", "region-selector")
						.on("change", function() { console.log(this.value); filter_by_region(this.value); });
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

			theaders.classed("sorted", false);
				if (sort_ascending) {
					tbody.selectAll("tr").sort(function(a, b) {
					return d3.ascending(+a[d], +b[d]);
				});
					sort_ascending = false;
			} else {
				tbody.selectAll("tr").sort(function(a, b) {
				return d3.descending(+a[d], +b[d]);
			});
				sort_ascending = true;
		}
			sortable_headers.classed("sorted", false);
			d3.select(this).classed("sorted", true);
		})
		theaders.exit().remove();
		redraw(data);
		});
		

d3.select("#menu_selector").selectAll("li")
	.on("click", function(d) {
		var selected_item = d3.select(this).attr("class");
		console.log(selected_item);
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
		thead.selectAll("th").classed("sorted", false);
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
		.style("background-color", function(d, i) { return color_scale.domain(indicators_map[indicators[i]])(d)});
		

		// Показательная сортировка таблицы при первой загрузке
		tbody.selectAll("tr").sort(function(a, b) {
				return d3.descending(+a[table_headers[2]], +b[table_headers[2]]);
			});
		thead.selectAll(".sortable")._groups[0][1].className += " sorted";

}
	main();


/////////////////////////////////////
// Карта

var height = 600,
	width = 800;
var selected_category;
var data_loaded = false;
				
var projection = d3.geoMercator().center([27.9, 53.7]).scale(4000)
                    .translate([width / 2, height / 2]);
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
	console.log(category_names);
	

	var category_selector = d3.select("#map").append("select")
			.attr("id", "map_selector")

var svg_map = d3.select("#map")
				.append("svg")
				.attr("width", 800)
				.attr("height", height);

var legend = svg_map.append("g")
            .attr("id", "legend")
            .attr("transform", "translate(40, 50)");

category_selector.on("change", function() {
		console.log("Hello")
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
	console.log(selected_category);

    for (var i = 0; i < data.length; i++ ) {
      for (var j = 0; j < karta.features.length; j++) {
        if (data[i].subject == karta.features[j].properties.rajon) {
          karta.features[j].properties.amount = +data[i][selected_category];
          break;
        }
      }
    };

color.domain(d3.extent(data, function(d) { return +d[selected_category]; }));
    var paths = svg_map.selectAll("path")
      .data(karta.features)
	
	paths.enter()
      .append("path")
      .attr("d", path)
	.attr("fill", function(d) { if (d.properties.amount) {
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
