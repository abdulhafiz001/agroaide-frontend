import type { FarmerProfile } from '@/types/farmer';

/** True when the farmer has set GPS so location-aware features can run. */
export function hasFarmLocation(profile?: FarmerProfile | null): boolean {
  if (!profile) return false;
  const lat = Number(profile.farmLatitude);
  const lng = Number(profile.farmLongitude);
  return Number.isFinite(lat) && Number.isFinite(lng);
}

/** True when core farm profile fields exist for personalized insights. */
export function isFarmProfileComplete(profile?: FarmerProfile | null): boolean {
  if (!profile || !hasFarmLocation(profile)) return false;
  const hasCrops = Array.isArray(profile.crops) && profile.crops.length > 0;
  const hasFarmName = Boolean(profile.farmName?.trim() && profile.farmName !== 'My Farm');
  const hasLocationLabel = Boolean(
    profile.farmLocation?.trim() && profile.farmLocation !== 'Unknown location',
  );
  return hasCrops || hasFarmName || hasLocationLabel;
}
