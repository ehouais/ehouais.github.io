define(['ui-utils'], function($) {
    return function($dom, params) {
        var $o = $.element('div', {}, {
                'position': 'absolute',
                'top': '0',
                'left': '0',
                'display': 'none',
                'width': '100%',
                'height': '100%',
                'margin': 'auto',
                'user-select': 'none',
                'z-index': '1000',
                'background-color': params['background-color'] || 'transparent'
            }),
            $i = $.element('div', {}, {
                'display': 'table-cell',
                'vertical-align': 'middle',
                'margin': 'auto'
            });

        $dom.style.margin = 'auto';
        $i.appendChild($dom);
        $o.appendChild($i);
        document.body.appendChild($o);

        return {
            show: function() { $o.style.display = 'table'; },
            hide: function() { $o.style.display = 'none'; }
        };
    };
});
