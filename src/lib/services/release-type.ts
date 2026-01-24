interface ReleaseInfo {
  releaseType: string;
  certifications: Record<string, string>;
}

const cache = new Map<string, ReleaseInfo>();

export async function getReleaseType(
  mediaId: number,
  mediaType: string,
): Promise<ReleaseInfo> {
  try {
    const cacheKey = `${mediaId}_${mediaType}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }

    const response = await fetch(`/api/release-info/${mediaType}/${mediaId}`);

    if (!response.ok) {
      return {
        releaseType: "Unknown Quality",
        certifications: {},
      };
    }

    const result: ReleaseInfo = await response.json();
    cache.set(cacheKey, result);

    return result;
  } catch (error) {
    console.error("Error fetching release type and certifications:", error);
    return {
      releaseType: "Unknown Quality",
      certifications: {},
    };
  }
}
