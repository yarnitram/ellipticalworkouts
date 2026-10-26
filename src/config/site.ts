import { z } from 'zod';

export const SITE_CONFIG = {
  name: 'EllipticalWorkouts.com',
  shortName: 'EllipticalWorkouts',
  url: 'https://ellipticalworkouts.com',
  defaultDescription:
    'Science-backed elliptical interval workouts with live phone-mounted audio timers, resistance cues, zero-impact cardio routines, and in-depth machine reviews.',
  affiliateTag: 'ellipticalworkouts-20',
  utmSource: 'ellipticalworkouts.com',
} as const;

export const WorkoutIntervalSchema = z.object({
  name: z.string().min(1),
  durationSec: z.number().int().positive(),
  resistance: z.number().int().min(1).max(30),
  incline: z.number().int().min(-10).max(30),
  targetRpm: z.number().int().min(20).max(140),
  notes: z.string().min(1),
});

export const MachineSpecsSchema = z.object({
  flywheel: z.string().min(1),
  strideLength: z.string().min(1),
  maxIncline: z.string().min(1),
});

export const RecommendedMachineSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  tagline: z.string().min(1),
  affiliateUrl: z.string().url(),
  priceRange: z.string().min(1),
  specs: MachineSpecsSchema.optional(),
});

export const WorkoutDifficultySchema = z.enum(['Beginner', 'Intermediate', 'Advanced']);

export const MachinePriceTierSchema = z.enum(['Budget', 'Mid-Range', 'Premium', 'Commercial']);

export const MachineDetailedSpecsSchema = z.object({
  flywheel: z.string().min(1),
  strideLength: z.string().min(1),
  maxIncline: z.string().min(1),
  resistanceLevels: z.string().min(1),
  maxUserWeight: z.string().min(1),
  display: z.string().min(1),
});

export const MachineReviewSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  brand: z.string().min(1),
  price: z.number().positive(),
  priceRange: z.string().min(1),
  priceTier: MachinePriceTierSchema,
  rating: z.number().min(1).max(5),
  reviewCount: z.number().int().positive(),
  tagline: z.string().min(1),
  bestFor: z.string().min(1),
  verdict: z.string().min(20),
  specs: MachineDetailedSpecsSchema,
  pros: z.array(z.string().min(1)).min(2),
  cons: z.array(z.string().min(1)).min(1),
  affiliateUrl: z.string().url(),
  compatibleWorkoutSlugs: z.array(z.string()).min(1),
});

export const WorkoutSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(10),
  description: z.string().min(20),
  durationMinutes: z.number().int().positive(),
  difficulty: WorkoutDifficultySchema,
  caloriesBurned: z.string().min(3),
  targetGoal: z.string().min(3),
  recommendedMachine: RecommendedMachineSchema,
  intervals: z.array(WorkoutIntervalSchema).min(3),
});

export type WorkoutInterval = z.infer<typeof WorkoutIntervalSchema>;
export type RecommendedMachine = z.infer<typeof RecommendedMachineSchema>;
export type WorkoutDifficulty = z.infer<typeof WorkoutDifficultySchema>;
export type Workout = z.infer<typeof WorkoutSchema>;
export type MachinePriceTier = z.infer<typeof MachinePriceTierSchema>;
export type MachineDetailedSpecs = z.infer<typeof MachineDetailedSpecsSchema>;
export type MachineReview = z.infer<typeof MachineReviewSchema>;

/**
 * Central affiliate URL resolver so affiliate tags and UTM parameters
 * can be updated globally in one place.
 */
