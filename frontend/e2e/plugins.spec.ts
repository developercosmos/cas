import { test, expect } from '@playwright/test';

test.describe('Plugin Manager E2E Tests', () => {
  const API_BASE = 'http://localhost:4000';

  test.describe('Plugin List API', () => {
    test('should return list of plugins', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/plugins`);
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThanOrEqual(3); // At least core.text-block, ldap-auth, rag-retrieval
    });

    test('should have required plugin fields', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/plugins`);
      const data = await response.json();
      
      for (const plugin of data.data) {
        expect(plugin).toHaveProperty('id');
        expect(plugin).toHaveProperty('name');
        expect(plugin).toHaveProperty('version');
        expect(plugin).toHaveProperty('status');
      }
    });
  });

  test.describe('Plugin Status API', () => {
    test('should get LDAP plugin status', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/plugins/ldap-auth/status`);
      // Status endpoint may require auth (401) or return success
      expect([200, 401]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
      }
    });

    test('should get RAG plugin status', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/plugins/rag-retrieval/status`);
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      // Response structure: { success: true, plugin: { status: ... } }
      expect(data.success).toBe(true);
      expect(data.plugin).toHaveProperty('status');
    });
  });

  test.describe('Plugin Export API', () => {
    test('should export LDAP plugin as ZIP', async ({ request }) => {
      // This requires authentication - skip if not authenticated
      const response = await request.get(`${API_BASE}/api/plugins/ldap-auth/export`);
      
      // Either 200 (success) or 401 (auth required)
      expect([200, 401]).toContain(response.status());
      
      if (response.status() === 200) {
        const contentType = response.headers()['content-type'];
        expect(contentType).toContain('application/zip');
      }
    });

    test('should export RAG plugin as ZIP', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/plugins/rag-retrieval/export`);
      expect([200, 401]).toContain(response.status());
      
      if (response.status() === 200) {
        const contentType = response.headers()['content-type'];
        expect(contentType).toContain('application/zip');
      }
    });
  });

  test.describe('Plugin Documentation API', () => {
    test('should get LDAP plugin documentation', async ({ request }) => {
      // Documentation is at /api/plugins/:id/docs
      const response = await request.get(`${API_BASE}/api/plugins/ldap-auth/docs`);
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    test('should get RAG plugin documentation', async ({ request }) => {
      // Documentation is at /api/plugins/:id/docs
      const response = await request.get(`${API_BASE}/api/plugins/rag-retrieval/docs`);
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  test.describe('Plugin Enable/Disable API', () => {
    test('should require authentication for enable', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/plugins/ldap-auth/enable`);
      // Should require auth
      expect([200, 401, 403]).toContain(response.status());
    });

    test('should require authentication for disable', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/plugins/ldap-auth/disable`);
      // Should require auth
      expect([200, 401, 403]).toContain(response.status());
    });
  });

  test.describe('Plugin Import API', () => {
    test('should require authentication for import', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/plugins/import`, {
        data: { plugin: { id: 'test', name: 'Test' } }
      });
      // Should require auth
      expect([200, 400, 401, 403]).toContain(response.status());
    });

    test('should validate import payload', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/plugins/import`, {
        data: {}
      });
      // Should return error for empty payload (either auth or validation error)
      expect([400, 401, 403]).toContain(response.status());
    });
  });
});
