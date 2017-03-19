// Укоротить названия переменных.
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
	data_annual,
	data_current,
	y_axis_group,
	x_axis_group,
	area_graph,
	svg,
    slider_group,
    general_map_data,
	line_graph,
	current_category,
	filtered_data,
	main_data,
	x_scale,
	current_indicator,
	lock_preview = false;

// Малая карта для графика годовых данных
var general_map_projection = d3.geoMercator()
                   .center([27.9, 53.7])
                            //.translate([0, 0])
                            .scale(1200);
var general_map_path = d3.geoPath()
    .projection(general_map_projection);
                                                        
// Цветовые шкалы
var general_map_color = d3.scaleQuantize()
              .range(['#feedde','#fdbe85','#fd8d3c','#d94701']);
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

// Словарь цветовых шкал для таблицы оперативных данных, обновлять вручную
// в зависимости от показателя.
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

// Меню графика годовых данных: селектор регионов и индикаторов
var general_subject_selector = d3.select("#general")
						.append("select")
						.attr("id", "subjects")
						.on("change", function() {
							var selected_subject = d3.select(this).node().value;
							lock_preview = (selected_subject == "375" ?  false : selected_subject);
							var selected_indicator = d3.select("#indicators").node().value;
							redraw_graph(selected_subject, selected_indicator);
						});
var general_indicator_selector = d3.select("#general")
					.append("select")
					.attr("id", "indicators")
					.on("change", function() {
						var selected_value = d3.select(this).node().value;
						var selected_subject = d3.select("#subjects").node().value;
						current_indicator = selected_value;
							redraw_graph(selected_subject, selected_value);
						});

// Шкалы для графика годовых данных

var x_scale = d3.scaleBand()
                .range([0, 950])
                .round(true);
var y_scale = d3.scaleLinear()
				.range([180, 10]);
var formatter = d3.format(",.1f");

var y_axis = d3.axisLeft(y_scale)
				.ticks(5)
			.tickFormat(function(d) { return formatter(d); });

var x_axis = d3.axisBottom(x_scale);

var line = d3.line()
			.x(function(d) {
                return x_scale(d.period) + 60 + x_scale.bandwidth() / 2;
            })
			.y(function(d) { return y_scale(+d.amount); });

var area = d3.area()
			.x(function(d) {
                return x_scale(d.period) + 60 + x_scale.bandwidth() / 2;
            })
			.y0(180)
			.y1(function(d) { return y_scale(+d.amount); });





function draw_by_category(category) {
	console.log(category)
	data_annual = main_data["annual_data"].filter(function(d) {
			return d.category == category;
			});
	data_current = main_data["current_data"].filter(function(d) {
			return d.category == category;
			});
			
	var general_subject_selectors = Array.from(new Set(
					data_annual.map(function(d) {
												return d.subject;
												})));

	var general_indicator_selectors = Array.from(new Set(
					data_annual.map(function(d) {
												return d.indicator;
												})));
	current_indicator = data_annual[0].indicator;


		// Создаем меню
	var subjects = general_subject_selector.selectAll("option")
			.data(general_subject_selectors);
	subjects.enter()
			.append("option")
			.attr("value", function(d) { return d; })
			.text(function(d) { return main_data["subjects"][d]; });
			
	subjects.transition()
		.duration(500)
		.attr("value", function(d) { return d; })
			.text(function(d) { return main_data["subjects"][d]; });
	subjects.exit()
		.remove();
		
	var indicators = general_indicator_selector.selectAll("option")
			.data(general_indicator_selectors);
			
	indicators.enter()
			.append("option")
			.attr("value", function(d) { return d; })
			.text(function(d) { return main_data["indicators"][d]; });
	indicators.transition()
		.duration(500)
		.attr("value", function(d) { return d; })
			.text(function(d) { return main_data["indicators"][d]; });
	indicators.exit()
		.remove();



		// Создаем график
	
	redraw_graph(data_annual[0].subject, data_annual[0].indicator);
	
}

