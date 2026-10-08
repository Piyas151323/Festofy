import React from 'react';

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-[#242730] bg-[#14161a] p-5 animate-pulse space-y-4"
        >
          <div className="h-44 w-full bg-[#1e222b] rounded-lg" />
          <div className="space-y-2">
            <div className="h-4 bg-[#1e222b] rounded w-1/4" />
            <div className="h-6 bg-[#1e222b] rounded w-3/4" />
          </div>
          <div className="h-4 bg-[#1e222b] rounded w-full" />
          <div className="h-4 bg-[#1e222b] rounded w-2/3" />
          <div className="pt-4 border-t border-[#242730] flex justify-between items-center">
            <div className="h-4 bg-[#1e222b] rounded w-1/3" />
            <div className="h-8 bg-[#1e222b] rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const DetailSkeleton: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse p-6">
      <div className="h-72 w-full bg-[#1e222b] rounded-2xl" />
      <div className="space-y-3">
        <div className="h-8 bg-[#1e222b] rounded w-2/3" />
        <div className="h-4 bg-[#1e222b] rounded w-1/3" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-[#1e222b] rounded w-full" />
        <div className="h-4 bg-[#1e222b] rounded w-5/6" />
        <div className="h-4 bg-[#1e222b] rounded w-4/6" />
      </div>
    </div>
  );
};

export const StatsGridSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-3 w-20 bg-[#1e222b] rounded" />
            <div className="h-4 w-4 bg-[#1e222b] rounded" />
          </div>
          <div className="h-7 w-16 bg-[#1e222b] rounded" />
          <div className="h-3 w-28 bg-[#1e222b] rounded" />
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-4 animate-pulse space-y-3">
      <div className="h-8 bg-[#191b20] rounded-xl w-full mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-3 border-b border-[#242730] last:border-0">
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-[#1e222b] rounded w-1/3" />
            <div className="h-3 bg-[#1e222b] rounded w-1/4" />
          </div>
          <div className="h-6 bg-[#1e222b] rounded w-24" />
        </div>
      ))}
    </div>
  );
};
