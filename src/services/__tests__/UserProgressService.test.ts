import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UserProgressService } from '@/services/game/UserProgressService';

describe('UserProgressService', () => {
  let service: UserProgressService;

  beforeEach(() => {
    service = new UserProgressService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('instance creation', () => {
    it('creates independent instances', () => {
      const instance1 = new UserProgressService();
      const instance2 = new UserProgressService();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('technology unlocking', () => {
    it('returns false for locked techs', () => {
      expect(service.isTechUnlocked('automation')).toBe(false);
    });

    it('returns true after unlocking a tech', () => {
      service.unlockTech('automation');
      expect(service.isTechUnlocked('automation')).toBe(true);
    });

    it('keeps unlockTech idempotent', () => {
      service.unlockTech('automation');
      service.unlockTech('automation');
      expect(service.getUnlockedTechs()).toEqual(['automation']);
    });

    it('unlocks multiple techs at once', () => {
      service.unlockTechs(['automation', 'logistics', 'steel-processing']);
      expect(service.isTechUnlocked('automation')).toBe(true);
      expect(service.isTechUnlocked('logistics')).toBe(true);
      expect(service.isTechUnlocked('steel-processing')).toBe(true);
    });

    it('returns the unlocked tech list', () => {
      service.unlockTechs(['automation', 'logistics']);
      expect(service.getUnlockedTechs()).toEqual(['automation', 'logistics']);
    });
  });

  describe('snapshot hydration', () => {
    it('replaces unlocked techs from snapshot state', () => {
      service.unlockTechs(['automation', 'logistics']);
      service.replaceUnlockedTechs(['steel-processing']);

      expect(service.getUnlockedTechs()).toEqual(['steel-processing']);
      expect(service.isTechUnlocked('automation')).toBe(false);
      expect(service.isTechUnlocked('steel-processing')).toBe(true);
    });
  });

  describe('progress reset', () => {
    it('clears unlocked techs after reset', () => {
      service.unlockTech('automation');
      service.resetProgress();

      expect(service.isTechUnlocked('automation')).toBe(false);
      expect(service.getUnlockedTechs()).toEqual([]);
    });
  });
});