d3.json("data/test_data.json", function(data) {

d3.json("data/preview_map.json", function(map_data) {

	main_data = data;
    general_map_data = map_data;

	var categories = d3.map(main_data["categories"]).keys();

    console.log(main_data);
    //general_data = main_data;
	d3.select("#categories")
		.append("ul")
		.selectAll("li")
		.data(categories)
		.enter()
		.append("li")
		.text(function(d) { return main_data["categories"][d]; })
		.attr("id", function(d) { return d; })
		.on("click", function(d) {
			d3.selectAll("#categories li")
				.classed("active", false);
			d3.select(this).classed("active", true);
			var selected_category = d3.select(this).attr("id");
			draw_by_category(selected_category);
		});
	d3.select("#categories")
		.select("li")
		.classed("active", true);
	current_category = d3.map(data["categories"]).keys()[0];

	svg = d3.select("#general")
			.append("svg")
			.attr("width", "100%")
			.attr("height", 250);

    slider_group = svg.append("g")
                .attr("transform", "translate(60, 210)")
                .attr("id", "slider")
                .attr("stroke", "black")
                .attr("stroke-width", 2);

    general_map_group = svg.append("g")
                .attr("id", "general_map")
                .attr("transform", "translate(650, -150)");
	var general_map = d3.select("#general_map")
							.selectAll("path")

	general_map.data(general_map_data.features)
							.enter()
							.append("path")
							.attr("d", general_map_path)
							.attr("stroke", "black")
							.attr("fill", "white")
							.attr("opacity", "0.5")
							.on("click", function(d) {
								console.log(d.properties.region_name, d.properties.amount);
							});

	var circles = svg.selectAll("circle");

				
		x_axis_group = d3.select("svg").append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(60, 180)");
		y_axis_group = d3.select("svg").append("g")
					.attr("class", "y axis")
					.attr("transform", "translate(60, 0)");

		area_graph = svg.append("path")
								.attr("class", "area_graph");

		line_graph = d3.select("svg")
			.append("path");

        
        
		slider_group.append("line")
			.attr("class", "slider")
			.attr("x1", x_scale.range()[0])
			.attr("x2", x_scale.range()[1])
			.attr("y1", "10")
			.attr("y2", "10");
		d3.select("#slider")
			.append("circle")
			.attr("id", "slider_handle")
			.call(d3.drag()
				.on("drag", dragging)
				.on("end", dragended)
			);
// Функции для передвижения бегунка
function dragging() {
			d3.select(this).attr("cx", function() {
			if (d3.event.x <= 0) {
				return 0;
			} else if (d3.event.x > 950) {
				return 950;
			} else {
				return d3.event.x;          
		   }
			});
		}
function dragended(d) {
console.log(d3.event.x)
			  //d3.select(this).attr("cx", x_scale(x_scale.domain()[Math.round(d3.event.x / x_scale.step() / 2)]) + Math.round(x_scale.step() / 2));
			  var year_selected = x_scale.domain()[Math.round((d3.event.x) / x_scale.step() )];
			  console.log(year_selected);
			  d3.select(this).attr("cx", Math.round(x_scale(x_scale.domain()[Math.round((d3.event.x) / x_scale.step() )]) + x_scale.step() / 2));
			  
			 redraw_preview_map(year_selected, current_indicator)

}


draw_by_category(current_category);
	//// Собираем заголовки для первого селектора
	//data_annual = data["annual_data"].filter(function(d) {
			//return d.category == current_category;
			//});
	//data_current = data["current_data"].filter(function(d) {
			//return d.category == current_category;
			//});
			

	

	})
	
	
	

	
});



// Функция проверки наличия индикаторов для выбранного региона
function check_output(data) {
	if (data.length == 0) {
		d3.select("svg")
			.append("text")
			.attr("class", "message")
			.attr("x", 150)
			.attr("y", 100)
			.text("Данные будут добавлены. Попробуйте выбрать другой регион в меню.");
	}
}

