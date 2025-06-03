'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  loadingMessage?: string;
}

export const useApi = <T = any>(options: UseApiOptions = {}) => {
  const {
    showSuccessToast = false,
    showErrorToast = true,
    successMessage = 'Operation completed successfully',
    loadingMessage = 'Processing...'
  } = options;

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const { toast } = useToast();

  const execute = useCallback(async (
    apiCall: () => Promise<any>,
    customOptions?: Partial<UseApiOptions>
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    const finalOptions = { ...options, ...customOptions };

    try {
      const response = await apiCall();
      const data = response.data;

      setState({
        data,
        loading: false,
        error: null,
      });

      if (finalOptions.showSuccessToast) {
        toast({
          title: "Success",
          description: finalOptions.successMessage || successMessage,
        });
      }

      return data;
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });

      if (finalOptions.showErrorToast) {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }

      throw error;
    }
  }, [options, successMessage, toast]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
};

// Specialized hooks for different API operations
export const useWelfareApi = () => {
  return useApi({
    showSuccessToast: true,
    successMessage: 'Welfare operation completed successfully',
  });
};

export const useEmergencyApi = () => {
  return useApi({
    showSuccessToast: true,
    showErrorToast: true,
    successMessage: 'Emergency alert processed successfully',
  });
};

export const useMarketplaceApi = () => {
  return useApi({
    showSuccessToast: true,
    successMessage: 'Marketplace operation completed successfully',
  });
};

export const useGrievanceApi = () => {
  return useApi({
    showSuccessToast: true,
    successMessage: 'Grievance operation completed successfully',
  });
};

export const useAuthApi = () => {
  return useApi({
    showSuccessToast: false, // Auth operations handle their own toasts
    showErrorToast: false,
  });
};

export default useApi;
