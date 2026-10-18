import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatPrice, type Property } from "../data/properties";
import { formatVehiclePrice, type Vehicle } from "../data/vehicles";

const API = ""; 



async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Erreur ${res.status}`);
  }
  return res.json();
}



export const queryKeys = {
  properties: {
    all: ["properties"] as const,
    byId: (id: string) => ["properties", id] as const,
    featured: ["properties", "featured"] as const,
    byType: (type: string) => ["properties", "type", type] as const,
  },
  messages: {
    all: ["messages"] as const,
    byFilter: (f: string) => ["messages", "filter", f] as const,
  },
  vehicles: {
    all: ["vehicles"] as const,
    byId: (id: string) => ["vehicles", id] as const,
    byType: (type: string) => ["vehicles", "type", type] as const,
  },
  services: {
    all: ["services"] as const,
  },
  faqs: {
    all: ["faqs"] as const,
  },
};



export function useProperties() {
  return useQuery({
    queryKey: queryKeys.properties.all,
    queryFn: () => apiFetch<Property[]>("/api/properties"),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useProperty(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.properties.byId(id ?? ""),
    queryFn: () => apiFetch<Property>(`/api/properties/${id}`),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useFeaturedProperties() {
  return useQuery({
    queryKey: queryKeys.properties.featured,
    queryFn: () =>
      apiFetch<Property[]>("/api/properties").then((list) =>
        list.filter((p) => p.featured)
      ),
    staleTime: 1000 * 60 * 10,
  });
}

export function usePropertiesByType(type: string) {
  return useQuery({
    queryKey: queryKeys.properties.byType(type),
    queryFn: () =>
      apiFetch<Property[]>(`/api/properties?type=${encodeURIComponent(type)}`),
    staleTime: 1000 * 60 * 5,
  });
}



export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prop: Partial<Property>) =>
      apiFetch<{ success: boolean; id: string }>("/api/properties", {
        method: "POST",
        body: JSON.stringify(prop),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.properties.all }),
  });
}

export function useUpdateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prop: Partial<Property>) =>
      apiFetch<{ success: boolean }>(`/api/properties/${prop.id}`, {
        method: "PUT",
        body: JSON.stringify(prop),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.properties.all }),
  });
}

export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/properties/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.properties.all }),
  });
}



export function useVehicles(type?: string) {
  return useQuery({
    queryKey: type ? queryKeys.vehicles.byType(type) : queryKeys.vehicles.all,
    queryFn: () =>
      apiFetch<Vehicle[]>(
        type ? `/api/vehicles?type=${encodeURIComponent(type)}` : "/api/vehicles"
      ),
    staleTime: 1000 * 60 * 5,
  });
}



export function useVehicle(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.vehicles.byId(id ?? ""),
    queryFn: () => apiFetch<Vehicle>(`/api/vehicles/${id}`),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}



export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: Partial<Vehicle>) =>
      apiFetch<{ success: boolean; id: string }>("/api/vehicles", {
        method: "POST",
        body: JSON.stringify(v),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.vehicles.all }),
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: Partial<Vehicle>) =>
      apiFetch<{ success: boolean }>(`/api/vehicles/${v.id}`, {
        method: "PUT",
        body: JSON.stringify(v),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.vehicles.all }),
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/vehicles/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.vehicles.all }),
  });
}



export type Stats = {
  properties: { total: number; sale: number; rental: number; value: number };
  vehicles: { total: number; sale: number; rental: number; featured: number };
  reviews: { total: number; approved: number; pending: number };
  messages: { total: number; unread: number };
};



export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: () => apiFetch<Stats>("/api/admins/stats"),
    staleTime: 1000 * 60,
  });
}



export type Service = {
  id: string;
  title: string;
  text: string;
  points: string[];
  active: boolean;
  created_at?: string;
};

export function useServices() {
  return useQuery({
    queryKey: queryKeys.services.all,
    queryFn: () => apiFetch<Service[]>("/api/services?all=1"),
    staleTime: 1000 * 60 * 5,
  });
}

export function usePublicServices() {
  return useQuery({
    queryKey: queryKeys.services.all,
    queryFn: () => apiFetch<Service[]>("/api/services"),
    staleTime: 1000 * 60 * 10,
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (s: Partial<Service>) =>
      apiFetch<{ success: boolean; id: string }>("/api/services", {
        method: "POST",
        body: JSON.stringify(s),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.services.all }),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (s: Partial<Service>) =>
      apiFetch<{ success: boolean }>(`/api/services/${s.id}`, {
        method: "PUT",
        body: JSON.stringify(s),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.services.all }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/services/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.services.all }),
  });
}

export type Faq = {
  id: string;
  question: string;
  answer: string;
  position: number;
  active: boolean;
  created_at?: string;
};

export function useFaqs() {
  return useQuery({
    queryKey: queryKeys.faqs.all,
    queryFn: () => apiFetch<Faq[]>("/api/faqs?all=1"),
    staleTime: 1000 * 60 * 5,
  });
}

export function usePublicFaqs() {
  return useQuery({
    queryKey: queryKeys.faqs.all,
    queryFn: () => apiFetch<Faq[]>("/api/faqs"),
    staleTime: 1000 * 60 * 10,
  });
}

export function useCreateFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (f: Partial<Faq>) =>
      apiFetch<{ success: boolean; id: string }>("/api/faqs", {
        method: "POST",
        body: JSON.stringify(f),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.faqs.all }),
  });
}

export function useUpdateFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (f: Partial<Faq>) =>
      apiFetch<{ success: boolean }>(`/api/faqs/${f.id}`, {
        method: "PUT",
        body: JSON.stringify(f),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.faqs.all }),
  });
}

export function useDeleteFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/faqs/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.faqs.all }),
  });
}



export type Message = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  read: boolean;
  created_at: string;
};

export function useMessages(filter: "all" | "unread" = "all") {
  return useQuery({
    queryKey: queryKeys.messages.byFilter(filter),
    queryFn: () =>
      apiFetch<Message[]>(
        filter === "unread"
          ? "/api/messages?filter=unread"
          : "/api/messages"
      ),
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
  });
}

export function useCreateMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (msg: Omit<Message, "id" | "read" | "created_at">) =>
      apiFetch<{ success: boolean; id: string }>("/api/messages", {
        method: "POST",
        body: JSON.stringify(msg),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.messages.all }),
  });
}

export function useUpdateMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; read: boolean }) =>
      apiFetch<{ success: boolean }>(`/api/messages/${args.id}`, {
        method: "PUT",
        body: JSON.stringify({ read: args.read }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.messages.all }),
  });
}

export function useDeleteMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/messages/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.messages.all }),
  });
}



export { formatPrice, formatVehiclePrice };
export type { Property, Vehicle };