// Перерисовка малой карты
function redraw_preview_map(year, indicator) {
	if (!lock_preview) {
	var map_filtered_data = data_annual.filter(function(d) {
		return d.indicator == indicator && d.period == year && d.subject != "375";
	});

general_map_extent = d3.extent(map_filtered_data, function(d) {
	if (d.subject != "375") { 
	return +d.amount;
	}
	});

general_map_color.domain([general_map_extent[0], general_map_extent[1]]);

general_map_data.features.forEach(function(a) {
   map_filtered_data.forEach(function(b) {
    if (b.subject == a.properties.subject) {
        a.properties.amount = b.amount;
    }
   });
});

d3.select("#general_map")
    .selectAll("path")
    .data(general_map_data);
    
d3.select("#general_map")
    .selectAll("path")
    .transition()
    .duration(500)
    .attr("fill", function(d) {
		
		return general_map_color(+d.properties.amount);

    });

} else {
	d3.select("#general_map")
    .selectAll("path")
    .transition()
    .duration(500)
    .attr("fill", function(d) {
		if (d.properties.subject == lock_preview) {
			return "orange";
		} else {
			return "white";
		}

    });
}



}

function redraw_graph(subject, indicator) {
	d3.select(".message").remove();
	
	var selected_data = data_annual.filter(function(d) {
		return d.subject == subject && d.indicator == indicator;
		});
	var values = selected_data.map(function(d) {
			return d.amount;
			});
	check_output(values);
	var data_extent = d3.extent(values, function(d) {
		return +d;
		});
	data_extent.sort(function(a, b) {
		return d3.ascending(a, b);
	});
	
	var max = d3.max(data_extent, function(d) { return d; });
	var min = d3.min(data_extent, function(d) { return d; });

	var years = selected_data.map(function(d) {
			return d.period;
			});
	years.sort(function(a, b) {
		return d3.ascending(+a, +b);
	});


	//var map_filtered_data = data_annual.filter(function(d) {
		//return d.indicator == indicator && d.period == years[years.length - 1] && d.subject != "375";
	//});

//general_map_extent = d3.extent(map_filtered_data, function(d) {
	//if (d.subject != "375") { 
	//return +d.amount;
	//}
	//});

//general_map_color.domain([general_map_extent[0], general_map_extent[1]]);

//general_map_data.features.forEach(function(a) {
   //map_filtered_data.forEach(function(b) {
    //if (b.subject == a.properties.subject) {
        //a.properties.amount = b.amount;
    //}
   //});
//});


//d3.select("#general_map")
    //.selectAll("path")
    //.data(general_map_data);
    
//d3.select("#general_map")
    //.selectAll("path").transition()
    //.duration(500)
    //.attr("fill", function(d) {
		
		//return general_map_color(+d.properties.amount);

    //});
    
	y_scale.domain([0, data_extent[1]]);
	y_axis_group
			.transition()
			.duration(500)
			.call(y_axis);

	x_scale.domain(years);
	x_axis_group
		.transition()
		.duration(500)
		.call(x_axis);

    //slider_scale.domain(years);

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
		


var circles = svg.selectAll(".graph_circle")
	.data(selected_data);

	circles.exit().remove();

	circles.enter()
	.append("circle")
    .attr("class", "graph_circle")
	.on("mouseover", function(d) {

                    var xPos = d3.event.pageX - 20 + "px";
                    var yPos = d3.event.pageY - 35 + "px";
                    d3.select("#general_tooltip")
                      .style("left", xPos)
                      .style("top", yPos)
                      .classed("hidden", false);
                    d3.select("#datum")
                      .text(formatter(d.amount));
            })
         .on("mouseout", function(d) {
                    d3.select("#general_tooltip")
                        .classed("hidden", true)
                      })
	.attr("cx", function(d) {
			return x_scale(d.period) + 60 + x_scale.bandwidth() / 2;
			})
		.attr("cy", function(d) {
			return y_scale(+d.amount);
			})
		.attr("r", 5);

	circles.transition()
		.duration(500)
		.attr("cx", function(d) {
			return x_scale(d.period) + 60 + x_scale.bandwidth() / 2;
			})
		.attr("cy", function(d) {
			return y_scale(+d.amount);
			})
		.attr("r", 5);

// Вешаем бегунок

			
	d3.select("#slider>circle").transition()
		.duration(500)
		.attr("cx", x_scale(years[years.length - 1]) + x_scale.step() / 2)
			.attr("cy", 10)
			.attr("r", 8);

redraw_preview_map(years[years.length - 1], indicator);




}

