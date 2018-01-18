define(['ui-utils'], function($) {
    return {
        update: function(data) {
            var tabTpl = function(tab) {
                    return $.element('li', {class: 'tab', uri: tab.uri, textContent: tab.label});
                },
                tabs = $.element('ul', {class: 'tabs'}),
                tabpaneTpl = function(tab) {
                    var div = $.element('div', {class: 'tabpane', uri: tab.uri});
                    div.appendChild($.element('iframe'));
                    return div;
                },
                tabpanes = $.element('div', {class: 'tabpanes'}),
                activate = function(tab) {
                    var uri = tab.getAttribute('uri'),
                        tabpane = $.select('[uri="'+uri+'"]', tabpanes)
                        iframe = $.select('iframe', tabpane),
                        activeTab = $.select('.active', tabs),
                        activeTabpane = $.select('.active', tabpanes);

                    if (!iframe.hasAttribute('src')) iframe.setAttribute('src', uri);
                    activeTab && activeTab.classList.remove('active');
                    tab.classList.add('active');
                    tab.classList.add('loaded');
                    activeTabpane && activeTabpane.classList.remove('active');
                    tabpane.classList.add('active');
                };

            document.body.appendChild(tabs);
            document.body.appendChild(tabpanes);

            tabs.addEventListener('click', $.delegate('.tab', function(e) {
                activate(e.target);
                e.preventDefault();
            }));

            var link;

            $.toNodes(tabs, tabTpl)(data.tabs);
            $.toNodes(tabpanes, tabpaneTpl)(data.tabs);
            if (data.favicon) {
                link = document.createElement('link');
                link.type = 'image/png';
                link.rel = 'icon';
                link.href = data.favicon;
                document.head.appendChild(link);
            }
            if (data.deftab !== undefined) {
                activate($.select('[uri="'+data.tabs[data.deftab].uri+'"]', tabs));
            }
        }
    };
});
