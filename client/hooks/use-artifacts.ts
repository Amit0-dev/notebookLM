"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  artifactKeys,
  createArtifact,
  deleteArtifact,
  getArtifact,
  listArtifacts,
} from "@/lib/api/artifacts";
import type { CreateArtifactInput } from "@/lib/validators/artifact";

export function useArtifacts(workspaceId: string) {
  return useQuery({
    queryKey: artifactKeys.lists(workspaceId),
    queryFn: () => listArtifacts(workspaceId),
    enabled: Boolean(workspaceId),
    refetchInterval: (query) => {
      const artifacts = query.state.data;
      if (!artifacts?.length) return false;
      const busy = artifacts.some(
        (a) => a.status === "PENDING" || a.status === "PROCESSING",
      );
      return busy ? 2500 : false;
    },
  });
}

export function useArtifact(workspaceId: string, artifactId: string | null) {
  return useQuery({
    queryKey: artifactKeys.detail(workspaceId, artifactId ?? "none"),
    queryFn: () => getArtifact(workspaceId, artifactId!),
    enabled: Boolean(workspaceId && artifactId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "PENDING" || status === "PROCESSING") return 2000;
      return false;
    },
  });
}

export function useCreateArtifact(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateArtifactInput) =>
      createArtifact(workspaceId, input),
    onSuccess: (artifact) => {
      void queryClient.invalidateQueries({
        queryKey: artifactKeys.lists(workspaceId),
      });
      queryClient.setQueryData(
        artifactKeys.detail(workspaceId, artifact.id),
        artifact,
      );
    },
  });
}

export function useDeleteArtifact(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (artifactId: string) =>
      deleteArtifact(workspaceId, artifactId),
    onSuccess: (_void, artifactId) => {
      void queryClient.invalidateQueries({
        queryKey: artifactKeys.lists(workspaceId),
      });
      queryClient.removeQueries({
        queryKey: artifactKeys.detail(workspaceId, artifactId),
      });
    },
  });
}
