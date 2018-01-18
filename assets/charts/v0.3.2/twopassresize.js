define(function() {
    return function(container, margin, resize) {
        return function() {
            var width = container.clientWidth,
                height = container.clientHeight,
                fontsize = Math.max(Math.min(Math.min(width, height)/25, 20), 11),
                bbox = resize(0, 0, width, height, fontsize),
                absmargin = margin*Math.min(width, height);

            resize(
                -bbox.x+absmargin,
                -bbox.y+absmargin,
                2*width-bbox.width-2*absmargin,
                2*height-bbox.height-2*absmargin,
                fontsize
            );
        };
    }
});
