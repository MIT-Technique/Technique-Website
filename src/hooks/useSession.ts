import { SessionData } from "../lib/lib";
import { useEffect, useState } from "react";

// TODO: Remove this hardcoded session for production
const TESTING_MODE = true;

export default function useSession() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // Hardcoded session for testing
    if (TESTING_MODE) {
      setSession({
        isLoggedIn: true,
        userInfo: {
          email: "grogo@mit.edu",
          name: "Grogo",
        },
      } as SessionData);
      setLoading(false);
      return;
    }

    const fetchSession = async () => {
      try {
        const response = await fetch("/api/session");
        if (response.ok) {
          const session = (await response.json()) as SessionData;
          setSession(session);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, []);
  return { session, loading };
}
