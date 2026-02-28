// @system — File upload component with drag & drop support
import { useCallback, useRef, useState } from 'react'
import { Upload, X, File, Image, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/app/lib/@system/utils'
import { Button } from '@/app/components/@system/ui/button'



const FILE_ICONS = {
  image: <Image className="h-4 w-4 text-blue-500" />,
  pdf: <FileText className="h-4 w-4 text-red-500" />,
  text: <FileText className="h-4 w-4 text-gray-500" />,
  default: <File className="h-4 w-4 text-muted-foreground" /> }

function getFileIcon(file) {
  if (file.type.startsWith('image/')) return FILE_ICONS.image
  if (file.type === 'application/pdf') return FILE_ICONS.pdf
  if (file.type.startsWith('text/')) return FILE_ICONS.text
  return FILE_ICONS.default
}

function formatBytes(bytes){
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function generateId(){
  return Math.random().toString(36).slice(2, 10)
}

export function FileUpload({
  accept,
  maxSize = 10 * 1024 * 1024,
  multiple = true,
  onFiles,
  onRemove,
  files: externalFiles,
  disabled = false,
  className }) {
  const [isDragging, setIsDragging] = useState(false)
  const [internalFiles, setInternalFiles] = useState([])
  const [dragError, setDragError] = useState(null)
  const inputRef = useRef(null)

  const files = externalFiles ?? internalFiles

  const addFiles = useCallback(
    (incoming) => {
      const valid = []
      const errors = []

      incoming.forEach((file) => {
        if (file.size > maxSize) {
          errors.push(`"${file.name}" exceeds ${formatBytes(maxSize)} limit`)
          return
        }
        valid.push(file)
      })

      if (errors.length) {
        setDragError(errors.join('; '))
        setTimeout(() => setDragError(null), 4000)
      }

      if (!valid.length) return

      if (!externalFiles) {
        const newEntries = valid.map((file) => ({
          id: generateId(),
          file,
          status: 'pending',
          progress: 0 }))
        setInternalFiles((prev) => (multiple ? [...prev, ...newEntries] : newEntries))
      }

      onFiles?.(valid)
    },
    [maxSize, multiple, externalFiles, onFiles],
  )

  const handleDragEnter = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) setIsDragging(true)
    },
    [disabled],
  )

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    // Only clear drag state when leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      if (disabled) return

      const dropped = Array.from(e.dataTransfer.files)
      addFiles(multiple ? dropped : [dropped[0]])
    },
    [disabled, multiple, addFiles],
  )

  const handleInputChange = useCallback(
    (e) => {
      const selected = Array.from(e.target.files ?? [])
      addFiles(selected)
      // Reset so same file can be re-selected
      e.target.value = ''
    },
    [addFiles],
  )

  const handleRemove = useCallback(
    (id) => {
      if (!externalFiles) {
        setInternalFiles((prev) => prev.filter((f) => f.id !== id))
      }
      onRemove?.(id)
    },
    [externalFiles, onRemove],
  )

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="File upload drop zone"
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors',
          'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border bg-background hover:border-primary/60 hover:bg-accent/40',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
            isDragging ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
          )}
        >
          <Upload className="h-5 w-5" />
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">
            {isDragging ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-xs text-muted-foreground">
            or{' '}
            <span className="font-medium text-primary underline-offset-2 hover:underline">
              browse
            </span>{' '}
            to choose files
          </p>
          {(accept || maxSize) && (
            <p className="mt-1 text-xs text-muted-foreground">
              {accept && <span>Accepted · </span>}
              Max {formatBytes(maxSize)}
              {multiple ? ' per file' : ''}
            </p>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleInputChange}
          className="sr-only"
          aria-hidden="true"
        />
      </div>

      {/* Error banner */}
      {dragError && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{dragError}</span>
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <ul className="flex flex-col gap-2" role="list" aria-label="Selected files">
          {files.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center gap-3 rounded-md border bg-background px-3 py-2 text-sm"
            >
              {/* Icon */}
              <span className="shrink-0">{getFileIcon(entry.file)}</span>

              {/* Name + meta */}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium leading-none">{entry.file.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatBytes(entry.file.size)}
                </p>
                {/* Progress bar */}
                {entry.status === 'uploading' && (
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${entry.progress}%` }}
                    />
                  </div>
                )}
                {/* Error message */}
                {entry.status === 'error' && entry.error && (
                  <p className="mt-0.5 text-xs text-destructive">{entry.error}</p>
                )}
              </div>

              {/* Status badge */}
              <span className="shrink-0">
                {entry.status === 'success' && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                {entry.status === 'error' && (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
                {entry.status === 'uploading' && (
                  <span className="text-xs text-muted-foreground">{entry.progress}%</span>
                )}
              </span>

              {/* Remove button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemove(entry.id)}
                aria-label={`Remove ${entry.file.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
