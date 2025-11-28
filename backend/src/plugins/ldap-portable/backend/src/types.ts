/**
 * LDAP Plugin Type Definitions
 * Following CAS Constitution standards
 */

export interface LdapConfiguration {
  id: string;
  serverurl: string;
  basedn: string;
  binddn: string;
  bindpassword: string;
  searchfilter: string;
  searchattribute: string;
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
  importstatus: LdapImportStatus;
  importerrors?: string[];
  createdat: Date;
  updatedat: Date;
}

export type LdapImportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface LdapAuthResult {
  success: boolean;
  user?: LdapUser;
  message?: string;
}

export interface LdapUser {
  id: string;
  username: string;
  email: string;
  authtype: 'ldap';
  createdat: Date;
  updatedat: Date;
}

export interface LdapImportResult {
  success: boolean;
  message: string;
  importedCount?: number;
}

export interface LdapConnectionTestResult {
  success: boolean;
  message: string;
  details?: {
    server: string;
    port: number;
    secure: boolean;
    baseDN: string;
    connectedAt: string;
    error?: string;
  };
}

export interface LdapPluginStatus {
  name: string;
  version: string;
  status: 'configured' | 'not configured';
  active: boolean;
  configuration: {
    server: string;
    baseDN: string;
    searchAttribute: string;
    port: number;
    secure: boolean;
  } | null;
}

export interface LdapConfigureRequest {
  serverurl: string;
  basedn: string;
  binddn: string;
  bindpassword: string;
  searchfilter?: string;
  searchattribute?: string;
  groupattribute?: string;
  issecure?: boolean;
  port?: number;
}

export interface LdapTestRequest extends LdapConfigureRequest {}

export interface LdapImportRequest {
  searchQuery?: string;
}

export interface LdapAuthenticateRequest {
  username: string;
  password: string;
}
