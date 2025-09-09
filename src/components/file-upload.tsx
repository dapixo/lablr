'use client'

import { AlertCircle, FileText, Upload } from 'lucide-react'
import type React from 'react'
import { useCallback, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ACCEPTED_FILE_TYPES, ERROR_MESSAGES, MAX_FILE_SIZE_BYTES } from '@/constants'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFileContent: (content: string, filename: string) => void
  className?: string
}

export function FileUpload({ onFileContent, className }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(
    async (file: File) => {
      setIsLoading(true)
      setError(null)

      try {
        // Vérifier le type de fichier
        if (!ACCEPTED_FILE_TYPES.some(type => file.name.toLowerCase().endsWith(type))) {
          throw new Error(ERROR_MESSAGES.INVALID_FILE_TYPE)
        }

        // Vérifier la taille
        if (file.size > MAX_FILE_SIZE_BYTES) {
          throw new Error(ERROR_MESSAGES.FILE_TOO_LARGE)
        }

        const content = await file.text()

        if (!content.trim()) {
          throw new Error(ERROR_MESSAGES.FILE_EMPTY)
        }

        onFileContent(content, file.name)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors de la lecture du fichier'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    },
    [onFileContent]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFile(files[0])
      }
    },
    [handleFile]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length > 0) {
        handleFile(files[0])
      }
      // Reset input value pour pouvoir sélectionner le même fichier
      e.target.value = ''
    },
    [handleFile]
  )

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Import du rapport Amazon Seller
        </CardTitle>
        <CardDescription>
          Glissez-déposez ou sélectionnez votre rapport Amazon Seller (.txt au format TSV)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          role="button"
          tabIndex={0}
          className={cn(
            'relative rounded-lg border-2 border-dashed p-8 text-center transition-colors',
            isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
            isLoading && 'pointer-events-none opacity-50'
          )}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
        >
          <input
            type="file"
            accept=".txt"
            onChange={handleFileInput}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            disabled={isLoading}
          />

          <div className="flex flex-col items-center gap-4">
            <Upload
              className={cn('h-10 w-10', isDragOver ? 'text-primary' : 'text-muted-foreground')}
            />

            <div className="space-y-2">
              <p className="text-lg font-medium">
                {isLoading ? 'Traitement en cours...' : 'Glissez votre fichier ici'}
              </p>
              <p className="text-sm text-muted-foreground">
                ou cliquez pour parcourir vos fichiers
              </p>
            </div>

            {!isLoading && <Button variant="secondary">Sélectionner un fichier</Button>}
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
