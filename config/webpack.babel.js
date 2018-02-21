import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import HtmlWebpackInlineSourcePlugin from 'html-webpack-inline-source-plugin';
import ClosureCompilerPlugin from 'webpack-closure-compiler';
import DontEmitPlugin from './plugins/dont-emit-plugin';
import {markCallback, sweep} from './plugins/mas-config-webpack-plugin';
import {setEnv, ifInline, ifDist, ifDev, nix} from './mas-helpers';
import {root} from './helpers';

module.exports = function(env) {

    setEnv(env);

    // plugin options
    const opt = {
        htmlWebpack: {
            template: 'src/index.html',
            inlineSource: ifInline('.(js)$'),
            minify: ifDist({
                collapseWhitespace: true,
                minifyCSS: true,
                removeComments: true
            })
        },
        loaderOptions: {
            htmlLoader: {
                minimize: true
            }
        },
        dontEmit: {
            patterns: [/\.js$/]
        },
        closureCompiler: {
            compiler: {
                language_in: 'ECMASCRIPT6',
                language_out: 'ECMASCRIPT5',
                compilation_level: 'SIMPLE_OPTIMIZATIONS'
            },
            concurrency: 4,
        }
    };

    const config = {
        devtool: ifDev('source-map'),

        resolve: {
            extensions: ['.ts', '.js']
        },

        entry: {
            'app': './src/main.ts'
        },

        output: {
            path: root('dist'),
            publicPath: '/',
            filename: '[name].[hash].js',
            chunkFilename: '[id].[hash].chunk.js'
        },

        module: {
            rules: [
                {
                    test: /\.ts$/,
                    loaders: [
                        {
                            loader: 'awesome-typescript-loader',
                            options: { configFileName: root('config', 'tsconfig.json') }
                        }
                    ]
                },
                {
                    test: /\.html$/,
                    loader: 'html-loader'
                },
            ]
        },

        plugins: [
            htmlWebpackPlugin(opt.htmlWebpack),

            webpackNoEmitOnErrorsPlugin(),

            webpackLoaderOptionsPlugin(opt.loaderOptions),

            ifInline(htmlWebpackInlineSourcePlugin()),

            ifDist(dontEmitPlugin(opt.dontEmit)),

            ifDist(closureCompilerPlugin(opt.closureCompiler))
        ]
    };

    return sweep(config);
};

function closureCompilerPlugin(options) {
    return markCallback((x) => new ClosureCompilerPlugin(x), options);
}

function dontEmitPlugin(options) {
    return markCallback((x) => new DontEmitPlugin(x), options);
}

function htmlWebpackPlugin(options) {
    return markCallback((x) => new HtmlWebpackPlugin(x), options);
}

function webpackNoEmitOnErrorsPlugin() {
    return markCallback((x) => new webpack.NoEmitOnErrorsPlugin(x));
}

function webpackLoaderOptionsPlugin(options) {
    return markCallback((x) => new webpack.LoaderOptionsPlugin(x), options);
}

function htmlWebpackInlineSourcePlugin() {
    return markCallback((x) => new HtmlWebpackInlineSourcePlugin(x));
}
