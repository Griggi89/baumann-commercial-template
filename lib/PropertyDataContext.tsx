'use client';

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// PropertyData React Context
// Provides property data from Google Sheets to all dashboard components.
//
// Supports two modes:
//   1. SSG mode â receives pre-fetched data via `initialData` prop (no API call)
//   2. Legacy mode â fetches from /api/sheet-data on mount (backward compat)
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { defaultPropertyData, type PropertyData } from './propertyData';

interface PropertyDataContextValue {
  data: PropertyData;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const PropertyDataContext = createContext<PropertyDataContextValue>({
  data: defaultPropertyData,
  loading: true,
  error: null,
  refresh: () => {},
});

interface PropertyDataProviderProps {
  children: ReactNode;
  /** Pre-fetched data from SSG â if provided, skips the API call */
  initialData?: PropertyData;
}

export function PropertyDataProvider({ children, initialData }: PropertyDataProviderProps) {
  const [data, setData] = useState<PropertyData>(initialData ?? defaultPropertyData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/sheet-data');
      if (!res.ok) {
        // If no sheet configured, use defaults silently
        if (res.status === 404) {
          setData(defaultPropertyData);
        } else {
          throw new Error(`Failed to fetch: ${res.status}`);
        }
      } else {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.warn('[PropertyData] Could not load sheet data, using defaults:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setData(defaultPropertyData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If initialData was provided (SSG), skip the API fetch
    if (!initialData) {
      fetchData();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <PropertyDataContext.Provider value={{ data, loading, error, refresh: fetchData }}>
      {children}
    </PropertyDataContext.Provider>
  );
}

/** Hook to access property data from Google Sheets */
export function usePropertyData(): PropertyData {
  return useContext(PropertyDataContext).data;
}

/** Hook to access loading/error state */
export function usePropertyDataStatus() {
  const { loading, error, refresh } = useContext(PropertyDataContext);
  return { loading, error, refresh };
}
