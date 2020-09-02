module.exports = function (api) {
  const sourceMaps = api.env('production') ? false : 'inline';
  const presets = [
    ['@babel/preset-env', {targets: {'chrome': 83}}],
    '@babel/preset-react',
  ];
  const plugins = [
    '@babel/plugin-transform-modules-commonjs',
    '@babel/plugin-proposal-class-properties',
  ];

  return {
    sourceMaps,
    presets,
    plugins
  };
};
