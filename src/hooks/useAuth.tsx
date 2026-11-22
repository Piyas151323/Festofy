import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  reload,
  getIdToken,
  getIdTokenResult,
  updateProfile,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase/config';
import { AuthContextType, UserProfile, UserRoleType } from '../types';

const AuthContext = createContext<AuthContextType | null>(null);

function formatVerificationSendError(err: any): string {
  const code = err?.code || '';
  if (code === 'auth/too-many-requests') {
    return 'Too many verification emails were requested recently. Please wait a minute and try "Resend verification email".';
  }
  return 'Your account is active, but we could not send the verification email right now. Click "Resend verification email" below to try again.';
}

function formatProfileSyncError(err: any): string {
  const code = err?.code || '';
  const msg = err?.message || '';
  if (code === 'permission-denied' || msg.includes('Missing or insufficient permissions')) {
    return 'Unable to read your account permissions from Firestore. Please retry in a moment or sign out and sign back in.';
  }
  if (code === 'unavailable' || msg.toLowerCase().includes('network') || msg.toLowerCase().includes('offline')) {
    return 'Could not reach Firestore to load your profile. Check your connection and click Retry.';
  }
  return 'Unable to verify your profile and role in Firestore. Please click Retry or sign out and try again.';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRoleType>('student');
  const [hasPendingOrgRequest, setHasPendingOrgRequest] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const authSeqRef = useRef(0);
  const inFlightResolutionRef = useRef<{ uid: string; promise: Promise<boolean> } | null>(null);
  const lastAutoCheckRef = useRef(0);

  const resetAuthenticatedProfileState = useCallback(() => {
    setCurrentUser(null);
    setRole('student');
    setHasPendingOrgRequest(false);
  }, []);

  const clearVerificationMessages = useCallback(() => {
    setVerificationNotice(null);
    setVerificationError(null);
  }, []);

  const sendVerificationEmailSafe = useCallback(async (user: FirebaseUser): Promise<boolean> => {
    try {
      await sendEmailVerification(user);
      setVerificationError(null);
      setVerificationNotice(
        `Verification email sent to ${user.email || 'your inbox'}. Open the link in your inbox, then click "I’ve verified my email".`
      );
      return true;
    } catch (err: any) {
      console.warn('Email verification dispatch notice:', err?.code || err?.message);
      setVerificationNotice(null);
      setVerificationError(formatVerificationSendError(err));
      return false;
    }
  }, []);

  /**
   * Single idempotent initialization & role resolution path.
   * Runs strictly AFTER Firebase confirms emailVerified === true.
   * Distinguishes missing documents from failed Firestore reads so failed reads
   * never fabricate a fallback student profile or overwrite existing roles/profiles.
   */
  const resolveUserAuthData = useCallback(
    async (targetUser: FirebaseUser, forceTokenRefresh: boolean = false): Promise<boolean> => {
      if (!targetUser.emailVerified) {
        resetAuthenticatedProfileState();
        return false;
      }

      if (
        inFlightResolutionRef.current &&
        inFlightResolutionRef.current.uid === targetUser.uid &&
        !forceTokenRefresh
      ) {
        return inFlightResolutionRef.current.promise;
      }

      const runResolution = (async (): Promise<boolean> => {
        try {
          // Ensure Firebase ID token reflects email_verified: true before first protected Firestore operation
          const tokenResult = await getIdTokenResult(targetUser, forceTokenRefresh);
          if (tokenResult?.claims?.email_verified !== true) {
            await getIdToken(targetUser, true);
          }

          const userRef = doc(db, 'users', targetUser.uid);
          const roleRef = doc(db, 'userRoles', targetUser.uid);

          const [userSnap, roleSnap] = await Promise.all([getDoc(userRef), getDoc(roleRef)]);
          const now = new Date().toISOString();

          let profileData: UserProfile;
          if (!userSnap.exists()) {
            const newProfile = {
              displayName: (
                targetUser.displayName ||
                targetUser.email?.split('@')[0] ||
                'User'
              ).slice(0, 120),
              email: (targetUser.email || '').slice(0, 150),
              photoURL: (targetUser.photoURL || '').slice(0, 500),
              createdAt: now,
              updatedAt: now
            };
            await setDoc(userRef, newProfile);
            profileData = {
              uid: targetUser.uid,
              ...newProfile
            };
          } else {
            const data = userSnap.data();
            profileData = {
              uid: targetUser.uid,
              displayName: data.displayName || targetUser.displayName || 'User',
              email: data.email || targetUser.email || '',
              photoURL: data.photoURL || targetUser.photoURL || '',
              phone: data.phone,
              institution: data.institution,
              classGrade: data.classGrade,
              participantCategory: data.participantCategory,
              studentId: data.studentId,
              interests: data.interests,
              isProfileComplete: data.isProfileComplete,
              createdAt: data.createdAt || now,
              updatedAt: data.updatedAt || now
            };
          }

          // Preserve existing authoritative role if present; only initialize 'student' when role doc is absent
          let assignedRole: UserRoleType = 'student';
          let pendingOrg = false;

          if (roleSnap.exists()) {
            const rData = roleSnap.data();
            if (rData?.role === 'organizer' || rData?.role === 'admin') {
              assignedRole = rData.role;
            }
          }

          if (assignedRole === 'student') {
            const memQuery = query(
              collection(db, 'organizationMembers'),
              where('userId', '==', targetUser.uid)
            );
            const memSnap = await getDocs(memQuery);
            if (!memSnap.empty) {
              assignedRole = 'organizer';
            } else {
              const orgQuery = query(
                collection(db, 'organizations'),
                where('requestedBy', '==', targetUser.uid)
              );
              const orgSnap = await getDocs(orgQuery);
              if (!orgSnap.empty) {
                const hasApproved = orgSnap.docs.some((d) => d.data().status === 'approved');
                if (hasApproved) {
                  assignedRole = 'organizer';
                } else {
                  pendingOrg = orgSnap.docs.some((d) => d.data().status === 'pending');
                }
              }
            }
          }

          if (!roleSnap.exists()) {
            await setDoc(roleRef, {
              role: 'student',
              createdAt: now,
              updatedAt: now
            });
          }

          if (auth.currentUser && auth.currentUser.uid !== targetUser.uid) {
            return false;
          }

          setCurrentUser(profileData);
          setRole(assignedRole);
          setHasPendingOrgRequest(pendingOrg);
          setAuthError(null);
          return true;
        } catch (err: any) {
          console.warn('Firestore profile/role resolution error:', err?.code || err?.message);
          resetAuthenticatedProfileState();
          setAuthError(formatProfileSyncError(err));
          return false;
        } finally {
          if (inFlightResolutionRef.current?.uid === targetUser.uid) {
            inFlightResolutionRef.current = null;
          }
        }
      })();

      inFlightResolutionRef.current = { uid: targetUser.uid, promise: runResolution };
      return runResolution;
    },
    [resetAuthenticatedProfileState]
  );

  const syncUserAfterAuthEvent = useCallback(
    async (fbUser: FirebaseUser | null, seq: number) => {
      if (!fbUser) {
        if (seq !== authSeqRef.current) return;
        setFirebaseUser(null);
        setEmailVerified(false);
        resetAuthenticatedProfileState();
        setAuthError(null);
        setVerificationNotice(null);
        setVerificationError(null);
        setLoading(false);
        return;
      }

      let activeUser = fbUser;
      // On initial load/refresh, check if an unverified user has verified in another tab
      if (!activeUser.emailVerified) {
        await reload(activeUser).catch(() => {});
        activeUser = auth.currentUser || activeUser;
      }

      if (seq !== authSeqRef.current) return;

      setFirebaseUser(activeUser);
      const isVerified = Boolean(activeUser.emailVerified);
      setEmailVerified(isVerified);

      if (!isVerified) {
        resetAuthenticatedProfileState();
        setAuthError(null);
        setLoading(false);
        return;
      }

      setVerificationNotice(null);
      setVerificationError(null);
      await resolveUserAuthData(activeUser, false);
      if (seq === authSeqRef.current) {
        setLoading(false);
      }
    },
    [resetAuthenticatedProfileState, resolveUserAuthData]
  );

  const checkEmailVerification = useCallback(async (): Promise<boolean> => {
    const user = auth.currentUser;
    if (!user) return false;

    setVerificationError(null);
    setVerificationNotice(null);

    try {
      await reload(user);
    } catch (err: any) {
      setVerificationError(
        err?.message || 'Unable to check verification status right now. Please try again.'
      );
      return false;
    }

    const refreshedUser = auth.currentUser || user;
    setFirebaseUser(refreshedUser);
    const isNowVerified = Boolean(refreshedUser.emailVerified);
    setEmailVerified(isNowVerified);

    if (!isNowVerified) {
      setVerificationError(
        'Your email is still not verified. Please click the verification link sent to your inbox, then check again.'
      );
      return false;
    }

    await getIdToken(refreshedUser, true);
    setVerificationNotice(null);
    setVerificationError(null);
    setAuthError(null);
    return await resolveUserAuthData(refreshedUser, true);
  }, [resolveUserAuthData]);

  const resendVerificationEmail = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No active account session found. Please sign in again.');
    }

    await reload(user).catch(() => {});
    const current = auth.currentUser || user;
    if (current.emailVerified) {
      setEmailVerified(true);
      await getIdToken(current, true);
      await resolveUserAuthData(current, true);
      return;
    }

    await sendVerificationEmailSafe(current);
  }, [resolveUserAuthData, sendVerificationEmailSafe]);

  const retryAuthSync = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    setAuthError(null);
    await reload(user).catch(() => {});
    const refreshed = auth.currentUser || user;
    setFirebaseUser(refreshed);
    setEmailVerified(Boolean(refreshed.emailVerified));
    if (refreshed.emailVerified) {
      await resolveUserAuthData(refreshed, true);
    } else {
      resetAuthenticatedProfileState();
    }
    setLoading(false);
  }, [resetAuthenticatedProfileState, resolveUserAuthData]);

  const refreshUserRole = useCallback(async () => {
    const user = auth.currentUser;
    if (user && user.emailVerified) {
      await resolveUserAuthData(user, false);
    }
  }, [resolveUserAuthData]);

  useEffect(() => {
    getRedirectResult(auth)
      .then((cred) => {
        if (cred?.user) {
          console.log('Google redirect sign-in completed for:', cred.user.email);
        }
      })
      .catch((err) => {
        if (err?.code !== 'auth/null-user') {
          console.warn('Google redirect sign-in resolution notice:', err?.code || err?.message);
        }
      });

    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      const seq = ++authSeqRef.current;
      setLoading(true);
      await syncUserAfterAuthEvent(fbUser, seq);
    });

    return () => {
      authSeqRef.current += 1;
      unsubscribe();
    };
  }, [syncUserAfterAuthEvent]);

  // Automatically check verification when returning to this tab after clicking the link in another tab
  useEffect(() => {
    if (!firebaseUser || emailVerified) return;

    const handleVisibilityOrFocus = async () => {
      if (document.visibilityState === 'hidden') return;
      const now = Date.now();
      if (now - lastAutoCheckRef.current < 3000) return;
      lastAutoCheckRef.current = now;

      const user = auth.currentUser;
      if (!user || user.emailVerified) return;

      await reload(user).catch(() => {});
      const refreshed = auth.currentUser || user;
      if (refreshed.emailVerified) {
        setFirebaseUser(refreshed);
        setEmailVerified(true);
        setVerificationNotice(null);
        setVerificationError(null);
        await getIdToken(refreshed, true).catch(() => {});
        await resolveUserAuthData(refreshed, true);
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [firebaseUser, emailVerified, resolveUserAuthData]);

  const signInWithGoogle = async () => {
    try {
      setAuthError(null);
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        setFirebaseUser(res.user);
        setEmailVerified(Boolean(res.user.emailVerified));
        if (res.user.emailVerified) {
          await resolveUserAuthData(res.user, true);
        }
      }
      return res;
    } catch (error: any) {
      if (
        error?.code === 'auth/popup-closed-by-user' ||
        error?.code === 'auth/cancelled-popup-request'
      ) {
        console.warn('Google Sign-in popup closed by user.');
      } else {
        console.warn('Google Sign-in notice:', error?.code || error?.message);
      }
      throw error;
    }
  };

  const signInWithGoogleRedirect = async () => {
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      console.warn('Google redirect initiation notice:', error?.code || error?.message);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      setAuthError(null);
      setVerificationError(null);
      setVerificationNotice(null);
      const normalizedEmail = email.trim();
      if (!normalizedEmail) {
        throw new Error('Please enter a valid email address.');
      }
      const cred = await signInWithEmailAndPassword(auth, normalizedEmail, pass);
      if (cred.user) {
        await reload(cred.user).catch(() => {});
        const activeUser = auth.currentUser || cred.user;
        setFirebaseUser(activeUser);
        setEmailVerified(Boolean(activeUser.emailVerified));
        if (activeUser.emailVerified) {
          await resolveUserAuthData(activeUser, true);
        } else {
          resetAuthenticatedProfileState();
        }
      }
      return cred;
    } catch (error: any) {
      if (error?.code === 'auth/operation-not-allowed' || error?.message?.includes('auth/operation-not-allowed')) {
        console.warn('Firebase Email/Password provider is disabled. Directing to Google Sign-In.');
        const customError = new Error('Email & password sign-in is disabled for this project. Please sign in using Google.');
        (customError as any).code = 'auth/operation-not-allowed';
        throw customError;
      }

      console.warn('Authentication notice:', error?.code || error?.message);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      setAuthError(null);
      setVerificationError(null);
      setVerificationNotice(null);
      const normalizedEmail = email.trim();
      const normalizedName = name.trim().slice(0, 120);
      if (!normalizedEmail) {
        throw new Error('Please enter a valid email address.');
      }
      if (normalizedName.length < 2) {
        throw new Error('Please enter your full name.');
      }

      const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, pass);
      if (cred.user) {
        await updateProfile(cred.user, { displayName: normalizedName });
        setFirebaseUser(cred.user);
        setEmailVerified(Boolean(cred.user.emailVerified));
        resetAuthenticatedProfileState();

        // Dispatch verification email; if sending fails, keep the created session alive
        // so the user can resend without recreating the account. No Firestore writes occur yet.
        if (!cred.user.emailVerified) {
          await sendVerificationEmailSafe(cred.user);
        }
      }
      return cred;
    } catch (error: any) {
      if (error?.code === 'auth/operation-not-allowed' || error?.message?.includes('auth/operation-not-allowed')) {
        console.warn('Firebase Email/Password provider is disabled. Directing to Google Sign-In.');
        const customError = new Error('Email & password registration is disabled for this project. Please sign in using Google.');
        (customError as any).code = 'auth/operation-not-allowed';
        throw customError;
      }

      console.warn('Registration notice:', error?.code || error?.message);
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      setVerificationNotice(null);
      setVerificationError(null);
      setAuthError(null);
      await signOut(auth);
    } catch (error) {
      console.warn('Sign-out notice:', error);
      throw error;
    }
  };

  const needsEmailVerification = Boolean(firebaseUser && !emailVerified);
  const isAuthenticated = currentUser !== null && emailVerified && authError === null;
  const isStudent = role === 'student';
  const isOrganizer = role === 'organizer' || role === 'admin';
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        emailVerified,
        needsEmailVerification,
        authError,
        verificationNotice,
        verificationError,
        role,
        loading,
        isAuthenticated,
        isStudent,
        isOrganizer,
        isAdmin,
        hasPendingOrgRequest,
        signInWithGoogle,
        signInWithGoogleRedirect,
        signInWithEmail,
        signUpWithEmail,
        resendVerificationEmail,
        checkEmailVerification,
        retryAuthSync,
        clearVerificationMessages,
        signOutUser,
        refreshUserRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
