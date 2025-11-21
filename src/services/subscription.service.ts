// src/services/subscription.service.ts
import { SubscriptionRepository } from '../repositories/subscription.repository.js';

export const SubscriptionService = {
  async isUserSubscribed(userId: string): Promise<boolean> {
    const activeSub = await SubscriptionRepository.findActiveByUserId(userId);
    
    if (!activeSub) return false;

    // Validação extra de data, embora o status do Stripe já deva controlar isso via Webhook
    const now = new Date();
    const endDate = activeSub.endDate ? new Date(activeSub.endDate) : new Date(0);
    
    return endDate > now;
  }
};