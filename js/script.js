// Укоротить названия переменных.
var regions = [],
	re = /област/,
	table_data,
	my_array,
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
	lock_preview = false,
	current_indicators,
	theaders,
	my_array;
	
	var t = d3.transition().duration(500);

// Малая карта для графика годовых данных
var general_map_projection = d3.geoMercator()
                   .center([27.9, 53.7])
                            //.translate([0, 0])
                            .scale(2200);
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

var new_scale_map = {
	"i12": color_scale_green,
	"i13": color_scale_full_reverse,
	"i9": color_scale_green,
	"i4": color_scale_full_reverse,
	"i11": color_scale_red,
	"i10": color_scale_red,
	"i1": color_scale_green,
	"i2": color_scale_green,
	"i8": color_scale_green
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
				.range([280, 10]);
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
			.y0(280)
			.y1(function(d) { return y_scale(+d.amount); });

function draw_by_category(category) {

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
	var annual_subjects = general_subject_selector.selectAll("option")
			.data(general_subject_selectors);
	annual_subjects.enter()
			.append("option")
			.attr("value", function(d) { return d; })
			.text(function(d) { return main_data["subjects"][d]; });
			
	annual_subjects.transition().duration(500)
		.attr("value", function(d) { return d; })
			.text(function(d) { return main_data["subjects"][d]; });
	annual_subjects.exit()
		.remove();
		
	var annual_indicators = general_indicator_selector.selectAll("option")
			.data(general_indicator_selectors);
			
	annual_indicators.enter()
			.append("option")
			.attr("value", function(d) { return d; })
			.text(function(d) { return main_data["indicators"][d]; });
	annual_indicators.transition().duration(500)
		.attr("value", function(d) { return d; })
			.text(function(d) { return main_data["indicators"][d]; });
	annual_indicators.exit()
		.remove();
		
	// Выводим первый селектор индикаторов наверх
	d3.select("#indicators")
		.selectAll("option")
		._groups[0][0]
		.selected = true;

		// Создаем график
	redraw_graph(data_annual[0].subject, data_annual[0].indicator);
	
	// Рисуем таблицу оперативных данных
	draw_table();
}

d3.json("data/test_data.json", function(data) {

	d3.json("data/preview_map.json", function(map_data) {

		main_data = data;
		general_map_data = map_data;

		var categories = d3.map(main_data["categories"]).keys();

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
				.attr("height", 350);

		slider_group = svg.append("g")
					.attr("transform", "translate(60, 310)")
					.attr("id", "slider")
					.attr("stroke", "black")
					.attr("stroke-width", 2);

		general_map_group = svg.append("g")
					.attr("id", "general_map")
					.attr("transform", "translate(750, -80)");
		var general_map = d3.select("#general_map")
								.selectAll("path")

		general_map.data(general_map_data.features)
								.enter()
								.append("path")
								.attr("id", function(d) {
									return d.properties.region_name;
								}) 
								.attr("d", general_map_path)
								.attr("stroke", "black")
								.attr("fill", "white")
								.on("mouseover", function(d) {
									var xPos = d3.event.pageX + "px";
									var yPos = d3.event.pageY + "px";
									d3.select("#tooltip")
										.style("left", xPos)
										.style("top", yPos)
										.classed("hidden", false)   
									d3.select("#rajon")    
										.text(d.properties.region_name)
									d3.select("#amount")
										.text(formatter(d.properties.amount));
								})
								.on("mouseout", function(d) {
									d3.select("#tooltip")
										.classed("hidden", true)
												  });
		// Добавляем Минск
		general_map_group.append("circle")
				//.datum([27.5666, 53.9])
                       //.attr("class", "Minsk")
                .attr("cx", function(d) {
					return general_map_projection([27.5666, 53.9])[0];
				})
                .attr("cy", function(d) {
					return general_map_projection([27.5666, 53.9])[1]; 
					})
                .attr("r", 25)
                .attr("fill", "white")
                .attr("stroke", "black")
				.attr("opacity", "1")
				.on("mouseover", function(d) {
									var xPos = d3.event.pageX + "px";
									var yPos = d3.event.pageY + "px";
									d3.select("#tooltip")
										.style("left", xPos)
										.style("top", yPos)
										.classed("hidden", false)  
									d3.select("#rajon")    
										.text("г. Минск")     
									d3.select("#amount")
										.text(formatter(d));
								})
								.on("mouseout", function(d) {
									d3.select("#tooltip")
										.classed("hidden", true)
												  });
		// Добавляем легенду
		//general_map_group.append("g")
			//.attr("transform", "translate(0, 0)")
			//.attr("id", "preview_map_legend")
			//.selectAll("rect")
			//.data(["#d94701", "#feedde"])
			//.enter()
			//.append("rect")
			//.attr("x", 620)
			//.attr("y", function(d, i) {
				//return 150 + i * 25;
			//})
			//.attr("width", 15)
			//.attr("height", 15)
			//.attr("fill", function(d) { return d; });
			
			// Надписи на карте
			// d3.selectAll("#general_map path").append("text").attr("x", function(d) { return path.centroid(d)[0]; }).attr("y", function(d) { return path.centroid(d)[1]; }).attr("class", "text_label").text(function(d) { return d.properties.amount;})
			
			// Или так лучше d3.selectAll("#general_map path").append("text").append("textPath").attr("xlink:href", function(d) { return "#" + d.properties.region_name}).attr("x", function(d) { return path.centroid(d)[0]; }).attr("y", function(d) { return path.centroid(d)[1]; }).attr("class", "text_label").text(function(d) { return d.properties.amount;})
			
		var circles = svg.selectAll("circle");

			x_axis_group = d3.select("svg").append("g")
					.attr("class", "x axis")
					.attr("transform", "translate(60, 280)");
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
	//console.log(d3.event.x)
				  //d3.select(this).attr("cx", x_scale(x_scale.domain()[Math.round(d3.event.x / x_scale.step() / 2)]) + Math.round(x_scale.step() / 2));
				  var year_selected = x_scale.domain()[Math.round((d3.event.x) / x_scale.step() )];
				  //console.log(year_selected);
				  d3.select(this).attr("cx", Math.round(x_scale(x_scale.domain()[Math.round((d3.event.x) / x_scale.step() )]) + x_scale.step() / 2));
				 redraw_preview_map(year_selected, current_indicator)
	}
	draw_by_category(current_category);
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
		// Отображаем легенду
		d3.select("#preview_map_legend")
			.style("display", "block")
		// Фильтруем данные для карты
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
		var minsk_amount = map_filtered_data.filter(function(d) {
			return d.subject == "170";
			})[0].amount;
			
//		console.log("minsk_amount", minsk_amount);
		d3.select("#general_map")
			.selectAll("path")
			.data(general_map_data);
		d3.select("#general_map")
			.selectAll("path")
			.transition().duration(500)
			.attr("fill", function(d) {
				
				return general_map_color(+d.properties.amount);
			});
		// Раскрашиваем Минск
		d3.select("#general_map")
			.select("circle")
			.data([minsk_amount])
			.transition().duration(500)
			.attr("fill", function(d) {
				return general_map_color(d);
			})
	} else {
		// Скрываем легенду
		//d3.select("#preview_map_legend")
			//.style("display", "none")
		d3.select("#general_map")
		.selectAll("path")
		.transition().duration(500)
		.attr("fill", function(d) {
			if (d.properties.subject == lock_preview) {
				return "orange";
			} else {
				return "white";
			}
		});
		// Раскрашиваем Минск
		d3.select("#general_map")
			.select("circle")
			.transition().duration(500)
			.attr("fill", function(d) {
				return (lock_preview == "170" ? "orange" : "white");
			})
	}
}

function redraw_graph(subject, indicator) {
	d3.select(".message").remove();
	
	var selected_data = data_annual.filter(function(d) {
		return d.subject == subject && d.indicator == indicator;
		});
	selected_data.sort(function(a, b) {
		return d3.ascending(a.period, b.period)
	})
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
    
	y_scale.domain([0, data_extent[1]]);
	y_axis_group
			.transition().duration(500)
			.call(y_axis);

	x_scale.domain(years);
	x_axis_group
		.transition().duration(500)
		.call(x_axis);

	area_graph
		.transition().duration(500)
		.attr("d", area(selected_data));

	line_graph.transition().duration(500)
		.attr("d", line(selected_data))
		.attr("class", "line_graph");

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

	circles.transition().duration(500)
		.attr("cx", function(d) {
			return x_scale(d.period) + 60 + x_scale.bandwidth() / 2;
			})
		.attr("cy", function(d) {
			return y_scale(+d.amount);
			})
		.attr("r", 5);

// Вешаем бегунок
	d3.select("#slider>circle")
		.transition().duration(500)
		.attr("cx", x_scale(years[years.length - 1]) + x_scale.step() / 2)
			.attr("cy", 10)
			.attr("r", 8);

redraw_preview_map(years[years.length - 1], indicator);

}


// Основная версия кода таблицы оперативных данных 

//function main() {
    //d3.tsv("data/data.tsv", function(loaded_data) {
    //// Собираем названия областей для селектора                
        //data = loaded_data.slice(0);
        //data.forEach(function(d) {
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
		//});
		

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
      
    //paths.transition().duration(500)
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
  
	//legend_texts.transition().duration(500)
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
   
        //cities.transition().duration(500)
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

// *********************************************************************
// *********************************************************************

// Испытательный код таблицы оперативных данных

function draw_table() {
		// Готовим список регионов для селектора таблицы
		regions = [];
        data_current.forEach(function(d) {
        if (regions.indexOf(d.region) < 0) {
            regions.push(d.region);
            };
        });
        regions.sort(function(a, b) {
             return d3.ascending(main_data["subjects"][a], main_data["subjects"][b]);
             })
        console.log(regions);
        regions.splice(regions.indexOf(170), 1);
        regions.unshift("375");
        console.log(regions);
        
        // Отфильтровываем только районы
        table_data = data_current.filter(function(d) {
		// Проверяем по списку кодов регионов
		// или if regions.indexOf(d.subject)] < 0
			return !(d["subject"] in main_data["subjects"]);
        });

        // Для отрисовки таблицы передавать данные в виде [{region: , subject: , indicator: amount..., }, {region: , subject: , indicator: ...}] - это уже в my_array. Как не показывать область?
        test_data = {};
        table_data.forEach(function(d) {
			if ((d.subject in test_data) == false) {
				test_data[d.subject] = {};
				test_data[d.subject][d.indicator] = d.amount;test_data[d.subject]["region"] = d.region;
			} else {
				test_data[d.subject][d.indicator] = d.amount;
				test_data[d.subject]["region"] = d.region;
			}
			});
		// Тестовый набор для таблицы
		my_array = [];
		var rajony_names = d3.map(test_data).keys();
		console.log("rajony_names", rajony_names)
		rajony_names.forEach(function(d) {
			var temp_arr = {};
			temp_arr["subject"] = d;
			Object.assign(temp_arr, test_data[d])
			temp_arr["region"] = test_data[d]["region"];
			my_array.push(temp_arr)
			})
		
		var rajony = d3.map(test_data).keys();
		
		current_indicators = Array.from(new Set(table_data.map(function(d) {
			return d.indicator;
			})));
		//table_headers = d3.map(table_data[0]).keys(); // Уже не сработает.
		
		table_headers = current_indicators.slice(0);
		table_headers.unshift("subject")
		// Убираем колонку с названием региона из данных
		//table_headers.unshift("selector");

		theaders = thead.selectAll("th")
			.data(table_headers);

		theaders.enter()
			.append("th")
			.attr("class", "sortable")
			.attr("id", function(d) { return d; })
			.text(function(d) { return main_data["indicators"][d]; });
		theaders.attr("id", function(d) { return d; })
			.text(function(d) { return main_data["indicators"][d]; });
		theaders.exit()
			.remove();
		// Создаем цветовую карту
		//indicators = table_headers.slice(0);
		//indicators.shift("subject");


		// Карта нужна для создания диапазона значений по каждому индикатору. По этому диапазону будет работать раскраска. 
		for (var i = 0; i < current_indicators.length; i++) {
			var temp_arr = table_data.map(function(d) {
				if (d.subject != "170" && d["indicator"] == current_indicators[i]) {
				return d.amount;
			}
			});
			var min = d3.min(temp_arr, function(d) { return +d; });
			var max = d3.max(temp_arr, function(d) { return +d; });
			var median = d3.median(temp_arr, function(d) { return +d; });
            min < 0 ? indicators_map[current_indicators[i]] = {
				"range": [min, median, max], "scale": new_scale_map[current_indicators[i]] } :
					indicators_map[current_indicators[i]] = {
						"range": [min, max], "scale": new_scale_map[current_indicators[i]]
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
			.text(function(d) { return main_data["subjects"][d]; });

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

		// Отрисовка таблицы
		redraw(my_array);
		

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
		if ( region == "375") {
			filtered_data = my_array;
		} else {
			filtered_data = my_array.filter(function(d) {
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

			i > 0 ? current_indicators[i] : "normal";
			});
    cells.exit().remove();

// Раскрашиваем таблицу
	tbody.selectAll("tr")
		.selectAll(".number")
		.style("background-color", function(d, i) {
			return indicators_map[current_indicators[i]]["range"].length > 2 ? indicators_map[current_indicators[i]]["scale"].domain(indicators_map[current_indicators[i]]["range"])(parseInt(d)) : indicators_map[current_indicators[i]]["scale"].domain(indicators_map[current_indicators[i]]["range"])(parseInt(d))
        });

		// Показательная сортировка первой колонки таблицы при первой загрузке
		tbody.selectAll("tr").sort(function(a, b) {
				return d3.descending(+a[table_headers[1]], +b[table_headers[1]]);
			});
		thead.selectAll(".sortable").classed("desc asc", false);
		thead.selectAll(".sortable")._groups[0][0].className += " sorted desc";
		
}


// Карта

var height = 600,
	width = 800;
var selected_category;

				
var projection = d3.geoMercator().center([27.9, 53.7]).scale(2800)
                    .translate([250, 220]);
var path = d3.geoPath().projection(projection);
var color = d3.scaleQuantile()
              .range(['#feedde','#fdbe85','#fd8d3c','#d94701']);
var formatter = d3.format(",.1f");

d3.json("data/rajony.geojson", function(karta) {
	
	// Собираем названия категорий для селектора

    d3.csv("data/goroda.csv", function(goroda) {


var category_names = current_indicators;
	//category_names.shift("region");
	//category_names.shift("subject");

	

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
		.text(function(d) { return main_data["indicators"][d]; });
		

function redraw_map(selected_category) {

    for (var i = 0; i < my_array.length; i++ ) {
      for (var j = 0; j < karta.features.length; j++) {
        if (my_array[i].subject == karta.features[j].properties.rajon) {
          karta.features[j].properties.amount = +my_array[i][selected_category];
          break;
        }
      }
    };

	color.domain(d3.extent(my_array, function(d) {
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
                      .text(main_data["indicators"][selected_category] + " : " + formatter(d.properties.amount));
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
                                for (var q = 0; q < my_array.length; q++) {
                                  if (d.city == my_array[q].subject) {
                                      colorCircle = color(my_array[q][selected_category]);
                                      d.amount = my_array[q][selected_category];
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
                      .text(d.city);
                    
                      d3.select("#amount")
                      .text(main_data["indicators"][selected_category] + " : " + formatter(d.amount));
            })
                    .on("mouseout", function(d) {
                      d3.select("#tooltip")
                        .classed("hidden", true)
                      });
   
        cities.transition()
			.duration(500)
			.attr("fill", function(d) { 
                                var colorCircle;
                                for (var q = 0; q < my_array.length; q++) {
                                  if (d.city == my_array[q].subject) {
                                      colorCircle = color(my_array[q][selected_category]);
                                      d.amount = my_array[q][selected_category];
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
                      .text(main_data["indicators"][selected_category] + " : " + formatter(d.amount));
            })
                    .on("mouseout", function(d) {
                      d3.select("#tooltip")
                        .classed("hidden", true)
                      });
                      
	}

redraw_map(category_names[0])

});

});
