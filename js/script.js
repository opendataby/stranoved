var re = /област/;
var regions = [];
var data;
var sortAscending = true;
var table = d3.select("#table").append("table");
var thead = table.append("thead").append("tr")
var tbody = table.append("tbody");
var table_headers;
var rows;

function main() {
    d3.csv("data/data2.csv", function(loaded_data) {
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
    theaders.exit().remove();

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
        .text(function(d) { return d; })
//        .sort(function(a, b) { return d3.ascending(a, b); });

// Снимаем класс с селектора
	d3.select("th").classed("sortable", false);

	var sortable_headers = d3.selectAll(".sortable");

	sortable_headers.on("click", function(d) {

	theaders.classed("sorted", false);
		if (sortAscending) {
		    rows.sort(function(a, b) { return +b[d] < +a[d]; });
		        sortAscending = false;
		                	     sortable_headers.classed("sorted", false);
		                	     d3.select(this).classed("sorted", true);
		                	   } else {
		                		 rows.sort(function(a, b) { return +b[d] > +a[d]; });
		                		 sortAscending = true;
		                	   }
					})

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
	rows = tbody.selectAll("tr").data(data)
	rows.exit().remove();
	rows.enter()
        .append("tr");
    var cells = tbody.selectAll("tr").selectAll("td")
        .data(function(d) {
            return table_headers.map(function(header) {
                return d[header];
			});
        })
    cells.enter()
        .append("td")
        .text(function(d) { return d; });
	cells.text(function(d) { return d; });
    cells.exit().remove();
}
	main();
