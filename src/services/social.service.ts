// src/services/social.service.ts
import { SocialRepository } from '../repositories/social.repository.js';
import { ReviewRepository } from '../repositories/review.repository.js';
import { HqRepository } from '../repositories/hq.repository.js';
import { ReviewDTO } from '../schemas/social.schema.js';
import { BusinessError } from './user.service.js';
import { Review } from '../types/index.js';

export const SocialService = {
  // --- Reviews ---
  async addReview(userId: string, hqId: string, data: ReviewDTO): Promise<Review> {
    const hq = await HqRepository.findById(hqId);
    if (!hq) throw new BusinessError('HQ não encontrada.', 404);

    return ReviewRepository.upsert(userId, hqId, data);
  },

  async deleteReview(userId: string, hqId: string): Promise<void> {
    await ReviewRepository.delete(userId, hqId);
  },

  async getReviews(hqId: string) {
    return ReviewRepository.findByHq(hqId);
  },

  // --- Favorites ---
  async toggleFavorite(userId: string, hqId: string): Promise<{ isFavorite: boolean }> {
    const hq = await HqRepository.findById(hqId);
    if (!hq) throw new BusinessError('HQ não encontrada.', 404);

    const isFav = await SocialRepository.isFavorite(userId, hqId);
    if (isFav) {
      await SocialRepository.removeFavorite(userId, hqId);
      return { isFavorite: false };
    } else {
      await SocialRepository.addFavorite(userId, hqId);
      return { isFavorite: true };
    }
  },

  async getUserFavorites(userId: string) {
    return SocialRepository.listUserFavorites(userId);
  },

  // --- Followers ---
  async followCreator(followerId: string, creatorId: string) {
    // TODO: Validar se creatorId existe
    await SocialRepository.followCreator(followerId, creatorId);
  },

  async unfollowCreator(followerId: string, creatorId: string) {
    await SocialRepository.unfollowCreator(followerId, creatorId);
  },
  
  async getFollowing(userId: string) {
    return SocialRepository.listFollowing(userId);
  }
};