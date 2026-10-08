import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Link as LinkIcon,
  Sparkles,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { uploadDirectImage } from '../../services/imageUploadService';

interface DirectImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  helperText?: string;
  placeholderUrl?: string;
  aspectRatio?: 'banner' | 'logo';
  required?: boolean;
}

const PRESET_BANNERS = [
  {
    title: 'Hackathon & Tech',
    category: 'Technology',
    url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80'
  },
  {
    title: 'Cultural Festival',
    category: 'Cultural',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80'
  },
  {
    title: 'Robotics & AI Expo',
    category: 'Engineering',
    url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&auto=format&fit=crop&q=80'
  },
  {
    title: 'Live Music & Concert',
    category: 'Music',
    url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80'
  },
  {
    title: 'Sports & Athletics',
    category: 'Sports',
    url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&auto=format&fit=crop&q=80'
  },
  {
    title: 'Business & Conclave',
    category: 'Management',
    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80'
  },
  {
    title: 'Design & Visual Arts',
    category: 'Arts',
    url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&auto=format&fit=crop&q=80'
  },
  {
    title: 'Esports Championship',
    category: 'Gaming',
    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80'
  }
];

const PRESET_LOGOS = [
  {
    title: 'Tech Society',
    url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=300&auto=format&fit=crop&q=80'
  },
  {
    title: 'Cultural Council',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&auto=format&fit=crop&q=80'
  },
  {
    title: 'Engineering Club',
    url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=300&auto=format&fit=crop&q=80'
  },
  {
    title: 'Athletic Union',
    url: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=300&auto=format&fit=crop&q=80'
  }
];

