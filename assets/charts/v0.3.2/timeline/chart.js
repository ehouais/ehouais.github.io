define(['d3', 'timescale', 'twopassresize'], function(d3, Timescale, TwoPassResize) {
    return function(container, params) {
        var svg = d3.select('body').append('svg'),
            chart = svg.append('g'),
            tScale = d3.scaleTime(),
            yScale = d3.scaleBand(),
            cScale = d3.scaleOrdinal(d3.schemeCategory10),
            lines,
            titles,
            hticks,
            bars,
            rects,
            texts,
            formatDT = function(date) {
                return (new Date(date)).toLocaleDateString();
            },
            timescale = Timescale(chart, tScale),
            resize = function(left, top, width, height, fontsize) {
                var bwidth = yScale.bandwidth();

                svg
                    .attr('width', container.clientWidth)
                    .attr('height', container.clientHeight);

                chart
                    .attr('transform', 'translate('+left+','+top+')');

                tScale
                    .range([0, width]);

                timescale.redraw(width, height);

                yScale
                    .range([0, height])
                    .padding(0.7);

                lines
                    .attr('transform', function(d, i) { return 'translate(0,'+(yScale(i)+bwidth/2)+')'; });

                titles
                    .style('font-size', fontsize+'px')
                    .attr('x', -fontsize/2)
                    .attr('y', fontsize/4);

                hticks
                    .attr('x1', 0)
                    .attr('x2', width)
                    .attr('y1', 0)
                    .attr('y2', 0);

                rects
                    .attr('d', function(d) {
                        var x1 = tScale(d.start),
                            x2 = tScale(d.end),
                            x = tScale(d.datetime),
                            th = Math.max(Math.min(bwidth, 60), 8),
                            vh = -2*bwidth*d.value;

                        if (d.value) {
                            return 'M'+x1+' 0L'+x1+' '+vh+'L'+x2+' '+vh+'L'+x2+' 0Z';
                        } else if (x) {
                            return 'M'+x+' '+(-th/2)+'l'+(th/3)+' '+(th/2)+'l'+(-th/3)+' '+(th/2)+'l'+(-th/3)+' '+(-th/2)+'Z';
                        } else {
                            return 'M'+x1+' '+(-bwidth/2)+'L'+x2+' '+(-bwidth/2)+'L'+x2+' '+(bwidth/2)+'L'+x1+' '+(bwidth/2)+'Z';
                        }
                    })
                    .attr('stroke', function(d) { return d.datetime ? '#fff' : 'none'; });

                texts
                    .style('font-size', fontsize+'px')
                    .attr('x', function(d) { return tScale(d.start || d.datetime); })
                    .attr('y', function(d) {
                        return (d.value ? -2*bwidth*d.value : -bwidth/2)-fontsize/6;
                    })
                    .style('text-anchor', function(d) { return d.datetime ? 'middle' : 'start'; });

                return svg._groups[0][0].getBBox();
            };

        return {
            update: function(timelines) {
                var start,
                    end;

                if (timelines.viewbox) {
                    start = timelines.viewbox.start,
                    end = timelines.viewbox.end;
                } else {
                    start = +Infinity,
                    end = -Infinity;
                }

                timelines.timelines.forEach(function(timeline) {
                    var max = 0;

                    timeline.events.forEach(function(event, i) {
                        if (timelines.viewbox) {
                            if (event.datetime) {
                                if (event.datetime < start || event.datetime > end) {
                                    timeline.events.splice(i, 1);
                                }
                            } else if (event.start > end || event.end < start){
                                timeline.events.splice(i, 1);
                            } else {
                                event.start = Math.max(event.start, start);
                                event.end = Math.min(event.end, end);
                            }
                        } else {
                            start = Math.min(start, event.start || event.datetime);
                            end = Math.max(end, event.end || event.datetime);
                        }
                        if (event.value) {
                            max = Math.max(max, event.value);
                        }
                    });
                    if (max > 0) {
                        timeline.events.forEach(function(event) {
                            event.value /= max;
                        });
                    }
                });

                if (!timelines.viewbox) {
                    var delta = (end-start)/10;
                    start = new Date(start-delta);
                    end = new Date(end+delta);
                }

                tScale
                    .domain([start, end]);

                yScale
                    .domain(d3.range(timelines.timelines.length));

                lines = chart.append('g')   // lines container
                    .selectAll('g')         // lines
                    .data(timelines.timelines)
                    .enter()
                    .append('g')
                    .style('fill', function(d, i) { return cScale(i+1); });

                titles = lines.append('text')
                    .text(function(d) { return d.label; })
                    .style('text-anchor', 'end');

                hticks = lines.append('line')
                    .attr('class', 'hline')
                    .style('stroke', function(d, i) { return cScale(i+1); });

                bars = lines.selectAll('g')      // line events
                    .data(function(d) { return d.events; })
                    .enter()
                    .append('g')
                    .style('fill', function(d, i) { return d.start ? '' : cScale(0); });

                rects = bars.append('path');

                rects.append('title')
                    .text(function(event) { return event.start ? formatDT(event.start)+'-'+formatDT(event.end) : formatDT(event.datetime); });

                texts = bars.append('text')
                    .text(function(event) { return event.label; })
                    .style('fill', '#000');

                this.resize();
            },
            resize: TwoPassResize(container, params.margin, resize)
        };
    };
});
