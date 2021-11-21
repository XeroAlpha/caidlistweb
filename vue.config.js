module.exports = {
    transpileDependencies: ["vuetify"],
    publicPath: "", // use relative path
    pwa: {
        name: "MCBEID表",
        manifestOptions: {
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
            exclude: [ /latest(\.\S+)?\.zip$/, /\.(js|css)\.map$/i ]
        }
    }
};
