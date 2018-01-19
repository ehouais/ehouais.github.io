define(['d3', 'twopassresize'], function(d3, TwoPassResize) {
    return function(container, params) {
        var dgroups,
            slabels,
            lcol,
            nb_series,
            nb_rows,
            grouping,
            svg = d3.select(container).append('svg'),
            chart = svg.append('g'),
            vScale = d3.scaleLinear(),
            bScale = d3.scaleBand(),

            xAxis = d3.axisBottom(vScale),
            yAxis = d3.axisLeft(bScale)
                .tickSizeOuter(0),

            xx = chart.append('g')
                .attr('class', 'x axis'),
            yy = chart.append('g')
                .attr('class', 'y axis'),
            groups = chart.append('g'),

            cScale = d3.scaleOrdinal(d3.schemeCategory10),
            legend,
            lrects,
            ltexts,
            unitl;

        var resize = function(left, top, width, height, fontsize) {
                var heights = [];

                svg
                    .attr('width', container.clientWidth)
                    .attr('height', container.clientHeight);

                chart
                    .attr('transform', 'translate('+left+','+top+')');

                bScale
                    .range([0, height])
                    .padding(nb_series > 1 ? 0.2 : 0.1);

                var rowheight = bScale.bandwidth()/grouping.length;

                vScale
                    .range([0, width]);

                xAxis
                    .ticks(Math.min(11, width/25))
                    .tickSize(-height);

                xx
                    .attr('transform', 'translate(0,' + height + ')')
                    .call(xAxis)
                    .style('font-size', fontsize+'px')
                    .selectAll('text')
                    .attr('dy', fontsize);

                xx
                    .selectAll('g')
                    .filter(function(d) { return d; })
                    .classed('minor', true);

                yy
                    .call(yAxis)
                    .style('font-size', fontsize+'px')
                    .selectAll('text')
                    .each(function(d, i) {
                        d3.select(this).text(null)
                            .append('tspan')
                            .text(dgroups[i].label)
                            .attr('y', 0)
                            .attr('dx', -fontsize/3);
                    });

                group
                    .attr('transform', function(d, i) {
                        return 'translate(0,'+(bScale(i))+')';
                    });

                rects
                    .attr('x', function(d, i) { return vScale(d.left); })
                    .attr('y', function(d) { return d.row*rowheight; })
                    .attr('width', function(d) { return vScale(d.width); })
                    .attr('height', rowheight);

                if (slabels) {
                    legend
                        .attr('transform', function(d, i) { return 'translate(0,'+(-(i+2)*fontsize)+')'; });

                    lrects
                        .attr('x', width-18)
                        .attr('height', fontsize*0.9);

                    ltexts
                        .attr('x', width-24)
                        .attr('y', fontsize/2)
                        .style('font-size', fontsize+'px');
                }

                if (unitl) {
                    unitl
                        .attr('x', width+fontsize)
                        .attr('dy', fontsize);
                }

                return svg._groups[0][0].getBBox();
            };

        return {
            update: function(dataset) {
                var rows = dataset.rows;

                lcol = params.labels || 0;
                nb_series = rows[0].length-1;
                grouping = params.grouping || d3.range(nb_series).map(function(index) {
                    return [index+1];
                });

                slabels = dataset.cols.slice(1).map(function(col) {
                    return col.label;
                });

                nb_rows = rows.length;

                // Pre-compute bar dimensions according to values and grouping
                var max = 0;
                dgroups = rows.map(function(row) {
                    var group = {label: row[lcol], values: []};
                    grouping.forEach(function(stack, i) {
                        var width = 0;
                        stack.forEach(function(col_index) {
                            var value = parseFloat(row[col_index]) || 0;
                            group.values.push({
                                row: i,
                                left: width,
                                width: value
                            });
                            width += value;
                        });
                        max = Math.max(max, width);
                    });
                    return group;
                });

                // Nb of ticks on x-axis
                bScale.domain(d3.range(nb_rows)),

                // Compute max bar height to set y-axis range, taking grouping into account
                vScale.domain([0, max]);

                group = groups
                    .selectAll('.group')
                    .data(dgroups)
                    .enter()
                    .append('g')
                    .attr('class', 'group');

                bars = group.selectAll('g')
                    .data(function(d) { return d.values; })
                    .enter()
                    .append('g');

                rects = bars.append('rect')
                    .attr('fill', function(d, i) { return cScale(i); });

                rects.append('title')
                    .text(function(d) { return d.height; });

                if (slabels) {
                    legend = chart.append('g').selectAll('.legend')
                        .data(slabels)
                        .enter()
                        .append('g')
                        .attr('class', 'legend');

                    lrects = legend.append('rect')
                        .attr('width', 18)
                        .style('fill', function(d, i) { return cScale(i); });

                    ltexts = legend.append('text')
                        .attr('dy', '.35em')
                        .style('text-anchor', 'end')
                        .text(function(d) { return d; });
                }

                this.resize();
            },
            resize: TwoPassResize(container, params.margin, resize)
        };
    };
})
