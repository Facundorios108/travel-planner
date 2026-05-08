import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const { destination, startDate, endDate, budget, preferences } = await req.json();

    if (!destination) {
      return NextResponse.json({ error: "Destination is required" }, { status: 400 });
    }

    const model = getGeminiModel();

    const prompt = `
      Actúa como un planificador de viajes experto. Crea un itinerario detallado para un viaje a ${destination}.
      Fechas: de ${startDate || "flexible"} a ${endDate || "flexible"}.
      Presupuesto estimado: ${budget || "no especificado"}.
      Preferencias: ${preferences || "turismo general"}.

      El resultado DEBE ser un objeto JSON estrictamente válido con la siguiente estructura:
      {
        "tripTitle": "Nombre creativo del viaje",
        "description": "Una breve descripción inspiradora",
        "itinerary": [
          {
            "day": 1,
            "title": "Título del día",
            "activities": [
              {
                "time": "Mañana/Tarde/Noche",
                "activity": "Descripción de la actividad",
                "location": "Lugar específico",
                "estimatedCost": "Costo en USD (opcional)"
              }
            ]
          }
        ],
        "budgetBreakdown": {
          "accommodation": "estimación",
          "food": "estimación",
          "activities": "estimación",
          "total": "estimación total"
        },
        "tips": ["Consejo 1", "Consejo 2"]
      }

      Responde ÚNICAMENTE con el objeto JSON, sin texto adicional ni bloques de código markdown.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean potential markdown blocks if AI includes them
    const jsonString = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(jsonString);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("AI Planner Error:", error);
    return NextResponse.json({ error: "Failed to generate itinerary: " + error.message }, { status: 500 });
  }
}
