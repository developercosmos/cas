declare module '../user-access-management/main.js' {
  interface UserAccessPlugin {
    name: string;
    version: string;
    description: string;
    author: string;
    category: string;
    isSystem: boolean;
    enabled: boolean;
    routes: any;
    hooks: {
      onInstall: () => Promise<void>;
      onUninstall: () => Promise<void>;
      onEnable: () => void;
      onDisable: () => void;
    };
  }

  const plugin: UserAccessPlugin;
  export default plugin;
}
