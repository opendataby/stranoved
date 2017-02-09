var re = /област/,
	regions = [],
	data,
	sortAscending = false,
	table = d3.select("#table").append("table"),
	thead = table.append("thead").append("tr"),
	tbody = table.append("tbody"),
	table_headers,
	rows,
	formatter = d3.format(",.1f");

function main() {
    d3.csv("data/data.csv", function(loaded_data) {
        // Собираем названия областей для селектора
        data = loaded_data;
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
		    tbody.selectAll("tr").sort(function(a, b) {
				return d3.descending(parseFloat(+a[d]), parseFloat(+b[d])); });
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
        .text(function(d) { return (isNaN(d) ? d : formatter(d)); });
	cells.text(function(d) { return (isNaN(d) ? d : formatter(d)); });
    cells.exit().remove();

}
	main();
