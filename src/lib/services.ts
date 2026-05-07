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
        return docRef.id;
    },

    async getUserTrips(userId: string, userEmail?: string | null): Promise<Trip[]> {
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
        return Array.from(tripsMap.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },
    async getTrip(tripId: string): Promise<Trip | null> {
        const docRef = doc(db, "trips", tripId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return null;
        return {
            id: snap.id,
            ...snap.data(),
            createdAt: snap.data().createdAt.toDate(),
            startDate: snap.data().startDate?.toDate(),
            endDate: snap.data().endDate?.toDate(),
        } as Trip;
    },

    async updateTrip(tripId: string, data: Partial<Trip>): Promise<void> {
        const docRef = doc(db, "trips", tripId);
        await updateDoc(docRef, data);
    },

    async inviteCollaborator(tripId: string, email: string): Promise<{ success: boolean; message: string }> {
        try {
            const tripSnap = await getDoc(doc(db, "trips", tripId));
            if (!tripSnap.exists()) return { success: false, message: "Viaje no encontrado" };

            const tripData = tripSnap.data();
            const currentCollabs = tripData.collaborators || [];

            if (currentCollabs.includes(email)) return { success: false, message: "El usuario ya es colaborador" };

            await updateDoc(doc(db, "trips", tripId), {
                collaborators: [...currentCollabs, email]
            });

            return { success: true, message: "Invitación enviada exitosamente" };
        } catch (error) {
            console.error("Error inviting collaborator", error);
            return { success: false, message: "Error al invitar colaborador" };
        }
    },

    async deleteTrip(tripId: string): Promise<void> {
        const docRef = doc(db, "trips", tripId);
        await deleteDoc(docRef);
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
        return docRef.id;
    },

    async getTripDestinations(tripId: string): Promise<Destination[]> {
        const q = query(
            collection(db, "destinations"),
            where("tripId", "==", tripId),
            orderBy("order", "asc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(
            (doc) =>
            ({
                id: doc.id,
                ...doc.data(),
                startDate: doc.data().startDate?.toDate(),
                endDate: doc.data().endDate?.toDate(),
            } as Destination)
        );
    },

    // Activities
    async addActivity(data: Omit<Activity, "id">): Promise<string> {
        const docRef = await addDoc(collection(db, "activities"), data);
        return docRef.id;
    },

    async getActivitiesByTrip(tripId: string): Promise<Activity[]> {
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
        return activities.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    },

    async updateActivity(id: string, data: Partial<Omit<Activity, "id">>): Promise<void> {
        const docRef = doc(db, "activities", id);
        // Firebase crashes if it receives undefined values natively.
        const payload: any = { ...data };
        if (payload.endDate === undefined) {
            payload.endDate = deleteField();
        }
        await updateDoc(docRef, payload);
    },

    async deleteActivity(id: string): Promise<void> {
        const docRef = doc(db, "activities", id);
        await deleteDoc(docRef);
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
