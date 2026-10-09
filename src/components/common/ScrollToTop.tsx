import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * ScrollToTop Component
 * Resets window scroll position to (0, 0) upon any route navigation,
 * preserving scroll only when the browser performs a POP (back/forward history navigation).
 */
export const ScrollToTop: React.FC = () => {
  const { pathname, search } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    // If navigating to a new route (PUSH or REPLACE), scroll instantly to the top
    if (navigationType !== 'POP') {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [pathname, search, navigationType]);

  return null;
};
