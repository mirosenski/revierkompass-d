export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // Zusätzliche moderne PostCSS Plugins für optimale Performance
    ...(process.env.NODE_ENV === 'production' ? {
      cssnano: {
        preset: ['default', {
          discardComments: {
            removeAll: true,
          },
          normalizeWhitespace: true,
          colormin: true,
          convertValues: true,
          minifyFontValues: true,
          minifyGradients: true,
          minifyParams: true,
          minifySelectors: true,
          minifyUrls: true,
          normalizeCharset: true,
          normalizeDisplayValues: true,
          normalizePositions: true,
          normalizeRepeatStyle: true,
          normalizeString: true,
          normalizeTimingFunctions: true,
          normalizeUnicode: true,
          normalizeUrl: true,
          orderedValues: true,
          reduceIdents: true,
          reduceInitial: true,
          reduceTransforms: true,
          svgo: true,
          uniqueSelectors: true,
        }],
      },
      // PostCSS Import für bessere Modularität
      'postcss-import': {},
      // PostCSS Preset Env für moderne CSS Features
      'postcss-preset-env': {
        stage: 3,
        features: {
          'nesting-rules': true,
          'custom-properties': true,
          'custom-media-queries': true,
          'has-pseudo-class': true,
          'gap-properties': true,
          'overflow-wrap': true,
        },
      },
    } : {}),
  },
} 