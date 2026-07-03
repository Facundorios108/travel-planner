import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: Request) {
    // 1. Validate authorization
    // In local dev we can bypass if we don't have a CRON_SECRET yet, or we can just enforce it
    const authHeader = request.headers.get('authorization');
    if (
        process.env.NODE_ENV === 'production' &&
        authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!adminDb) {
        return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 });
    }

    try {
        // 2. Determine "tomorrow" date range
        // Note: For a globally scaled app, timezones are tricky. 
        // We will assume "tomorrow" based on UTC time of execution.
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const startOfTomorrow = new Date(tomorrow);
        startOfTomorrow.setHours(0, 0, 0, 0);
        
        const endOfTomorrow = new Date(tomorrow);
        endOfTomorrow.setHours(23, 59, 59, 999);

        // 3. Query all activities happening tomorrow
        const activitiesSnapshot = await adminDb.collection('activities')
            .where('startDate', '>=', startOfTomorrow)
            .where('startDate', '<=', endOfTomorrow)
            .get();

        if (activitiesSnapshot.empty) {
            return NextResponse.json({ message: 'No activities found for tomorrow.' });
        }

        // Group activities by tripId
        const tripActivities: Record<string, any[]> = {};
        activitiesSnapshot.forEach(doc => {
            const data = doc.data();
            const activity = { id: doc.id, ...data } as any;
            if (!tripActivities[activity.tripId]) {
                tripActivities[activity.tripId] = [];
            }
            tripActivities[activity.tripId].push(activity);
        });

        const emailsSent = [];

        // 4. For each trip, fetch trip details and send email
        for (const [tripId, activities] of Object.entries(tripActivities)) {
            const tripDoc = await adminDb.collection('trips').doc(tripId).get();
            if (!tripDoc.exists) continue;

            const trip = tripDoc.data()!;
            
            // Collect all emails for this trip (creator + collaborators)
            const recipients = new Set<string>();
            if (trip.creatorEmail) recipients.add(trip.creatorEmail);
            if (trip.activeCollaborators && Array.isArray(trip.activeCollaborators)) {
                trip.activeCollaborators.forEach(email => recipients.add(email));
            }

            if (recipients.size === 0) continue;

            // Sort activities by time
            activities.sort((a, b) => {
                const dateA = a.startDate.toDate ? a.startDate.toDate() : new Date(a.startDate);
                const dateB = b.startDate.toDate ? b.startDate.toDate() : new Date(b.startDate);
                return dateA.getTime() - dateB.getTime();
            });

            const dateString = startOfTomorrow.toLocaleDateString('es-ES', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            });

            // Use the request URL to determine the origin if NEXT_PUBLIC_APP_URL is not set
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

            // Generate HTML Content
            const htmlContent = generateEmailHtml(trip.name, dateString, activities, tripId, appUrl);

            // Send Email
            // Make subject unique to avoid Gmail grouping and hiding content behind 3 dots during testing
            const uniqueSubject = process.env.NODE_ENV !== 'production' 
                ? `📅 Tu itinerario para mañana: ${trip.name} (Prueba ${new Date().getTime()})`
                : `📅 Tu itinerario para mañana: ${trip.name}`;

            const { data, error } = await resend.emails.send({
                from: 'CatchMe <onboarding@resend.dev>', // Change this when domain is verified
                to: Array.from(recipients),
                subject: uniqueSubject,
                html: htmlContent,
            });

            if (error) {
                console.error(`Failed to send email for trip ${tripId}:`, error);
            } else {
                emailsSent.push({ tripId, recipients: Array.from(recipients) });
            }
        }

        return NextResponse.json({ 
            message: 'Cron job executed successfully', 
            date: startOfTomorrow.toISOString(),
            emailsSent 
        });

    } catch (error: any) {
        console.error('Error executing daily itinerary cron:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Helper to format time
function formatTime(dateObj: any) {
    if (!dateObj) return '';
    const date = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

// Helper to generate the email HTML
function generateEmailHtml(tripName: string, dateString: string, activities: any[], tripId: string, appUrl: string) {
    const tripUrl = `${appUrl}/trip/${tripId}`;

    const headerLogo = `<img src="${appUrl}/LogoApp.png" alt="CatchMe Logo" style="width: 64px; height: 64px; margin-bottom: 16px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); background-color: #ffffff; object-fit: cover;" />`;

    const activitiesHtml = activities.map(act => `
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="background-color: #eff6ff; color: #2563eb; font-weight: bold; font-size: 14px; padding: 4px 10px; border-radius: 20px; margin-right: 12px;">
                    ${formatTime(act.startDate)}
                </span>
                <h3 style="margin: 0; font-size: 18px; color: #0f172a;">${act.title}</h3>
            </div>
            ${act.location ? `<p style="margin: 4px 0 0 0; font-size: 14px; color: #64748b;">📍 ${act.location}</p>` : ''}
            ${act.notes ? `<p style="margin: 8px 0 0 0; font-size: 14px; color: #475569; font-style: italic;">"${act.notes}"</p>` : ''}
        </div>
    `).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 24px; text-align: center;">
                    ${headerLogo}
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">CatchMe</h1>
                    <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 16px; font-weight: 500;">Tu itinerario para mañana está listo</p>
                </div>
                
                <!-- Body -->
                <div style="padding: 32px 24px;">
                    <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 22px;">${tripName}</h2>
                    <p style="margin: 0 0 24px 0; color: #64748b; font-size: 15px; font-weight: 500; text-transform: capitalize;">
                        ${dateString}
                    </p>
                    
                    <div style="margin-bottom: 32px;">
                        ${activitiesHtml}
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="${tripUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: bold; font-size: 16px; text-decoration: none; padding: 14px 28px; border-radius: 9999px; transition: background-color 0.2s;">
                            Ver Itinerario Completo
                        </a>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0; color: #94a3b8; font-size: 13px;">
                        Este correo fue enviado automáticamente por CatchMe.<br>
                        Para dejar de recibir estos correos, ajusta tus preferencias en la aplicación.
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;
}
