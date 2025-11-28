import React, { useState } from 'react';
import axe from 'axe-core';

interface TestResult {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: any[];
}

interface AccessibilityReport {
  violations: TestResult[];
  passes: number;
  incomplete: number;
  timestamp: string;
  url: string;
}

export const AccessibilityTestRunner: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<AccessibilityReport | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const runAccessibilityTest = async () => {
    setIsRunning(true);

    try {
      const results = await axe.run({
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21aa']
        },
        reporter: 'v2'
      });

      const reportData: AccessibilityReport = {
        violations: results.violations.map(violation => ({
          id: violation.id,
          impact: violation.impact as 'minor' | 'moderate' | 'serious' | 'critical',
          description: violation.description,
          help: violation.help,
          helpUrl: violation.helpUrl,
          nodes: violation.nodes
        })),
        passes: results.passes.length,
        incomplete: results.incomplete.length,
        timestamp: new Date().toISOString(),
        url: window.location.href
      };

      setReport(reportData);
    } catch (error) {
      console.error('Accessibility test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const exportReport = () => {
    if (!report) return;

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessibility-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button
        onClick={toggleVisibility}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '10px 15px',
          backgroundColor: '#E67E22',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          zIndex: 10000,
          fontSize: '14px',
          fontWeight: '500'
        }}
      >
        A11y Test
      </button>

      {isVisible && (
        <div
          tabIndex={0}
          role="dialog"
          aria-modal="true"
          aria-labelledby="accessibility-test-title"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              toggleVisibility();
            }
            // Add arrow key scrolling for the modal
            if (e.key === 'ArrowDown' && !e.shiftKey) {
              e.currentTarget.scrollBy({ top: 50, behavior: 'smooth' });
            } else if (e.key === 'ArrowUp' && !e.shiftKey) {
              e.currentTarget.scrollBy({ top: -50, behavior: 'smooth' });
            } else if (e.key === 'PageDown') {
              e.currentTarget.scrollBy({ top: 200, behavior: 'smooth' });
            } else if (e.key === 'PageUp') {
              e.currentTarget.scrollBy({ top: -200, behavior: 'smooth' });
            } else if (e.key === 'Home') {
              e.currentTarget.scrollTo({ top: 0, behavior: 'smooth' });
            } else if (e.key === 'End') {
              e.currentTarget.scrollTo({ top: e.currentTarget.scrollHeight, behavior: 'smooth' });
            }
          }}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: '800px',
            height: '80%',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '20px',
            zIndex: 10001,
            overflow: 'auto',
            color: 'var(--text-primary)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 id="accessibility-test-title">Accessibility Test Results</h2>
            <button
              onClick={toggleVisibility}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '0'
              }}
            >
              ×
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={runAccessibilityTest}
              disabled={isRunning}
              style={{
                padding: '10px 20px',
                backgroundColor: '#E67E22',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isRunning ? 'not-allowed' : 'pointer',
                marginRight: '10px'
              }}
            >
              {isRunning ? 'Running Tests...' : 'Run Tests'}
            </button>

            {report && (
              <button
                onClick={exportReport}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'var(--accent-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Export Report
              </button>
            )}
          </div>

          {report && (
            <div>
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px' }}>
                <h3>Summary</h3>
                <p>Tests run at: {new Date(report.timestamp).toLocaleString()}</p>
                <p>URL: {report.url}</p>
                <p>✅ Passes: {report.passes}</p>
                <p>❌ Violations: {report.violations.length}</p>
                <p>⚠️ Incomplete: {report.incomplete}</p>
              </div>

              {report.violations.length > 0 && (
                <div>
                  <h3>Violations Found</h3>
                  {report.violations.map((violation, index) => (
                    <div
                      key={index}
                      style={{
                        marginBottom: '15px',
                        padding: '15px',
                        backgroundColor:
                          violation.impact === 'critical' ? '#2d1b1b' :
                          violation.impact === 'serious' ? '#2d1f1b' :
                          violation.impact === 'moderate' ? '#2d2b1b' : '#2b2d1b',
                        border: `1px solid ${
                          violation.impact === 'critical' ? '#dc2626' :
                          violation.impact === 'serious' ? '#ea580c' :
                          violation.impact === 'moderate' ? '#d97706' : '#65a30d'
                        }`,
                        borderRadius: '6px'
                      }}
                    >
                      <div style={{ marginBottom: '10px' }}>
                        <strong>{violation.id}</strong>
                        <span
                          style={{
                            marginLeft: '10px',
                            padding: '2px 8px',
                            backgroundColor:
                              violation.impact === 'critical' ? '#dc2626' :
                              violation.impact === 'serious' ? '#ea580c' :
                              violation.impact === 'moderate' ? '#d97706' : '#65a30d',
                            borderRadius: '4px',
                            fontSize: '12px',
                            textTransform: 'uppercase'
                          }}
                        >
                          {violation.impact}
                        </span>
                      </div>
                      <p style={{ marginBottom: '10px' }}>{violation.description}</p>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{violation.help}</p>
                      <a
                        href={violation.helpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#E67E22',
                          textDecoration: 'none',
                          fontSize: '14px'
                        }}
                      >
                        Learn More
                      </a>
                      <div style={{ marginTop: '10px' }}>
                        <strong>Affected elements ({violation.nodes.length}):</strong>
                        <ul style={{ marginTop: '5px', fontSize: '12px' }}>
                          {violation.nodes.slice(0, 3).map((node, nodeIndex) => (
                            <li key={nodeIndex}>
                              {node.target.join(', ')}
                            </li>
                          ))}
                          {violation.nodes.length > 3 && <li>... and {violation.nodes.length - 3} more</li>}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {report.violations.length === 0 && (
                <div style={{ padding: '20px', backgroundColor: '#1e3a2b', border: '1px solid #10b981', borderRadius: '6px' }}>
                  <h3 style={{ color: '#10b981', marginBottom: '10px' }}>🎉 No violations found!</h3>
                  <p>The page passes all automated accessibility checks.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};