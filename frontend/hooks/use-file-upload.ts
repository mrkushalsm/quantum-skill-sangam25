'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UploadState {
  loading: boolean;
  progress: number;
  error: string | null;
  uploadedFiles: string[];
}

interface UseFileUploadOptions {
  maxFileSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
  showToast?: boolean;
}

export const useFileUpload = (options: UseFileUploadOptions = {}) => {
  const {
    maxFileSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxFiles = 5,
    showToast = true,
  } = options;

  const [state, setState] = useState<UploadState>({
    loading: false,
    progress: 0,
    error: null,
    uploadedFiles: [],
  });

  const { toast } = useToast();

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File size must be less than ${Math.round(maxFileSize / (1024 * 1024))}MB`;
    }

    // Check file type
    const isAllowed = allowedTypes.some(type => {
      if (type.includes('*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType);
      }
      return file.type === type;
    });

    if (!isAllowed) {
      return `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`;
    }

    return null;
  }, [maxFileSize, allowedTypes]);

  const uploadFiles = useCallback(async (
    files: FileList | File[],
    uploadFunction: (files: File[]) => Promise<any>
  ) => {
    const fileArray = Array.from(files);

    // Check file count
    if (fileArray.length > maxFiles) {
      const error = `Maximum ${maxFiles} files allowed`;
      setState(prev => ({ ...prev, error }));
      if (showToast) {
        toast({
          title: "Upload Error",
          description: error,
          variant: "destructive",
        });
      }
      return null;
    }

    // Validate each file
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setState(prev => ({ ...prev, error: validationError }));
        if (showToast) {
          toast({
            title: "File Validation Error",
            description: validationError,
            variant: "destructive",
          });
        }
        return null;
      }
    }

    setState(prev => ({
      ...prev,
      loading: true,
      progress: 0,
      error: null,
    }));

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
        }));
      }, 200);

      const response = await uploadFunction(fileArray);

      clearInterval(progressInterval);

      setState(prev => ({
        ...prev,
        loading: false,
        progress: 100,
        uploadedFiles: response.data?.files || response.data?.urls || [],
      }));

      if (showToast) {
        toast({
          title: "Upload Successful",
          description: `${fileArray.length} file(s) uploaded successfully`,
        });
      }

      return response.data;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        progress: 0,
        error: error.message || 'Upload failed',
      }));

      if (showToast) {
        toast({
          title: "Upload Failed",
          description: error.message || 'Failed to upload files',
          variant: "destructive",
        });
      }

      throw error;
    }
  }, [maxFiles, validateFile, showToast, toast]);

  const reset = useCallback(() => {
    setState({
      loading: false,
      progress: 0,
      error: null,
      uploadedFiles: [],
    });
  }, []);

  const removeFile = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((_, i) => i !== index),
    }));
  }, []);

  return {
    ...state,
    uploadFiles,
    reset,
    removeFile,
    validateFile,
  };
};

export default useFileUpload;
