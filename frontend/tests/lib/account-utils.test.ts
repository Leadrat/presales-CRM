import { computeSizeLabel, accountSizeTagClass, accountSizeBadgeClass } from '@/lib/account-utils';

describe('computeSizeLabel', () => {
  describe('boundary values', () => {
    it('returns empty string for 3 users (below threshold)', () => {
      expect(computeSizeLabel(3)).toBe('');
    });

    it('returns "Little Account" for 4 users (lower bound)', () => {
      expect(computeSizeLabel(4)).toBe('Little Account');
    });

    it('returns "Little Account" for 9 users (upper bound)', () => {
      expect(computeSizeLabel(9)).toBe('Little Account');
    });

    it('returns "Small Account" for 10 users (lower bound)', () => {
      expect(computeSizeLabel(10)).toBe('Small Account');
    });

    it('returns "Small Account" for 24 users (upper bound)', () => {
      expect(computeSizeLabel(24)).toBe('Small Account');
    });

    it('returns "Medium Account" for 25 users (lower bound)', () => {
      expect(computeSizeLabel(25)).toBe('Medium Account');
    });

    it('returns "Medium Account" for 49 users (upper bound)', () => {
      expect(computeSizeLabel(49)).toBe('Medium Account');
    });

    it('returns "Enterprise" for 50 users (lower bound)', () => {
      expect(computeSizeLabel(50)).toBe('Enterprise');
    });

    it('returns "Enterprise" for 100 users', () => {
      expect(computeSizeLabel(100)).toBe('Enterprise');
    });

    it('returns "Enterprise" for 1000 users', () => {
      expect(computeSizeLabel(1000)).toBe('Enterprise');
    });
  });

  describe('edge cases', () => {
    it('returns empty string for null', () => {
      expect(computeSizeLabel(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
      expect(computeSizeLabel(undefined)).toBe('');
    });

    it('returns empty string for 0', () => {
      expect(computeSizeLabel(0)).toBe('');
    });

    it('returns empty string for negative numbers', () => {
      expect(computeSizeLabel(-1)).toBe('');
      expect(computeSizeLabel(-100)).toBe('');
    });

    it('returns empty string for 1 user', () => {
      expect(computeSizeLabel(1)).toBe('');
    });

    it('returns empty string for 2 users', () => {
      expect(computeSizeLabel(2)).toBe('');
    });
  });
});

describe('accountSizeTagClass', () => {
  it('returns cyan classes for Little Account', () => {
    const result = accountSizeTagClass('Little Account');
    expect(result).toContain('border-cyan-400');
    expect(result).toContain('bg-cyan-50');
    expect(result).toContain('text-cyan-600');
  });

  it('returns green classes for Small Account', () => {
    const result = accountSizeTagClass('Small Account');
    expect(result).toContain('border-green-400');
    expect(result).toContain('bg-green-50');
    expect(result).toContain('text-green-600');
  });

  it('returns amber classes for Medium Account', () => {
    const result = accountSizeTagClass('Medium Account');
    expect(result).toContain('border-amber-400');
    expect(result).toContain('bg-amber-50');
    expect(result).toContain('text-amber-600');
  });

  it('returns purple classes for Enterprise', () => {
    const result = accountSizeTagClass('Enterprise');
    expect(result).toContain('border-purple-400');
    expect(result).toContain('bg-purple-50');
    expect(result).toContain('text-purple-600');
  });

  it('returns gray classes for empty/unknown label', () => {
    const result = accountSizeTagClass('');
    expect(result).toContain('border-gray-400');
    expect(result).toContain('bg-gray-50');
    expect(result).toContain('text-gray-600');
  });
});

describe('accountSizeBadgeClass', () => {
  it('returns cyan classes for Little', () => {
    const result = accountSizeBadgeClass('Little');
    expect(result).toContain('border-cyan-200');
    expect(result).toContain('bg-cyan-50');
    expect(result).toContain('text-cyan-700');
  });

  it('returns green classes for Small', () => {
    const result = accountSizeBadgeClass('Small');
    expect(result).toContain('border-green-200');
    expect(result).toContain('bg-green-50');
    expect(result).toContain('text-green-700');
  });

  it('returns amber classes for Medium', () => {
    const result = accountSizeBadgeClass('Medium');
    expect(result).toContain('border-amber-200');
    expect(result).toContain('bg-amber-50');
    expect(result).toContain('text-amber-700');
  });

  it('returns purple classes for Enterprise', () => {
    const result = accountSizeBadgeClass('Enterprise');
    expect(result).toContain('border-purple-200');
    expect(result).toContain('bg-purple-50');
    expect(result).toContain('text-purple-700');
  });

  it('returns gray text for empty/unknown label', () => {
    const result = accountSizeBadgeClass('');
    expect(result).toBe('text-gray-400');
  });
});