//function draw_general() {
	//d3.json("data/belarus1.json", function(json_data) {
                    //general_map_data = json_data;
                    

		//// Собираем заголовки для первого селектора
		////general_data = data.slice(0);
		//data = general_data["annual_data"].filter(function(d) {
			//return d.category == category;
			//});
		//console.log(data);
		//var general_subject_selectors = Array.from(new Set(
					//data.map(function(d) {
												//return d.subject;
												//})));
		//var general_indicator_selectors = Array.from(new Set(
					//data.map(function(d) {
												//return d.indicator;
												//})));
		//// Создаем меню
		//general_subject_selector.selectAll("option")
			//.data(general_subject_selectors)
			//.enter()
			//.append("option")
			//.attr("value", function(d) { return d; })
			//.text(function(d) { return d; });
		//general_indicator_selector.selectAll("option")
			//.data(general_indicator_selectors)
			//.enter()
			//.append("option")
			//.attr("value", function(d) { return d; })
			//.text(function(d) { return d; });
		
		//// Создаем график
		//svg = d3.select("#general")
			//.append("svg")
			//.attr("width", "100%")
			//.attr("height", 250);

        //slider_group = d3.select("svg")
                //.append("g")
                //.attr("transform", "translate(60, 210)")
                //.attr("id", "slider")
                //.attr("stroke", "black")
                //.attr("stroke-width", 2);

        //general_map_group = svg.append("g")
                //.attr("id", "general_map")
                //.attr("transform", "translate(650, -150)");
		//var general_map = d3.select("#general_map")
							//.selectAll("path")

		//general_map.data(json_data.features)
							//.enter()
							//.append("path")
							//.attr("d", general_map_path)
							//.attr("stroke", "black")
							//.attr("fill", "white")
							//.attr("opacity", "0.5")
							//.on("click", function(d) {
								//console.log(d.properties.region_name, d.properties.amount);
							//});

		//var circles = svg.selectAll("circle");

				
		//x_axis_group = d3.select("svg").append("g")
				//.attr("class", "x axis")
				//.attr("transform", "translate(60, 180)");
		//y_axis_group = d3.select("svg").append("g")
					//.attr("class", "y axis")
					//.attr("transform", "translate(60, 0)");

		//area_graph = svg.append("path")
								//.attr("class", "area_graph");

		//line_graph = d3.select("svg")
			//.append("path");

		//redraw_graph(data[0].subject, data[0].indicator);
        
        
		//slider_group.append("line")
			//.attr("class", "slider")
			//.attr("x1", slider_scale.range()[0])
			//.attr("x2", slider_scale.range()[1])
			//.attr("y1", "10")
			//.attr("y2", "10");

		//d3.select("#slider")
			//.append("circle")
			//.attr("cx", 60 + x_scale.bandwidth())
			//.attr("cy", 10)
			//.attr("r", 4)
			//.attr("stroke", "black")
			//.call(d3.drag()
				//.on("drag", dragging)
				//.on("end", dragended)
			//);

		//function dragging() {
			//d3.select(this).attr("cx", function() {
			//if (d3.event.x < 0) {
				//return 0;
			//} else if (d3.event.x > 950) {
				//return 950;
			//} else {
				//return d3.event.x;          
		   //}
			//});
		//}

		//function dragended(d) {
			  //d3.select(this).attr("cx", slider_scale(slider_scale.domain()[Math.round(d3.event.x / slider_scale.step())]) + slider_scale.bandwidth() / 2);
		//}

	//})
//};
        
       //draw_general();





