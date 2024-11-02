const path = require("path");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const InlineChunkHtmlPlugin = require("react-dev-utils/InlineChunkHtmlPlugin");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const { keys } = require("lodash");

const paths = require("../helpers/paths");
const { isEnvProduction, isEnvDevelopment, shouldUseSourceMap } = require("../helpers/environment");
const { emptyOr } = require("../helpers/utils");
const rebuiltronConfig = require("../rebuiltronConfig");
const baseConfig = require("./base");
const imageLoaders = require("../loaders/images");
const styleLoaders = require("../loaders/style");
const javascriptLoaders = require("../loaders/javascript");


const { renderers } = require(paths.appConfig);


module.exports = {
	...baseConfig,
	mode: isEnvProduction ? "production" : "development",
	target: "browserslist",
	devtool: shouldUseSourceMap && (isEnvProduction ? "source-map" : "cheap-module-source-map"),
	entry: renderers,
	output: {
		...baseConfig.output,
		filename: `${rebuiltronConfig.buildDirs.js}/${isEnvProduction ? "[name].[contenthash:8].js" : "[name].bundle.js"}`,
		chunkFilename: `${rebuiltronConfig.buildDirs.js}/${isEnvProduction ? "[name].[contenthash:8].chunk.js" : "[name].chunk.js"}`,
		assetModuleFilename: `${rebuiltronConfig.buildDirs.media}/[name].[hash][ext]`
	},
	optimization: {
		...baseConfig.optimization,
		minimizer: [
			...baseConfig.optimization.minimizer,
			new CssMinimizerPlugin()
		]
	},
	module: {
		...baseConfig.module,
		rules: [
			// Handles `node_modules` packages that contain sourcemaps
			...emptyOr(shouldUseSourceMap, [{
				enforce: "pre",
				exclude: /@babel(?:\/|\\{1,2})runtime/,
				test: /\.(js|mjs|jsx|ts|tsx|css)$/,
				loader: require.resolve("source-map-loader")
			}]),
			{
				oneOf: [
					...imageLoaders,
					...javascriptLoaders,
					...styleLoaders,
					{
						// Makes sure the assets get served by `WebpackDevServer`
						exclude: [/^$/, /\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
						type: "asset/resource"
					}
				]
			},
			{
				test: [/src\/renderers\/app\/components\/common\/index.js/i],
				sideEffects: false
			}
		]
	},
	plugins: [
		...baseConfig.plugins,
		...emptyOr(isEnvProduction, [
			new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime-.+[.]js/]), // Injects scripts into HTML
			new MiniCssExtractPlugin({
				filename: `${rebuiltronConfig.buildDirs.css}/[name].[contenthash:8].css`,
				chunkFilename: `${rebuiltronConfig.buildDirs.css}/[name].[contenthash:8].chunk.css`
			}),
			new CopyPlugin({
				patterns: [{
					from: paths.appPublic,
					to: paths.appBuild,
					globOptions: {
						ignore: ["**/*.html"]
					}
				}]
			})
		]),
		...emptyOr(isEnvDevelopment, [
			new ReactRefreshWebpackPlugin({ overlay: false })
		]),
		...keys(renderers).map((renderer) => (
			new HtmlWebpackPlugin({
				inject: true,
				template: path.join(paths.appPublic, `${renderer}.html`),
				filename: `${renderer}.html`,
				chunks: [renderer],
				...emptyOr(isEnvProduction, {
					minify: {
						removeComments: true,
						collapseWhitespace: true,
						removeRedundantAttributes: true,
						useShortDoctype: true,
						removeEmptyAttributes: true,
						removeStyleLinkTypeAttributes: true,
						keepClosingSlash: true,
						minifyJS: true,
						minifyCSS: true,
						minifyURLs: true
					}
				})
			})
		))
	]
};