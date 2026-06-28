import { db } from "./firebase";
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    deleteField,
    setDoc,
} from "firebase/firestore";
import { Trip, Activity, Destination, Expense, UserSettings, UserPassport, PassportCountry } from "@/types/travel";
import { dataCache, cacheKeys } from "@/utils/dataCache";

export const travelService = {
    // User Profile
    async saveUserProfile(userId: string, email: string | null, displayName: string | null): Promise<void> {
        if (!email) return;
        const docRef = doc(db, "users", userId);
        await setDoc(docRef, {
            email: email.toLowerCase(),
            displayName: displayName || email.split("@")[0],
            updatedAt: new Date()
        }, { merge: true });
    },

    async getUserNameByEmail(email: string): Promise<string> {
        if (!email) return "";
        try {
            const q = query(collection(db, "users"), where("email", "==", email.toLowerCase()));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const data = querySnapshot.docs[0].data();
                return data.displayName || email.split("@")[0];
            }
        } catch (e) {
            console.error("Error getting user profile name:", e);
        }
        // Fallback formatting
        const prefix = email.split("@")[0];
        const clean = prefix.replace(/[0-9._-]/g, " ").trim();
        return clean ? clean.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : prefix;
    },

    // User Settings
    async getUserSettings(userId: string): Promise<UserSettings | null> {
        const docRef = doc(db, "userSettings", userId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return null;
        return snap.data() as UserSettings;
    },

    async updateUserSettings(userId: string, data: Partial<UserSettings>): Promise<void> {
        const docRef = doc(db, "userSettings", userId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            await updateDoc(docRef, data);
        } else {
            // Default values for new settings document
            const defaultSettings: UserSettings = {
                theme: 'system',
                currency: 'USD',
                language: 'es',
                pushNotifications: false,
                ...data
            };
            await setDoc(docRef, defaultSettings);
        }
    },

    // Trips
    async createTrip(userId: string, name: string, startDate?: Date, endDate?: Date): Promise<string> {
        const tripData: any = {
            userId,
            name,
            createdAt: new Date(),
        };

        if (startDate) tripData.startDate = startDate;
        if (endDate) tripData.endDate = endDate;

        const docRef = await addDoc(collection(db, "trips"), tripData);
        
        // Invalidate user trips cache
        dataCache.invalidatePattern(/^trips:user:/);
        
        return docRef.id;
    },

    async getUserTrips(userId: string, userEmail?: string | null): Promise<Trip[]> {
        // Check cache first
        const cacheKey = cacheKeys.userTrips(userId);
        const cached = dataCache.get<Trip[]>(cacheKey);
        if (cached) return cached;

        // Unfortunately standard Firestore without `or` requires two queries or an `in` / `array-contains`
        // We'll fetch trips where I'm the owner, and trips where I'm a collaborator.

        const ownerQuery = query(
            collection(db, "trips"),
            where("userId", "==", userId)
        );

        const collabQuery = userEmail ? query(
            collection(db, "trips"),
            where("collaborators", "array-contains", userEmail)
        ) : null;

        const [ownerSnap, collabSnap] = await Promise.all([
            getDocs(ownerQuery),
            collabQuery ? getDocs(collabQuery) : Promise.resolve({ docs: [] })
        ]);

        const tripsMap = new Map<string, Trip>();

        const processDoc = (doc: any) => {
            if (!tripsMap.has(doc.id)) {
                tripsMap.set(doc.id, {
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                    startDate: doc.data().startDate?.toDate(),
                    endDate: doc.data().endDate?.toDate(),
                } as Trip);
            }
        };

        ownerSnap.docs.forEach(processDoc);
        collabSnap.docs.forEach(processDoc);

        // Sort in memory (descending)
        const trips = Array.from(tripsMap.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        // Cache for 10 minutes (increased from 3)
        dataCache.set(cacheKey, trips, 10 * 60 * 1000);
        
        return trips;
    },
    async getTrip(tripId: string): Promise<Trip | null> {
        // Check cache first
        const cacheKey = cacheKeys.trip(tripId);
        const cached = dataCache.get<Trip>(cacheKey);
        if (cached) return cached;

        const docRef = doc(db, "trips", tripId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return null;
        
        const trip = {
            id: snap.id,
            ...snap.data(),
            createdAt: snap.data().createdAt.toDate(),
            startDate: snap.data().startDate?.toDate(),
            endDate: snap.data().endDate?.toDate(),
        } as Trip;
        
        // Cache for 10 minutes (increased from 5)
        dataCache.set(cacheKey, trip, 10 * 60 * 1000);
        
        return trip;
    },

    async updateTrip(tripId: string, data: Partial<Trip>): Promise<void> {
        const docRef = doc(db, "trips", tripId);
        await updateDoc(docRef, data);
        
        // Invalidate caches
        dataCache.invalidate(cacheKeys.trip(tripId));
        dataCache.invalidatePattern(/^trips:user:/);
        dataCache.invalidatePattern(new RegExp(`^.*:trip:${tripId}$`));
    },

    async inviteCollaborator(tripId: string, email: string, inviterName?: string): Promise<{ success: boolean; message: string }> {
        try {
            const cleanEmail = email.trim().toLowerCase();
            const tripSnap = await getDoc(doc(db, "trips", tripId));
            if (!tripSnap.exists()) return { success: false, message: "Viaje no encontrado" };

            const tripData = tripSnap.data();
            const currentCollabs = tripData.collaborators || [];
            const currentCollabsLower = currentCollabs.map((c: string) => c.toLowerCase());

            if (currentCollabsLower.includes(cleanEmail)) return { success: false, message: "El usuario ya es colaborador" };

            await updateDoc(doc(db, "trips", tripId), {
                collaborators: [...currentCollabs, cleanEmail]
            });

            // Send email invitation
            try {
                await fetch('/api/send-invite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: cleanEmail,
                        tripName: tripData.name || 'Tu viaje',
                        inviterName: inviterName || 'Un amigo',
                        tripId: tripId
                    })
                });
            } catch (emailError) {
                console.error("Error sending email:", emailError);
                // Don't fail the whole operation if email fails
            }

            // Invalidate cache
            dataCache.invalidate(cacheKeys.trip(tripId));
            dataCache.invalidatePattern(/^trips:user:/);

            return { success: true, message: "Invitación enviada exitosamente" };
        } catch (error) {
            console.error("Error inviting collaborator", error);
            return { success: false, message: "Error al invitar colaborador" };
        }
    },

    async removeCollaborator(tripId: string, email: string): Promise<{ success: boolean; message: string }> {
        try {
            const cleanEmail = email.trim().toLowerCase();
            const tripSnap = await getDoc(doc(db, "trips", tripId));
            if (!tripSnap.exists()) return { success: false, message: "Viaje no encontrado" };

            const tripData = tripSnap.data();
            const currentCollabs = tripData.collaborators || [];

            const updatedCollabs = currentCollabs.filter((collab: string) => collab.toLowerCase() !== cleanEmail);
            const updatedActiveCollabs = (tripData.activeCollaborators || []).filter((collab: string) => collab.toLowerCase() !== cleanEmail);

            await updateDoc(doc(db, "trips", tripId), {
                collaborators: updatedCollabs,
                activeCollaborators: updatedActiveCollabs
            });

            // Invalidate cache
            dataCache.invalidate(cacheKeys.trip(tripId));
            dataCache.invalidatePattern(/^trips:user:/);

            return { success: true, message: "Colaborador eliminado exitosamente" };
        } catch (error) {
            console.error("Error removing collaborator", error);
            return { success: false, message: "Error al eliminar colaborador" };
        }
    },

    async deleteTrip(tripId: string): Promise<void> {
        const docRef = doc(db, "trips", tripId);
        await deleteDoc(docRef);
        
        // Invalidate caches
        dataCache.invalidate(cacheKeys.trip(tripId));
        dataCache.invalidatePattern(/^trips:user:/);
        dataCache.invalidatePattern(new RegExp(`^.*:trip:${tripId}$`));
    },

    // Destinations
    async addDestination(
        tripId: string,
        country: string,
        city: string,
        startDate: Date,
        endDate: Date,
        order: number
    ): Promise<string> {
        const docRef = await addDoc(collection(db, "destinations"), {
            tripId,
            country,
            city,
            startDate,
            endDate,
            order,
        });
        
        // Invalidate caches
        dataCache.invalidate(cacheKeys.tripDestinations(tripId));
        dataCache.invalidate(cacheKeys.trip(tripId));
        
        return docRef.id;
    },

    async getTripDestinations(tripId: string): Promise<Destination[]> {
        // Check cache first
        const cacheKey = cacheKeys.tripDestinations(tripId);
        const cached = dataCache.get<Destination[]>(cacheKey);
        if (cached) return cached;

        const q = query(
            collection(db, "destinations"),
            where("tripId", "==", tripId),
            orderBy("order", "asc")
        );
        const snapshot = await getDocs(q);
        const destinations = snapshot.docs.map(
            (doc) =>
            ({
                id: doc.id,
                ...doc.data(),
                startDate: doc.data().startDate?.toDate(),
                endDate: doc.data().endDate?.toDate(),
            } as Destination)
        );
        
        // Cache for 10 minutes (increased from 5)
        dataCache.set(cacheKey, destinations, 10 * 60 * 1000);
        
        return destinations;
    },

    async deleteDestination(destId: string, tripId: string): Promise<void> {
        const docRef = doc(db, "destinations", destId);
        await deleteDoc(docRef);
        
        // Invalidate caches
        dataCache.invalidate(cacheKeys.tripDestinations(tripId));
        dataCache.invalidate(cacheKeys.trip(tripId));
    },

    async updateDestination(destId: string, tripId: string, data: Partial<Destination>): Promise<void> {
        const docRef = doc(db, "destinations", destId);
        const payload = Object.fromEntries(
            Object.entries(data).filter(([_, v]) => v !== undefined)
        );
        await updateDoc(docRef, payload);
        
        // Invalidate caches
        dataCache.invalidate(cacheKeys.tripDestinations(tripId));
        dataCache.invalidate(cacheKeys.trip(tripId));
    },

    // Activities
    async addActivity(data: Omit<Activity, "id">): Promise<string> {
        const docRef = await addDoc(collection(db, "activities"), data);
        
        // Invalidate cache
        dataCache.invalidate(cacheKeys.tripActivities(data.tripId));
        
        return docRef.id;
    },

    async getActivitiesByTrip(tripId: string): Promise<Activity[]> {
        // Check cache first
        const cacheKey = cacheKeys.tripActivities(tripId);
        const cached = dataCache.get<Activity[]>(cacheKey);
        if (cached) return cached;

        // Querying by tripId only to avoid composite index requirements in Firebase just for sorting
        const q = query(collection(db, "activities"), where("tripId", "==", tripId));
        const snapshot = await getDocs(q);

        const activities = snapshot.docs.map(
            (doc) =>
            ({
                id: doc.id,
                ...doc.data(),
                startDate: doc.data().startDate?.toDate(),
                endDate: doc.data().endDate?.toDate(),
            } as Activity)
        );

        // Sort in memory by startDate
        const sortedActivities = activities.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
        
        // Cache for 10 minutes (increased from 5)
        dataCache.set(cacheKey, sortedActivities, 10 * 60 * 1000);
        
        return sortedActivities;
    },

    async updateActivity(id: string, data: Partial<Omit<Activity, "id">>): Promise<void> {
        const docRef = doc(db, "activities", id);
        // Firebase crashes if it receives undefined values natively.
        const payload: any = { ...data };
        if (payload.endDate === undefined) {
            payload.endDate = deleteField();
        }
        await updateDoc(docRef, payload);
        
        // Invalidate cache if tripId is known
        if (data.tripId) {
            dataCache.invalidate(cacheKeys.tripActivities(data.tripId));
        }
    },

    async deleteActivity(id: string): Promise<void> {
        const docRef = doc(db, "activities", id);
        await deleteDoc(docRef);
        
        // Note: Can't invalidate specific trip cache without knowing tripId
        // Consider passing tripId if needed for better cache management
    },

    // Expenses
    async addExpense(data: Omit<Expense, "id">): Promise<string> {
        const docRef = await addDoc(collection(db, "expenses"), {
            ...data,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    },

    async getTripExpenses(tripId: string): Promise<Expense[]> {
        const q = query(
            collection(db, "expenses"),
            where("tripId", "==", tripId)
        );
        const snapshot = await getDocs(q);

        const expenses = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date?.toDate(),
                createdAt: data.createdAt?.toDate(),
            } as Expense;
        });

        // Sort by date descending (newest first)
        return expenses.sort((a, b) => b.date.getTime() - a.date.getTime());
    },

    async deleteExpense(id: string): Promise<void> {
        const docRef = doc(db, "expenses", id);
        await deleteDoc(docRef);
    },

    async updateExpense(id: string, data: Partial<Expense>): Promise<void> {
        const docRef = doc(db, "expenses", id);
        await updateDoc(docRef, data);
    },

    // Documents
    async addDocument(data: Omit<import("@/types/travel").TripDocument, "id">): Promise<string> {
        const docRef = await addDoc(collection(db, "documents"), {
            ...data,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    },

    async getTripDocuments(tripId: string): Promise<import("@/types/travel").TripDocument[]> {
        const q = query(
            collection(db, "documents"),
            where("tripId", "==", tripId)
        );
        const snapshot = await getDocs(q);

        const documents = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
            } as import("@/types/travel").TripDocument;
        });

        return documents.sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
    },

    async deleteDocument(id: string): Promise<void> {
        const docRef = doc(db, "documents", id);
        await deleteDoc(docRef);
    },

    // Passport Map Services
    async getUserPassport(userId: string): Promise<UserPassport | null> {
        const cacheKey = `passport:user:${userId}`;
        const cached = dataCache.get<UserPassport>(cacheKey);
        if (cached) return cached;

        try {
            const docRef = doc(db, "passports", userId);
            const snap = await getDoc(docRef);
            if (!snap.exists()) return null;

            const data = snap.data();
            const passport: UserPassport = {
                userId,
                countries: data.countries || {},
                updatedAt: data.updatedAt?.toDate() || new Date(),
            };

            dataCache.set(cacheKey, passport, 10 * 60 * 1000);
            return passport;
        } catch (error) {
            console.error("Error fetching user passport:", error);
            return null;
        }
    },

    async saveUserPassport(userId: string, countries: Record<string, PassportCountry>): Promise<void> {
        const cleanObject = (obj: any): any => {
            const clean: any = {};
            Object.keys(obj).forEach(key => {
                const val = obj[key];
                if (val === undefined) return;
                if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
                    clean[key] = cleanObject(val);
                } else {
                    clean[key] = val;
                }
            });
            return clean;
        };

        const docRef = doc(db, "passports", userId);
        const payload = {
            countries: cleanObject(countries),
            updatedAt: serverTimestamp(),
        };
        await setDoc(docRef, payload);

        // Invalidate cache
        const cacheKey = `passport:user:${userId}`;
        dataCache.invalidate(cacheKey);
    },
};