//function main() {
    ////d3.tsv("data/data.tsv", function(loaded_data) {
    //// Собираем названия областей для селектора                
        //data_current.forEach(function(d) {
        //if (regions.indexOf(d.region) < 0) {
            //regions.push(d.region);
            //};
        //});
        //// Отфильтровываем только районы
        //data = data.filter(function(d) {
            //return d.subject.match(re) == null || d.subject == "Минск";
        //});
        //regions.sort(function(a, b) { return d3.ascending(a, b); });
        //regions.unshift("Вся Беларусь")

		//table_headers = d3.map(data[0]).keys();

		//// Убираем колонку с названием региона из данных
		//table_headers.shift("region");

		//var theaders = thead.selectAll("th").data(table_headers);

		//theaders.enter()
			//.append("th")
			//.attr("class", "sortable")
			//.text(function(d) { return d; })

		//// Создаем цветовую карту
		//indicators = table_headers.slice(0);
		//indicators.shift("subject");

		//for (var i = 0; i < indicators.length; i++) {
			//var temp_arr = data.map(function(d) {
				//if (d.subject != "г. Минск") {
				//return d[indicators[i]];
			//}
			//});
			//var min = d3.min(temp_arr, function(d) { return +d; });
			//var max = d3.max(temp_arr, function(d) { return +d; });
			//var median = d3.median(temp_arr, function(d) { return +d; });
            //min < 0 ? indicators_map[indicators[i]] = {
				//"range": [min, median, max], "scale": scale_map[indicators[i]] } :
					//indicators_map[indicators[i]] = {
						//"range": [min, max], "scale": scale_map[indicators[i]]
					//}
		//}

	//// Вставляем селектор
		//var selector = d3.select("thead").select("th")
						//.text("")
						//.append("select")
						//.attr("id", "region-selector")
						//.on("change", function() {
							//filter_by_region(this.value); 
							//});
		//selector.selectAll("option")
			//.data(regions)
			//.enter()
			//.append("option")
			//.attr("value", function(d) { return d; })
			//.text(function(d) { return d; });

	//// Снимаем класс с селектора
	//d3.select("th").classed("sortable", false);

	//var sortable_headers = d3.selectAll(".sortable")
		//.on("click", function(d) {

			//theaders.classed("sorted asc desc", false);
				//if (sort_ascending) {
					//tbody.selectAll("tr").sort(function(a, b) {
					//return d3.ascending(+a[d], +b[d]);

				//});
			//sortable_headers.classed("sorted asc desc", false);
			//d3.select(this).classed("sorted asc", true);
					//sort_ascending = false;
			//} else {
				//tbody.selectAll("tr").sort(function(a, b) {
				//return d3.descending(+a[d], +b[d]);

			//});
			//sortable_headers.classed("sorted asc desc", false);
			//d3.select(this).classed("sorted desc", true);
				//sort_ascending = true;
		//}
		//})
		//theaders.exit().remove();
		//redraw(data);
		////});
		

//d3.select("#menu_selector").selectAll("li")
	//.on("click", function(d) {
		//var selected_item = d3.select(this).attr("class");
		//d3.selectAll("#menu_selector li").classed("active", false);
		//d3.select(this).classed("active", true);
		//d3.selectAll(".tab_content").classed("hidden", true);
		//d3.select("#" + selected_item).classed("hidden", false);
	//});

//d3.select("#full_table").classed("hidden", false);
//}

//function filter_by_region(region) {

		//if ( region == "Вся Беларусь") {
			//filtered_data = data;
		//} else {
			//filtered_data = data.filter(function(d) {
				//return d.region == region;
			//});
		//}
		//redraw(filtered_data);

    //}

//function redraw(data) {
	
	//rows = tbody.selectAll("tr").data(data);
	//rows.enter()
        //.append("tr");
	//rows.exit().remove();

    //var cells = tbody.selectAll("tr").selectAll("td")
        //.data(function(d) {
            //return table_headers.map(function(header) {
                //return d[header];
			//});
        //})
    //cells.enter()
        //.append("td")
        //.text(function(d) { return (isNaN(d) ? d : formatter(d)); })
        //.attr("class", function(d) { return (isNaN(d) ? "normal" : "number"); });
	//cells.text(function(d) { return (isNaN(d) ? d : formatter(d)); })
		//.attr("style", function(d, i) {

			//i > 0 ? indicators[i] : "normal";
			//});
    //cells.exit().remove();

