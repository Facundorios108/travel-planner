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
import { Trip, Activity, Destination, Expense, UserSettings } from "@/types/travel";
import { dataCache, cacheKeys } from "@/utils/dataCache";

export const travelService = {
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
            const tripSnap = await getDoc(doc(db, "trips", tripId));
            if (!tripSnap.exists()) return { success: false, message: "Viaje no encontrado" };

            const tripData = tripSnap.data();
            const currentCollabs = tripData.collaborators || [];

            if (currentCollabs.includes(email)) return { success: false, message: "El usuario ya es colaborador" };

            await updateDoc(doc(db, "trips", tripId), {
                collaborators: [...currentCollabs, email]
            });

            // Send email invitation
            try {
                await fetch('/api/send-invite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: email,
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
            const tripSnap = await getDoc(doc(db, "trips", tripId));
            if (!tripSnap.exists()) return { success: false, message: "Viaje no encontrado" };

            const tripData = tripSnap.data();
            const currentCollabs = tripData.collaborators || [];

            if (!currentCollabs.includes(email)) return { success: false, message: "El usuario no es colaborador" };

            const updatedCollabs = currentCollabs.filter((collab: string) => collab !== email);

            await updateDoc(doc(db, "trips", tripId), {
                collaborators: updatedCollabs
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
};
