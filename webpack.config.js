const path = require("path")
const nodeExternals = require("webpack-node-externals")

module.exports = {
    entry: {
        "server": "./server.ts",
    },
    target: "node",
    externals: [nodeExternals()],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: {
                    loader: "ts-loader",
                    options: {
                        configFile: "./tsconfig.json",
                    },
                },
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
        alias: {
            "@": path.resolve(__dirname, ""),
        },
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",
        libraryTarget: "module",  // 指定输出为 ES 模块
        chunkFormat: "module",    // 指定 chunk 格式为 module
    },
    experiments: {
        outputModule: true,  // 启用 ES 模块输出
    },
};
