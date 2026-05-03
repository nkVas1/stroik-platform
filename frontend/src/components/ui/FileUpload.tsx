'use client';

import * as React from 'react';
import { Upload, X, FileText, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileUploadProps {
  /** Called with newly-added files (cumulative if multiple=true) */
  onChange: (files: File[]) => void;
  /** Current list of selected files */
  value?: File[];
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // bytes
  className?: string;
  label?: string;
  hint?: string;
  disabled?: boolean;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10 MB

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isImage(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * FileUpload — drag-and-drop or click file picker.
 * Brutalism design consistent with the project UI kit.
 */
export function FileUpload({
  onChange,
  value = [],
  accept,
  multiple = false,
  maxSize = DEFAULT_MAX_SIZE,
  className,
  label = 'Перетащите файлы сюда или нажмите',
  hint,
  disabled = false,
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [errors, setErrors] = React.useState<string[]>([]);

  const handleFiles = React.useCallback(
    (incoming: FileList | null) => {
      if (!incoming) return;
      const newErrors: string[] = [];
      const valid: File[] = [];

      Array.from(incoming).forEach((file) => {
        if (file.size > maxSize) {
          newErrors.push(`${file.name}: слишком большой (макс. ${formatSize(maxSize)})`);
          return;
        }
        valid.push(file);
      });

      setErrors(newErrors);
      if (valid.length > 0) {
        onChange(multiple ? [...value, ...valid] : [valid[0]]);
      }
    },
    [maxSize, multiple, onChange, value]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) handleFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    const next = value.filter((_, i) => i !== index);
    onChange(next);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Загрузить файл"
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-brutal border-2 border-dashed',
          'border-black dark:border-gray-600 bg-surface-cardLight dark:bg-surface-cardDark',
          'py-8 px-4 text-center transition-colors cursor-pointer select-none',
          isDragging && 'border-brand bg-brand/5',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'hover:border-brand hover:bg-brand/5',
        )}
      >
        <Upload size={24} className={cn('text-gray-400', isDragging && 'text-brand')} />
        <p className="text-xs font-black uppercase">{label}</p>
        {hint && <p className="text-[10px] font-bold text-gray-400">{hint}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        disabled={disabled}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Error messages */}
      {errors.map((err, i) => (
        <p key={i} className="text-[10px] font-bold text-red-600">{err}</p>
      ))}

      {/* Selected files list */}
      {value.length > 0 && (
        <ul className="space-y-1">
          {value.map((file, i) => (
            <li
              key={i}
              className="flex items-center gap-2 rounded-brutal border-2 border-black px-3 py-2 bg-surface-cardLight dark:bg-surface-cardDark"
            >
              {isImage(file)
                ? <Image size={14} className="shrink-0 text-brand" />
                : <FileText size={14} className="shrink-0 text-gray-500" />}
              <span className="flex-1 text-xs font-bold truncate">{file.name}</span>
              <span className="text-[10px] font-bold text-gray-400 shrink-0">{formatSize(file.size)}</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="shrink-0 p-0.5 rounded hover:text-red-500 transition-colors"
                aria-label="Удалить файл"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
