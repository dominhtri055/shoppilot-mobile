import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getStoreSettings } from "../api/storeSettingsApi";
import { useAuth } from "./AuthContext";
import {
  createDefaultStoreSettings,
  type StoreSettings,
} from "../types/storeSettings";

type StoreSettingsContextValue = {
  settings: StoreSettings;
  loading: boolean;
  errorMessage: string | null;
  refresh: () => Promise<StoreSettings | null>;
  replaceSettings: (settings: StoreSettings) => void;
};

const StoreSettingsContext = createContext<
  StoreSettingsContextValue | undefined
>(undefined);

function getFullName(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function StoreSettingsProvider({ children }: PropsWithChildren) {
  const { session, user } = useAuth();
  const fallbackSettings = useMemo(
    () =>
      createDefaultStoreSettings(
        user?.id ?? "",
        user?.email ?? "",
        getFullName(user?.user_metadata?.full_name)
      ),
    [user?.email, user?.id, user?.user_metadata?.full_name]
  );
  const [settings, setSettings] = useState<StoreSettings>(fallbackSettings);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!session?.access_token || !user?.id) {
      setSettings(fallbackSettings);
      setErrorMessage(null);
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      const nextSettings = await getStoreSettings(
        user.id,
        session.access_token
      );
      setSettings(nextSettings);
      return nextSettings;
    } catch (error) {
      setSettings(fallbackSettings);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Store settings could not be loaded."
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, [fallbackSettings, session?.access_token, user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<StoreSettingsContextValue>(
    () => ({
      settings,
      loading,
      errorMessage,
      refresh,
      replaceSettings: setSettings,
    }),
    [errorMessage, loading, refresh, settings]
  );

  return (
    <StoreSettingsContext.Provider value={value}>
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  const context = useContext(StoreSettingsContext);

  if (!context) {
    throw new Error(
      "useStoreSettings must be used inside StoreSettingsProvider."
    );
  }

  return context;
}
