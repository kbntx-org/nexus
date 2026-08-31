export const hooks = {
  updateConfig(config) {
    if (config.frozenLockfile === undefined) {
      config.frozenLockfile = true;
    }
    return config;
  }
};
