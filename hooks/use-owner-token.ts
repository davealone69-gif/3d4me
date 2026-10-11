import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const OWNER_TOKEN_KEY = "figural.owner-token.v1";

function createOwnerToken() {
  const suffix = Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 10)).join("");
  return `fg_${Date.now().toString(36)}_${suffix}`;
}

export function useOwnerToken() {
  const [ownerToken, setOwnerToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const existing = await AsyncStorage.getItem(OWNER_TOKEN_KEY);
      const token = existing ?? createOwnerToken();
      if (!existing) await AsyncStorage.setItem(OWNER_TOKEN_KEY, token);
      if (active) {
        setOwnerToken(token);
        setReady(true);
      }
    })().catch(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  return { ownerToken, ready };
}
