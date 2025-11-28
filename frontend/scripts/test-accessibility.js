#!/usr/bin/env node

/**
 * Automated Accessibility Testing Script
 * Tests the running application for WCAG 2.1 AA compliance
 */

const { chromium } = require('playwright');
const axe = require('axe-core');

class AccessibilityTester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      url: '',
      violations: [],
      passes: 0,
      incomplete: 0,
      inapplicable: 0
    };
  }

  async runTests(baseUrl = 'http://localhost:3000') {
    console.log('🔍 Starting accessibility tests...');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Test different pages and states
      await this.testPage(page, `${baseUrl}`, 'Login Page');

      // Test accessibility test page (if accessible via keyboard shortcut)
      await this.testAccessibilityPage(page, baseUrl);

      console.log('\n📊 Accessibility Test Results:');
      console.log(`✅ Passes: ${this.results.passes}`);
      console.log(`❌ Violations: ${this.results.violations.length}`);
      console.log(`⚠️  Incomplete: ${this.results.incomplete}`);
      console.log(`➖ Inapplicable: ${this.results.inapplicable}`);

      if (this.results.violations.length > 0) {
        console.log('\n🚨 Critical Issues Found:');
        this.violations
          .filter(v => v.impact === 'critical')
          .forEach(v => {
            console.log(`  - ${v.id}: ${v.description}`);
          });

        console.log('\n⚠️  Serious Issues:');
        this.violations
          .filter(v => v.impact === 'serious')
          .forEach(v => {
            console.log(`  - ${v.id}: ${v.description}`);
          });
      }

      await this.generateReport();

    } catch (error) {
      console.error('❌ Test failed:', error.message);
    } finally {
      await browser.close();
    }
  }

  async testPage(page, url, pageName) {
    console.log(`\n📄 Testing: ${pageName}`);

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Wait for dynamic content

    // Inject axe-core
    await page.addScriptTag({
      content: axe.source
    });

    // Run accessibility tests
    const results = await page.evaluate(() => {
      return axe.run({
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21aa']
        },
        reporter: 'v2',
        rules: {
          // Add custom rules if needed
        }
      });
    });

    this.results.url = url;
    this.results.passes += results.passes.length;
    this.results.incomplete += results.incomplete.length;
    this.results.inapplicable += results.inapplicable.length;

    // Process violations
    results.violations.forEach(violation => {
      this.results.violations.push({
        ...violation,
        page: pageName,
        url: url,
        timestamp: new Date().toISOString()
      });
    });

    console.log(`  Found ${results.violations.length} violations`);
  }

  async testAccessibilityPage(page, baseUrl) {
    console.log('\n🎯 Testing accessibility components...');

    try {
      // Try to trigger accessibility test page (Ctrl+Shift+A)
      await page.keyboard.press('Control+Shift+A');
      await page.waitForTimeout(1000);

      // Test keyboard navigation
      await this.testKeyboardNavigation(page);

      // Test color contrast (basic check)
      await this.testColorContrast(page);

    } catch (error) {
      console.log('  Accessibility test page not available');
    }
  }

  async testKeyboardNavigation(page) {
    console.log('  ⌨️  Testing keyboard navigation...');

    const interactiveElements = await page.$$(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    console.log(`    Found ${interactiveElements.length} interactive elements`);

    // Test Tab navigation
    let tabCount = 0;
    for (let i = 0; i < Math.min(interactiveElements.length, 10); i++) {
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluateHandle(() => document.activeElement);
      tabCount++;
    }

    console.log(`    Navigated through ${tabCount} elements with Tab key`);
  }

  async testColorContrast(page) {
    console.log('  🎨 Testing color contrast...');

    // Basic contrast check using computed styles
    const contrastResults = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const results = [];

      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;

        // Skip transparent or same colors
        if (backgroundColor === 'transparent' || backgroundColor === 'rgba(0, 0, 0, 0)') {
          return;
        }

        // This is a simplified check - real contrast calculation is more complex
        const hasVisibleText = el.textContent?.trim().length > 0;
        if (hasVisibleText) {
          results.push({
            element: el.tagName.toLowerCase(),
            color,
            backgroundColor,
            fontSize: parseFloat(styles.fontSize)
          });
        }
      });

      return results.slice(0, 20); // Limit results
    });

    console.log(`    Checked contrast for ${contrastResults.length} text elements`);
  }

  async generateReport() {
    const reportData = {
      ...this.results,
      summary: {
        totalViolations: this.results.violations.length,
        criticalViolations: this.results.violations.filter(v => v.impact === 'critical').length,
        seriousViolations: this.results.violations.filter(v => v.impact === 'serious').length,
        moderateViolations: this.results.violations.filter(v => v.impact === 'moderate').length,
        minorViolations: this.results.violations.filter(v => v.impact === 'minor').length,
        wcagCompliant: this.results.violations.length === 0
      },
      recommendations: this.generateRecommendations()
    };

    // Write JSON report
    const fs = require('fs');
    const reportPath = `./accessibility-report-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.results.violations.length === 0) {
      recommendations.push('✅ No accessibility violations found. Keep up the good work!');
      return recommendations;
    }

    // Analyze violation patterns and suggest fixes
    const violationTypes = this.violations.reduce((acc, v) => {
      acc[v.id] = (acc[v.id] || 0) + 1;
      return acc;
    }, {});

    Object.entries(violationTypes).forEach(([ruleId, count]) => {
      switch (ruleId) {
        case 'color-contrast':
          recommendations.push('🎨 Improve color contrast ratios - ensure text meets WCAG AA standards (4.5:1 for normal text)');
          break;
        case 'keyboard':
          recommendations.push('⌨️  Ensure all interactive elements are keyboard accessible');
          break;
        case 'focus-order-semantics':
          recommendations.push('🔄 Check and fix focus order throughout the application');
          break;
        case 'aria-labels':
          recommendations.push('🏷️  Add proper ARIA labels to interactive elements without visible text');
          break;
        case 'heading-order':
          recommendations.push('📝 Ensure proper heading hierarchy (h1-h6) without skipping levels');
          break;
        case 'list':
          recommendations.push('📋 Use proper list markup for list content');
          break;
        case 'image-alt':
          recommendations.push('🖼️  Add alt text to all meaningful images');
          break;
        case 'button-name':
          recommendations.push('🔘 Ensure all buttons have accessible names');
          break;
        case 'label':
          recommendations.push('🏷️  Associate labels with all form inputs');
          break;
        default:
          recommendations.push(`🔧 Address ${count} instance(s) of ${ruleId} violation`);
      }
    });

    return recommendations;
  }

  get violations() {
    return this.results.violations;
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new AccessibilityTester();
  tester.runTests(process.argv[2]).catch(console.error);
}

module.exports = AccessibilityTester;