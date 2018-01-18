define(['tablesort'], function(Tablesort) {
    return {
        update: function(data) {
            var $table = document.createElement('table'),
                $tbody = document.createElement('tbody'),
                $row = function(row, header) {
                    return row.reduce(function($tr, value) {
                        var $td = document.createElement(header ? 'th' : 'td');
                        $td.textContent = value;
                        $tr.appendChild($td);
                        return $tr;
                    }, document.createElement('tr'))
                };

            if (data.cols) {
                $table.appendChild($row(data.cols.map(function(col) {
                    return col.label;
                }), true));
                data = data.rows;
            }
            data.forEach(function(row) {
                $tbody.appendChild($row(row));
            });
            $table.appendChild($tbody);
            document.body.innerHTML = '';
            document.body.appendChild($table);
            new Tablesort($table);
        }
    };
});
