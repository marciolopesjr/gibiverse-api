// src/services/readingHistory.service.ts
import { ReadingHistoryRepository } from '../repositories/readingHistory.repository.js';
import { HqRepository } from '../repositories/hq.repository.js';
import { BusinessError } from './user.service.js';
import { ReadProgressDTO, ReadingHistory } from '../types/index.js';

export const ReadingHistoryService = {
  async updateReadProgress(
    hqId: string,
    userId: string,
    data: ReadProgressDTO,
  ): Promise<ReadingHistory> {
    const hq = await HqRepository.findById(hqId);
    if (!hq) {
      throw new BusinessError(`HQ com ID ${hqId} não encontrada.`, 404);
    }

    const maxPage = hq.pageCount - 1; // pageCount is 1-based, lastPageRead is 0-based
    if (data.lastPageRead > maxPage) {
      throw new BusinessError(
        `A página lida (${data.lastPageRead}) excede o total de páginas da HQ (${maxPage + 1}).`,
        400,
      );
    }

    const updatedProgress = await ReadingHistoryRepository.updateProgress(
      hqId,
      userId,
      data,
    );

    return updatedProgress;
  },

  async getMultipleProgress(
    hqIds: string[],
    userId: string,
  ): Promise<ReadingHistory[]> {
    return ReadingHistoryRepository.findMultipleByHqsAndUser(hqIds, userId);
  },
};