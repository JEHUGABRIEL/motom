import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Property } from "../data/properties";
import type { Vehicle } from "../data/vehicles";

// Client API du site public. Le back-office (biens, véhicules, services, FAQ,
// messages, avis, comptes, journal d'audit) vit dans le dépôt motom-admin et
// possède sa propre copie de ce fichier : seules les routes publiques restent ici.

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
  },
  messages: {
    all: ["messages"] as const,
    byFilter: (f: string) => ["messages", "filter", f] as const,
  },
  reviews: {
    all: ["reviews"] as const,
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



export type Service = {
  id: string;
  title: string;
  text: string;
  points: string[];
  active: boolean;
  created_at?: string;
};

export function usePublicServices() {
  return useQuery({
    queryKey: queryKeys.services.all,
    queryFn: () => apiFetch<Service[]>("/api/services"),
    staleTime: 1000 * 60 * 10,
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

export function usePublicFaqs() {
  return useQuery({
    queryKey: queryKeys.faqs.all,
    queryFn: () => apiFetch<Faq[]>("/api/faqs"),
    staleTime: 1000 * 60 * 10,
  });
}



export type Review = {
  id: string;
  author: string;
  avatar?: string;
  rating: number;
  comment: string;
  created_at?: string;
};

export function useReviews() {
  return useQuery({
    queryKey: queryKeys.reviews.all,
    queryFn: () => apiFetch<Review[]>("/api/reviews"),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
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
