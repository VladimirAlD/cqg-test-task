const path = require('path');

const HTMLWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ImageminPlugin = require('imagemin-webpack-plugin').default;

const isDev = process.env.NODE_ENV === 'development';
const isProd = !isDev;

const filename = ext => isDev ? `[name].${ext}` : `[name].[chunkhash].${ext}`;

const babelOptions = (preset) => {
  const opts = {
    presets: [
      ['@babel/preset-env', {
        // debug: true,
        corejs: 3,
        useBuiltIns: "usage",
        // targets:
        // 'defaults, not ie < 11, last 2 versions, > 1%, iOS 7, last 3 iOS versions',
      }]
    ],
  };

  if (preset) {
    opts.presets.push(preset);
  }

  return opts;
};

const plugins = () => {
  const base = [
    new HTMLWebpackPlugin({
      template: './index.html',
      templateParameters: {
        title: 'CQG test task'
      },
      minify: {
        collapseWhitespace: isProd
      }
    }),
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [{
          from: "./assets",
          to: "assets"
        },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: `./css/${filename('css')}`,
    }),
    new ImageminPlugin({
      disable: isDev, // Disable during development
      test: /\.(jpe?g|png|gif|svg)$/
    }),
  ];
  return base;
};

module.exports = {
  context: path.resolve(__dirname, 'src'),
  mode: 'development',
  entry: {
    main: ['whatwg-fetch',
      'core-js/features/promise',
      './index.js'
    ]
  },
  output: {
    filename: `./js/${filename('js')}`,
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    historyApiFallback: true,
    open: true,
    compress: true,
    port: 3000,
  },
  devtool: isDev ? 'source-map' : false,
  // This will enable CSS optimization only in production mode.
  optimization: {
    minimizer: [
      `...`,
      new CssMinimizerPlugin(),
    ],
  },
  resolve: {
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    }
  },
  plugins: plugins(),
  module: {
    rules: [
      // JavaScript
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: babelOptions()
        }
      },
      // TypeScript
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: babelOptions('@babel/preset-typescript')
        }
      },
      // CSS, PostCSS, Sass
      {
        test: /\.(css|s[ac]ss)$/,
        use: [
          // 'style-loader',
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              url: false
            }
          },
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [
                  [
                    "autoprefixer",
                    {
                      grid: true,
                    }
                  ]
                ],
                sourceMap: true
              }
            }
          },
          'resolve-url-loader',
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true
            }
          }
        ],
      },
      // изображения
      {
        test: /\.(?:ico|gif|png|jpg|jpeg)$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: `./img/${filename('[ext]')}`,
          }
        }]
      },
      // шрифты и SVG
      {
        test: /\.(woff(2)?|eot|ttf|otf|)$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: `./fonts/${filename('[ext]')}`,
          }
        }]
      },
      // SVG
      {
        test: /\.svg$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: `./assets/${filename('[ext]')}`,
          }
        }]
      },
    ]
  }
};