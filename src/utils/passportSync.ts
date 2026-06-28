import { Trip, UserPassport, PassportCountry } from "@/types/travel";
import { countriesList } from "./countriesData";
import { travelService } from "@/lib/services";

/**
 * Automatically syncs the user's planned trips to their map passport
 * Rules:
 * - If a country in a trip is in the future -> mark as "want_to_go" (Quiero ir)
 * - If a country in a trip is today or in the past -> mark as "visited" (Visitado)
 * - Lived status is never overwritten by automated trip sync.
 * - Visited status is never overwritten by "want_to_go".
 */
export async function syncTripsToPassport(
  userId: string,
  trips: Trip[],
  currentPassport: UserPassport | null
): Promise<UserPassport | null> {
  if (!userId || trips.length === 0) return currentPassport;

  const passportCountries = currentPassport ? { ...currentPassport.countries } : {};
  let hasChanges = false;
  const now = new Date();

  // Helper to normalize strings for comparison
  const normalize = (str: string) =>
    str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  trips.forEach((trip) => {
    if (!trip.destination) return;

    // Get the country name from the destination (usually the last part after comma, or the full string)
    const parts = trip.destination.split(",");
    const countryQuery = normalize(parts[parts.length - 1]);

    // Find the country in our localized database
    const matchedCountry = countriesList.find(
      (c) =>
        normalize(c.spanishName) === countryQuery ||
        normalize(c.name) === countryQuery ||
        normalize(c.code) === countryQuery
    );

    if (!matchedCountry) return;

    const countryId = matchedCountry.id; // numeric string
    const existing = passportCountries[countryId];

    // Determine status based on trip start date
    let targetStatus: "visited" | "want_to_go" = "visited";
    if (trip.startDate) {
      const startDate = new Date(trip.startDate);
      // If trip is starting in the future
      if (startDate > now) {
        targetStatus = "want_to_go";
      }
    }

    if (!existing) {
      // Add new record
      passportCountries[countryId] = {
        countryCode: countryId,
        status: targetStatus,
        color: targetStatus === "visited" ? "#bbf7d0" : undefined, // default pastel green
        dates: trip.startDate
          ? [
              {
                startDate: new Date(trip.startDate).toISOString().split("T")[0],
                endDate: trip.endDate
                  ? new Date(trip.endDate).toISOString().split("T")[0]
                  : undefined,
              },
            ]
          : [],
        tripId: trip.id,
      };
      hasChanges = true;
    } else {
      // Update rules:
      // 1. If it was "want_to_go" but the trip has now started, promote to "visited"
      if (existing.status === "want_to_go" && targetStatus === "visited") {
        existing.status = "visited";
        if (!existing.color) existing.color = "#bbf7d0";
        hasChanges = true;
      }
      
      // 2. Link tripId if not linked yet
      if (!existing.tripId) {
        existing.tripId = trip.id;
        hasChanges = true;
      }
    }
  });

  if (hasChanges) {
    try {
      await travelService.saveUserPassport(userId, passportCountries);
      const updatedPassport: UserPassport = {
        userId,
        countries: passportCountries,
        updatedAt: new Date(),
      };
      return updatedPassport;
    } catch (e) {
      console.error("Error saving automatic passport sync:", e);
    }
  }

  return currentPassport;
}
