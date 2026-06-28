export interface Trip {
    id: string;
    userId: string;
    name: string; // e.g., "Eurotrip 2024"
    createdAt: Date;
    startDate?: Date;
    endDate?: Date;
    coverImage?: string;
    collaborators?: string[]; // Array of user IDs who can access this trip
    activeCollaborators?: string[]; // Array of collaborator emails that have opened the trip
    creatorEmail?: string; // Email of the creator/owner of the trip
    description?: string;
    destination?: string;
    budget?: number;
}

export interface UserSettings {
    theme: 'light' | 'dark' | 'system';
    currency: string;
    language: 'es' | 'en';
    pushNotifications: boolean;
}

export interface Destination {
    id: string;
    tripId: string;
    country: string;
    city: string;
    order: number;
    startDate: Date;
    endDate: Date;
}

export type ActivityType = "flight" | "transfer" | "activity" | "carRental" | "other";

export interface Activity {
    id: string;
    tripId: string;
    destinationId?: string;
    type?: ActivityType;
    title: string;
    description?: string;
    location?: string;
    category?: string;
    notes?: string;
    startDate: Date;
    endDate?: Date;
}

export type ExpenseCategory = 'flight' | 'accommodation' | 'food' | 'transport' | 'activities' | 'shopping' | 'other';

export interface Expense {
    id: string;
    tripId: string;
    title: string;
    amount: number;
    currency: string;
    category: ExpenseCategory;
    date: Date;
    createdAt?: Date;
    paidBy?: string; // Email of the user who paid
}

export type DocumentType = 'ticket' | 'hotel' | 'id' | 'train' | 'car' | 'other';

export interface TripDocument {
    id: string;
    tripId: string;
    title: string;
    subtitle?: string;
    type: DocumentType;
    url?: string; // e.g., URL to an image or PDF
    createdAt?: Date;
}

export type PassportCountryStatus = "visited" | "want_to_go" | "lived";

export interface PassportCountry {
    countryCode: string; // ISO numeric code (e.g. "032")
    status: PassportCountryStatus;
    color?: string; // Custom map color
    dates?: { startDate: string; endDate?: string }[];
    tripId?: string; // Linked trip ID
}

export interface UserPassport {
    userId: string;
    countries: Record<string, PassportCountry>;
    updatedAt: Date;
}
