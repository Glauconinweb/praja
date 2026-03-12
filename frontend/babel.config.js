module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Se você usar o Reanimated no futuro, ele entra aqui
    ],
  };
};
