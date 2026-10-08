import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Organization } from '../types';
import { getUserOrganizations } from '../services/organizationService';

interface OrganizerContextType {
  organizations: Organization[];
  activeOrganization: Organization | null;
  setActiveOrganization: (org: Organization) => void;
  loading: boolean;
  error: string | null;
  refetchOrganizations: () => Promise<void>;
}

const OrganizerContext = createContext<OrganizerContextType | null>(null);

const ACTIVE_ORG_STORAGE_KEY = 'festofy_organizer_active_org_id';

export const OrganizerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, role, isAdmin, loading: authLoading } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrganization, setActiveOrganizationState] = useState<Organization | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrgs = useCallback(async () => {
    if (!currentUser?.uid) {
      setOrganizations([]);
      setActiveOrganizationState(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const orgs = await getUserOrganizations(currentUser.uid, isAdmin);
      setOrganizations(orgs);

      if (orgs.length > 0) {
        // Check if there was an active org ID saved in sessionStorage
        const savedOrgId = sessionStorage.getItem(ACTIVE_ORG_STORAGE_KEY);
        const matchingSaved = orgs.find((o) => o.id === savedOrgId);

        if (matchingSaved) {
          setActiveOrganizationState(matchingSaved);
        } else {
          setActiveOrganizationState(orgs[0]);
          sessionStorage.setItem(ACTIVE_ORG_STORAGE_KEY, orgs[0].id);
        }
      } else {
        setActiveOrganizationState(null);
        sessionStorage.removeItem(ACTIVE_ORG_STORAGE_KEY);
      }
    } catch (err: any) {
      console.warn('Failed to load organizer organizations notice:', err?.message || err);
      setError('Unable to load authorized organizations. Please check your connection.');
      setOrganizations([]);
      setActiveOrganizationState(null);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, isAdmin]);

  useEffect(() => {
    if (!authLoading) {
      fetchOrgs();
    }
  }, [authLoading, fetchOrgs]);

  const setActiveOrganization = (org: Organization) => {
    setActiveOrganizationState(org);
    sessionStorage.setItem(ACTIVE_ORG_STORAGE_KEY, org.id);
  };

  return (
    <OrganizerContext.Provider
      value={{
        organizations,
        activeOrganization,
        setActiveOrganization,
        loading: authLoading || loading,
        error,
        refetchOrganizations: fetchOrgs
      }}
    >
      {children}
    </OrganizerContext.Provider>
  );
};

export const useOrganizer = (): OrganizerContextType => {
  const context = useContext(OrganizerContext);
  if (!context) {
    throw new Error('useOrganizer must be used within an OrganizerProvider');
  }
  return context;
};
