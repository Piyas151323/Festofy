/**
 * Festofy Site & Authentication Configuration
 * Storing production domain and Firebase OAuth settings
 */

export const SITE_CONFIG = {
  appName: 'Festofy',
  // Official Netlify production deployment URL saved for Google OAuth
  productionUrl: 'https://festofy.netlify.app/',
  productionDomain: 'festofy.netlify.app',

  // Associated Firebase configuration details
  firebaseProjectId: 'sonic-octane-ssmzh',
  firebaseAuthDomain: 'sonic-octane-ssmzh.firebaseapp.com',

  // Direct Firebase Console Authorized Domains settings page
  firebaseAuthSettingsUrl: 'https://console.firebase.google.com/project/sonic-octane-ssmzh/authentication/settings',

  // Required domains to authorize in Firebase Console for Google Sign-in to work:
  requiredAuthorizedDomains: [
    'festofy.netlify.app',
    'localhost',
    'sonic-octane-ssmzh.firebaseapp.com',
    'sonic-octane-ssmzh.web.app'
  ]
};

/**
 * Checks if the current host matches production, localhost, or preview
 */
export function getCurrentDomainInfo() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isNetlifyProduction = hostname === 'festofy.netlify.app';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isPreview = !isNetlifyProduction && !isLocalhost;

  return {
    hostname,
    isNetlifyProduction,
    isLocalhost,
    isPreview,
    productionUrl: SITE_CONFIG.productionUrl,
    productionDomain: SITE_CONFIG.productionDomain,
    firebaseProjectId: SITE_CONFIG.firebaseProjectId,
    firebaseAuthSettingsUrl: SITE_CONFIG.firebaseAuthSettingsUrl
  };
}
