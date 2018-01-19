/*
{
    root: {
        id: node_id, // optional
        type: 'text'|'vsplit'|'hsplit'|'shape'|'padding'
        alignlt: boolean
        alignrb: boolean
        clickable: boolean, // if id is set, optional

        // vsplit/hsplit types only
        subnodes: [
            ...
        ]

        // shape type only
        shape: 'rect'|'rrect'|'circle'
        subnode: node

        // text type only
        text: string
    },
    links: [
        {
            from: node_id,
            to: node_id,
            stroke: 'plain'|'dashed',
            from_marker: 'none'|'arrow',
            to_marker: 'none'|'arrow',
           [text: string]
        },
        ...
    ]
}
*/
define(['snap.svg'], function(Snap) {
    return function(container, params) {
        var paper = Snap();
        var arrow = paper.polygon([0,-2, 5,0, 0,2, 0,-2]).attr({fill: '#555'});
        var marker = arrow.marker(0,-2, 5,4, 2.5,0).attr('orient', 'auto-start-reverse');
        var diagram,
            top,
            links;
        var closestPoint = function(x1, y1, a1, b1, x2, y2, a2, b2) {
                var dmin = Infinity,
                    xt1, yt1,
                    xm1, ym1,
                    xt2, yt2,
                    xm2, ym2,
                    t1, t2,
                    n = 100;
                    r = 2*Math.PI/n;

                for (t1=0; t1 < n; t1++) {
                    xt1 = x1 + a1*Math.cos(t1*r);
                    yt1 = y1 + b1*Math.sin(t1*r);
                    for (t2=0; t2 < n; t2++) {
                        xt2 = x2 + a2*Math.cos(t2*r);
                        yt2 = y2 + b2*Math.sin(t2*r);
                        d = Math.hypot(xt2 - xt1, yt2 - yt1);
                        if (d < dmin) {
                            xm1 = xt1;
                            ym1 = yt1;
                            xm2 = xt2;
                            ym2 = yt2;
                            dmin = d;
                        }
                    }
                }

                return [[xm1, ym1], [xm2, ym2]];
            };
        var render = function() { // TODO: use fontsize parameter
                var factor = 10;//Math.min(width, height)/100;
                var nodeLUT = {};

                //paper.attr({width: width, height: height});

                top = paper.group().attr('font-family', 'condensed');

                var renderNode = function(node, parent, factor, depth) {
                    var group = paper.group().attr('font-size', factor*15),
                        margin = node.margin || factor*5,
                        fill,
                        bg = group;

                    parent.add(group); // group must be added to parent prior to BBox calculations

                    switch (node.type) {
                    case 'padding':
                        group.add(bg = paper.rect(margin, margin, factor*5, factor*5).attr('fill', 'none'));
                        break;
                    case 'text':
                        group.add(bg = paper.text(0, 0, node.text.replace(/_/g, ' ')).attr('text-anchor', 'middle'));
                        break;
                    case 'shape':
                        var ne = renderNode(node.subnode, group, factor*0.9, node.shape == 'rrect' ? depth+1 : depth),
                            bbox = ne.getBBox(),
                            width = bbox.width+2*margin,
                            height = bbox.height+2*margin,
                            attrs = {'stroke-width': '0.05em', stroke: '#000', fill: '#fff'},
                            radius;

                        switch (node.shape) {
                        case 'rect':
                            bg = paper.rect(bbox.x-margin, bbox.y-margin, width, height).attr(attrs);
                            break;
                        case 'rrect':
                            bg = paper.rect(bbox.x-margin, bbox.y-margin, width, height).attr({rx: '0.4em', ry: '0.4em', stroke: 'none', fill: 'hsl(210,60,'+(80-10*depth)+')'});
                            break;
                        case 'circle':
                            radius = height/2+'px';
                            bg = paper.rect(bbox.x-margin, bbox.y-margin, width, height).attr(attrs).attr({rx: radius, ry: radius});
                            break;
                        }
                        ne.prepend(bg);

                        break;
                    case 'hsplit':
                        var x = 0,
                            bbox;

                        node.subnodes.forEach(function(n) {
                            n.element = renderNode(n, group, factor, depth);
                            n.bbox = n.element.getBBox();
                            if (!bbox || n.bbox.height > bbox.height) {
                                bbox = n.bbox;
                            }
                        });
                        node.subnodes.forEach(function(n) {
                            n.element.transform('t'+(x-n.bbox.x)+','+((bbox.y-n.bbox.y)+(n.alignlt ? 0 : n.alignrb ? 2 : 1)*(bbox.height-n.bbox.height)/2));
                            x += n.bbox.width+margin;
                        });
                        break;
                    case 'vsplit':
                        var y = 0,
                            bbox;

                        node.subnodes.forEach(function(n) {
                            n.element = renderNode(n, group, factor, depth);
                            n.bbox = n.element.getBBox();
                            if (!bbox || n.bbox.width > bbox.width) {
                                bbox = n.bbox;
                            }
                        });
                        node.subnodes.forEach(function(n) {
                            n.element.transform('t'+((bbox.x-n.bbox.x)+(n.alignlt ? 0 : n.alignrb ? 2 : 1)*(bbox.width-n.bbox.width)/2)+','+(y-n.bbox.y));
                            y += n.bbox.height+margin;
                        });
                        break;
                    };

                    if (node.id) {
                        nodeLUT[node.id] = bg;
                        if (node.clickable) {
                            group.attr('cursor', 'pointer');
                            group.hover(function() {
                                fill = bg.attr().fill;
                                bg.attr('fill', '#fbb');
                            }, function() {
                                bg.attr('fill', fill);
                            });
                            group.click(function() {
                                window.parent.postMessage({type: 'click', data: node.id}, '*');
                            });
                        }
                    }

                    return group;
                };
                renderNode(diagram.root, top, factor, 0);

                // render links
                links = paper.group().appendTo(top);
                var linkNodes = function(node1, node2, params, tf) {
                        var bbox1 = node1.node.getBoundingClientRect(),
                            bbox2 = node2.node.getBoundingClientRect(),
                            hw1 = bbox1.width/2, hh1 = bbox1.height/2,
                            xc1 = bbox1.left+hw1, yc1 = bbox1.top+hh1,
                            hw2 = bbox2.width/2, hh2 = bbox2.height/2,
                            xc2 = bbox2.left+hw2, yc2 = bbox2.top+hh2,
                            line,
                            sw = Math.max(1, factor*1.5)*(params.width == 'double' ? 3 : 1),
                            dtf = 2.5*sw*(params.from_marker == 'arrow'), // stroke width * distance to center of marker
                            dtt = 2.5*sw*(params.to_marker == 'arrow'), // stroke width * distance to center of marker
                            angle,
                            rect1 = (node1.type == 'rect'),
                            rect2 = (node2.type == 'rect'),
                            circle1 = (node1.type == 'circle'),
                            circle2 = (node2.type == 'circle'),
                            sdx = xc2 > xc1 ? +1 : -1,
                            sdy = yc2 > yc1 ? +1 : -1;

                        if (xc1 == xc2) {
                            yc1 += sdy*(hh1+dtf);
                            yc2 += -sdy*(hh2+dtt);
                        } else if (yc1 == yc2) {
                            xc1 += sdx*(hw1+dtf);
                            xc2 += -sdx*(hw2+dtt);
                        } else {
                            var coords = closestPoint(xc1, yc1, hw1, hh1, xc2, yc2, hw2, hh2);
                            dx1 = node1.type == 'text' ? 0 : coords[0][0]-xc1;
                            dy1 = node1.type == 'text' ? 0 : coords[0][1]-yc1;
                            dx2 = node2.type == 'text' ? 0 : coords[1][0]-xc2;
                            dy2 = node2.type == 'text' ? 0 : coords[1][1]-yc2;

                            d = Math.abs((yc2+dy2-yc1-dy1)/(xc2+dx2-xc1-dx1));
                            angle = Math.atan(d);

                            dx1 = Math.abs(dx1);
                            dy1 = Math.abs(dy1);
                            dx2 = Math.abs(dx2);
                            dy2 = Math.abs(dy2);

                            var crct = true;
                            xc1 += (circle1 ? hw1*Math.cos(angle) : Math.min(hw1, dx1+crct*(hh1-dy1)/d)+dtf*Math.cos(angle))*(xc1 < xc2 ? 1 : -1);
                            yc1 += (circle1 ? hh1*Math.sin(angle) : Math.min(hh1, dy1+crct*(hw1-dx1)*d)+dtf*Math.sin(angle))*(yc1 < yc2 ? 1 : -1);
                            xc2 += (circle2 ? hw2*Math.cos(angle) : Math.min(hw2, dx2+crct*(hh2-dy2)/d)+dtt*Math.cos(angle))*(xc1 < xc2 ? -1 : 1);
                            yc2 += (circle2 ? hh2*Math.sin(angle) : Math.min(hh2, dy2+crct*(hw2-dx2)*d)+dtt*Math.sin(angle))*(yc1 < yc2 ? -1 : 1);
                        }

                        if (params.text) {
                            var text = paper.text(0, 0, params.text).attr({'font-size': 10*factor*tf}),
                                bbox = text.getBBox();

                            text.transform('t'+((xc1+xc2)/2-bbox.width/2)+','+((yc1+yc2)/2-bbox.height/2-bbox.y));
                            linkNodes(node1, text, {stroke: params.stroke, width: params.width, from_marker: params.from_marker}, tf*0.9);
                            linkNodes(text, node2, {stroke: params.stroke, width: params.width, to_marker: params.to_marker}, tf*0.9);
                            links.add(text);
                        } else {
                            line = paper.line(xc1, yc1, xc2, yc2).attr({stroke: '#555', 'stroke-width': sw});
                            if (params.stroke == 'dashed') {
                                line.attr('stroke-dasharray', sw+' '+sw);
                            }
                            if (params.from_marker == 'arrow') {
                                line.attr({markerStart: marker})
                            }
                            if (params.to_marker == 'arrow') {
                                line.attr({markerEnd: marker})
                            }
                            links.add(line);
                        }
                    };

                diagram.links.forEach(function(link) {
                    linkNodes(nodeLUT[link.from], nodeLUT[link.to], link, 1);
                });

                bbox = top.getBBox();
            };
        var bbox;

        return {
            update: function(diag) {
                diagram = diag;
                render();
                this.resize();
            },
            resize: function() {
                var cw = container.clientWidth, ch = container.clientHeight,
                    m = params.margin*Math.min(cw, ch),
                    bw = bbox.width,
                    bh = bbox.height,
                    scale = Math.min((cw-2*m)/bw, (ch-2*m)/bh);
                top.transform('translate('+((cw-(bw+2*bbox.x)*scale)/2)+','+((ch-(bh+2*bbox.y)*scale)/2)+') scale('+scale+')');
            }
         };
    };
});
