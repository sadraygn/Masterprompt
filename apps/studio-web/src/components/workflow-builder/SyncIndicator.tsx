'use client';

interface SyncIndicatorProps {
  isSyncing: boolean;
  lastSync: Date | null;
}

export function SyncIndicator({ isSyncing, lastSync }: SyncIndicatorProps) {
  const formatLastSync = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      {isSyncing ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
          <span className="text-blue-600">Syncing...</span>
        </>
      ) : lastSync ? (
        <>
          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          <span className="text-gray-600">
            Last synced: {formatLastSync(lastSync)}
          </span>
        </>
      ) : (
        <>
          <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
          <span className="text-gray-500">Not synced</span>
        </>
      )}
    </div>
  );
}