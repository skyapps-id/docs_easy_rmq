import React from 'react';
import { useLocation } from '@docusaurus/router';

export default function VersionBanner(): React.ReactElement | null {
  const { pathname } = useLocation();

  // Check if we're on 1.0.0-beta version
  if (pathname.includes('/docs/1.0.0-beta/')) {
    return (
      <div style={{
        backgroundColor: 'rgba(235, 130, 80, 0.15)',
        border: '1px solid rgba(235, 130, 80, 0.3)',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px',
        textAlign: 'center',
      }}>
        <strong>📌 This is documentation for Easy RMQ 1.0.0-beta, which is no longer actively maintained.</strong>{' '}
        <a href="/docs/intro" style={{
          color: 'var(--ifm-color-link)',
          fontWeight: '600',
          textDecoration: 'underline',
        }}>For up-to-date documentation, see the latest version (1.0.0)</a>
      </div>
    );
  }

  return null;
}