export const DirectImageUpload: React.FC<DirectImageUploadProps> = ({
  value,
  onChange,
  label = 'Banner Image',
  helperText,
  placeholderUrl = 'https://example.com/banner.jpg',
  aspectRatio = 'banner',
  required = false
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'preset' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const presets = aspectRatio === 'logo' ? PRESET_LOGOS : PRESET_BANNERS;

  const handleFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WebP, SVG, GIF).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size is too large (maximum 10MB).');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(10);

    try {
      const result = await uploadDirectImage(file, (progress) => {
        setUploadProgress(progress);
      });

      onChange(result.url);
      setUrlInputValue(result.url);
      setIsUploading(false);
      setUploadProgress(100);
    } catch (err: any) {
      console.warn('Direct upload warning:', err?.message || err);
      setUploadError(err?.message || 'Upload failed. You can retry or use a direct URL.');
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleUrlSubmit = () => {
    const trimmed = urlInputValue.trim();
    if (trimmed && !trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setUploadError('Image URL must start with http:// or https://');
      return;
    }
    setUploadError(null);
    onChange(trimmed);
  };

  const handleClear = () => {
    onChange('');
    setUrlInputValue('');
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {/* Header and Label */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <label className="block text-xs font-semibold text-zinc-300">
          {label} {required ? <span className="text-[#ff4f1a]">*</span> : <span className="text-zinc-500 font-normal">(Optional)</span>}
        </label>

        {/* Source Switcher Tabs */}
        <div className="flex items-center gap-1 bg-[#13151a] p-1 rounded-lg border border-[#262a34]">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-[#1e222b] text-[#ff4f1a] shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Direct Upload
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preset')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'preset'
                ? 'bg-[#1e222b] text-[#ff4f1a] shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Curated Presets
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'url'
                ? 'bg-[#1e222b] text-[#ff4f1a] shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Web Link
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {/* Existing Image Active Preview Card */}
      {value ? (
        <div className="relative rounded-xl border border-[#2e3442] bg-[#14161c] overflow-hidden group">
          <div
            className={`w-full bg-[#0d0e12] flex items-center justify-center relative overflow-hidden ${
              aspectRatio === 'logo' ? 'h-36 sm:h-44' : 'h-48 sm:h-56'
            }`}
          >
            <img
              src={value}
              alt="Uploaded visual preview"
              className={`max-h-full max-w-full object-cover transition-transform duration-300 group-hover:scale-[1.01] ${
                aspectRatio === 'logo' ? 'rounded-lg p-2 max-h-32 max-w-32 object-contain bg-[#191b20]' : 'w-full h-full object-cover'
              }`}
              onError={(e) => {
                // Handle broken link fallback
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80';
              }}
            />

            {/* Gradient Overlay for subtle depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 pointer-events-none" />

            {/* Bottom Meta & Action Bar */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-2 bg-[#0d0e12]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[11px] text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate max-w-[200px] font-mono">
                  {value.startsWith('https://ucarecdn.com') ? 'Direct CDN Uploaded' : 'Image Configured'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-[#191b20]/90 hover:bg-[#242730] border border-white/15 text-white text-[11px] font-medium rounded-lg transition-colors flex items-center gap-1 shadow-sm backdrop-blur-md"
                >
                  <RefreshCw className="w-3 h-3 text-[#ff4f1a]" />
                  Replace
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 bg-red-950/70 hover:bg-red-900 border border-red-800/40 text-red-200 rounded-lg transition-colors shadow-sm backdrop-blur-md"
                  title="Remove image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty / Uploading State */
        <div className="space-y-2">
          {activeTab === 'upload' && (
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`cursor-pointer border-2 border-dashed rounded-xl p-6 transition-all duration-200 text-center flex flex-col items-center justify-center gap-3 ${
                dragActive
                  ? 'border-[#ff4f1a] bg-[#ff4f1a]/10 scale-[1.01]'
                  : isUploading
                  ? 'border-[#2e3442] bg-[#14161c] cursor-wait'
                  : 'border-[#2e3442] hover:border-[#ff4f1a]/60 bg-[#14161c]/60 hover:bg-[#191b20]'
              }`}
            >
              {isUploading ? (
                <div className="w-full max-w-xs space-y-3 py-2">
                  <div className="w-10 h-10 rounded-full bg-[#ff4f1a]/10 border border-[#ff4f1a]/30 flex items-center justify-center mx-auto text-[#ff4f1a] animate-spin">
                    <Loader2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-white">Uploading & Optimizing...</p>
                    <p className="text-[11px] text-zinc-400">Processing direct image upload</p>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-[#242730] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#ff4f1a] to-orange-400 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-[#1e222b] border border-[#2e3442] flex items-center justify-center text-[#ff4f1a] shadow-inner group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <p className="text-xs font-semibold text-zinc-200">
                      Drag and drop your {aspectRatio === 'logo' ? 'logo' : 'poster banner'}, or{' '}
                      <span className="text-[#ff4f1a] underline underline-offset-2">browse files</span>
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Supports JPG, PNG, WebP, SVG, GIF up to 10MB. Automatically optimized for retina displays.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Curated Presets Tab */}
          {activeTab === 'preset' && (
            <div className="rounded-xl border border-[#2e3442] bg-[#14161c] p-3 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span className="font-medium text-zinc-300">Select a high-resolution festival poster:</span>
                <span>8 themes available</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {presets.map((preset, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      onChange(preset.url);
                      setUrlInputValue(preset.url);
                    }}
                    className="group relative rounded-lg overflow-hidden border border-[#2e3442] hover:border-[#ff4f1a] bg-[#191b20] text-left transition-all hover:scale-[1.02]"
                  >
                    <div className="h-16 w-full overflow-hidden bg-zinc-900">
                      <img
                        src={preset.url}
                        alt={preset.title}
                        className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                      />
                    </div>
                    <div className="p-1.5">
                      <p className="text-[11px] font-semibold text-zinc-200 truncate">{preset.title}</p>
                      {'category' in preset && typeof (preset as any).category === 'string' && (
                        <p className="text-[9px] text-[#ff4f1a] uppercase tracking-wider font-mono">
                          {(preset as any).category}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Web Link Tab */}
          {activeTab === 'url' && (
            <div className="rounded-xl border border-[#2e3442] bg-[#14161c] p-3.5 space-y-2.5">
              <div className="relative">
                <ImageIcon className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  maxLength={500}
                  placeholder={placeholderUrl}
                  value={urlInputValue}
                  onChange={(e) => setUrlInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleUrlSubmit();
                    }
                  }}
                  className="w-full bg-[#191b20] border border-[#2e3442] rounded-xl pl-10 pr-24 py-2.5 text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a] transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={handleUrlSubmit}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#ff4f1a] hover:bg-[#e04010] text-white text-[11px] font-semibold rounded-lg transition-colors"
                >
                  Apply
                </button>
              </div>
              <p className="text-[11px] text-zinc-500">
                Paste any publicly accessible HTTP/HTTPS image URL (under 500 characters).
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error Notice */}
      {uploadError && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="flex-1 text-[11px]">{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-[11px] underline text-red-200 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Helper text if provided */}
      {helperText && !uploadError && (
        <span className="block text-[11px] text-[#656c80]">{helperText}</span>
      )}
    </div>
  );
};
