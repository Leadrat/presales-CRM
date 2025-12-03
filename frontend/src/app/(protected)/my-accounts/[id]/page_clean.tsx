// This file will contain only the content up to line 833 to fix the corruption
// We'll then replace the original file with this clean version
import { useEffect } from "react";

function TabLoader({ label, loading, error, onLoad, children }: TabLoaderProps) {
  useEffect(() => {
    void onLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900/70 p-6 text-center shadow-sm">
        <p className="text-sm text-gray-400">Loading {label}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/40 bg-red-900/40 p-6 text-center shadow-sm">
        <p className="text-sm text-red-200">{error}</p>
      </div>
    );
  }

  return <>{children}</>;
}

