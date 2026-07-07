// api/flights.js
// Funzione serverless Vercel: fa da tramite tra il frontend e l'API di Duffel.
// La chiave segreta DUFFEL_API_KEY resta solo qui, lato server — non arriva mai al browser.
//
// Setup su Vercel:
// 1. Project Settings → Environment Variables → aggiungi DUFFEL_API_KEY
//    (usa una chiave "test" da https://app.duffel.com/ finché non sei pronto per il live)
// 2. Fai il deploy: il file sarà raggiungibile su https://<tuo-progetto>.vercel.app/api/flights
//
// Richiesta attesa dal frontend (POST, JSON):
// {
//   "origin": "FCO",          // codice IATA aeroporto di partenza
//   "destination": "BCN",     // codice IATA aeroporto di arrivo
//   "departureDate": "2026-09-15",
//   "returnDate": "2026-09-22",   // opzionale: se assente, cerca solo andata
//   "passengers": 2,              // numero di adulti (default 1)
//   "cabinClass": "economy"       // opzionale: economy | premium_economy | business | first
// }

export default async function handler(req, res) {
  // CORS: necessario perché il frontend (es. l'artifact o un altro dominio)
  // chiama questa funzione da un'origine diversa da quella di Vercel.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non permesso, usa POST" });
  }

  const apiKey = process.env.DUFFEL_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "DUFFEL_API_KEY non configurata sul server" });
  }

  const {
    origin,
    destination,
    departureDate,
    returnDate,
    passengers = 1,
    cabinClass = "economy",
  } = req.body || {};

  if (!origin || !destination || !departureDate) {
    return res.status(400).json({ error: "origin, destination e departureDate sono obbligatori" });
  }

  const slices = [{ origin, destination, departure_date: departureDate }];
  if (returnDate) {
    slices.push({ origin: destination, destination: origin, departure_date: returnDate });
  }

  const passengerCount = Math.max(1, Math.min(9, Number(passengers) || 1));

  const payload = {
    data: {
      slices,
      passengers: Array.from({ length: passengerCount }, () => ({ type: "adult" })),
      cabin_class: cabinClass,
    },
  };

  try {
    const duffelRes = await fetch("https://api.duffel.com/air/offer_requests?return_offers=true", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Duffel-Version": "v2",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await duffelRes.json();

    if (!duffelRes.ok) {
      const message = data?.errors?.[0]?.message || "Errore nella richiesta a Duffel";
      return res.status(duffelRes.status).json({ error: message });
    }

    const offers = data?.data?.offers || [];

    const simplified = offers
      .map((o) => ({
        id: o.id,
        totalAmount: parseFloat(o.total_amount),
        currency: o.total_currency,
        airline: o.owner?.name || "Compagnia sconosciuta",
        slices: (o.slices || []).map((s) => {
          const segments = s.segments || [];
          const first = segments[0];
          const last = segments[segments.length - 1];
          return {
            origin: s.origin?.iata_code,
            destination: s.destination?.iata_code,
            departingAt: first?.departing_at,
            arrivingAt: last?.arriving_at,
            stops: Math.max(0, segments.length - 1),
          };
        }),
      }))
      .sort((a, b) => a.totalAmount - b.totalAmount);

    return res.status(200).json({
      offerRequestId: data?.data?.id,
      offers: simplified,
      cheapest: simplified[0] || null,
    });
  } catch (err) {
    return res.status(502).json({ error: "Impossibile contattare Duffel in questo momento" });
  }
}