//// Раскрашиваем таблицу
	//tbody.selectAll("tr")
		//.selectAll(".number")
		//.style("background-color", function(d, i) {
			//return indicators_map[indicators[i]]["range"].length > 2 ? indicators_map[indicators[i]]["scale"].domain(indicators_map[indicators[i]]["range"])(parseInt(d)) : indicators_map[indicators[i]]["scale"].domain(indicators_map[indicators[i]]["range"])(parseInt(d))
        //});

		//// Показательная сортировка первой колонки таблицы при первой загрузке
		//tbody.selectAll("tr").sort(function(a, b) {
				//return d3.descending(+a[table_headers[1]], +b[table_headers[1]]);
			//});
		//thead.selectAll(".sortable").classed("desc asc", false);
		//thead.selectAll(".sortable")._groups[0][0].className += " sorted desc";
		
//}
	//main();

//// Карта

//var height = 600,
	//width = 800;
//var selected_category;
//var data_loaded = false;
				
//var projection = d3.geoMercator().center([27.9, 53.7]).scale(2800)
                    //.translate([250, 220]);
//var path = d3.geoPath().projection(projection);
//var color = d3.scaleQuantile()
              //.range(['#f2f0f7','#cbc9e2','#9e9ac8','#6a51a3']);
//var formatter = d3.format(",.1f");

//d3.json("data/rajony.geojson", function(karta) {
	
	//// Собираем названия категорий для селектора

    //d3.csv("data/goroda.csv", function(goroda) {
	//data_loaded = true;

//var category_names = d3.map(data[0]).keys();
	//category_names.shift("region");
	//category_names.shift("subject");

	

	//var category_selector = d3.select("#map").append("select")
			//.attr("id", "map_selector")

//var svg_map = d3.select("#map")
				//.append("svg")
				//.attr("viewBox", "0 0 800 600")
				//.attr("preserveAspectRatio", "xMidYMid");
				////.attr("width", 800)
				////.attr("height", height);

//var legend = svg_map.append("g")
            //.attr("id", "legend")
            //.attr("transform", "translate(40, 40)");

//category_selector.on("change", function() {

					//selected_category = this.value
					//redraw_map(selected_category);
				//})

	//category_selector.selectAll("option")
		//.data(category_names)
		//.enter()
		//.append("option")
		//.attr("value", function(d) { return d; })
		//.text(function(d) { return d; });
		

