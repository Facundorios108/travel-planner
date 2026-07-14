import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const flightCode = searchParams.get("flightCode");

    if (!flightCode) {
        return NextResponse.json({ error: "No flight code provided" }, { status: 400 });
    }

    const apiKey = process.env.AVIATIONSTACK_API_KEY;

    if (apiKey && apiKey !== "your_aviationstack_api_key") {
        try {
            // AviationStack Standard Free plan supports ONLY HTTP (not HTTPS).
            // Normalizing flight code (removing spaces)
            const cleanCode = flightCode.toUpperCase().replace(/\s/g, "");
            const url = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${encodeURIComponent(cleanCode)}`;
            
            const response = await fetch(url, { next: { revalidate: 60 } }); // Cache for 1 minute
            if (!response.ok) {
                throw new Error(`AviationStack API returned status ${response.status}`);
            }
            const data = await response.json();
            
            if (data && data.data && data.data.length > 0) {
                // Get the first flight record
                const flight = data.data[0];
                const dep = flight.departure || {};
                const arr = flight.arrival || {};
                const airline = flight.airline || {};
                
                // Map AviationStack status to our friendly UI statuses:
                // 'En Horario' | 'Demorado' | 'Cancelado' | 'En vuelo' | 'Aterrizado'
                let friendlyStatus = "En Horario";
                const apiStatus = flight.flight_status; // active, scheduled, landed, cancelled, diverted
                const delay = dep.delay || 0;

                if (apiStatus === "cancelled") {
                    friendlyStatus = "Cancelado";
                } else if (apiStatus === "active") {
                    friendlyStatus = "En vuelo";
                } else if (apiStatus === "landed") {
                    friendlyStatus = "Aterrizado";
                } else if (delay > 15) {
                    friendlyStatus = "Demorado";
                }

                // Helper to format ISO times from AviationStack to local time format (HH:MM)
                const formatTime = (isoString?: string) => {
                    if (!isoString) return "--:--";
                    // AviationStack returns airport local time but suffixes with +00:00 / Z.
                    // To keep the true local airport time, we extract the HH:MM substring directly.
                    const tIndex = isoString.indexOf("T");
                    if (tIndex !== -1 && isoString.length >= tIndex + 6) {
                        return isoString.substring(tIndex + 1, tIndex + 6);
                    }
                    try {
                        const date = new Date(isoString);
                        return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
                    } catch {
                        return isoString.substring(11, 16) || "--:--";
                    }
                };

                return NextResponse.json({
                    flightCode: flightCode.toUpperCase(),
                    airline: airline.name || "Desconocida",
                    status: friendlyStatus,
                    delayMinutes: delay,
                    departureTime: formatTime(dep.scheduled),
                    arrivalTime: formatTime(arr.scheduled),
                    terminal: dep.terminal || "N/A",
                    gate: dep.gate || "N/A",
                    flightDate: flight.flight_date,
                    isMock: false
                });
            }
        } catch (error) {
            console.error("Error fetching live flight data from AviationStack:", error);
            // Fall through to mock response as fallback
        }
    }

    // MOCKUP API RESPONSE (Fallback / Simulation)
    // Simulamos que la llamada toma tiempo
    await new Promise(resolve => setTimeout(resolve, 800));

    // Lógica ficticia para devolver distintos estados dependiendo del número
    const numPart = flightCode.replace(/\D/g, "");
    const lastDigit = numPart.length > 0 ? parseInt(numPart[numPart.length - 1]) : 0;

    let status = "En Horario";
    let delayMinutes = 0;
    
    if (lastDigit === 1 || lastDigit === 7) {
        status = "Demorado";
        delayMinutes = 45;
    } else if (lastDigit === 4) {
        status = "Cancelado";
    }

    return NextResponse.json({
        flightCode: flightCode.toUpperCase(),
        airline: "Simulated Airline",
        status,
        delayMinutes,
        departureTime: "14:30",
        arrivalTime: "18:45",
        gate: "A4",
        terminal: "T2",
        flightDate: new Date().toISOString().split("T")[0],
        isMock: true
    });
}
