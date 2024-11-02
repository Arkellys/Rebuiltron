const paths = require("../helpers/paths");
const { shouldUseSourceMap, isEnvProduction } = require("../helpers/environment");


module.exports = [
	{
		test: /\.(js|jsx)$/,
		exclude: [paths.appNodeModules],
		use: {
			loader: require.resolve("swc-loader"),
			options: {
				jsc: {
					experimental: {
						plugins: [
							["@swc/plugin-transform-imports", {
								lodash: {
									transform: "lodash/{{member}}"
								}
							}]
						]
					},
					parser: {
						syntax: "ecmascript",
						jsx: true,
						dynamicImport: true
					},
					transform: {
						react: {
							refresh: true,
							runtime: "automatic"
						}
					}
				},
				minify: isEnvProduction,
				sourceMaps: shouldUseSourceMap
			}
		},
		resolve: {
			fullySpecified: false // Allows extensions not to be specified on import
		}
	}
];