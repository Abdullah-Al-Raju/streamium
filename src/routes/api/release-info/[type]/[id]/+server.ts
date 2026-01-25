import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";

interface ReleaseDate {
  certification: string;
  iso_639_1?: string;
  release_date: string;
  type: number;
  note?: string;
}

interface ReleaseDateResult {
  iso_3166_1: string;
  release_dates: ReleaseDate[];
}

interface WatchProviderRegion {
  flatrate?: Array<{ provider_name: string }>;
  rent?: Array<{ provider_name: string }>;
  buy?: Array<{ provider_name: string }>;
}

export async function GET({ params, fetch }: RequestEvent) {
  const tmdbApiKey = env.TMDB_API_KEY;
  const tmdbApiUrl = env.TMDB_API_URL;

  if (!tmdbApiKey || !tmdbApiUrl) {
    return json({
      releaseType: "Unknown Quality",
      certifications: {},
    });
  }

  const { type, id } = params;
  const mediaType = type === "tv" ? "tv" : "movie";

  try {
    const [releaseDatesResponse, watchProvidersResponse] = await Promise.all([
      fetch(`${tmdbApiUrl}/${mediaType}/${id}/release_dates?api_key=${tmdbApiKey}`),
      fetch(`${tmdbApiUrl}/${mediaType}/${id}/watch/providers?api_key=${tmdbApiKey}`),
    ]);

    if (!releaseDatesResponse.ok || !watchProvidersResponse.ok) {
      return json({
        releaseType: "Unknown Quality",
        certifications: {},
      });
    }

    const releaseDatesData = await releaseDatesResponse.json();
    const watchProvidersData = await watchProvidersResponse.json();

    const currentUtcDate = new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate(),
      ),
    );

    const releases: ReleaseDate[] = releaseDatesData.results?.flatMap(
      (result: ReleaseDateResult) => result.release_dates,
    ) || [];

    // Extract certifications
    const certifications: Record<string, string> = {};
    releaseDatesData.results?.forEach((result: ReleaseDateResult) => {
      const certificationEntry = result.release_dates.find(
        (release) => release.certification,
      );
      if (certificationEntry) {
        certifications[result.iso_3166_1] = certificationEntry.certification;
      }
    });

    // Check release types
    const isDigitalRelease = releases.some(
      (release) =>
        [4, 6].includes(release.type) &&
        new Date(release.release_date).getTime() <= currentUtcDate.getTime(),
    );

    const isInTheaters = releases.some((release) => {
      const releaseDate = new Date(release.release_date);
      return release.type === 3 && releaseDate.getTime() <= currentUtcDate.getTime();
    });

    const hasFutureRelease = releases.some(
      (release) => new Date(release.release_date).getTime() > currentUtcDate.getTime(),
    );

    const availableRegions = Object.keys(watchProvidersData.results || {});
    const isStreamingAvailable = availableRegions.some(
      (region) => (watchProvidersData.results?.[region]?.flatrate || []).length > 0,
    );

    const isRentalOrPurchaseAvailable = availableRegions.some((region: string) => {
      const data = watchProvidersData.results?.[region] as WatchProviderRegion | undefined;
      const rentProviders = data?.rent || [];
      const buyProviders = data?.buy || [];
      return rentProviders.length > 0 || buyProviders.length > 0;
    });

    // Determine release type
    let releaseType: string;
    if (isInTheaters && !isStreamingAvailable && !isDigitalRelease) {
      releaseType = "Cam";
    } else if (isStreamingAvailable || isDigitalRelease) {
      releaseType = "HD";
    } else if (hasFutureRelease && !isInTheaters) {
      releaseType = "Not Released Yet";
    } else if (isRentalOrPurchaseAvailable) {
      releaseType = "Rental/Buy Available";
    } else {
      releaseType = "Unknown Quality";
    }

    return json({ releaseType, certifications });
  } catch (err) {
    console.error("Error fetching release info:", err);
    return json({
      releaseType: "Unknown Quality",
      certifications: {},
    });
  }
}
