(function () {
    'use strict';

    const STORAGE_KEY = 'app-panel-history';
    var currentUrl = '';
    var currentLabel = '';
    var currentDescription = '';
    var encodedCurrentIcon = '';
    var currentIcon = '';

    if (document.body && document.body.dataset) {
        currentUrl = document.body.dataset.panelRouteUrl || '';
        currentLabel = document.body.dataset.panelRouteLabel || '';
        currentDescription = document.body.dataset.panelRouteDescription || '';
        encodedCurrentIcon = document.body.dataset.panelRouteIcon || '';

        if (encodedCurrentIcon !== '') {
            try {
                currentIcon = window.atob(encodedCurrentIcon);
            } catch (_error) {
                currentIcon = '';
            }
        }
    }

    if (currentUrl !== '' && currentLabel !== '') {
        var storedRaw;
        var historyList;

        try {
            storedRaw = window.sessionStorage.getItem(STORAGE_KEY);
            historyList = storedRaw !== null ? JSON.parse(storedRaw) : [];
        } catch (_) {
            historyList = [];
        }

        if (!Array.isArray(historyList)) {
            historyList = [];
        }

        historyList = historyList.filter(function (item) {
            return item !== null
                && typeof item === 'object'
                && typeof item.url === 'string'
                && typeof item.label === 'string'
                && item.url !== ''
                && item.label !== '';
        });

        historyList = historyList.filter(function (item) {
            return item.url !== currentUrl;
        });

        historyList = historyList.map(function (item) {
            return {
                url: item.url,
                label: item.label,
                description: typeof item.description === 'string'
                    ? item.description
                    : '',
                icon: typeof item.icon === 'string'
                    ? item.icon
                    : ''
            };
        });

        historyList.push({
            url: currentUrl,
            label: currentLabel,
            description: currentDescription,
            icon: currentIcon
        });

        historyList = historyList.slice(-8);

        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(historyList));

        var historyContainer = document.querySelector('.panel-topbar-history');

        if (historyContainer instanceof HTMLElement
            && Array.isArray(historyList)
            && historyList.length > 0) {

            while (historyContainer.firstChild) {
                historyContainer.removeChild(historyContainer.firstChild);
            }

            var nav = document.createElement('nav');
            nav.className = 'panel-history-breadcrumbs';
            nav.setAttribute('aria-label', 'Page history');

            var ol = document.createElement('ol');

            for (var i = 0; i < historyList.length; i++) {
                var item = historyList[i];
                var isCurrent = i === historyList.length - 1;

                var li = document.createElement('li');

                if (!isCurrent) {
                    var a = document.createElement('a');
                    a.href = item.url;

                    var icon = createHistoryIcon(item.icon);

                    if (icon !== null) {
                        a.appendChild(icon);
                    }

                    a.appendChild(document.createTextNode(item.label));

                    if (item.description !== '' && typeof item.description !== 'undefined') {
                        a.setAttribute('title', item.description);
                    }

                    li.appendChild(a);
                } else {
                    var icon = createHistoryIcon(item.icon);

                    if (icon !== null) {
                        li.appendChild(icon);
                    }

                    li.appendChild(document.createTextNode(item.label));
                    li.setAttribute('aria-current', 'page');

                    if (item.description !== '' && typeof item.description !== 'undefined') {
                        li.setAttribute('title', item.description);
                    }
                }

                ol.append(li);
            }

            nav.append(ol);
            historyContainer.append(nav);
        }
    }
    const themeToggle = document.getElementById('app-theme-toggle');
    const themeMenu   = document.getElementById('app-theme-menu');

    const sidebarToggle  = document.getElementById('sidebar-toggle');
    const sidebar        = document.getElementById('panel-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const panelMain      = document.getElementById('panel-main');

    if (sidebarToggle instanceof HTMLButtonElement
        && sidebar instanceof HTMLElement
        && panelMain instanceof HTMLElement) {
        sidebarToggle.addEventListener('click', function () {
            if (window.matchMedia('(min-width: 992px)').matches) {
                const isCollapsed = sidebar.classList.toggle('collapsed');
                panelMain.classList.toggle('expanded', isCollapsed);
                sidebarToggle.setAttribute('aria-expanded', String(!isCollapsed));
                return;
            }

            if (!(sidebarOverlay instanceof HTMLElement)) return;

            const isOpen = sidebar.classList.toggle('open');
            sidebarOverlay.classList.toggle('visible', isOpen);
            sidebarToggle.setAttribute('aria-expanded', String(isOpen));
        });
    }

    if (sidebarOverlay instanceof HTMLElement
        && sidebar instanceof HTMLElement
        && sidebarToggle instanceof HTMLButtonElement) {
        sidebarOverlay.addEventListener('click', function () {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('visible');
            sidebarToggle.setAttribute('aria-expanded', 'false');
            sidebarToggle.focus();
        });
    }

    const sidebarMediaQuery = window.matchMedia('(min-width: 992px)');

    if (sidebarOverlay instanceof HTMLElement
        && sidebar instanceof HTMLElement
        && panelMain instanceof HTMLElement
        && sidebarToggle instanceof HTMLButtonElement) {
        sidebarMediaQuery.addEventListener('change', function () {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('visible');
            sidebar.classList.remove('collapsed');
            panelMain.classList.remove('expanded');
            sidebarToggle.setAttribute('aria-expanded', 'true');
        });
    }

    if (!(themeToggle instanceof HTMLButtonElement)
        || !(themeMenu instanceof HTMLUListElement)) {
        return;
    }

    const themeOptions = themeMenu.querySelectorAll('.panel-theme-option');

    function updateThemeOptions(theme) {
        Array.from(themeOptions).forEach(function (option) {
            var isActive = option.dataset.themeValue === theme;
            option.classList.toggle('active', isActive);
            option.setAttribute('aria-pressed', String(isActive));
        });
    }

    function applyTheme(theme) {
        const resolvedTheme = theme === 'auto'
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : theme;

        document.documentElement.setAttribute('data-app-theme', resolvedTheme);
    }

    const savedTheme = window.localStorage.getItem('app-theme');

    if (savedTheme === 'dark'
        || savedTheme === 'light'
        || savedTheme === 'auto') {
        applyTheme(savedTheme);
        updateThemeOptions(savedTheme);
    } else {
        applyTheme('auto');
        updateThemeOptions('auto');
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
        var current = window.localStorage.getItem('app-theme');
        if (current === 'auto') {
            applyTheme('auto');
        }
    });

    themeToggle.addEventListener('click', function () {
        const isHidden = themeMenu.hidden;
        themeMenu.hidden = !isHidden;
        themeToggle.setAttribute('aria-expanded', String(!isHidden));
    });

    Array.from(themeOptions).forEach(function (option) {
        option.addEventListener('click', function () {
            var value = option.dataset.themeValue;
            if (value !== 'dark' && value !== 'light' && value !== 'auto') return;

            applyTheme(value);
            updateThemeOptions(value);
            window.localStorage.setItem('app-theme', value);
            themeMenu.hidden = true;
            themeToggle.setAttribute('aria-expanded', 'false');
        });
    });

    document.addEventListener('click', function (evt) {
        if (!(evt.target instanceof Node)) return;
        if (!themeToggle.contains(evt.target)
            && !themeMenu.contains(evt.target)) {
            themeMenu.hidden = true;
            themeToggle.setAttribute('aria-expanded', 'false');
        }
    });

    document.addEventListener('keydown', function (evt) {
        if (evt.key !== 'Escape') return;
        themeMenu.hidden = true;
        themeToggle.setAttribute('aria-expanded', 'false');
        themeToggle.focus();
    });

    function createHistoryIcon(icon) {
        if (typeof icon !== 'string') {
            return null;
        }

        const value = icon.trim();

        if (!value.startsWith('<svg') || !value.endsWith('</svg>')) {
            return null;
        }

        const template = document.createElement('template');
        template.innerHTML = value;

        const svg = template.content.firstElementChild;

        if (!(svg instanceof SVGElement)
            || svg.tagName.toLowerCase() !== 'svg') {
            return null;
        }

        const wrapper = document.createElement('span');
        wrapper.className = 'panel-history-breadcrumb-icon';
        wrapper.setAttribute('aria-hidden', 'true');
        wrapper.append(svg);

        return wrapper;
    }

}());
