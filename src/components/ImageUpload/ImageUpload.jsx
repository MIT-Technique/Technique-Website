'use client';

import { useState, useRef } from 'react';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function ImageUpload({ imageUrl, onUpload, onDelete, disabled, label, fileName }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [localUrl, setLocalUrl] = useState(null);
  const inputRef = useRef(null);

  function validate(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.';
    }
    if (file.size > MAX_SIZE) {
      return 'File too large. Maximum size is 5MB.';
    }
    return null;
  }

  async function handleFile(file) {
    if (!file) return;
    const err = validate(file);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setUploading(true);
    try {
      const url = await onUpload(file);
      if (url) setLocalUrl(url);
    } catch (e) {
      setError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  async function handleDelete() {
    setError('');
    setUploading(true);
    try {
      await onDelete();
      setLocalUrl(null);
    } catch (e) {
      setError(e.message || 'Delete failed');
    } finally {
      setUploading(false);
    }
  }

  const displayUrl = localUrl || imageUrl;

  if (displayUrl) {
    return (
      <div className="flex flex-col gap-1">
        {label && <span className="text-xs font-medium text-text-muted">{label}</span>}
        <div className="relative inline-block">
          <img
            src={displayUrl}
            alt={label || 'Uploaded image'}
            title={fileName || ''}
            className="w-32 h-32 object-cover rounded border border-border"
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={uploading}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-700 disabled:opacity-50"
              aria-label="Remove image"
            >
              ✕
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-xs font-medium text-text-muted">{label}</span>}
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled && !uploading) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        className={`w-32 h-32 border-2 border-dashed rounded flex items-center justify-center cursor-pointer transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed border-gray-300' :
          dragOver ? 'border-[#750014] bg-red-50' :
          'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          disabled={disabled || uploading}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {uploading ? (
          <span className="text-xs text-text-muted">Uploading...</span>
        ) : (
          <span className="text-xs text-text-muted text-center px-2">Click or drop image</span>
        )}
      </div>
      {error && <p className="text-xs text-red-600 max-w-[128px]">{error}</p>}
    </div>
  );
}
