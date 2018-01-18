define(['d3'], function(d3) {
    return function(container, scale) {
        var minor = container.append('g')
                .attr('class', 'x axis minor'),
            mtAxis = d3.axisBottom()
                .scale(scale),
            mticks = minor.append('g'),
            mlAxis = d3.axisBottom()
                .scale(scale)
                .tickFormat(''),
            mlines = minor.append('g')
                .attr('class', 'lines'),
            major = container.append('g')
                .attr('class', 'x axis major'),
            MtAxis = d3.axisBottom()
                .scale(scale)
                .tickSize(20)
                .tickSizeOuter(0),
            Mticks = major.append('g'),
            MlAxis = d3.axisBottom()
                .scale(scale)
                .tickFormat(''),
            Mlines = major.append('g')
                .attr('class', 'lines'),
            nline = container.append('line')
                .attr('class', 'now'),
            findInterval = function (val, bounds) {
                var index = 0;
                while (bounds[index] && val < bounds[index]) index++;
                return index;
            };

        return {
            redraw: function(width, height) {
                var fs = Math.max(Math.min(Math.min(width, height)/20, 20), 11);
                    domain = scale.domain(),
                    start = domain[0],
                    end = domain[1],
                    mode = findInterval(
                        (end-start)/(24*60*60*1000)*fs/12/width,
                        [30, 14, 5, 2, 0.6, 0.3, 0.06, 0.04, 0.02, 0.01, 0.002, 0.001, 0.0004, 0.00024]
                    ),
                    ticks = [ // major interval, major format, minor interval, nb. intervals, minor format
                        [  'Year', 100,       '%Y',   'Year', 10,     '\'%y'],
                        [    null,   1,       null,   'Year',  1,     '\'%y'],
                        [    null,   1,       null,   'Year',  1,       '%Y'],
                        [  'Year',   1,       '%Y',  'Month',  3,       '%b'],
                        [  'Year',   1,       '%Y',  'Month',  1,       '%b'],
                        [  'Year',   1,       '%Y',  'Month',  1,       '%B'],
                        [ 'Month',   1,    '%B %Y', 'Monday',  1,       '%d'],
                        ['Monday',   1, '%d/%m/%Y',    'Day',  1,         ''],
                        ['Monday',   1, '%d/%m/%Y',    'Day',  1,       '%a'],
                        ['Monday',   1,         '',    'Day',  1, '%a %d/%m'],
                        [   'Day',   1, '%a %d/%m',   'Hour',  6,      '%Hh'],
                        [   'Day',   1, '%a %d/%m',   'Hour',  1,      '%Hh'],
                        [  'Hour',   1,      '%Hh', 'Minute', 30,       '%M'],
                        [  'Hour',   1,      '%Hh', 'Minute', 10,       '%M'],
                        [  'Hour',   1,      '%Hh', 'Minute',  5,       '%M'],
                    ][mode],
                    now = Date.now();

                var interval,
                    now = Date.now();

                if (now > start && now < end) {
                    nline.attr('y1', 0);
                }

                major.style('display', ticks[0] ? 'block' : 'none');
                if (ticks[0]) {
                    interval = d3['time'+ticks[0]];
                    MtAxis
                        .ticks(interval, ticks[1])
                        .tickFormat(d3.timeFormat(ticks[2]));

                    Mticks
                        .attr('transform', 'translate(0,' + height + ')')
                        .call(MtAxis)
                        .selectAll('.tick text')
                        .style('font-size', Math.max(fs*0.7, 11)+'px')
                        .style('text-anchor', 'start')
                        .attr('x', 2)
                        .attr('y', 15);

                    MlAxis
                        .ticks(interval, ticks[1])
                        .tickSize(-height, 0);

                    Mlines
                        .attr('transform', 'translate(0,' + height + ')')
                        .call(MlAxis);
                }

                interval = d3['time'+ticks[3]];
                mtAxis
                    .ticks(interval, ticks[4])
                    .tickFormat(d3.timeFormat(ticks[5]));

                mticks
                    .attr('transform', 'translate(0,' + height + ')')
                    .call(mtAxis)
                    .selectAll('.tick text')
                    .style('font-size', Math.max(fs*0.6, 10)+'px')
                    .style('text-anchor', 'start')
                    .attr('x', 2)
                    .attr('y', 4);

                mlAxis
                    .ticks(interval, ticks[4])
                    .tickSize(-height, 0);

                mlines
                    .attr('transform', 'translate(0,' + height + ')')
                    .call(mlAxis);

                if (start <= now && now <= end) {
                    xnow = scale(now);
                    nline
                        .attr('x1', xnow)
                        .attr('x2', xnow)
                        .attr('y1', 0)
                        .attr('y2', height);
                    nline.style.display = 'inherit';
                } else {
                    nline.style.display = 'none';
                }
            }
        }
    }
});
