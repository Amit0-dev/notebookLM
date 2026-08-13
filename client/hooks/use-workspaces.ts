"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspace,
  listWorkspaces,
  updateWorkspace,
  workspaceKeys,
} from "@/lib/api/workspaces";
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from "@/lib/validators/workspace";

export function useWorkspaces() {
  return useQuery({
    queryKey: workspaceKeys.lists(),
    queryFn: listWorkspaces,
  });
}

export function useWorkspace(workspaceId: string) {
  return useQuery({
    queryKey: workspaceKeys.detail(workspaceId),
    queryFn: () => getWorkspace(workspaceId),
    enabled: Boolean(workspaceId),
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWorkspaceInput) => createWorkspace(input),
    onSuccess: (workspace) => {
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
      queryClient.setQueryData(workspaceKeys.detail(workspace.id), workspace);
    },
  });
}

export function useUpdateWorkspace(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateWorkspaceInput) =>
      updateWorkspace(workspaceId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: workspaceKeys.detail(workspaceId),
      });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workspaceId: string) => deleteWorkspace(workspaceId),
    onSuccess: (_void, workspaceId) => {
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
      queryClient.removeQueries({
        queryKey: workspaceKeys.detail(workspaceId),
      });
    },
  });
}
