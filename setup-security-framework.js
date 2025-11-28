#!/usr/bin/env node

/**
 * Security Framework Setup Script
 * Automated setup and configuration for the CAS Plugin Security Framework
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SecurityFrameworkSetup {
  constructor() {
    this.configPath = path.join(__dirname, 'config/security-config.json');
    this.keyPath = path.join(__dirname, 'config/security-key');
    this.logsPath = path.join(__dirname, 'logs/security');
    this.auditPath = path.join(__dirname, 'audit');
    this.certificatesPath = path.join(__dirname, 'certificates');
  }

  async run() {
    console.log('🔐 CAS Plugin Security Framework Setup');
    console.log('=====================================');

    try {
      await this.checkPrerequisites();
      await this.createDirectories();
      await this.generateEncryptionKey();
      await this.createDefaultConfiguration();
      await this.setupCertificateAuthority();
      await this.createDatabaseSchema();
      await this.installSecurityTools();
      await this.setupMonitoring();
      await this.validateSetup();

      console.log('\n✅ Security Framework setup completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Review the configuration at: ' + this.configPath);
      console.log('2. Import your security policies');
      console.log('3. Configure your trust anchors');
      console.log('4. Start the security orchestration service');
      console.log('5. Test with a sample plugin');

    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
      console.error('Please check the error details above and fix any issues.');
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    console.log('\n📋 Checking prerequisites...');

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

    if (majorVersion < 16) {
      throw new Error(`Node.js version 16 or higher is required. Current version: ${nodeVersion}`);
    }
    console.log('✓ Node.js version:', nodeVersion);

    // Check required modules
    const requiredModules = ['crypto', 'fs', 'path'];
    for (const module of requiredModules) {
      try {
        require.resolve(module);
      } catch (error) {
        throw new Error(`Required module '${module}' not found`);
      }
    }
    console.log('✓ Required modules available');

    // Check system dependencies
    const systemDeps = ['docker', 'openssl'];
    for (const dep of systemDeps) {
      try {
        const { execSync } = require('child_process');
        execSync(`which ${dep}`, { stdio: 'ignore' });
        console.log(`✓ ${dep} found`);
      } catch (error) {
        console.warn(`⚠️  ${dep} not found - some features may not work`);
      }
    }
  }

  async createDirectories() {
    console.log('\n📁 Creating directory structure...');

    const directories = [
      'config',
      'logs/security',
      'audit',
      'certificates',
      'certificates/ca',
      'certificates/plugins',
      'certificates/revoked',
      'plugins',
      'plugins/quarantine',
      'threat-intelligence',
      'compliance',
      'reports',
      'backup'
    ];

    for (const dir of directories) {
      const fullPath = path.join(__dirname, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log('✓ Created:', fullPath);
      }
    }
  }

  async generateEncryptionKey() {
    console.log('\n🔑 Generating encryption key...');

    if (fs.existsSync(this.keyPath)) {
      console.log('✓ Encryption key already exists');
      return;
    }

    const key = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(this.keyPath, key, { mode: 0o600 });
    console.log('✓ Encryption key generated and stored');
  }

  async createDefaultConfiguration() {
    console.log('\n⚙️  Creating default security configuration...');

    if (fs.existsSync(this.configPath)) {
      console.log('✓ Configuration already exists');
      return;
    }

    const config = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      securityFramework: {
        enabled: true,
        strictMode: false,
        logging: {
          level: 'INFO',
          file: path.join(this.logsPath, 'security.log'),
          maxSize: '100MB',
          maxFiles: 10
        }
      },
      staticAnalysis: {
        enabled: true,
        timeout: 300000,
        maxFileSize: 10485760,
        strictMode: false,
        tools: {
          eslint: true,
          sonarjs: true,
          security: true,
          complexity: true
        }
      },
      runtimeProtection: {
        enabled: true,
        sandboxing: {
          enabled: true,
          type: 'docker',
          defaultProfile: 'medium-risk',
          profiles: {
            'low-risk': {
              cpu: { cores: 1, limit: '500m' },
              memory: { limit: '512M' },
              network: { allowed: ['https://api.github.com', 'https://registry.npmjs.org'] }
            },
            'medium-risk': {
              cpu: { cores: 1, limit: '1000m' },
              memory: { limit: '1G' },
              network: { allowed: [] }
            },
            'high-risk': {
              cpu: { cores: 1, limit: '2000m' },
              memory: { limit: '2G' },
              network: { allowed: [], blocked: ['*'] }
            }
          }
        },
        monitoring: {
          enabled: true,
          metrics: true,
          alerts: true,
          interval: 5000
        }
      },
      signatureVerification: {
        enabled: true,
        requireSignature: false,
        trustLevel: 'MEDIUM',
        algorithms: ['RSA-PSS', 'ECDSA', 'EdDSA'],
        certificateValidation: {
          checkRevocation: true,
          requireChain: true,
          trustAnchors: ['ca/cas-root.crt']
        }
      },
      auditing: {
        enabled: true,
        realTime: true,
        retention: {
          default: 365,
          security: 2555, // 7 years
          compliance: 2555
        },
        events: [
          'PLUGIN_INSTALL',
          'PLUGIN_UNINSTALL',
          'SECURITY_VIOLATION',
          'POLICY_VIOLATION',
          'INCIDENT_CREATED',
          'COMPLIANCE_VIOLATION'
        ]
      },
      compliance: {
        enabled: true,
        frameworks: ['ISO27001', 'SOC2'],
        autoReporting: true,
        schedule: '0 2 * * 0', // Weekly on Sunday at 2 AM
        assessments: {
          automated: true,
          frequency: 'MONTHLY'
        }
      },
      threatIntelligence: {
        enabled: true,
        sources: [
          {
            name: 'CISA KEV',
            url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
            format: 'JSON',
            updateFrequency: 'DAILY'
          },
          {
            name: 'NVD',
            url: 'https://nvd.nist.gov/feeds/json/cve/1.1/',
            format: 'JSON',
            updateFrequency: 'DAILY'
          }
        ],
        autoBlocking: {
          enabled: false,
          threshold: 'HIGH',
          duration: 24 // hours
        }
      },
      incidentResponse: {
        enabled: true,
        automatedResponse: true,
        escalationThreshold: 3,
        playbooks: [
          'malware-detection',
          'data-breach',
          'denial-of-service',
          'unauthorized-access'
        ],
        notification: {
          channels: ['email', 'slack'],
          escalation: true,
          timeout: 30 // minutes
        }
      },
      marketplace: {
        enabled: true,
        verification: {
          required: true,
          minimumLevel: 'STANDARD',
          automaticRevocation: true
        },
        scanning: {
          staticAnalysis: true,
          dependencyScanning: true,
          secretsScanning: true,
          containerScanning: false
        },
        reputation: {
          enabled: true,
          minimumScore: 70,
          factors: ['security', 'quality', 'popularity', 'community']
        }
      }
    };

    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    console.log('✓ Default configuration created');
  }

  async setupCertificateAuthority() {
    console.log('\n🏛️  Setting up Certificate Authority...');

    const caKeyPath = path.join(this.certificatesPath, 'ca', 'ca-key.pem');
    const caCertPath = path.join(this.certificatesPath, 'ca', 'ca-cert.pem');

    if (fs.existsSync(caCertPath)) {
      console.log('✓ Certificate Authority already exists');
      return;
    }

    // Generate CA private key
    const { execSync } = require('child_process');

    try {
      execSync(`openssl genrsa -out "${caKeyPath}" 4096`, { stdio: 'inherit' });
      console.log('✓ CA private key generated');

      // Generate CA certificate
      const caConfig = this.createCAConfig();
      const caConfigPath = path.join(this.certificatesPath, 'ca', 'ca-config.cnf');
      fs.writeFileSync(caConfigPath, caConfig);

      execSync(`openssl req -new -x509 -key "${caKeyPath}" -days 3650 -out "${caCertPath}" -config "${caConfigPath}"`, { stdio: 'inherit' });
      console.log('✓ CA certificate generated');

      // Create CRL infrastructure
      const crlPath = path.join(this.certificatesPath, 'ca', 'ca.crl');
      execSync(`touch "${crlPath}"`, { stdio: 'inherit' });
      console.log('✓ Certificate Revocation List initialized');

    } catch (error) {
      throw new Error(`Failed to setup Certificate Authority: ${error.message}`);
    }
  }

  createCAConfig() {
    return `
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_ca
prompt = no

[req_distinguished_name]
C = US
ST = California
L = San Francisco
O = CAS Platform
OU = Security
CN = CAS Root CA
emailAddress = security@cas-platform.com

[v3_ca]
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer
basicConstraints = critical, CA:true
keyUsage = critical, digitalSignature, cRLSign, keyCertSign
extendedKeyUsage = serverAuth, clientAuth
`;
  }

  async createDatabaseSchema() {
    console.log('\n🗄️  Creating database schema...');

    const sqlPath = path.join(__dirname, 'database', 'security-schema.sql');

    // Create database directory if it doesn't exist
    const dbDir = path.dirname(sqlPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const schema = `
-- CAS Plugin Security Framework Database Schema

-- Security Events Table
CREATE TABLE IF NOT EXISTS security_events (
    id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    source_type VARCHAR(20) NOT NULL,
    source_component VARCHAR(100),
    source_instance VARCHAR(100),
    plugin_id VARCHAR(100),
    sandbox_id VARCHAR(100),
    user_id VARCHAR(100),
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    description TEXT NOT NULL,
    details JSONB,
    tags TEXT[],
    correlation_id VARCHAR(64),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(100),
    mitigation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security Incidents Table
CREATE TABLE IF NOT EXISTS security_incidents (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    category VARCHAR(50) NOT NULL,
    source VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    events TEXT[],
    affected_plugins TEXT[],
    affected_users TEXT[],
    impact JSONB,
    timeline JSONB,
    assigned_to VARCHAR(100),
    estimated_resolution TIMESTAMP WITH TIME ZONE,
    actual_resolution TIMESTAMP WITH TIME ZONE,
    root_cause TEXT,
    lessons_learned TEXT,
    prevention TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plugin Security Profiles Table
CREATE TABLE IF NOT EXISTS plugin_security_profiles (
    id VARCHAR(64) PRIMARY KEY,
    plugin_id VARCHAR(100) UNIQUE NOT NULL,
    version VARCHAR(20) NOT NULL,
    security_score INTEGER CHECK (security_score >= 0 AND security_score <= 100),
    risk_level VARCHAR(20) NOT NULL,
    trust_level VARCHAR(20) NOT NULL,
    permissions TEXT[],
    restrictions JSONB,
    compliance JSONB,
    last_assessment TIMESTAMP WITH TIME ZONE NOT NULL,
    assessment_history JSONB,
    incidents TEXT[],
    violations JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security Policies Table
CREATE TABLE IF NOT EXISTS security_policies (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    version VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    purpose TEXT,
    scope TEXT,
    rules JSONB NOT NULL,
    exceptions JSONB,
    enforcement JSONB,
    compliance JSONB,
    review_cycle VARCHAR(20),
    last_review TIMESTAMP WITH TIME ZONE,
    next_review TIMESTAMP WITH TIME ZONE,
    owner VARCHAR(100) NOT NULL,
    approvers TEXT[],
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trust Anchors Table
CREATE TABLE IF NOT EXISTS trust_anchors (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    certificate_pem TEXT NOT NULL,
    public_key TEXT NOT NULL,
    fingerprint VARCHAR(64) NOT NULL,
    issuer VARCHAR(200),
    subject VARCHAR(200),
    serial_number VARCHAR(64),
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_to TIMESTAMP WITH TIME ZONE NOT NULL,
    crl_distribution_points TEXT[],
    ocsp_urls TEXT[],
    trust_level VARCHAR(20) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    last_verified TIMESTAMP WITH TIME ZONE,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'UNKNOWN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plugin Certificates Table
CREATE TABLE IF NOT EXISTS plugin_certificates (
    id VARCHAR(64) PRIMARY KEY,
    plugin_id VARCHAR(100) NOT NULL,
    version VARCHAR(20) NOT NULL,
    issuer VARCHAR(200) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    serial_number VARCHAR(64) NOT NULL,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_to TIMESTAMP WITH TIME ZONE NOT NULL,
    public_key TEXT NOT NULL,
    signature TEXT NOT NULL,
    fingerprint VARCHAR(64) NOT NULL,
    permissions TEXT[],
    trust_level VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revocation_reason VARCHAR(100),
    certificate_pem TEXT NOT NULL,
    signing_certificate_chain TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance Reports Table
CREATE TABLE IF NOT EXISTS compliance_reports (
    id VARCHAR(64) PRIMARY KEY,
    framework VARCHAR(20) NOT NULL,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    controls JSONB,
    violations JSONB,
    recommendations JSONB,
    evidence JSONB,
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    next_review_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Threat Intelligence Table
CREATE TABLE IF NOT EXISTS threat_intelligence (
    id VARCHAR(64) PRIMARY KEY,
    threat_type VARCHAR(50) NOT NULL,
    threat_name VARCHAR(200) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description TEXT,
    indicators JSONB,
    mitigations TEXT[],
    first_seen TIMESTAMP WITH TIME ZONE NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE NOT NULL,
    confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
    source VARCHAR(100) NOT NULL,
    tags TEXT[],
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security Metrics Table
CREATE TABLE IF NOT EXISTS security_metrics (
    id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_unit VARCHAR(20),
    dimensions JSONB,
    source VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_plugin_id ON security_events(plugin_id);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_plugin_security_profiles_plugin_id ON plugin_security_profiles(plugin_id);
CREATE INDEX IF NOT EXISTS idx_plugin_certificates_plugin_id ON plugin_certificates(plugin_id);
CREATE INDEX IF NOT EXISTS idx_threat_intelligence_threat_type ON threat_intelligence(threat_type);
CREATE INDEX IF NOT EXISTS idx_security_metrics_timestamp ON security_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_metrics_name ON security_metrics(metric_name);
`;

    fs.writeFileSync(sqlPath, schema);
    console.log('✓ Database schema created at:', sqlPath);
  }

  async installSecurityTools() {
    console.log('\n🛠️  Installing security analysis tools...');

    const tools = [
      {
        name: 'ESLint Security Plugin',
        command: 'npm install --save-dev eslint-plugin-security',
        description: 'Security rules for ESLint'
      },
      {
        name: 'SonarJS',
        command: 'npm install --save-dev eslint-plugin-sonarjs',
        description: 'SonarJS rules for JavaScript/TypeScript'
      },
      {
        name: 'Audit CI',
        command: 'npm install --save-dev audit-ci',
        description: 'Automated npm audit'
      },
      {
        name: 'Snyk',
        command: 'npm install -g snyk',
        description: 'Dependency vulnerability scanner'
      }
    ];

    for (const tool of tools) {
      try {
        const { execSync } = require('child_process');
        console.log(`Installing ${tool.name}...`);
        execSync(tool.command, { stdio: 'inherit' });
        console.log(`✓ ${tool.name} installed`);
      } catch (error) {
        console.warn(`⚠️  Failed to install ${tool.name}: ${error.message}`);
        console.warn(`   You can install it manually: ${tool.command}`);
      }
    }
  }

  async setupMonitoring() {
    console.log('\n📊 Setting up monitoring...');

    // Create monitoring configuration
    const monitoringConfig = {
      metrics: {
        enabled: true,
        interval: 60000, // 1 minute
        retention: {
          raw: 7, // days
          aggregated: 90 // days
        },
        aggregation: {
          intervals: ['1m', '5m', '15m', '1h', '6h', '1d'],
          functions: ['avg', 'min', 'max', 'sum', 'count']
        }
      },
      alerts: {
        enabled: true,
        channels: {
          email: {
            enabled: false,
            smtp: {
              host: 'localhost',
              port: 587,
              secure: false,
              auth: {
                user: '',
                pass: ''
              }
            },
            recipients: []
          },
          slack: {
            enabled: false,
            webhook: '',
            channel: '#security-alerts'
          },
          webhook: {
            enabled: false,
            url: '',
            headers: {}
          }
        },
        rules: [
          {
            name: 'High Security Violations',
            condition: 'security_events_severity_HIGH_count > 5',
            severity: 'HIGH',
            duration: '5m'
          },
          {
            name: 'Critical Security Violations',
            condition: 'security_events_severity_CRITICAL_count > 0',
            severity: 'CRITICAL',
            duration: '1m'
          },
          {
            name: 'Plugin Security Score Low',
            condition: 'plugin_security_score < 50',
            severity: 'MEDIUM',
            duration: '10m'
          }
        ]
      },
      dashboards: {
        enabled: true,
        refresh: 30000, // 30 seconds
        panels: [
          {
            title: 'Security Events',
            type: 'timeseries',
            metrics: ['security_events_total', 'security_events_by_severity']
          },
          {
            title: 'Plugin Security Scores',
            type: 'gauge',
            metrics: ['plugin_security_scores']
          },
          {
            title: 'Threat Intelligence',
            type: 'table',
            metrics: ['threat_indicators', 'threat_count']
          },
          {
            title: 'Compliance Status',
            type: 'status',
            metrics: ['compliance_scores', 'compliance_violations']
          }
        ]
      }
    };

    const monitoringConfigPath = path.join(__dirname, 'config/monitoring.json');
    fs.writeFileSync(monitoringConfigPath, JSON.stringify(monitoringConfig, null, 2));
    console.log('✓ Monitoring configuration created');

    // Create log rotation configuration
    const logrotateConfig = `
# CAS Security Framework Log Rotation
${this.logsPath}/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 $USER $USER
    postrotate
        # Send signal to security framework to reload logs
        pkill -SIGUSR1 -f "security-orchestration" || true
    endscript
}

${this.auditPath}/*.log {
    daily
    missingok
    rotate 365
    compress
    delaycompress
    notifempty
    create 0640 $USER $USER
}
`;

    const logrotatePath = path.join(__dirname, 'config/logrotate-security');
    fs.writeFileSync(logrotatePath, logrotateConfig);
    console.log('✓ Log rotation configuration created');
  }

  async validateSetup() {
    console.log('\n🔍 Validating setup...');

    const validationChecks = [
      {
        name: 'Configuration file',
        check: () => fs.existsSync(this.configPath),
        required: true
      },
      {
        name: 'Encryption key',
        check: () => fs.existsSync(this.keyPath),
        required: true
      },
      {
        name: 'CA certificate',
        check: () => fs.existsSync(path.join(this.certificatesPath, 'ca', 'ca-cert.pem')),
        required: true
      },
      {
        name: 'Database schema',
        check: () => fs.existsSync(path.join(__dirname, 'database', 'security-schema.sql')),
        required: true
      },
      {
        name: 'Monitoring configuration',
        check: () => fs.existsSync(path.join(__dirname, 'config/monitoring.json')),
        required: false
      },
      {
        name: 'Log rotation configuration',
        check: () => fs.existsSync(path.join(__dirname, 'config/logrotate-security')),
        required: false
      }
    ];

    let allRequiredPassed = true;

    for (const check of validationChecks) {
      const passed = check.check();
      const status = passed ? '✓' : '✗';
      const requirement = check.required ? '(Required)' : '(Optional)';

      console.log(`${status} ${check.name} ${requirement}`);

      if (!passed && check.required) {
        allRequiredPassed = false;
      }
    }

    if (!allRequiredPassed) {
      throw new Error('Some required setup steps failed. Please check the errors above.');
    }

    // Test configuration loading
    try {
      const config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
      console.log('✓ Configuration file is valid JSON');
    } catch (error) {
      throw new Error(`Configuration file is invalid: ${error.message}`);
    }

    // Test encryption key
    try {
      const key = fs.readFileSync(this.keyPath, 'utf-8').trim();
      if (key.length !== 64) {
        throw new Error('Encryption key has invalid length');
      }
      console.log('✓ Encryption key is valid');
    } catch (error) {
      throw new Error(`Encryption key validation failed: ${error.message}`);
    }
  }
}

// CLI Interface
if (require.main === module) {
  const setup = new SecurityFrameworkSetup();
  setup.run().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = SecurityFrameworkSetup;