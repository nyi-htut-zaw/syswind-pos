import React, { useState, useRef } from 'react';
import { UploadCloud, ImagePlus, X, RefreshCw, Check, Link as LinkIcon } from 'lucide-react';
import { api } from '../api/client';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  labelMm?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label = 'Product Image',
  labelMm = 'ပစ္စည်းဓာတ်ပုံ တင်ရန်',
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to resize/compress image before uploading
  const processAndUploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WebP)');
      return;
    }

    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(0)} KB`);
    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const rawBase64 = e.target?.result as string;

        // Resize image via canvas to keep under 1200px max dimension
        const img = new Image();
        img.onload = async () => {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.85);

            // Upload to backend API
            try {
              const res = await api.post('/upload', {
                image: optimizedBase64,
                filename: file.name,
              });
              if (res.url) {
                onChange(res.url);
              } else {
                onChange(optimizedBase64);
              }
            } catch (uploadErr) {
              // Fallback to storing the optimized base64 directly
              onChange(optimizedBase64);
            }
          } else {
            onChange(rawBase64);
          }
          setUploading(false);
        };
        img.src = rawBase64;
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Failed to process image:', err);
      alert('Failed to upload image. Please try again.');
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setFileName('');
    setFileSize('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-slate-300 font-semibold text-xs flex items-center space-x-1.5">
          <span>{label}</span>
          {labelMm && <span className="text-[10px] text-brand-400 font-normal">({labelMm})</span>}
        </label>

        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[10px] text-slate-400 hover:text-brand-300 flex items-center space-x-1 transition-colors"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{showUrlInput ? 'Switch to File Upload' : 'Paste Image URL instead'}</span>
        </button>
      </div>

      {showUrlInput ? (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="https://example.com/images/product.jpg"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
          />
          {value && (
            <div className="flex items-center space-x-2 p-2 bg-slate-950/80 rounded-xl border border-slate-800">
              <img src={value} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-slate-700" />
              <div className="min-w-0 flex-1">
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1">
                  <Check className="w-3 h-3" />
                  <span>URL Image Loaded</span>
                </span>
                <p className="text-[10px] text-slate-400 truncate font-mono">{value}</p>
              </div>
              <button
                type="button"
                onClick={() => onChange('')}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />

          {value ? (
            /* Selected Image Preview Card */
            <div className="p-3 bg-slate-950/90 rounded-2xl border border-brand-500/30 flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/80 shrink-0 shadow-inner">
                  <img
                    src={value}
                    alt="Uploaded Product"
                    className="w-full h-full object-cover"
                  />
                  {uploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 text-brand-400 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center space-x-1 text-xs font-bold text-white truncate">
                    <span>{fileName || 'Product Photo'}</span>
                    <span className="text-[10px] text-emerald-400 font-normal bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                      Uploaded ✓
                    </span>
                  </div>
                  {fileSize && (
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{fileSize}</p>
                  )}
                  <p className="text-[10px] text-brand-400 font-medium">Ready for catalog & POS</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700 transition-colors flex items-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Change</span>
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Upload Dropzone */
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-slate-700 hover:border-slate-600 bg-slate-950/60 hover:bg-slate-950'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600/20 to-emerald-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 mb-2 shadow-inner">
                {uploading ? (
                  <RefreshCw className="w-6 h-6 animate-spin text-brand-400" />
                ) : (
                  <UploadCloud className="w-6 h-6 text-brand-400" />
                )}
              </div>

              <div className="text-xs font-bold text-white mb-0.5">
                {uploading ? 'Uploading and optimizing...' : 'Click to upload or drag & drop'}
              </div>
              <p className="text-[11px] text-slate-400">
                PNG, JPG, WebP (ကွန်ပျူတာ / ဖုန်းမှ ဓာတ်ပုံရွေးချယ်ပါ)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
