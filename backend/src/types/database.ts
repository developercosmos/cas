// Database types following CBS Constitution
export interface User {
  id: string;
  username: string;
  email: string;
  passwordhash: string;
  authtype: 'local' | 'ldap'; // Constitution: Authentication method tracking
  ldapdn?: string; // Constitution: LDAP Distinguished Name
  ldapgroups?: string[]; // Constitution: LDAP group membership
  createdat: Date;
  updatedat: Date;
  deletedat?: Date;
}

export interface LdapConfiguration {
  id: string;
  serverurl: string;
  basedn: string;
  binddn: string;
  bindpassword: string;
  searchfilter: string;
  searchattribute: string;
  emailattribute?: string;
  displaynameattribute?: string;
  groupattribute: string;
  issecure: boolean;
  port: number;
  isactive: boolean;
  createdat: Date;
  updatedat: Date;
}

export interface LdapUserImport {
  id: string;
  ldapdn: string;
  username: string;
  email: string;
  firstname?: string;
  lastname?: string;
  displayname?: string;
  ldapgroups: string[];
  importstatus: 'pending' | 'processing' | 'completed' | 'failed';
  importerrors?: string[];
  createdat: Date;
  updatedat: Date;
}

export interface UserSession {
  Id: string;
  UserId: string;
  TokenHash: string;
  ExpiresAt: Date;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface UserSettings {
  Id: string;
  UserId: string;
  ThemePreference: string;
  LanguagePreference: string;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface CanvasLayout {
  Id: string;
  UserId: string;
  LayoutName: string;
  LayoutData: Record<string, any>;
  IsDefault: boolean;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface PluginConfiguration {
  Id: string;
  PluginId: string;
  PluginName: string;
  PluginVersion: string;
  PluginDescription?: string;
  PluginAuthor?: string;
  PluginEntry: string;
  PluginStatus: 'active' | 'disabled' | 'error';
  IsSystem: boolean;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface PluginColorScheme {
  Id: string;
  PluginId: string;
  SchemeName: string;
  SchemeData: Record<string, any>;
  IsDefault: boolean;
  CreatedAt: Date;
}

export interface PluginUserPreferences {
  Id: string;
  UserId: string;
  PluginId: string;
  PreferenceKey: string;
  PreferenceValue: Record<string, any>;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface UserPluginPermissions {
  Id: string;
  UserId: string;
  PluginId: string;
  PermissionName: string;
  IsGranted: boolean;
  GrantedAt: Date;
  GrantedBy?: string;
  CreatedAt: Date;
}

export interface UserStorage {
  Id: string;
  UserId: string;
  PluginId?: string;
  StorageKey: string;
  StorageValue: Record<string, any>;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface Migration {
  version: string;
  name: string;
  applied_at?: Date;
  applied?: boolean;
}