//function redraw_map(selected_category) {

    //for (var i = 0; i < data.length; i++ ) {
      //for (var j = 0; j < karta.features.length; j++) {
        //if (data[i].subject == karta.features[j].properties.rajon) {
          //karta.features[j].properties.amount = +data[i][selected_category];
          //break;
        //}
      //}
    //};

	//color.domain(d3.extent(data, function(d) {
		//if (d.subject != "г. Минск") { return +d[selected_category];
			//}
		//}));
    //var paths = svg_map.selectAll("path")
      //.data(karta.features)
	
	//paths.enter()
      //.append("path")
      //.attr("d", path)
	//.attr("fill", function(d) {
			//if (d.properties.amount) {
				//return color(d.properties.amount);
            //} else {
				//return "white"
            //}
    //})
    //.on("mouseover", function(d) {
        //var xPos = d3.event.pageX + "px";
        //var yPos = d3.event.pageY + "px";
        //d3.select("#tooltip")
			//.style("left", xPos)
            //.style("top", yPos)
            //.classed("hidden", false);
        //d3.select("#rajon")
			//.text(d.properties.rajon + " район" );        
        //d3.select("#amount")
			//.text(selected_category + " : " + formatter(d.properties.amount));
    //})
    //.on("mouseout", function(d) {
		//d3.select("#tooltip")
			//.classed("hidden", true)
                      //});
                                  
    //paths.on("mouseover", function(d) {
                    //var xPos = d3.event.pageX + "px";
                    //var yPos = d3.event.pageY + "px";
                    //d3.select("#tooltip")
                      //.style("left", xPos)
                      //.style("top", yPos)
                      //.classed("hidden", false);
                    //d3.select("#rajon")
                      //.text(d.properties.rajon + " район" );
                    
                      //d3.select("#amount")
                      //.text(selected_category + " : " + formatter(d.properties.amount));
        //})
        //.on("mouseout", function(d) {
			//d3.select("#tooltip")
				//.classed("hidden", true)
        //});
      
    //paths.transition()
		//.duration(500)
		//.attr("fill", function(d) { return color(+d.properties.amount); });

      //// Легенда

    //var legend_rects = legend.selectAll("rect")
            //.data(color.range());
            
    //legend_rects.enter()
        //.append("rect")
        //.attr("x", 30)
        //.attr("y", function(d, i) { return i * 15; })
        //.attr("width", 10)
        //.attr("height", 10)
        //.attr("fill", function(d) { return d; })
        //.attr("stroke", "black");
            
    //var legend_texts = legend.selectAll("text")
            //.data(color.range());
            
    //legend_texts.enter()
            //.append("text")
            //.text(function(d) { return "<" + " " + formatter(d3.max(color.invertExtent(d), function(d) { return d; })); })
            //.attr("x", 45)
            //.attr("y", function(d, i) { return (i * 15) + 10; });
  
	//legend_texts.transition()
		//.duration(500)
		//.text(function(d) { return "<" + " " + formatter(d3.max(color.invertExtent(d), function(d) { return d; })); })
  
        //var cities = svg_map.selectAll("circle")
                          //.data(goroda);
                    
                    //cities.enter()
                       //.append("circle")
                       //.attr("class", "city")
                       //.attr("cx", function(d) {
                         //return projection([d.lon, d.lat])[0];
                       //})
                       //.attr("cy", function(d) {
                         //return projection([d.lon, d.lat])[1];
                       //})
                       //.attr("r", function(d) {
                         //if (d.city == "г. Минск") {
                           //return 7;
                         //} else {
                           //return 5;
                         //};})                    
                    //.attr("fill", function(d) { 
                                //var colorCircle;
                                //for (var q = 0; q < data.length; q++) {
                                  //if (d.city == data[q].subject) {
                                      //colorCircle = color(data[q][selected_category]);
                                      //d.amount = data[q][selected_category];
                                    //} else {
                                      //continue;
                                  //};
                                //};
                                //return colorCircle;
                                //})
                    //.on("mouseover", function(d) {
                    //var xPos = d3.event.pageX + "px";
                    //var yPos = d3.event.pageY + "px";
                    //d3.select("#tooltip")
                      //.style("left", xPos)
                      //.style("top", yPos)
                      //.classed("hidden", false);
                    //d3.select("#rajon")
                      //.text(d.city );
                    
                      //d3.select("#amount")
                      //.text(selected_category + " : " + formatter(d.amount));
            //})
                    //.on("mouseout", function(d) {
                      //d3.select("#tooltip")
                        //.classed("hidden", true)
                      //});
   
        //cities.transition()
			//.duration(500)
			//.attr("fill", function(d) { 
                                //var colorCircle;
                                //for (var q = 0; q < data.length; q++) {
                                  //if (d.city == data[q].subject) {
                                      //colorCircle = color(data[q][selected_category]);
                                      //d.amount = data[q][selected_category];
                                    //} else {
                                      //continue;
                                  //};
                                //};
                                //return colorCircle;
                                //});
                
        //cities.on("mouseover", function(d) {
                    //var xPos = d3.event.pageX + "px";
                    //var yPos = d3.event.pageY + "px";
                    //d3.select("#tooltip")
                      //.style("left", xPos)
                      //.style("top", yPos)
                      //.classed("hidden", false);
                    //d3.select("#rajon")
                      //.text(d.city );
                    
                      //d3.select("#amount")
                      //.text(selected_category + " : " + formatter(d.amount));
            //})
                    //.on("mouseout", function(d) {
                      //d3.select("#tooltip")
                        //.classed("hidden", true)
                      //});
                      
	//}

//redraw_map(category_names[0])

//});

//});
