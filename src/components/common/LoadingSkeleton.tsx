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
