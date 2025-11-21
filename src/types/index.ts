// src/types/index.ts

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'Leitor' | 'Criador' | 'Admin';
  stripeCustomerId?: string | null; // <--- ADICIONE ESTA LINHA
  resetPasswordToken?: string | null; // <--- ADICIONE ESTA TAMBÉM (da fase anterior)
  resetPasswordExpires?: Date | string | null; // <--- E ESTA
  createdAt: string;
  updatedAt: string;
}

export interface AuthPayload {
  token: string;
  user: Omit<User, 'passwordHash'>;
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'Leitor' | 'Criador' | 'Admin';
}

export interface Creator {
  id: string;
  userId: string;
  penName: string;
  bio?: string;
  analyticsId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Review {
  id: string;
  userId: string;
  hqId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HQ {
  id: string;
  creatorId: string;
  title: string;
  genre?: string; /* @deprecated - Em breve será substituído totalmente por tags */
  sinopse?: string;
  storagePath: string;
  isPremium: boolean;
  coverImage: string;
  pdfPath: string | null;
  pageCount: number;
  /* Novos Campos de Cache */
  averageRating: number; // Vem do banco como string/number dependendo do driver, tratar com cuidado
  reviewCount: number;
}

/* Estende a HQ para incluir dados relacionais completos na resposta da API */
export interface HQDetails extends HQ {
  creatorPenName: string;
  tags: Tag[];
  userReview?: Review; // Se o usuário logado já avaliou
  isFavorite?: boolean; // Se o usuário logado favoritou
}

export interface PaginatedResponse<T> {
  data: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}

export interface HqFilterOptions {
  search?: string;
  genre?: string; // Mantido para compatibilidade
  tag?: string;   // Novo filtro por slug da tag
  isPremium?: boolean;
}

export interface UserFilterOptions {
  search?: string;
  role?: User['role'];
}

export interface ReadProgressDTO {
  lastPageRead: number;
}

export interface ReadingHistory {
  userId: string;
  hqId: string;
  lastPageRead: number;
  lastReadAt: string;
}

export type HqWithProgress = Omit<HQ & { creatorPenName: string }, 'storagePath'> & {
  lastPageRead?: number;
};

export type UserUpdateAdminDTO = {
  role: User['role'];
};

export interface Subscription {
  id: string;
  userId: string;
  planId: string; // Mantemos para referência interna (ex: 'premium')
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing'; // Status do Stripe
  startDate: string;
  endDate: string | null; // Mapeia para currentPeriodEnd
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  createdAt: string;
}