export function resolveAffiliateUrl(rawUrl: string, campaignSlug?: string): string {
  try {
    const parsed = new URL(rawUrl);
    if (!parsed.searchParams.has('tag')) {
      parsed.searchParams.set('tag', SITE_CONFIG.affiliateTag);
    }
    if (!parsed.searchParams.has('utm_source')) {
      parsed.searchParams.set('utm_source', SITE_CONFIG.utmSource);
    }
    if (campaignSlug && !parsed.searchParams.has('utm_campaign')) {
      parsed.searchParams.set('utm_campaign', campaignSlug);
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

export interface DerivedWorkoutStats {
  totalSeconds: number;
  minResistance: number;
  maxResistance: number;
  resistanceRange: string;
  minRpm: number;
  maxRpm: number;
  rpmRange: string;
  maxIncline: number;
  intervalCount: number;
}

export function computeWorkoutStats(workout: Workout): DerivedWorkoutStats {
  const totalSeconds = workout.intervals.reduce((acc, step) => acc + step.durationSec, 0);
  const resistances = workout.intervals.map((i) => i.resistance);
  const rpms = workout.intervals.map((i) => i.targetRpm);
  const inclines = workout.intervals.map((i) => i.incline);

  const minResistance = Math.min(...resistances);
  const maxResistance = Math.max(...resistances);
  const minRpm = Math.min(...rpms);
  const maxRpm = Math.max(...rpms);
  const maxIncline = Math.max(...inclines);

  return {
    totalSeconds,
    minResistance,
    maxResistance,
    resistanceRange:
      minResistance === maxResistance ? `Lvl ${minResistance}` : `Lvl ${minResistance}–${maxResistance}`,
    minRpm,
    maxRpm,
    rpmRange: minRpm === maxRpm ? `${minRpm} RPM` : `${minRpm}–${maxRpm} RPM`,
    maxIncline,
    intervalCount: workout.intervals.length,
  };
}

export function formatIntervalDuration(durationSec: number): string {
  const mins = Math.floor(durationSec / 60);
  const secs = durationSec % 60;
  if (mins > 0 && secs > 0) return `${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m`;
  return `${secs}s`;
}

export function buildExercisePlanJsonLd(workout: Workout, canonicalUrl: string) {
  const stats = computeWorkoutStats(workout);
  return {
    '@context': 'https://schema.org',
    '@type': 'ExercisePlan',
    name: workout.title,
    description: workout.description,
    url: canonicalUrl,
    activityType: 'Cardiovascular / Elliptical',
    exerciseType: workout.targetGoal,
    activityDuration: `PT${workout.durationMinutes}M`,
    timeRequired: `PT${workout.durationMinutes}M`,
    intensity: `${workout.difficulty} (${stats.resistanceRange}, ${stats.rpmRange})`,
    estimatedEnergyBurn: workout.caloriesBurned,
  };
}

export function buildBreadcrumbJsonLd(workout: Workout, canonicalUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'All Elliptical Workouts',
        item: `${SITE_CONFIG.url}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: workout.title,
        item: canonicalUrl,
      },
    ],
  };
}

export function getRelatedWorkouts(
  currentSlug: string,
  allWorkouts: Workout[],
  limit = 3
): Workout[] {
  const current = allWorkouts.find((w) => w.slug === currentSlug);
  const candidates = allWorkouts.filter((w) => w.slug !== currentSlug);
  if (!current) return candidates.slice(0, limit);

  return candidates
    .map((item) => {
      let score = 0;
      if (item.difficulty === current.difficulty) score += 2;
      if (item.durationMinutes === current.durationMinutes) score += 1;
      return { item, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);
}

export function buildMachineProductJsonLd(machine: MachineReview, canonicalUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: machine.name,
    description: machine.verdict,
    url: canonicalUrl,
    brand: {
      '@type': 'Brand',
      name: machine.brand,
    },
    offers: {
      '@type': 'Offer',
      price: machine.price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: resolveAffiliateUrl(machine.affiliateUrl, machine.slug),
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: machine.rating,
      reviewCount: machine.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
  };
}

export function buildMachineBreadcrumbJsonLd(machine: MachineReview, canonicalUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Equipment Reviews',
        item: `${SITE_CONFIG.url}/equipment`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: machine.name,
        item: canonicalUrl,
      },
    ],
  };
}
