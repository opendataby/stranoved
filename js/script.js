var re = /област/,
	regions = [],
	data,
	sort_ascending = true,
	table = d3.select("#table").append("table"),
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
						.on("change", function() { filter_by_region(this.value); });
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
