// app/InstanceContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { rtdb } from "../../lib/firebase";
import { ref, onValue, set, off, remove, get } from "firebase/database";
import type { DataSnapshot } from "firebase/database";
import type { Instance, InstanceType, User } from "../types";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createPublicRoom } from "@/app/utils/publicRooms";
import { createPrivateRoom } from "@/app/utils/privateRooms";

type InstanceFromDB = Omit<Instance, "id" | "users"> & { users?: Record<string, User> };

const InstanceContext = createContext<{
  instances: Instance[];
  currentInstance: Instance | null;
  joinInstance: (instanceId: string) => void;
  createInstance: (type: InstanceType, customUrl?: string) => void;
  leaveInstance: () => void;
  user: User;
  userReady: boolean;
  setPublicRoomInstance: (instance: Instance) => void;
}>({
  instances: [],
  currentInstance: null,
  joinInstance: () => {},
  createInstance: () => {},
  leaveInstance: () => {},
  user: { id: "", displayName: "", isPremium: false },
  userReady: false,
  setPublicRoomInstance: () => {},
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
        setUser({
          id: firebaseUser.uid,
          displayName: processDisplayName(firebaseUser),
          isPremium: false, // update if you have premium logic
        });
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
      // If currentInstance is set, update it with the latest data
      if (currentInstance) {
        const updated = list.find((inst) => inst.id === currentInstance.id);
        if (updated && JSON.stringify(updated) !== JSON.stringify(currentInstance)) {
          setCurrentInstance(updated);
        }
      }
    };
    onValue(instancesRef, handleValue);
    return () => off(instancesRef, "value", handleValue);
  }, [currentInstance]);

  // Create a new instance and join it
  const createInstance = useCallback(
    async (type: InstanceType, customUrl?: string) => {
      if (!userReady) {
        return;
      }
      
      if (type === "public") {
        // Use new PublicRooms system for public rooms
        try {
          const publicRoom = await createPublicRoom(user.id, customUrl);
          
          // Create a temporary Instance object for compatibility
          const tempInstance: Instance = {
            id: publicRoom.id,
            type: "public",
            users: [user],
            createdBy: publicRoom.createdBy,
            url: publicRoom.url,
          };
          setCurrentInstance(tempInstance);
        } catch {
          // Silent error handling - error details not needed
        }
      } else {
        // Use new PrivateRooms system for private rooms
        try {
          const privateRoom = await createPrivateRoom(user.id, customUrl || generateRoomUrl());
          
          // Create a temporary Instance object for compatibility
          const tempInstance: Instance = {
            id: privateRoom.id,
            type: "private",
            users: [user],
            createdBy: privateRoom.createdBy,
            url: privateRoom.url,
          };
          setCurrentInstance(tempInstance);
        } catch {
          // Silent error handling - error details not needed
        }
      }
    },
    [user, userReady]
  );

  // Join an existing instance
  const joinInstance = useCallback(
    (instanceId: string) => {
      if (!userReady) return;
      const instanceRef = ref(rtdb, `instances/${instanceId}/users/${user.id}`);
      set(instanceRef, user);
      // NOTE: Disconnect handling is now managed by RoomShell component with tab counting
      setCurrentInstance((prev) => {
        const inst = instances.find((i) => i.id === instanceId);
        if (!inst) return prev;
        // Add user if not already present
        const userExists = inst.users.some((u) => u.id === user.id);
        return userExists ? inst : { ...inst, users: [...inst.users, user] };
      });
    },
    [user, instances, userReady]
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

  // Set a PublicRoom as the current instance (for new PublicRooms system)
  const setPublicRoomInstance = useCallback((instance: Instance) => {
    setCurrentInstance(instance);
  }, []);

  return (
    <InstanceContext.Provider
      value={{ instances, currentInstance, joinInstance, createInstance, leaveInstance, user, userReady, setPublicRoomInstance }}
    >
      {children}
    </InstanceContext.Provider>
  );
};
