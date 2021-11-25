module.exports = {
    transpileDependencies: ["vuetify"],
    publicPath: "", // use relative path
    pwa: {
        name: "MCBEID表",
        manifestOptions: {
            id: "/idlist/",
            icons: [
                {
                    src: "./img/favicon-192x192.png",
                    sizes: "192x192",
                    type: "image/png"
                },
                {
                    src: "./img/favicon-512x512.png",
                    sizes: "512x512",
                    type: "image/png"
                }
            ]
        },
        iconPaths: {
            favicon32: "./img/favicon-32x32.png",
            favicon16: "./img/favicon-16x16.png",
            appleTouchIcon: "./img/favicon-152x152.png",
            maskIcon: null,
            msTileImage: "./img/favicon-144x144.png"
        },
        workboxPluginMode: "GenerateSW",
        workboxOptions: {
            exclude: [/latest(\.\S+)?\.zip$/, /\.(js|css)\.map$/i],
            runtimeCaching: [
                {
                    urlPattern: new RegExp("^https://fonts.googleapis.com/"),
                    handler: "staleWhileRevalidate",
                    options: {
                        cacheName: "google-fonts-stylesheets"
                    }
                },
                {
                    urlPattern: new RegExp("^https://fonts.gstatic.com/"),
                    handler: "cacheFirst",
                    options: {
                        cacheName: "google-fonts-webfonts",
                        cacheableResponse: {
                            statuses: [0, 200]
                        },
                        expiration: {
                            maxAgeSeconds: 60 * 60 * 24 * 365,
                            maxEntries: 30
                        }
                    }
                },
                {
                    urlPattern: "https://cdn.jsdelivr.net/npm/@mdi/font@latest/css/materialdesignicons.min.css",
                    handler: "staleWhileRevalidate",
                    options: {
                        cacheName: "material-design-icons-stylesheets"
                    }
                },
                {
                    urlPattern: new RegExp("^https://cdn.jsdelivr.net/npm/@mdi/font@latest/fonts/"),
                    handler: "cacheFirst",
                    options: {
                        cacheName: "material-design-icons-webfonts",
                        cacheableResponse: {
                            statuses: [0, 200]
                        },
                        expiration: {
                            maxAgeSeconds: 60 * 60 * 24 * 365,
                            maxEntries: 30
                        }
                    }
                }
            ]
        }
    }
};
