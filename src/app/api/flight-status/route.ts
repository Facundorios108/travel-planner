import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const flightCode = searchParams.get("flightCode");

    if (!flightCode) {
        return NextResponse.json({ error: "No flight code provided" }, { status: 400 });
    }

    // MOCKUP API RESPONSE
    // Simulamos que la llamada toma tiempo
    await new Promise(resolve => setTimeout(resolve, 800));

    // Lógica ficticia para devolver distintos estados dependiendo del número
    const numPart = flightCode.replace(/\D/g, "");
    const lastDigit = numPart.length > 0 ? parseInt(numPart[numPart.length - 1]) : 0;

    let status = "En Horario";
    let delayMinutes = 0;
    
    // Aleatoriamente hacemos que algunos tengan demoras
    if (lastDigit === 1 || lastDigit === 7) {
        status = "Demorado";
        delayMinutes = 45;
    } else if (lastDigit === 4) {
        status = "Cancelado";
    }

    return NextResponse.json({
        flightCode: flightCode.toUpperCase(),
        status,
        delayMinutes,
        departureTime: "14:30",
        arrivalTime: "18:45",
        gate: "A4",
        terminal: "T2",
        // Aquí podríamos insertar una llamada real a AviationStack usando process.env.AVIATION_API_KEY
        isMock: true
    });
}
