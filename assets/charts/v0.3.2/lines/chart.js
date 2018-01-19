define(['d3', 'timescale', 'twopassresize'], function(d3, Timescale, TwoPassResize) {
    return function(container, params) {
        var svg = d3.select('body').append('svg'),
            chart = svg.append('g'),
            vScale = d3.scaleLinear(),
            yAxis = d3.axisLeft(vScale),
            yy = chart.append('g')
                .attr('class', 'y axis'),
            lines = chart.append('g'),
            tScale = d3.scaleTime(),
            cScale = d3.scaleOrdinal(d3.schemeCategory10),
            line,
            marker,
            svgline = d3.line()
                .x(function(d) { return tScale(d.date); })
                .y(function(d) { return vScale(d.value); }),
            legend,
            lrects,
            ltexts,
            timescale = Timescale(chart, tScale),
            resize = function(left, top, width, height, fontsize) {
                var heights = [];

                svg
                    .attr('width', container.clientWidth)
                    .attr('height', container.clientHeight);

                chart
                    .attr('transform', 'translate('+left+','+top+')');

                vScale
                    .range([height, 0]);

                tScale
                    .range([0, width]);

                timescale.redraw(width, height);

                yAxis
                    .ticks(Math.min(11, height/25))
                    .tickSize(-width);

                yy
                    .call(yAxis)
                    .selectAll('text')
                    .style('font-size', fontsize+'px');

                line
                    .attr('d', svgline)
                    .attr('stroke-width', fontsize/5);

                legend
                    .attr('transform', function(d, i) { return 'translate(0,'+(-(i+2)*fontsize)+')'; });

                lrects
                    .attr('x', width-18)
                    .attr('y', fontsize/2)
                    .attr('height', fontsize/5);

                ltexts
                    .attr('x', width-24)
                    .attr('y', fontsize/2)
                    .style('font-size', fontsize+'px');

                return svg._groups[0][0].getBBox();
            };

        return {
            update: function(dataset) {
                var start = +Infinity,
                    end = -Infinity,
                    max = 0;

                var series = dataset.cols.slice(1).map(function(serie) {
                    return {label: serie.label, values: []};
                });
                dataset.rows.forEach(function(row) {
                    var timestamp = new Date(row[0]);
                    start = Math.min(start, timestamp);
                    end = Math.max(end, timestamp);
                    dataset.cols.slice(1).forEach(function(col, index) {
                        var value = parseFloat(row[index+1]);
                        series[index].values.push({date: timestamp, value: value});
                        max = Math.max(max, value);
                    });
                });

                var tmargin = Math.max((end-start)/20, 24*60*60);
                tScale
                    .domain([start-tmargin, end+tmargin]);

                vScale
                    .domain([params.offset || 0, max]);

                line = lines.selectAll('.line')
                    .data(series)
                    .enter()
                    .append('path')
                    .datum(function(d) { return d.values; })
                    .attr('class', 'line')
                    .attr('stroke', function(d, i) { return cScale(i); })
                    .attr('marker-start', function(d, i) { return 'url(#marker_'+i+')'; })
                    .attr('marker-mid', function(d, i) { return 'url(#marker_'+i+')'; })
                    .attr('marker-end', function(d, i) { return 'url(#marker_'+i+')'; });

                marker = svg.append('defs').selectAll('marker')
                    .data(series)
                    .enter()
                    .append('marker')
                    .attr('id', function(d, i) { return 'marker_'+i; })
                    .attr('markerWidth', 8)
                    .attr('markerHeight', 8)
                    .attr('refX', 5)
                    .attr('refY', 5)
                    .append('circle')
                    .attr('cx', 5)
                    .attr('cy', 5)
                    .attr('r', 1.2)
                    .attr('fill', function(d, i) { return cScale(i); })
                    .attr('class', 'circleMarker');

                legend = chart.append('g').selectAll('.legend')
                    .data(series)
                    .enter()
                    .append('g')
                    .attr('class', 'legend');

                lrects = legend.append('rect')
                    .attr('width', 18)
                    .style('fill', function(d, i) { return cScale(i); });

                ltexts = legend.append('text')
                    .attr('dy', '.35em')
                    .style('text-anchor', 'end')
                    .text(function(d) { return d.label; });

                this.resize();
            },
            resize: TwoPassResize(container, params.margin, resize)
        };
    };
});
