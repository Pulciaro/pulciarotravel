// netlify/functions/flights.js
// Funzione Netlify: fa da tramite tra il frontend e l'API di Duffel.
// La chiave segreta DUFFEL_API_KEY resta solo qui, lato server — non arriva mai al browser.
//
// Setup su Netlify:
// 1. Site settings → Environment variables → aggiungi DUFFEL_API_KEY
//    (usa una chiave "test" da https://app.duffel.com/ finché non sei pronta per il live)
// 2. Fai il deploy: la funzione sarà raggiungibile su
//    https://<il-tuo-sito>.netlify.app/.netlify/functions/flights
//
// Richiesta attesa dal frontend (POST, JSON):
// {
//   "origin": "FCO", "destination": "BCN",
//   "departureDate": "2026-09-15", "returnDate": "2026-09-22",
//   "passengers": 2, "cabinClass": "economy"
// }

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Metodo non permesso, usa POST" }) };
  }

  const apiKey = process.env.DUFFEL_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "DUFFEL_API_KEY non configurata sul server" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "JSON non valido nella richiesta" }) };
  }

  const {
    origin,
    destination,
    departureDate,
    returnDate,
    passengers = 1,
    cabinClass = "economy",
  } = body;

  if (!origin || !destination || !departureDate) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "origin, destination e departureDate sono obbligatori" }),
    };
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
      return { statusCode: duffelRes.status, headers, body: JSON.stringify({ error: message }) };
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        offerRequestId: data?.data?.id,
        offers: simplified,
        cheapest: simplified[0] || null,
      }),
    };
  } catch (err) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: "Impossibile contattare Duffel in questo momento" }) };
  }
};
