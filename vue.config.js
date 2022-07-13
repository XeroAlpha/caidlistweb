const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
    transpileDependencies: true,

    // use relative path
    publicPath: "",

    configureWebpack: {
        devtool: "source-map"
    },

    pwa: {
        name: "MCBEID表",
        themeColor: "#ffffff",
        msTileColor: "#ffffff",
        appleMobileWebAppCapable: "yes",
        appleMobileWebAppStatusBarStyle: "black",
        manifestOptions: {
            id: "/idlist/",
            description: "一款可以查询 Minecraft 基岩版命令相关ID的网站。",
            lang: "zh-CN",
            categories: ["games", "utilities"],
            background_color: "#ffffff",
            icons: [
                {
                    src: "./img/icon-96x96.png",
                    sizes: "96x96",
                    type: "image/png",
                    purpose: "any"
                },
                {
                    src: "./img/icon-maskable-96x96.png",
                    sizes: "96x96",
                    type: "image/png",
                    purpose: "maskable"
                },
                {
                    src: "./img/icon-192x192.png",
                    sizes: "192x192",
                    type: "image/png",
                    purpose: "any"
                },
                {
                    src: "./img/icon-maskable-192x192.png",
                    sizes: "192x192",
                    type: "image/png",
                    purpose: "maskable"
                },
                {
                    src: "./img/icon-384x384.png",
                    sizes: "384x384",
                    type: "image/png",
                    purpose: "any"
                },
                {
                    src: "./img/icon-maskable-384x384.png",
                    sizes: "384x384",
                    type: "image/png",
                    purpose: "maskable"
                },
                {
                    src: "./img/icon-512x512.png",
                    sizes: "512x512",
                    type: "image/png",
                    purpose: "any"
                },
                {
                    src: "./img/icon-maskable-512x512.png",
                    sizes: "512x512",
                    type: "image/png",
                    purpose: "maskable"
                },
                {
                    src: "./img/icon-1024x1024.png",
                    sizes: "1024x1024",
                    type: "image/png",
                    purpose: "any"
                },
                {
                    src: "./img/icon-maskable-1024x1024.png",
                    sizes: "1024x1024",
                    type: "image/png",
                    purpose: "maskable"
                }
            ],
            shortcuts: [
                {
                    name: "查询ID",
                    url: "./#beta-vanilla/global/",
                    icons: [
                        {
                            src: "./img/icon-96x96.png",
                            sizes: "96x96",
                            type: "image/png",
                            purpose: "any"
                        },
                        {
                            src: "./img/icon-maskable-96x96.png",
                            sizes: "96x96",
                            type: "image/png",
                            purpose: "maskable"
                        }
                    ]
                },
                {
                    name: "查询译名",
                    url: "./#beta-translator/global/",
                    icons: [
                        {
                            src: "./img/icon-96x96.png",
                            sizes: "96x96",
                            type: "image/png",
                            purpose: "any"
                        },
                        {
                            src: "./img/icon-maskable-96x96.png",
                            sizes: "96x96",
                            type: "image/png",
                            purpose: "maskable"
                        }
                    ]
                }
            ]
        },
        iconPaths: {
            faviconSVG: null,
            favicon32: "./img/favicon-32x32.png",
            favicon16: "./img/favicon-16x16.png",
            appleTouchIcon: "./img/apple-touch-icon-152x152.png",
            maskIcon: null,
            msTileImage: "./img/msapplication-icon-144x144.png"
        },
        workboxPluginMode: "GenerateSW",
        workboxOptions: {
            exclude: [/\.(js|css)\.map$/i, /\.zip/i, /data\/(.*)index.json/i]
        }
    },

    css: {
        sourceMap: true
    }
});
