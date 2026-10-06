import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase/config';
import { AuthContextType, UserProfile, UserRoleType } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firebase/errorHandler';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRoleType>('student');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const roleRef = doc(db, 'userRoles', firebaseUser.uid);

          const [userSnap, roleSnap] = await Promise.all([
            getDoc(userRef).catch(err => {
              console.warn('Error fetching user profile:', err);
              return null;
            }),
            getDoc(roleRef).catch(err => {
              console.warn('Error fetching user role:', err);
              return null;
            })
          ]);

          let profileData: UserProfile;

          if (!userSnap || !userSnap.exists()) {
            // New user registration profile initialization
            const newProfile = {
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Student Participant',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            await setDoc(userRef, newProfile).catch(err => {
              handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
            });
            profileData = {
              uid: firebaseUser.uid,
              ...newProfile
            };
          } else {
            const data = userSnap.data();
            profileData = {
              uid: firebaseUser.uid,
              displayName: data.displayName || firebaseUser.displayName || 'Student Participant',
              email: data.email || firebaseUser.email || '',
              photoURL: data.photoURL || firebaseUser.photoURL || '',
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString()
            };
          }

          // Authoritative role resolution from Firestore userRoles & organizationMembers collections.
          let assignedRole: UserRoleType = 'student';

          if (roleSnap && roleSnap.exists()) {
            const rData = roleSnap.data();
            if (rData?.role === 'organizer' || rData?.role === 'admin') {
              assignedRole = rData.role;
            }
          }

          // If still student, check if user has verified organization membership in organizationMembers
          if (assignedRole === 'student') {
            try {
              const memQuery = query(
                collection(db, 'organizationMembers'),
                where('userId', '==', firebaseUser.uid)
              );
              const memSnap = await getDocs(memQuery);
              if (!memSnap.empty) {
                assignedRole = 'organizer';
              }
            } catch (err) {
              console.warn('Error checking organization memberships:', err);
            }
          }

          if (!roleSnap || !roleSnap.exists()) {
            await setDoc(roleRef, {
              role: assignedRole,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }).catch(err => {
              handleFirestoreError(err, OperationType.WRITE, `userRoles/${firebaseUser.uid}`);
            });
          }

          setCurrentUser(profileData);
          setRole(assignedRole);
        } catch (err) {
          console.error('Failed to resolve authenticated user profile/role:', err);
          setCurrentUser({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          setRole('student');
        }
      } else {
        setCurrentUser(null);
        setRole('student');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google Sign-in failed:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error('Email sign-in failed:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (cred.user) {
        await updateProfile(cred.user, { displayName: name });
        const userRef = doc(db, 'users', cred.user.uid);
        const roleRef = doc(db, 'userRoles', cred.user.uid);
        const now = new Date().toISOString();

        await Promise.all([
          setDoc(userRef, {
            displayName: name,
            email,
            photoURL: '',
            createdAt: now,
            updatedAt: now
          }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${cred.user.uid}`)),
          setDoc(roleRef, {
            role: 'student',
            createdAt: now,
            updatedAt: now
          }).catch(err => handleFirestoreError(err, OperationType.WRITE, `userRoles/${cred.user.uid}`))
        ]);
      }
    } catch (error) {
      console.error('Email sign-up failed:', error);
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign-out failed:', error);
      throw error;
    }
  };

  const isAuthenticated = currentUser !== null;
  const isStudent = role === 'student';
  const isOrganizer = role === 'organizer' || role === 'admin';
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        loading,
        isAuthenticated,
        isStudent,
        isOrganizer,
        isAdmin,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOutUser
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
