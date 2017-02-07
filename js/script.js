function main(data) {
    function select_region(region) {
        console.log(region);
    }
    var re = /област/;
    var regions = [];
    // Собираем названия областей для селектора
    data.forEach(function(d) {
        if (regions.indexOf(d.region) < 0) {
            regions.push(d.region);
        };
    })
    regions.sort(function(a, b) { return d3.ascending(a, b); });
    regions.unshift("Вся Беларусь")
    data = data.filter(function(d) { return d.subject.match(re) == null; });
    var table_headers = d3.map(data[0]).keys();
    
    // Убираем колонку с названием региона из данных
    table_headers.shift("region");
    var table = d3.select("#table").append("table");
    var thead = table.append("thead").append("tr")
    var tbody = table.append("tbody");
    
    var theaders = thead.selectAll("th").data(table_headers);

    theaders.enter()
        .append("th")
        .text(function(d) { return d; });

    var rows = tbody.selectAll("tr")
        .data(data)
        .enter()
        .append("tr");

    var cells = rows.selectAll("td") 
        .data(function(d) { 
            return table_headers.map(function(header) {
                return d[header];
        });
        });
    
    cells.enter()
        .append("td")
        .text(function(d) { return d; });
        
    theaders.exit().remove();

    var selector = d3.select("thead").select("th")
                    .text("")
                    .append("select")
                    .attr("id", "region-selector")
                    .on("change", function() { select_region(this.value); });
    selector.selectAll("option")
        .data(regions)
        .enter()
        .append("option")
        .attr("value", function(d) { return d; })
        .text(function(d) { return d; })
//        .sort(function(a, b) { return d3.ascending(a, b); });

}
d3.csv("data/stranoved_data.csv", main)
