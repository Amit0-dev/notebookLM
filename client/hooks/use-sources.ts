"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createSource,
  deleteSource,
  importWebsite,
  importYoutube,
  listSources,
  sourceKeys,
  uploadPdf,
} from "@/lib/api/sources";
import type {
  CreateSourceInput,
  ImportWebsiteInput,
  ImportYoutubeInput,
  ListSourcesQuery,
} from "@/lib/validators/source";

export function useSources(workspaceId: string, query?: ListSourcesQuery) {
  return useQuery({
    queryKey: sourceKeys.list(workspaceId, query),
    queryFn: () => listSources(workspaceId, query),
    enabled: Boolean(workspaceId),
  });
}

export function useCreateSource(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSourceInput) =>
      createSource(workspaceId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: sourceKeys.lists(workspaceId),
      });
    },
  });
}

export function useImportWebsite(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ImportWebsiteInput) =>
      importWebsite(workspaceId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: sourceKeys.lists(workspaceId),
      });
    },
  });
}

export function useImportYoutube(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ImportYoutubeInput) =>
      importYoutube(workspaceId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: sourceKeys.lists(workspaceId),
      });
    },
  });
}

export function useUploadPdf(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, title }: { file: File; title?: string }) =>
      uploadPdf(workspaceId, file, title),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: sourceKeys.lists(workspaceId),
      });
    },
  });
}

export function useDeleteSource(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sourceId: string) => deleteSource(workspaceId, sourceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: sourceKeys.lists(workspaceId),
      });
    },
  });
}
