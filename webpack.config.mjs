import path from "path";


export default {
    entry: "./src/main/webapp/js/chattingPage.mjs",
    output: {
        filename: "bundle.js",
        path: path.resolve("src/main/webapp/js"),
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"],
                    },
                },
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            }
        ],
    },
    mode: "development", // 배포시 production 으로 전환.
    experiments: {
        outputModule: true
    }
};