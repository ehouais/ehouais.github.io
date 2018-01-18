define(['ui-utils'], function($) {
    return function($dom, params, cbs) {
        var data = {},
            $fields = $.element('div'),
            $buttons = $.element('div'),
            $hiddens = $.element('div'),
            $submit,
            id;

        for (id in params.fields) {
            $field = $.element('input', {type: 'text', placeholder: params.fields[id]});
            $field.dataset.id = id;
            $fields.appendChild($field);
        }

        for (id in params.buttons) {
            $button = $.element('button');
            $button.dataset.id = id;
            $button.textContent = params.buttons[id];
            $buttons.appendChild($button);
        }

        for (id in params.hidden) {
            $hidden = $.element('input', {type: 'hidden', value: params.hidden[id]});
            $hidden.dataset.id = id;
            $hiddens.appendChild($hidden);
        }

        $submit = $.element('button');
        $submit.textContent = 'Submit';
        $buttons.appendChild($submit);
        $dom.addEventListener('click', $.delegate('button', function(e) {
            var id = this.dataset.id,
                data = $.selectAll('input', $dom).reduce(function(data, $node) {
                    data[$node.dataset.id] = $node.value;
                    return data;
                }, {});

            (cbs.hasOwnProperty(id) ? cbs[id] : cbs)(data);
        }));

        $dom.appendChild($fields);
        $dom.appendChild($buttons);
        $dom.appendChild($hiddens);

        return function(data) {
            $.selectAll('input', $dom).forEach(function($node) {
                var value = data[$node.dataset.id];
                $node.value = typeof value == 'undefined' ? '' : value;
            });
        };
    };
});
