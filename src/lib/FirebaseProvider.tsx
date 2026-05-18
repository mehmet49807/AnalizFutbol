import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  tokens: number;
  points: number;
  role: 'user' | 'admin';
  profilePictureUrl?: string;
  bio?: string;
  country?: string;
  totalAdsWatched?: number;
  dailyTokensEarned?: number;
  lastEarnedDate?: string;
  favoriteLeagues?: string[];
}

interface FirebaseContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
}

const FirebaseContext = createContext<FirebaseContextType>({
  user: null,
  profile: null,
  loading: true,
});

export const useFirebase = () => useContext(FirebaseContext);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Cleanup previous profile listener
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      setUser(firebaseUser);
      setLoading(true);

      if (firebaseUser) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          
          let hasInitialized = false;

          unsubscribeProfile = onSnapshot(userRef, async (snapshot) => {
            if (!snapshot.exists() && !hasInitialized) {
              hasInitialized = true;
              // Creation logic
              const isAdmin = firebaseUser.email === 'admin@test.com' || 
                              firebaseUser.email === 'mehmet498000@gmail.com' ||
                              localStorage.getItem('is_admin_setup') === 'true';

              let country = 'Bilinmiyor';
              try {
                const geoResponse = await fetch('https://ipapi.co/json/');
                const geoData = await geoResponse.json();
                country = geoData.country_name || 'Bilinmiyor';
              } catch (e) {
                console.error("Geoloaction fetch error:", e);
              }

              const newProfile = {
                userId: firebaseUser.uid,
                name: firebaseUser.displayName || (isAdmin ? 'System Admin' : 'Anonim'),
                email: firebaseUser.email || '',
                tokens: isAdmin ? 1000000 : 50,
                points: isAdmin ? 9999 : 0,
                role: isAdmin ? 'admin' as const : 'user' as const,
                profilePictureUrl: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'A')}&background=random`,
                bio: '',
                country: country,
                totalAdsWatched: 0,
                dailyTokensEarned: 0,
                lastEarnedDate: new Date().toISOString().split('T')[0],
                createdAt: new Date().toISOString(),
              };
              
              try {
                await setDoc(userRef, newProfile);
                setProfile(newProfile as UserProfile);
                localStorage.removeItem('is_admin_setup');
              } catch (err) {
                console.error("Error creating profile:", err);
              }
            } else if (snapshot.exists()) {
              const data = snapshot.data() as UserProfile;
              
              // Auto-upgrade mehmet498000@gmail.com to admin
              if (firebaseUser.email === 'mehmet498000@gmail.com' && data.role !== 'admin') {
                const updatedData = { ...data, role: 'admin' as const };
                await setDoc(userRef, updatedData, { merge: true });
                setProfile(updatedData);
              } else {
                setProfile(data);
              }
            }
            setLoading(false);
          }, (err) => {
            console.error("Profile snapshot error:", err);
            setLoading(false);
          });
        } catch (error) {
          console.error("Profile sync error:", error);
          setLoading(false);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  return (
    <FirebaseContext.Provider value={{ user, profile, loading }}>
      {children}
    </FirebaseContext.Provider>
  );
};
