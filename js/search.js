const EventEmitter = require('events')
var webviews = require('webviews.js')
var urlParser = require('util/urlParser.js')
var searchbarPlugins = require('searchbar/searchbarPlugins.js')
var settings = require('util/settings.js')

var nextalSearch = {
    el: document.getElementById('nextal-search-input'),
    favoritesGrid: document.getElementById('nextal-favorites-grid'),
    events: new EventEmitter(),
    
    initialize: function() {
        nextalSearch.setupSearchBar()
        nextalSearch.loadRecentSites()
    },

    setupSearchBar: function() {
        nextalSearch.el.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault()
                const query = nextalSearch.el.value.trim()
                if (query) {
                    nextalSearch.handleSearch(query, e)
                }
            }
        })
    },

    loadRecentSites: function() {
        const recentSites = settings.get('recentSites') || []
        nextalSearch.favoritesGrid.innerHTML = ''

        recentSites.slice(0, 8).forEach(site => {
            const siteElement = document.createElement('div')
            siteElement.className = 'favorite-site'
            siteElement.innerHTML = `
                <div class="site-icon">
                    <img src="${site.favicon || 'default-favicon.png'}" alt="${site.title}">
                </div>
                <div class="site-title">${site.title}</div>
            `
            siteElement.addEventListener('click', () => {
                nextalSearch.handleSearch(site.url)
            })
            nextalSearch.favoritesGrid.appendChild(siteElement)
        })
    },

    handleSearch: function(url, event) {
        if (!urlParser.isPossibleURL(url)) {
            url = `https://www.google.com/search?q=${encodeURIComponent(url)}`
        } else if (!url.startsWith('http')) {
            url = 'https://' + url
        }

        nextalSearch.events.emit('url-selected', { url: url, background: false })
        webviews.focus()

        // Sauvegarder le site dans l'historique récent
        nextalSearch.updateRecentSites(url)
    },

    updateRecentSites: function(url) {
        let recentSites = settings.get('recentSites') || []
        const newSite = {
            url: url,
            title: url.split('/')[2] || url,
            favicon: `https://www.google.com/s2/favicons?domain=${url}`,
            timestamp: Date.now()
        }

        recentSites = [newSite, ...recentSites.filter(site => site.url !== url)]
        recentSites = recentSites.slice(0, 8)
        settings.set('recentSites', recentSites)
        nextalSearch.loadRecentSites()
    }
}

nextalSearch.events.on('url-selected', function(data) {
    webviews.update(data.url)
})

nextalSearch.initialize()

module.exports = nextalSearch