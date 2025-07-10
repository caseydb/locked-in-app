// app/InstanceContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { rtdb } from "../../lib/firebase";
import { ref, onValue, push, set, off, remove, get } from "firebase/database";
import type { DataSnapshot } from "firebase/database";
import type { Instance, InstanceType, User } from "../types";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";

type InstanceFromDB = Omit<Instance, "id" | "users"> & { users?: Record<string, User> };

const InstanceContext = createContext<{
  instances: Instance[];
  currentInstance: Instance | null;
  joinInstance: (instanceId: string) => void;
  createInstance: (type: InstanceType, customUrl?: string) => void;
  leaveInstance: () => void;
  user: User;
  userReady: boolean;
}>({
  instances: [],
  currentInstance: null,
  joinInstance: () => {},
  createInstance: () => {},
  leaveInstance: () => {},
  user: { id: "", displayName: "", isPremium: false },
  userReady: false,
});

export const useInstance = () => useContext(InstanceContext);

// Generate a unique user for this session
function getOrCreateUser(): User {
  if (typeof window === "undefined") return { id: "", displayName: "", isPremium: false };
  const user = window.sessionStorage.getItem("mockUser");
  if (user) return JSON.parse(user);
  const newUser = {
    id: `user-${Math.random().toString(36).slice(2, 10)}`,
    displayName: `User ${Math.floor(Math.random() * 1000)}`,
    isPremium: false,
  };
  window.sessionStorage.setItem("mockUser", JSON.stringify(newUser));
  return newUser;
}

// Process display name from auth
function processDisplayName(firebaseUser: { displayName?: string | null; email?: string | null }): string {
  // Use displayName if available
  if (firebaseUser.displayName) {
    return firebaseUser.displayName;
  }

  // Process email if available
  if (firebaseUser.email) {
    const username = firebaseUser.email.split("@")[0];
    // Capitalize first letter and keep the rest as is
    return username.charAt(0).toUpperCase() + username.slice(1);
  }

  return "Anonymous";
}

// Generate a random readable URL for the room
function generateRoomUrl(): string {
  const adjectives = ["swift", "bright", "calm", "bold", "cool", "fast", "kind", "warm", "zen"];
  const nouns = ["tiger", "eagle", "wolf", "bear", "fox", "lion", "hawk", "shark", "deer", "owl", "kiwi"];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 1000);
  return `${adjective}-${noun}-${number}`;
}

export const InstanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [currentInstance, setCurrentInstance] = useState<Instance | null>(null);
  const [user, setUser] = useState<User>(getOrCreateUser());
  const [userReady, setUserReady] = useState(false);

  // Update user from Firebase Auth if signed in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser((prevUser) => ({
          id: firebaseUser.uid,
          displayName: firebaseUser.displayName || processDisplayName(firebaseUser),
          isPremium: prevUser?.isPremium || false,
        }));
        setUserReady(true);
      } else {
        setUser(getOrCreateUser());
        setUserReady(true);
      }
    });
    return () => unsub();
  }, []);

  // Listen for real-time updates to instances
  useEffect(() => {
    const instancesRef = ref(rtdb, "instances");
    const handleValue = (snapshot: DataSnapshot) => {
      const data = snapshot.val() || {};
      const list: Instance[] = Object.entries(data).map(([id, value]) => {
        const v = value as InstanceFromDB;
        return {
          id,
          ...v,
          users: v.users ? Object.values(v.users) : [],
        };
      });
      setInstances(list);
      // Always check if we should update currentInstance
      setCurrentInstance(prev => {
        if (!prev) return prev;
        const updated = list.find((inst) => inst.id === prev.id);
        return updated || prev;
      });
    };
    onValue(instancesRef, handleValue);
    return () => off(instancesRef, "value", handleValue);
  }, []);

  // Set currentInstance when we detect our user in a room
  useEffect(() => {
    if (!user?.id || !userReady || currentInstance) return;
    
    // Check if user is in any instance
    const instanceWithUser = instances.find(inst => 
      inst.users.some(u => u.id === user.id)
    );
    
    if (instanceWithUser) {
      setCurrentInstance(instanceWithUser);
    }
  }, [instances, user?.id, userReady, currentInstance]);

  // Listen for real-time updates to current user's data in the instance
  useEffect(() => {
    if (!currentInstance || !user?.id || !userReady) return;
    
    const userRef = ref(rtdb, `instances/${currentInstance.id}/users/${user.id}`);
    const handleUserUpdate = async (snapshot: DataSnapshot) => {
      const userData = snapshot.val();
      if (userData && userData.displayName !== user.displayName) {
        // Update local state
        setUser(prevUser => ({
          ...prevUser,
          displayName: userData.displayName
        }));
        
        // Also update Firebase Auth profile if it's different
        if (auth.currentUser && auth.currentUser.displayName !== userData.displayName) {
          try {
            await updateProfile(auth.currentUser, { displayName: userData.displayName });
          } catch (error) {
            console.error("Error syncing display name to auth:", error);
          }
        }
      }
    };
    
    onValue(userRef, handleUserUpdate);
    return () => off(userRef, "value", handleUserUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentInstance?.id, user?.id, userReady]);

  // Create a new instance and join it
  const createInstance = useCallback(
    (type: InstanceType, customUrl?: string) => {
      if (!userReady) return;
      const instancesRef = ref(rtdb, "instances");
      const newInstanceRef = push(instancesRef);
      const roomUrl = customUrl || generateRoomUrl();
      const newInstance: Omit<Instance, "id" | "users"> & { users: { [id: string]: User } } = {
        type,
        users: { [user.id]: user },
        createdBy: user.id,
        url: roomUrl,
      };
      set(newInstanceRef, newInstance);
      // NOTE: Disconnect handling is now managed by RoomShell component with tab counting
      setCurrentInstance({ ...newInstance, id: newInstanceRef.key!, users: [user] });
    },
    [user, userReady]
  );

  // Join an existing instance
  const joinInstance = useCallback(
    (instanceId: string) => {
      if (!userReady) return;
      const instanceRef = ref(rtdb, `instances/${instanceId}/users/${user.id}`);
      set(instanceRef, {
        id: user.id,
        displayName: user.displayName,
        isPremium: user.isPremium || false
      });
      
      // Set currentInstance immediately with the instance we're joining
      // The real-time listener will update it with the latest data
      const targetInstance = instances.find(i => i.id === instanceId);
      if (targetInstance) {
        setCurrentInstance(targetInstance);
      }
    },
    [user, userReady, instances]
  );

  // Leave the current instance
  const leaveInstance = useCallback(() => {
    if (!currentInstance) return;
    const instanceToLeave = currentInstance; // Store reference before setting to null
    const userRef = ref(rtdb, `instances/${instanceToLeave.id}/users/${user.id}`);
    remove(userRef).then(() => {
      // After removing user, check if any users remain
      const usersRef = ref(rtdb, `instances/${instanceToLeave.id}/users`);
      get(usersRef).then((snapshot) => {
        if (!snapshot.exists() && instanceToLeave.type === "public") {
          // No users left and it's a public room, delete the room
          const instanceRef = ref(rtdb, `instances/${instanceToLeave.id}`);
          remove(instanceRef);
        }
      });
    });
  }, [currentInstance, user]);

  return (
    <InstanceContext.Provider
      value={{ instances, currentInstance, joinInstance, createInstance, leaveInstance, user, userReady }}
    >
      {children}
    </InstanceContext.Provider>
  );
};
