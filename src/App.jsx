import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  Plane, Wallet, Calendar, Sparkles, ChevronDown, ChevronUp, Building2, Info, Minus, Plus,
  Search, ListFilter, Users, MapPin, Bookmark, BookmarkCheck, Share2, X, Globe2, TicketCheck,
  MessageCircle, Send, Copy, Check, TrendingDown, TrendingUp, ArrowLeft, Loader2, RefreshCw, AlertTriangle
} from "lucide-react";

// URL della tua funzione serverless che fa da proxy verso Duffel (vedi api/flights.js).
// Sostituiscila con l'indirizzo del tuo deploy Vercel, es:
// "https://il-tuo-progetto.vercel.app/api/flights"
// Ora che frontend e funzione sono sullo stesso sito Netlify, basta il percorso relativo:
// non serve più scrivere l'indirizzo completo, e funziona anche se cambi dominio.
const DUFFEL_PROXY_URL = "/.netlify/functions/flights";

const MONTHS = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
const AIRLINES = ["ItaWays Air", "EuroSky", "BudgetJet", "SkyValue", "AirNomad", "BlueRoute"];
const STAYS = ["Appartamento centro storico", "B&B vista città", "Hostel design", "Guesthouse locale", "Boutique hotel", "Residence familiare"];

const DESTINATIONS = [
  { name: "Barcellona", country: "Spagna", flag: "🇪🇸", code: "BCN", region: "corto raggio", flightBase: 60, hotelBase: 55,
    flightMult: [1.0,0.85,0.95,1.1,1.15,1.05,1.35,1.45,1.1,0.95,0.8,1.1],
    hotelMult:  [0.9,0.85,0.9,1.0,1.05,1.1,1.3,1.4,1.15,1.0,0.85,1.0] },
  { name: "Lisbona", country: "Portogallo", flag: "🇵🇹", code: "LIS", region: "corto raggio", flightBase: 65, hotelBase: 50,
    flightMult: [0.9,0.85,0.95,1.05,1.15,1.2,1.35,1.4,1.15,1.0,0.85,1.05],
    hotelMult:  [0.85,0.8,0.9,1.0,1.1,1.2,1.35,1.4,1.15,1.0,0.85,0.95] },
  { name: "Praga", country: "Rep. Ceca", flag: "🇨🇿", code: "PRG", region: "corto raggio", flightBase: 45, hotelBase: 40,
    flightMult: [0.85,0.85,0.9,1.0,1.05,1.15,1.25,1.25,1.1,0.95,0.8,1.1],
    hotelMult:  [0.8,0.8,0.85,0.95,1.0,1.1,1.2,1.2,1.05,0.9,0.8,1.0] },
  { name: "Atene", country: "Grecia", flag: "🇬🇷", code: "ATH", region: "corto raggio", flightBase: 70, hotelBase: 45,
    flightMult: [0.8,0.8,0.85,1.0,1.1,1.3,1.45,1.5,1.2,0.95,0.8,0.95],
    hotelMult:  [0.75,0.75,0.8,0.95,1.05,1.25,1.4,1.45,1.15,0.9,0.75,0.85] },
  { name: "Budapest", country: "Ungheria", flag: "🇭🇺", code: "BUD", region: "corto raggio", flightBase: 40, hotelBase: 38,
    flightMult: [0.85,0.85,0.9,1.0,1.05,1.1,1.2,1.2,1.05,0.95,0.85,1.05],
    hotelMult:  [0.8,0.8,0.85,0.95,1.0,1.05,1.15,1.15,1.0,0.9,0.8,0.95] },
  { name: "Marrakech", country: "Marocco", flag: "🇲🇦", code: "RAK", region: "corto raggio", flightBase: 75, hotelBase: 42,
    flightMult: [0.9,0.9,0.95,1.05,1.1,1.2,1.3,1.3,1.1,1.0,0.9,1.0],
    hotelMult:  [0.85,0.85,0.9,1.0,1.0,1.1,1.15,1.15,1.0,0.95,0.85,0.95] },
  { name: "Istanbul", country: "Turchia", flag: "🇹🇷", code: "IST", region: "medio raggio", flightBase: 95, hotelBase: 35,
    flightMult: [0.85,0.85,0.9,1.0,1.05,1.15,1.25,1.3,1.1,1.0,0.85,0.95],
    hotelMult:  [0.8,0.8,0.85,0.9,0.95,1.05,1.15,1.2,1.05,0.95,0.85,0.9] },
  { name: "Il Cairo", country: "Egitto", flag: "🇪🇬", code: "CAI", region: "lungo raggio", flightBase: 240, hotelBase: 30,
    flightMult: [0.9,0.9,0.95,1.0,1.1,1.2,1.3,1.3,1.15,1.0,0.9,1.05],
    hotelMult:  [0.85,0.85,0.9,0.95,1.0,1.1,1.15,1.15,1.0,0.95,0.85,0.95] },
  { name: "New York", country: "USA", flag: "🇺🇸", code: "JFK", region: "lungo raggio", flightBase: 400, hotelBase: 130,
    flightMult: [0.9,0.95,1.0,1.05,1.1,1.2,1.3,1.3,1.15,1.05,0.95,1.35],
    hotelMult:  [0.85,0.9,0.95,1.0,1.05,1.15,1.2,1.2,1.1,1.0,0.9,1.3] },
  { name: "Bangkok", country: "Thailandia", flag: "🇹🇭", code: "BKK", region: "lungo raggio", flightBase: 450, hotelBase: 22,
    flightMult: [0.85,0.9,0.95,1.05,1.1,1.15,1.15,1.1,1.05,1.0,0.95,1.3],
    hotelMult:  [0.85,0.85,0.9,0.95,1.0,1.05,1.1,1.05,1.0,0.95,0.9,1.2] },
  { name: "Bali", country: "Indonesia", flag: "🇮🇩", code: "DPS", region: "lungo raggio", flightBase: 520, hotelBase: 28,
    flightMult: [0.9,0.9,0.95,1.0,1.05,1.1,1.2,1.25,1.15,1.0,0.9,1.3],
    hotelMult:  [0.85,0.85,0.9,0.95,1.0,1.05,1.15,1.2,1.1,0.95,0.85,1.15] },
  { name: "Madrid", country: "Spagna", flag: "🇪🇸", code: "MAD", region: "corto raggio", flightBase: 70, hotelBase: 55,
    flightMult: [0.9,0.85,0.9,1.0,1.1,1.15,1.35,1.4,1.15,1.0,0.85,1.05],
    hotelMult:  [0.85,0.8,0.85,0.95,1.05,1.15,1.3,1.35,1.1,0.95,0.85,1.0] },
  { name: "Parigi", country: "Francia", flag: "🇫🇷", code: "CDG", region: "corto raggio", flightBase: 75, hotelBase: 70,
    flightMult: [0.9,0.85,0.9,1.0,1.1,1.15,1.35,1.4,1.15,1.0,0.85,1.05],
    hotelMult:  [0.85,0.8,0.85,0.95,1.05,1.15,1.3,1.35,1.1,0.95,0.85,1.0] },
  { name: "Londra", country: "Regno Unito", flag: "🇬🇧", code: "LON", region: "corto raggio", flightBase: 85, hotelBase: 75,
    flightMult: [0.9,0.85,0.9,1.0,1.1,1.15,1.35,1.4,1.15,1.0,0.85,1.05],
    hotelMult:  [0.85,0.8,0.85,0.95,1.05,1.15,1.3,1.35,1.1,0.95,0.85,1.0] },
  { name: "Berlino", country: "Germania", flag: "🇩🇪", code: "BER", region: "corto raggio", flightBase: 65, hotelBase: 55,
    flightMult: [0.9,0.85,0.9,1.0,1.1,1.15,1.35,1.4,1.15,1.0,0.85,1.05],
    hotelMult:  [0.85,0.8,0.85,0.95,1.05,1.15,1.3,1.35,1.1,0.95,0.85,1.0] },
  { name: "Amsterdam", country: "Paesi Bassi", flag: "🇳🇱", code: "AMS", region: "corto raggio", flightBase: 80, hotelBase: 65,
    flightMult: [0.9,0.85,0.9,1.0,1.1,1.15,1.35,1.4,1.15,1.0,0.85,1.05],
    hotelMult:  [0.85,0.8,0.85,0.95,1.05,1.15,1.3,1.35,1.1,0.95,0.85,1.0] },
  { name: "Vienna", country: "Austria", flag: "🇦🇹", code: "VIE", region: "corto raggio", flightBase: 65, hotelBase: 60,
    flightMult: [0.9,0.85,0.9,1.0,1.1,1.15,1.35,1.4,1.15,1.0,0.85,1.05],
    hotelMult:  [0.85,0.8,0.85,0.95,1.05,1.15,1.3,1.35,1.1,0.95,0.85,1.0] },
  { name: "Dublino", country: "Irlanda", flag: "🇮🇪", code: "DUB", region: "corto raggio", flightBase: 90, hotelBase: 65,
    flightMult: [0.9,0.85,0.9,1.0,1.1,1.15,1.35,1.4,1.15,1.0,0.85,1.05],
    hotelMult:  [0.85,0.8,0.85,0.95,1.05,1.15,1.3,1.35,1.1,0.95,0.85,1.0] },
  { name: "Copenaghen", country: "Danimarca", flag: "🇩🇰", code: "CPH", region: "corto raggio", flightBase: 95, hotelBase: 80,
    flightMult: [0.85,0.85,0.9,1.0,1.1,1.2,1.3,1.3,1.1,0.95,0.85,1.15],
    hotelMult:  [0.85,0.85,0.9,0.95,1.05,1.15,1.25,1.25,1.05,0.95,0.85,1.1] },
  { name: "Stoccolma", country: "Svezia", flag: "🇸🇪", code: "ARN", region: "corto raggio", flightBase: 100, hotelBase: 80,
    flightMult: [0.85,0.85,0.9,1.0,1.1,1.2,1.3,1.3,1.1,0.95,0.85,1.15],
    hotelMult:  [0.85,0.85,0.9,0.95,1.05,1.15,1.25,1.25,1.05,0.95,0.85,1.1] },
  { name: "Zurigo", country: "Svizzera", flag: "🇨🇭", code: "ZRH", region: "corto raggio", flightBase: 90, hotelBase: 90,
    flightMult: [0.9,0.85,0.9,1.0,1.1,1.15,1.35,1.4,1.15,1.0,0.85,1.05],
    hotelMult:  [0.85,0.8,0.85,0.95,1.05,1.15,1.3,1.35,1.1,0.95,0.85,1.0] },
  { name: "Bruxelles", country: "Belgio", flag: "🇧🇪", code: "BRU", region: "corto raggio", flightBase: 70, hotelBase: 65,
    flightMult: [0.9,0.85,0.9,1.0,1.1,1.15,1.35,1.4,1.15,1.0,0.85,1.05],
    hotelMult:  [0.85,0.8,0.85,0.95,1.05,1.15,1.3,1.35,1.1,0.95,0.85,1.0] },
  { name: "Varsavia", country: "Polonia", flag: "🇵🇱", code: "WAW", region: "corto raggio", flightBase: 55, hotelBase: 45,
    flightMult: [0.9,0.85,0.9,1.0,1.1,1.15,1.35,1.4,1.15,1.0,0.85,1.05],
    hotelMult:  [0.85,0.8,0.85,0.95,1.05,1.15,1.3,1.35,1.1,0.95,0.85,1.0] },
  { name: "Malta", country: "Malta", flag: "🇲🇹", code: "MLA", region: "corto raggio", flightBase: 60, hotelBase: 55,
    flightMult: [0.9,0.85,0.9,1.0,1.1,1.15,1.35,1.4,1.15,1.0,0.85,1.05],
    hotelMult:  [0.85,0.8,0.85,0.95,1.05,1.15,1.3,1.35,1.1,0.95,0.85,1.0] },
  { name: "Dubai", country: "Emirati Arabi", flag: "🇦🇪", code: "DXB", region: "medio raggio", flightBase: 280, hotelBase: 60,
    flightMult: [0.85,0.85,0.9,1.0,1.05,1.15,1.25,1.3,1.1,1.0,0.85,0.95],
    hotelMult:  [0.8,0.8,0.85,0.9,0.95,1.05,1.15,1.2,1.05,0.95,0.85,0.9] },
  { name: "Tel Aviv", country: "Israele", flag: "🇮🇱", code: "TLV", region: "medio raggio", flightBase: 180, hotelBase: 70,
    flightMult: [0.85,0.85,0.9,1.0,1.05,1.15,1.25,1.3,1.1,1.0,0.85,0.95],
    hotelMult:  [0.8,0.8,0.85,0.9,0.95,1.05,1.15,1.2,1.05,0.95,0.85,0.9] },
  { name: "Tunisi", country: "Tunisia", flag: "🇹🇳", code: "TUN", region: "corto raggio", flightBase: 70, hotelBase: 35,
    flightMult: [0.9,0.85,0.9,1.0,1.1,1.15,1.35,1.4,1.15,1.0,0.85,1.05],
    hotelMult:  [0.85,0.8,0.85,0.95,1.05,1.15,1.3,1.35,1.1,0.95,0.85,1.0] },
  { name: "Tokyo", country: "Giappone", flag: "🇯🇵", code: "HND", region: "lungo raggio", flightBase: 550, hotelBase: 80,
    flightMult: [0.9,0.9,0.95,1.0,1.05,1.15,1.25,1.25,1.1,1.0,0.9,1.3],
    hotelMult:  [0.85,0.85,0.9,0.95,1.0,1.05,1.15,1.15,1.05,0.95,0.9,1.2] },
  { name: "Singapore", country: "Singapore", flag: "🇸🇬", code: "SIN", region: "lungo raggio", flightBase: 580, hotelBase: 60,
    flightMult: [0.9,0.9,0.95,1.0,1.05,1.15,1.25,1.25,1.1,1.0,0.9,1.3],
    hotelMult:  [0.85,0.85,0.9,0.95,1.0,1.05,1.15,1.15,1.05,0.95,0.9,1.2] },
  { name: "Hong Kong", country: "Cina", flag: "🇭🇰", code: "HKG", region: "lungo raggio", flightBase: 520, hotelBase: 65,
    flightMult: [0.9,0.9,0.95,1.0,1.05,1.15,1.25,1.25,1.1,1.0,0.9,1.3],
    hotelMult:  [0.85,0.85,0.9,0.95,1.0,1.05,1.15,1.15,1.05,0.95,0.9,1.2] },
  { name: "Seoul", country: "Corea del Sud", flag: "🇰🇷", code: "ICN", region: "lungo raggio", flightBase: 560, hotelBase: 55,
    flightMult: [0.9,0.9,0.95,1.0,1.05,1.15,1.25,1.25,1.1,1.0,0.9,1.3],
    hotelMult:  [0.85,0.85,0.9,0.95,1.0,1.05,1.15,1.15,1.05,0.95,0.9,1.2] },
  { name: "Pechino", country: "Cina", flag: "🇨🇳", code: "PEK", region: "lungo raggio", flightBase: 530, hotelBase: 50,
    flightMult: [0.9,0.9,0.95,1.0,1.05,1.15,1.25,1.25,1.1,1.0,0.9,1.3],
    hotelMult:  [0.85,0.85,0.9,0.95,1.0,1.05,1.15,1.15,1.05,0.95,0.9,1.2] },
  { name: "Delhi", country: "India", flag: "🇮🇳", code: "DEL", region: "lungo raggio", flightBase: 420, hotelBase: 25,
    flightMult: [0.9,0.9,0.95,1.0,1.05,1.15,1.25,1.25,1.1,1.0,0.9,1.3],
    hotelMult:  [0.85,0.85,0.9,0.95,1.0,1.05,1.15,1.15,1.05,0.95,0.9,1.2] },
  { name: "Los Angeles", country: "USA", flag: "🇺🇸", code: "LAX", region: "lungo raggio", flightBase: 480, hotelBase: 110,
    flightMult: [0.9,0.9,0.95,1.0,1.05,1.15,1.25,1.25,1.1,1.0,0.9,1.3],
    hotelMult:  [0.85,0.85,0.9,0.95,1.0,1.05,1.15,1.15,1.05,0.95,0.9,1.2] },
  { name: "Miami", country: "USA", flag: "🇺🇸", code: "MIA", region: "lungo raggio", flightBase: 440, hotelBase: 100,
    flightMult: [0.9,0.9,0.95,1.0,1.05,1.15,1.25,1.25,1.1,1.0,0.9,1.3],
    hotelMult:  [0.85,0.85,0.9,0.95,1.0,1.05,1.15,1.15,1.05,0.95,0.9,1.2] },
  { name: "Toronto", country: "Canada", flag: "🇨🇦", code: "YYZ", region: "lungo raggio", flightBase: 420, hotelBase: 90,
    flightMult: [0.9,0.9,0.95,1.0,1.05,1.15,1.25,1.25,1.1,1.0,0.9,1.3],
    hotelMult:  [0.85,0.85,0.9,0.95,1.0,1.05,1.15,1.15,1.05,0.95,0.9,1.2] },
  { name: "Città del Messico", country: "Messico", flag: "🇲🇽", code: "MEX", region: "lungo raggio", flightBase: 520, hotelBase: 55,
    flightMult: [0.9,0.9,0.95,1.0,1.05,1.15,1.25,1.25,1.1,1.0,0.9,1.3],
    hotelMult:  [0.85,0.85,0.9,0.95,1.0,1.05,1.15,1.15,1.05,0.95,0.9,1.2] },
  { name: "Rio de Janeiro", country: "Brasile", flag: "🇧🇷", code: "GIG", region: "lungo raggio", flightBase: 600, hotelBase: 55,
    flightMult: [1.2,1.15,1.0,0.9,0.85,0.85,0.95,0.95,0.9,0.9,1.0,1.3],
    hotelMult:  [1.1,1.05,0.95,0.9,0.85,0.85,0.9,0.9,0.9,0.9,0.95,1.2] },
  { name: "Buenos Aires", country: "Argentina", flag: "🇦🇷", code: "EZE", region: "lungo raggio", flightBase: 650, hotelBase: 45,
    flightMult: [1.2,1.15,1.0,0.9,0.85,0.85,0.95,0.95,0.9,0.9,1.0,1.3],
    hotelMult:  [1.1,1.05,0.95,0.9,0.85,0.85,0.9,0.9,0.9,0.9,0.95,1.2] },
  { name: "Sydney", country: "Australia", flag: "🇦🇺", code: "SYD", region: "lungo raggio", flightBase: 700, hotelBase: 80,
    flightMult: [1.15,1.1,1.0,0.9,0.85,0.85,0.9,0.9,0.9,0.95,1.05,1.35],
    hotelMult:  [1.1,1.05,0.95,0.9,0.85,0.85,0.9,0.9,0.9,0.95,1.0,1.25] },
  { name: "Nairobi", country: "Kenya", flag: "🇰🇪", code: "NBO", region: "lungo raggio", flightBase: 420, hotelBase: 40,
    flightMult: [0.9,0.9,0.95,1.0,1.05,1.15,1.25,1.25,1.1,1.0,0.9,1.3],
    hotelMult:  [0.85,0.85,0.9,0.95,1.0,1.05,1.15,1.15,1.05,0.95,0.9,1.2] },
  { name: "Città del Capo", country: "Sudafrica", flag: "🇿🇦", code: "CPT", region: "lungo raggio", flightBase: 480, hotelBase: 55,
    flightMult: [0.9,0.9,0.95,1.0,1.05,1.15,1.25,1.25,1.1,1.0,0.9,1.3],
    hotelMult:  [0.85,0.85,0.9,0.95,1.0,1.05,1.15,1.15,1.05,0.95,0.9,1.2] },

];

const CONTINENT_BY_COUNTRY = {
  "Spagna": "Europa", "Portogallo": "Europa", "Rep. Ceca": "Europa", "Grecia": "Europa",
  "Ungheria": "Europa", "Francia": "Europa", "Regno Unito": "Europa", "Germania": "Europa",
  "Paesi Bassi": "Europa", "Austria": "Europa", "Irlanda": "Europa", "Danimarca": "Europa",
  "Svezia": "Europa", "Svizzera": "Europa", "Belgio": "Europa", "Polonia": "Europa", "Malta": "Europa",
  "Marocco": "Africa", "Egitto": "Africa", "Tunisia": "Africa", "Kenya": "Africa", "Sudafrica": "Africa",
  "Turchia": "Asia", "Emirati Arabi": "Asia", "Israele": "Asia", "Thailandia": "Asia",
  "Indonesia": "Asia", "Giappone": "Asia", "Singapore": "Asia", "Cina": "Asia",
  "Corea del Sud": "Asia", "India": "Asia",
  "USA": "Nord America", "Canada": "Nord America", "Messico": "Nord America",
  "Brasile": "Sud America", "Argentina": "Sud America",
  "Australia": "Oceania",
};
const CONTINENT_FLAG = { "Europa": "🌍", "Africa": "🌍", "Asia": "🌏", "Nord America": "🌎", "Sud America": "🌎", "Oceania": "🌏" };

DESTINATIONS.forEach((d) => { d.continent = CONTINENT_BY_COUNTRY[d.country] || "Altro"; });

const DEPARTURE_CITIES_RAW = [
  { name: "Roma", code: "FCO" },
  { name: "Milano Malpensa", code: "MXP" },
  { name: "Milano Linate", code: "LIN" },
  { name: "Milano Bergamo", code: "BGY" },
  { name: "Venezia", code: "VCE" },
  { name: "Napoli", code: "NAP" },
  { name: "Bologna", code: "BLQ" },
  { name: "Torino", code: "TRN" },
  { name: "Palermo", code: "PMO" },
  { name: "Catania", code: "CTA" },
  { name: "Bari", code: "BRI" },
  { name: "Cagliari", code: "CAG" },
  { name: "Firenze", code: "FLR" },
  { name: "Verona", code: "VRN" },
  { name: "Genova", code: "GOA" },
  { name: "Pisa", code: "PSA" },
  { name: "Trieste", code: "TRS" },
  { name: "Alghero", code: "AHO" },
  { name: "Olbia", code: "OLB" },
  { name: "Brindisi", code: "BDS" },
  { name: "Lamezia Terme", code: "SUF" },
  { name: "Pescara", code: "PSR" },
  { name: "Rimini", code: "RMI" },
  { name: "Trapani", code: "TPS" },
  { name: "Reggio Calabria", code: "REG" },
  { name: "Ancona", code: "AOI" },
  { name: "Perugia", code: "PEG" },
  { name: "Parma", code: "PMF" },
  { name: "Treviso", code: "TSF" },
  { name: "Comiso", code: "CIY" },
  { name: "Crotone", code: "CRV" },
  { name: "Foggia", code: "FOG" },
  { name: "Cuneo", code: "CUF" },
  { name: "Pantelleria", code: "PNL" },
  { name: "Lampedusa", code: "LMP" },
  { name: "Elba", code: "EBA" },
  { name: "Forlì", code: "FRL" },
];

const DEPARTURE_CITIES = [...DEPARTURE_CITIES_RAW].sort((a, b) => a.name.localeCompare(b.name, "it"));

const NIGHT_PRESETS = [
  { label: "Weekend", nights: 3 },
  { label: "1 settimana", nights: 7 },
  { label: "2 settimane", nights: 14 },
];

function hashIndex(str, mod) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 997;
  return h % mod;
}

function computeForMonth(dest, monthIdx, nights, people) {
  const flightPerPerson = Math.round(dest.flightBase * dest.flightMult[monthIdx]);
  const flight = flightPerPerson * people;
  const hotelNight = Math.round(dest.hotelBase * dest.hotelMult[monthIdx]);
  const hotel = hotelNight * nights;
  return { flight, flightPerPerson, hotelNight, hotel, total: flight + hotel };
}

function bestResult(dest, month, nights, people) {
  if (month === "flex") {
    let best = null;
    for (let m = 0; m < 12; m++) {
      const r = computeForMonth(dest, m, nights, people);
      if (!best || r.total < best.total) best = { ...r, month: m };
    }
    return best;
  }
  return { ...computeForMonth(dest, month, nights, people), month };
}

function ticketId(r, departureCode, month, nights, people) {
  return `${r.code}_${departureCode}_${month}_${nights}_${people}`;
}

function shareText(t) {
  const lines = [
    `✈️ ${t.departureName} (${t.departureCode}) → ${t.name}, ${t.country} ${t.flag}`,
    `📅 ${t.monthLabel} · ${t.nights} ${t.nights === 1 ? "notte" : "notti"} · ${t.people} ${t.people === 1 ? "persona" : "persone"}`,
    `💶 Totale: €${t.total} (volo €${t.flight} + alloggio €${t.hotel})`,
    t.withinBudget ? `Rientra nel budget 🙌` : `Fuori budget di €${t.diff}`,
    `Trovato con Pulciaro Travel 🌍`,
  ];
  return lines.join("\n");
}

// Trasforma un indice di mese (0=Gen..11=Dic) nella prossima data futura in quel mese,
// così possiamo interrogare Duffel con una data reale anche quando l'utente ha scelto
// "mese flessibile" invece di un giorno preciso.
function nextDateForMonth(monthIndex, day = 15) {
  const now = new Date();
  let year = now.getFullYear();
  let candidate = new Date(year, monthIndex, day);
  if (candidate < now) {
    year += 1;
    candidate = new Date(year, monthIndex, day);
  }
  return candidate;
}
function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

// Interroga la funzione serverless (api/flights.js) che a sua volta interroga Duffel.
async function fetchRealFlightPrice(ticket) {
  const departureDate = nextDateForMonth(ticket.month);
  const returnDate = new Date(departureDate);
  returnDate.setDate(returnDate.getDate() + ticket.nights);

  const response = await fetch(DUFFEL_PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      origin: ticket.departureCode,
      destination: ticket.code,
      departureDate: toISODate(departureDate),
      returnDate: toISODate(returnDate),
      passengers: ticket.people,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || "Errore nella richiesta a Duffel");
  }
  return data; // { offers, cheapest, offerRequestId }
}

// Da un'offerta Duffel, ricava un'etichetta leggibile su scali (guarda la tratta di andata)
function stopsLabel(offer) {
  if (!offer || !offer.slices || !offer.slices[0]) return null;
  const stops = offer.slices[0].stops || 0;
  if (stops === 0) return "diretto";
  if (stops === 1) return "1 scalo";
  return `${stops} scali`;
}

function TicketCard({ r, departureCode, nights, people, budget, month, saved, onToggleSave, onOpen }) {
  const monthLabel = MONTHS[r.month];

  // Prezzo reale del volo per QUESTO biglietto, caricato appena la scheda appare.
  const [live, setLive] = useState("loading"); // 'loading' | 'error' | 'empty' | { cheapest, offers }
  useEffect(() => {
    let cancelled = false;
    setLive("loading");
    fetchRealFlightPrice({ departureCode, code: r.code, month: r.month, nights, people })
      .then((data) => { if (!cancelled) setLive(data.cheapest ? data : "empty"); })
      .catch(() => { if (!cancelled) setLive("error"); });
    return () => { cancelled = true; };
  }, [r.code, r.month, departureCode, nights, people]);

  const hasLivePrice = live && live !== "loading" && live !== "error" && live !== "empty" && live.cheapest;
  const liveIsEur = hasLivePrice && live.cheapest.currency === "EUR";

  // Il totale mostrato: se abbiamo un prezzo volo reale in EUR, lo sommiamo all'alloggio (stimato);
  // altrimenti resta la stima completa di partenza.
  const displayTotal = liveIsEur ? Math.round(live.cheapest.totalAmount + r.hotel) : r.total;
  const diff = displayTotal - budget;
  const withinBudgetLive = displayTotal <= budget;
  const stops = hasLivePrice ? stopsLabel(live.cheapest) : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(r)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(r); } }}
      style={{
        background: "var(--paper)", color: "var(--ink)", borderRadius: 14, overflow: "hidden", cursor: "pointer",
        boxShadow: r.withinBudget ? "0 10px 26px -12px rgba(37,61,49,0.4)" : "0 6px 16px -10px rgba(37,61,49,0.3)",
        opacity: r.withinBudget ? 1 : 0.85,
      }}
    >
      <div style={{ padding: "18px 20px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 20 }}>{r.flag}</span>
              <span className="pulciaro-display" style={{ fontSize: 18, fontWeight: 600 }}>{r.name}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{r.country} · {r.region}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="pulciaro-mono" style={{
              fontSize: 11.5, padding: "3px 8px", borderRadius: 5,
              background: "var(--violet)", color: "#fff", letterSpacing: 1
            }}>{r.code}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSave(r); }}
              aria-label={saved ? "Rimuovi dai biglietti salvati" : "Salva biglietto"}
              title={saved ? "Rimuovi dai biglietti salvati" : "Salva biglietto"}
              style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2 }}
            >
              {saved ? <BookmarkCheck size={18} color="var(--coral)" /> : <Bookmark size={18} color="var(--muted)" />}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "14px 0 4px", fontSize: 12.5, color: "var(--muted)" }}>
          <span className="pulciaro-mono">{departureCode}</span>
          <div style={{ flex: 1, borderTop: "1px dashed var(--line)" }} />
          <Plane size={12} style={{ transform: "rotate(90deg)" }} />
          <div style={{ flex: 1, borderTop: "1px dashed var(--line)" }} />
          <span className="pulciaro-mono">{r.code}</span>
        </div>
        <div style={{ fontSize: 11.5, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span>{month === "flex" ? `Mese migliore: ${monthLabel}` : `Partenza: ${monthLabel}`} · {nights} {nights === 1 ? "notte" : "notti"}</span>
          {live === "loading" && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Loader2 size={11} className="pulciaro-spin" /> prezzo reale…
            </span>
          )}
          {stops && (
            <span className="pulciaro-mono" style={{ fontSize: 10.5, padding: "1px 6px", borderRadius: 10, background: "var(--bg-deep)" }}>
              {stops}
            </span>
          )}
        </div>
      </div>

      <div style={{ position: "relative", borderTop: "2px dashed var(--line)", margin: "0 4px" }}>
        <div className="ticket-notch" style={{ left: -9, top: 0 }} />
        <div className="ticket-notch" style={{ right: -9, top: 0 }} />
      </div>

      <div style={{ padding: "14px 20px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="pulciaro-mono" style={{ fontSize: 26, fontWeight: 700, color: withinBudgetLive ? "var(--ink)" : "#9c5238" }}>€{displayTotal}</div>
            <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
              {people > 1 ? `volo + alloggio, totale per ${people} persone` : "volo + alloggio, totale viaggio"}
              {liveIsEur ? " · volo reale" : " · stima"}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            {withinBudgetLive ? (
              <span style={{ fontSize: 11.5, fontWeight: 600, color: "#2c6b45", background: "#dcefe0", padding: "4px 9px", borderRadius: 20 }}>
                risparmi €{budget - displayTotal}
              </span>
            ) : (
              <span style={{ fontSize: 11.5, fontWeight: 600, color: "#9c4a34", background: "#f6e2da", padding: "4px 9px", borderRadius: 20 }}>
                +€{diff} sul budget
              </span>
            )}
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, fontSize: 12, color: "var(--muted)" }}>
              Dettagli e condivisione <ChevronDown size={13} style={{ transform: "rotate(-90deg)" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Pulciaro() {
  const [budget, setBudget] = useState(700);
  const [nights, setNights] = useState(7);
  const [month, setMonth] = useState("flex");
  const [people, setPeople] = useState(1);
  const [departure, setDeparture] = useState(DEPARTURE_CITIES[0]);
  const [mode, setMode] = useState("suggested"); // 'suggested' | 'specific'
  const [selectedCode, setSelectedCode] = useState(DESTINATIONS[0].code);
  const [budgetTab, setBudgetTab] = useState("in"); // 'in' | 'out'
  const [view, setView] = useState("search"); // 'search' | 'saved'
  const [collapsed, setCollapsed] = useState({}); // continent collapse state
  const [modalTicket, setModalTicket] = useState(null);
  const [savedTickets, setSavedTickets] = useState([]);
  const [savedLoaded, setSavedLoaded] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");

  // Carica i biglietti salvati dal browser (localStorage), all'avvio della pagina
  useEffect(() => {
    try {
      const raw = localStorage.getItem("pulciaro-saved-tickets");
      if (raw) setSavedTickets(JSON.parse(raw));
    } catch (e) {
      // nessun biglietto salvato ancora, o browser che blocca localStorage
    }
    setSavedLoaded(true);
  }, []);

  const persistSaved = useCallback((list) => {
    try {
      localStorage.setItem("pulciaro-saved-tickets", JSON.stringify(list));
    } catch (e) {
      // storage non disponibile, i salvataggi restano solo in questa sessione
    }
  }, []);

  const isSaved = useCallback((id) => savedTickets.some((t) => t.id === id), [savedTickets]);

  const toggleSave = useCallback((snapshot) => {
    setSavedTickets((prev) => {
      const exists = prev.some((t) => t.id === snapshot.id);
      const next = exists ? prev.filter((t) => t.id !== snapshot.id) : [snapshot, ...prev];
      persistSaved(next);
      return next;
    });
  }, [persistSaved]);

  const computed = useMemo(() => {
    return DESTINATIONS.map((d) => {
      const r = bestResult(d, month, nights, people);
      return { ...d, ...r, withinBudget: r.total <= budget };
    });
  }, [budget, month, nights, people]);

  const results = useMemo(() => {
    if (mode === "specific") {
      return computed.filter((r) => r.code === selectedCode);
    }
    return [...computed].sort((a, b) => a.total - b.total);
  }, [computed, mode, selectedCode]);

  const withinCount = computed.filter((r) => r.withinBudget).length;
  const outCount = computed.length - withinCount;

  // Build a ticket snapshot (used for save + modal + share) from a result row
  const buildSnapshot = useCallback((r) => {
    const airline = AIRLINES[hashIndex(r.code, AIRLINES.length)];
    const stay = STAYS[hashIndex(r.code + r.name, STAYS.length)];
    const monthLabel = MONTHS[r.month];
    return {
      id: ticketId(r, departure.code, r.month, nights, people),
      code: r.code, name: r.name, country: r.country, flag: r.flag, region: r.region, continent: r.continent,
      departureCode: departure.code, departureName: departure.name,
      month: r.month, monthLabel, nights, people,
      flight: r.flight, flightPerPerson: r.flightPerPerson, hotel: r.hotel, hotelNight: r.hotelNight,
      total: r.total, withinBudget: r.withinBudget, diff: r.total - budget, budget,
      airline, stay, savedAt: Date.now(),
    };
  }, [departure, nights, people, budget]);

  // Group the "suggested" results into continent -> country -> destinations
  const groupedResults = useMemo(() => {
    if (mode === "specific") return null;
    const filtered = results.filter((r) => (budgetTab === "in" ? r.withinBudget : !r.withinBudget));
    const byContinent = {};
    filtered.forEach((r) => {
      byContinent[r.continent] = byContinent[r.continent] || {};
      byContinent[r.continent][r.country] = byContinent[r.continent][r.country] || [];
      byContinent[r.continent][r.country].push(r);
    });
    // Items inside each country are already cheapest-first (filtered preserves the
    // ascending sort of `results`). Order countries, and continents, the same way:
    // by their cheapest destination, so the whole layout reads in budget order.
    const continentMin = (continent) =>
      Math.min(...Object.values(byContinent[continent]).map((arr) => arr[0].total));
    const countryMin = (continent, country) => byContinent[continent][country][0].total;

    const orderedContinents = Object.keys(byContinent).sort((a, b) => continentMin(a) - continentMin(b));

    return orderedContinents.map((continent) => ({
      continent,
      total: Object.values(byContinent[continent]).reduce((acc, arr) => acc + arr.length, 0),
      countries: Object.keys(byContinent[continent])
        .sort((a, b) => countryMin(continent, a) - countryMin(continent, b))
        .map((country) => ({ country, items: byContinent[continent][country] })),
    }));
  }, [results, mode, budgetTab]);

  const toggleContinent = (continent) => setCollapsed((c) => ({ ...c, [continent]: !c[continent] }));

  const adjustNights = (delta) => setNights((n) => Math.min(30, Math.max(1, n + delta)));
  const adjustPeople = (delta) => setPeople((p) => Math.min(12, Math.max(1, p + delta)));

  const openModal = (r) => setModalTicket(buildSnapshot(r));
  const closeModal = () => setModalTicket(null);

  // Prezzo reale del volo (Duffel), interrogato on-demand quando si apre il dettaglio
  const [realFlight, setRealFlight] = useState(null); // null | 'loading' | 'error' | { cheapest, offers }

  const loadRealFlight = useCallback(async (ticket) => {
    setRealFlight("loading");
    try {
      const data = await fetchRealFlightPrice(ticket);
      setRealFlight(data.cheapest ? data : "empty");
    } catch (e) {
      setRealFlight("error");
    }
  }, []);

  useEffect(() => {
    if (modalTicket) {
      loadRealFlight(modalTicket);
    } else {
      setRealFlight(null);
    }
  }, [modalTicket, loadRealFlight]);

  const modalHasLivePrice = realFlight && realFlight !== "loading" && realFlight !== "error" && realFlight !== "empty" && realFlight.cheapest;
  const modalLiveIsEur = modalHasLivePrice && realFlight.cheapest.currency === "EUR";
  const modalStops = modalHasLivePrice ? stopsLabel(realFlight.cheapest) : null;
  const modalDisplayTotal = modalTicket
    ? (modalLiveIsEur ? Math.round(realFlight.cheapest.totalAmount + modalTicket.hotel) : modalTicket.total)
    : 0;
  const modalWithinBudgetLive = modalTicket ? modalDisplayTotal <= modalTicket.budget : true;
  const modalDiff = modalDisplayTotal - (modalTicket ? modalTicket.budget : 0);

  const doShareWhatsApp = (t) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText(t))}`, "_blank", "noopener,noreferrer");
  };
  const doShareTelegram = (t) => {
    window.open(`https://t.me/share/url?url=&text=${encodeURIComponent(shareText(t))}`, "_blank", "noopener,noreferrer");
  };
  const doCopy = async (t) => {
    try {
      await navigator.clipboard.writeText(shareText(t));
      setCopyStatus("Testo copiato negli appunti!");
    } catch (e) {
      setCopyStatus("Seleziona e copia il testo qui sotto");
    }
    setTimeout(() => setCopyStatus(""), 2500);
  };
  const doWebShare = async (t) => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Pulciaro Travel", text: shareText(t) });
        return;
      } catch (e) {
        // user cancelled or unsupported, fall through to buttons below
      }
    }
  };

  return (
    <div className="pulciaro-app" style={{ background: "var(--bg)", minHeight: "100%", padding: "28px 16px 60px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        .pulciaro-app {
          --bg: #E4F1DC;
          --bg-deep: #CDE6BE;
          --paper: #FFFFFF;
          --ink: #253D31;
          --coral: #E2704F;
          --gold: #D2A23A;
          --line: #A9D398;
          --muted: #4F6E58;
          --violet: #6C4FD9;
          font-family: 'Inter', sans-serif;
          color: var(--ink);
        }
        .pulciaro-app * { box-sizing: border-box; }
        .pulciaro-display { font-family: 'Fraunces', serif; }
        .pulciaro-mono { font-family: 'Space Mono', monospace; }
        .pulciaro-pill { border: 1px solid var(--line); background: transparent; color: var(--ink); transition: all 0.15s ease; }
        .pulciaro-pill:hover { border-color: var(--coral); }
        .pulciaro-slider { -webkit-appearance: none; appearance: none; height: 3px; background: var(--line); border-radius: 2px; outline: none; }
        .pulciaro-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; background: var(--coral); border: 3px solid var(--paper); cursor: pointer; }
        .pulciaro-slider::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: var(--coral); border: 3px solid var(--paper); cursor: pointer; }
        .ticket-notch { position: absolute; width: 18px; height: 18px; border-radius: 50%; background: var(--bg); top: 50%; transform: translateY(-50%); }
        .card-btn:focus-visible, .pulciaro-pill:focus-visible, .month-btn:focus-visible, .step-btn:focus-visible { outline: 2px solid var(--coral); outline-offset: 2px; }
        .pulciaro-spin { animation: pulciaro-spin 0.9s linear infinite; }
        @keyframes pulciaro-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .pulciaro-app * { transition: none !important; animation: none !important; } }
      `}</style>

      {/* Header */}
      <div style={{ maxWidth: 1040, margin: "0 auto 28px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: "50%", background: "var(--paper)",
          display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px -4px rgba(37,61,49,0.35)"
        }}>
          <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMQAAADECAIAAABPxBk8AABQm0lEQVR4nO29d5xkR3U2/Jy63T05bA6zQdKudpVWOaIcAAXAJBNsYywDxjhgG9s4+wXjiDF+sfGLQCbYBpEMIggEkpBAKKAsrcJqJe1Ku6sN2jg7eab71vP9UfHevt0zsxp/7/f7fn1+0k73vXWrTp1z6pynTtWtFpJoUYvmgtT/bQZa9P8fahlTi+aMWsbUojmjljG1aM6oZUwtmjNqGVOL5oxaxtSiOaOWMbVozqhlTC2aM2oZU4vmjFrG1KI5o5YxtWjOqGVMLZozahlTi+aMWsbUojmjljG1aM6oZUwtmjNqGVOL5oxaxtSiOaOWMbVozqhlTC2aM2oZU4vmjFrG1KI5o5YxtWjOqGVMLZozahlTi+aMWsbUojmjljG1aM6oZUwtmjNqGVOL5oxaxtSiOaOWMbVozqhlTC2aM2oZU4vmjEqFV6c9m5CA1F0U4P8rRxqSkHoG/y9QoaDCXVJmxuecy7Zx0yQhIs05L3x2Gs/EBn2I+8bAQ/S1cYW5D7NjYIYncDbQUGiduVpDJ+oHkrnS6JGGZAowJ57Mg40sqREPsyXWf3b1+KbrahZz6wjG4kzDXIEocyIWMZ8lFpwrbT/Hcoy+Fuq4WHxinmO+iWzl9TXnCzRuZaauwvW3SQk0Vknhs8UXmxSrU0puVFghZ80aRepr2OvZGHGxRDJKzUrEWkzjoW87MK1KGpcpcLCmcPaRZjEiKjnDUDLziPM/8fgsGgLwP9NWc6V5gzBFZhHmJPs5jk0iUl9RrqUZUT03zoFJfXQzhYs60MSBeYZZ5LTqnpiG9yZ+KPiAzMV8oeb121IN2vUDTJqyWhhMM1dc9KiPv80FIO6/ZmVm7m+bEcmZ6OOIInGjxwudQSjTdKB5k50FP0YmmTobVEAiG+IEwiKUSFBmwMLLlFtRjU2EE4vQSriegSMC4DMGvMYBNMcovv1GMLywMT+C6tkvQDy+fKGwHFDwo/wIKDg9SLG/CX6RuQ85XmJL8sCygObw4P8GTjqaPsUitOzNUFBH6pmOdO6dsfE63zJDhzErgJIdXjSRLwfCSIog6pLpvnmKUuc+SErGEqbzL5GhNOyjc3yZaZfhKHJ1R+Cl8o/MQHdNJGxuFd79f8OYbOJihqVnTi8H5kcCzgnOPSF+iNL7mqxYwuwa4PhhTA5JWiW0AFAlqDJKFSRtKFVQas8limiCAqGpZy2bl5FFyw3m2U5TPM3OmOprL5ypNZ/cFdTcaGDVCai+ZH4eSyLOreVqmLHEXQ0Z7yLuFnQKXYNKRJUAaABa+6FJAC/8lPd+ki89wYkhYc16EEkoJVElJG1o60HXfHQuQu+AzFvFvhXoXSU9S9G5ACrJNBd0kVW6d2bGu5Jx2mEmvipoMzjqAvkwcAI0heSzMCatw3DJW9XMlMRIH0fsk0KwyVydhoFpUG3MUK5fo/swvBtDL+LgVj24A6P7MXVY0knUJoFEdyySgbOx/kq1+NgA/sYO1q6/NNm3EYlILp9CgI5ZAhoERIGqpJNO1bdY5h3DgXNlw5tk6ckGyrlo2DRoziClMjs3E/sna6sw1hLXk6vzZYc5U1++7YYFmzCdv1KURmraQq6IhUMZhF/0mW5qbbuXTuLgC9z1KHY+KLsf5aHnMbZXpoahQW2jmyhQgBQ6hdZQ/UuSy/9Mzv1NiCLB0b3V684rD26VkjK2aXE0fUy0WgncuI/UAIDuBTj9Pbj0z1Dphgt5gUMCoIjEem4ohiDXhkaQeWQamyu47y+93DDnK0Pz6beJPj6fMYO8YvZrYTh1IzbgZbFpXJFmrshCVwBigJsAHD+EXQ/zuduw7W790lNq7AA0RAHK2lqkGVM5QGProCJUSS75EC7+UxJUwI8+zNs+nJSN3QGg2DmjtwlTB2N4bx2WCKCrY1RnvTt50/9BUlKm0NhBHtii2/vVvBVS6kBA75GyPAqrl2QDsWd0Gj9VjzGyw7yejjDMNaeoRw29UaGFIzaLIv+TvZhHNcwVhZ3t6/qgDIESAKhOYOf9ePJG/cwtcvBZVKsuEycicNMlX7HYZ4MnAQRQCkLqCt7yZb3h9YqQsb383KWy9ylI4ryNZdZHrRC8tJuXGdM0tqapq1L6pRtwytsEQFrl19+ZPvIV3bmgNHC8LD+dy8+RgTNlwdFUpahf/uORJ8RjLNUwehb5uSMJcxFcy055zMMz6YwPYWiU8XMfcjaVq3NyBNUx1CZQm6SuAiKqhFI7Kl3o6IMkVu25PIrrOp/9ob79r7HzflWdgoBKxHMVNxysNR61UREBRPSUxtIN8p47pHOBCPjQZ/Ht94ImdPmeSuhgXah1CAnGSVETq85Vv/JDtvdCp/qGn08fvbFUgSiQYA3oWayWb8Axl2LtK7HkZJTbnRqmm3cHYczU5mZSci5TAy8HVjeg4HsIiE45tIv7n+XeJ3HwOTm8Q4b3YHQfJ4clndCpBiAqQamDXfOlfyUXbVCrX4GVZ6J3hXVRWgN28YcHntXXX6QG96BkcBAQ3EKOCaG38Ph2rsMEa5SrPyoX/yEBTBzG9Zdi9yNQKgw0P+IRObgwagjvxQRQilDymk/y7F8jgCe+xS++KakIAGiDvygEUrCjE8tOx7HXyPqrsGwDRIVWZkANDaVJYCtyWnOaZ2rMWZOg5r7WWaK/O7IXux7m1jtl29364BYZ3k1rNw7QGLTtVWNMIjX6AHpXyNrLcdZ7ZdV5fg4PEWy7h5+7RIz2SCCqwupaXEITFstH7DaIrUT/UXjPnehfCYB3f1J/57eTsi8buaUcCewsz98SQBR0ykUn4T0/Yed8qY7JZ1+JXfdCBFr7kQa/UJcC7T2y5mKc/FY59kp0Lsx75QynDfN8mTAXK8Lc8iJ+OcakScwkeGV5mkU6wKFp2/bwbrzwEzx1k95+jxragckaBVAQJa4ziJQgNPOdLAuGbwDs6MH6n8OFfyRLT7KdrE3w+x/Ag9dBKVPGhp5I3+LtyvbHmIPDPb4J/1kJNHHZn8vlHyGAkZfST1+YHHjW4jMYIzSeluFfyazAOLnZftSqUG/7LzntFxTA+6/Dd98HCjVE0QY8Kwc7ZxRjkvOPw+nvkNN+GX0rgIYmBWTG+UxjS4PE5qw9U3F7M4io0zNqakgn9Qv34tEv4dlbZGg7U4gACQBlkXM8aBCtntZ7vji4iGYV6F0ir/wIznyPtZfaBL/9Hj70xaQkZunEMhr9CT5IsiOV3tRCYREQZNcK+fW70b8KAG/7kNz6YZQdk3TOyfrSeLpqZCTRIKQI0ipx7FXq2u+KSnB4e+1T5yRDeyAKEhmhHVMMKk4BQOavxjm/gTPfjc75kdCCiApXroIAZznpns1Cr99alau3rprCUeDHTnDk4h41ueORffq+6/RnLuPnrsR9/47B7RCRkiAxmMYugUqoLv4UhaHYjOj+UKSkZOwlfPfXcdPvcHJEAzppx9X/IuuvpiZEuUxiXLO/wuBFYF2YBn3jEuKUyOCLeOyrlpENb2H3/NBb7+kIw5Rvi66MtyRTg0ogO+/G3k0A2LtS1lwOmvljlHbycdldESWSKBzexpv/SH/2Cjx3u58qRP3L5FSd6MLdcBnZeUxuA09TN9LAmApX8go9W6OK8x1ygHRop77zo7z+Ytz4Ptl2j3BKykqUn/uIiznizMOpRNxw93qnV4TQ2Z6BB2JQCMh7/kV/7VoZO6QEqmOeev2nufRkpDXrbZyJS55pgd9YYJyd+PSaEIByrCng8a9yYogAFq3HsVeQ3icJg11SvCGYaplBTt7dycQQnv4WAYrIKe9gpQPQNOlzMDs5CBxaR5co2fMIv/wmPv6VACEs5X1PWA6q05uFSgGYZkNzva4dzfrtFJPPNJ/8lUxDma5adgDIxKD+6cd53fm4+Y+wfxNKgkQktO+dgQObGXuMVJvvlNeyMUEhnccyqcgn/5s3vV9qEwDYtwJXfaJW7ga17zt16Eqm4nAtMzLEon0QgBLufky23iECUQlOfrtJRLnhkBlOjKsTP74kJFYBKGDztzk5DEBWncv5x1Br8baWjw1hNdq0IKUEtUF85zf53I+ZcSrFoz7vrrL9DhHGX2w6M5u1MYXtBwVYzNtBpjyoufHr+rOX4+bfl6FtkogokVjYIqBEA8HNrMxczLsrycAmO3isZUcwiGGwiyhVEXn8i7ztQyS1JtZcklz4h4wMl96G4uw+nfNzQzTKC1k+bZahVuOTN9rk+epX6J5VTHXdgDIVh9Ad6YQqyE9ECfc8KS9tVADb+7DqPKYIY854Z299BOFE5Py6IOHowfTmP5WJ4QgvN5jPNQ5bEheIdN0kzs3ImGa98dLzI8L9m/G1X+DX3i47H5aSQJm8iBuoOT+QDWymbQRkHOk+Bg/M1JNZunBTzPQnH9MP3yBKBJBX/J6svBC11GQOBXH2Mvpr8ooEAoSrkyRFSpCtd3BwBwF0LZZjLhVtWc/2K9OE+KqZwaIEZHIcz9xqix33GiklEVuZ0BhqFQSYrzUE+sWfYdtPI1sR24/Z0Gz1PiNjKkwmFZeMkAiocd91/PfL8NhXRYhEhFmfHkEUKO+HXIwQeh9r00USqmfmeYcm6NCJXxs0a2oUYcof/YUc2iaAtPXgFR/UqaLWllUHiWgdFF2DRGFPHfAXARKFwzu4+RZzSR3/OlQqPoaFJwK3zCAYyf4HQIFP38SpUQCy8lzpW4k0jeYyUc+FEnIXrgeaAikJ8cQ3xUUS7rifm38ouhqlBhrjca+fad/AydJswlxUb7GF00cnweCL/Pov47vvk+FdSKLEMqMhGqM6EtAu4lidFjZRxwCjIGc+Rt+seUCVJDn8PO79Z/OAXvdqveYKXXOlvE7c4HfTWRcKSSAr/uAthZp8+nvWolefx94VMPP1SF4xhPQVxp2hd4FK9N5N6e5NAKR7MZadbrOybnZp+IsQGcVd9+kDScAXfozRvQBInd7yl7V/vxrfuJZDOy1SQzwprpdzNIxnTI2Nqd4kp61XbOvcdg8/fyUe/RKUiDK+oQ7X0sMdpxjmTcRFA4+H4igY+7f4OStOIhin9WqlBI/+h95+nwZQKicX/q60ddilfnoXhXjsMq467oDJX5g4Qy0Kas8DamiXANK1CMtPZ4oiFUXPR3Nv60Ed9yIqmRpTO39mvDRXX8TEcBXvFfboCbBhOou1RTC8k7seBgBRWLwuUVo/+KXa9a/C8z8R7+bjHiH/tVEHGrmrxsaUTVXFTzO+mxWxCPjIF/mlN8j+J6Wk3Gqmn/CHntr+GPBkksA2iuVM1k19c9OKwJMHA7HTc415YzIxbGiQP/4YalUhZM1l6phLwDTCxLR9DUGUDAA38nj2vjOJRDC6h7sfBaBFYdUFOnhWxv/Rc+hmZshKliSpkUB23k1SA3LUudLV7YabFxR9bPfMhI8EoGRqAs/elgIakDVXUETKUPufwlfewkdvEKdEyVlVYCYfGoK1NnArMwtz2aczNUUzEQC863/jm+/G2F4kShw8CLHCciSMbYuSq9I5cGHUIT/2XFrcY6ciXAy/UC9BYZpQ0JtvVns2ikBKFZz6dlqMJcIct1FddaDZW22whLSGLXfYPQMrz5ZKR8yLM+8I8dHpUFyjTogkkAC7N8rYQQBcuA69K6F11GYwd+dA3EVTRtlJRfrcj2ViBACWnaJ7l4sgKScY38dv/Kq+85/yK2ZeP8yk2DNqaUrTGdMM8Zdp+I6/4/f/AJwUUQ50SN7cbO+9E8rGq1xUCYNbJCACW9gW8JoQvx3AyjSSrsVBAqjaKDZ901ZyzKW6ZxlNNJM6xxm+w04avf/zw8LbK4AX7uLkGABZdKyad1Ssdd8lO+WyriXuOCAw63oWzRzahkMvKEDaerFgPWoQFbMUP+466rEXLKjS+57B/mcAqL6B0vINThRAOskffJC3/xXi0CLuecnMHmaOwaczpoY4Kefwgbs/gVv/QiSF8TweIHp7CJYfVZCxJESqgrEUsSlFE24EBDVDZPP5Y48ksv4+CsfmGVFl4bPfx8RhAOwdwMrzDbwtgPt+1BdAviiour6k+5+RwW0KQOcCLj/VrShHYjQBnXG8d9EvtGB9OCdHsedRAaASvfjk1PQzIBnv4fKqsHt8QRGoiWHufEQBUCU56gI7pjRERCmNOz6sb/srt2AeY7HMh3qaPWaqq6DhNwE2foW3/AmUhpKg6YxaHZR2FRQD6OBKmFkOsE4udlw0IzhzNZhU1sPBeBslCkiU7NuM5+9OAUKSdVcRYqG685JeXSICoY3XRSQI+wo4cRgHnrHOdvkZDhtn+fMpDMecKeVSG25YaEEK7n7MFlt+WsAMmV410blrfucDVsDLTqMqQWtxyVkBeceHee8nEDuN+ug24wndDIwpXj/3TIY0ifCFe/V3fkdq4xZQ+4UoWjArUTWwXcwvvJkvPjBFo08sqKKrxE4D3RiPexqhmeiS+2xsj+TUuH7m+2I6v+p8dM53OyRjKzRN2VcDInlmmnR9pIgk1OrA0/bGgrVMFHKradmQF3Cdidaa0DYcm53g3PM4dQ2AWnSc6uiNE99FdYbXN+1XQVKC2v8EaxMEuGBtLemj9l0QQCnRuPXP8MQ3ZhLJ/EraywDgmUgRoQhza2QPvvPrMroXyuaR6ycH1B5JR65cALN70NqH8wM+rynIY8Do6Ub9Db7Que7YfYt19OCOB6Q6AUDmHc2F6+BxghOqXSl0iwnO8uuDXSQTBex7Emb2tOAY6eiBF4cwE/UQIGE0nALkgYIoyIEtGD1AAN1L2bsy5428x6UfA/XTewUMPo/h3QDQvVT6V/o8uYmDUAq1MXz3t/Dig4WQJo5oYSWtAc0maZmJHRSTH739I9izUUrKiVoYDQ2/Czd89M4jRL3IiwSZiDM3ZMoEeyq0LMkMXsZXAAT/rg5vlaGdAqBUkWWn+D2YGU/pIbafSeaiTPCfJmUO7n+GaRUAewfYvTgYGi3PeZAT1xr1hBBJhJMjHN5NAO296Fvhs+42Ajs+/VQhxmgug6Awtg+D2wigrSdZdqIZtE5WNrByeA9v+i0ZO1AY4+YAgDdeMIHPaOlNN+GBzyNRUQLFuVpCW6/oZy7RYoibchjJ+YrpO2l9qo+wdf69eIhk0ZM40cWjQAAlmDiEQ1uMdmTRcZmceV4IbjSGiJ2v1PIu4OHdGNkLQNp60bsSOgTl8JjvL8OgYbZaoQZEqsMY3acAEYUFa7JRLA88YuYC9wJOVvnSUzY4LTqeygmdhJ/KJCLb7+Mdf519HC7EW3uqXwXIUUNjyjm0zPKqwf9j+3nbn6M2LsHH2NEtjHJHGawUK8M95X0PPWwCrS9zsMJv0PZjMsdYRgKxZ852wlxUIkh58BkAGuCCo1kqOZ1GY93EJxqsIl5YIdscR3xza+QAhvcIAFVSfaujPb92s6aN5/H1SDr+Xzt/rNVkeKe9O/9oRAPQhmSXWwmRLvh/mhBIDR7YYitZuDaM2Uz7gkRw/3XY9L3MeBQgelNtWiA+szDHoCBxeIT3f05e3IjEDF8XUYzTCtAlr/gYM4tkFG+MS0Vhxpl0djqdo0zOhtk5PsOiTcS+hdUHX7CG2rdKSuXI/8dOOThauIEk4qboDJtlbO1TYxjeZRnoGaCOx5ILUS6Ax7kir+IA8wjRwOCLVri9y+2iir2Zs4WQhLMStivcFEAGn1dGJfOO0qoS4zxbh3FRUxP84Z9gdF/Oaooy1sX+qXGYy9XnajQ+m4dfxM8+JSoDSXLSCM0HblT9PZiEuBdOTvW2fSJrlXGrcQMFadJc7PM1DO0WagHQ3odyp92skpeVQzz0Dsa5DnjT8O1CQAy9aIt2L8vNg91Y9y7NjyrXZuScAEKBI/tskc4Fkii7chD2pNsH6FwV6uQvCji8HbVxAdC9WLf1Ry1FRECJ7HkcP/tU/la+XNHjAJqFOf90bnALCOiH/5MHX5BEAvO0twrye/Del4Vb+5xHcC7atWi8nPMUtEm/mDmRaKqVM0UGowvewW5roEY6NihmC0q5E5Xe8LTkHon9q0Q3QjEblcyDg7vs/c55SJQdKnnhmx2hsd3nB5mZi8nEAauhjoWSdDgjpvVr4dQygd+Ygci3mqbHDsnkCAFUulXnvMghOlF7CykBD3xGDmytD2lhQ0Jjmj7MuRXZCPdNHOSjX5QkTE48rCgIRnkhAdnY4N4eQIwh4+bp570x7HUw0vmNwh29tgJ3MXu9NmVslkkbyp0Gy/glGRfIfA8RrMevprisegyFOWp9CXqWiio7RsV3NRYG87ue6mj8gGW6c74udbqGLauw0DgwGZTkfacCJ4dNxh9tPapjXhbESiZ0isLgTt77ySI9NNnia2nGqYEIlGLLj9VLmyWLbmJUBxTpVbw0GSnevP1Fe8sNvIAiYmiR9c9hMhS36hyleGxCV9o+bp2IErdfSSUolf1QZp53v/xHb+4ZWZtqxbmtqUF7va3HbiuNOc4Cm5yE3HcGjzs+iNoUAFS6WGp3Pk4y8TiyoDAE3HUBpDrKsf0AUGpDZ1+mNYE23BtxkVDgYzfg0AtFaQI0p1mnBkjyiW9Au3ebI0VmkUx4wBewNzSCa82uL9i0mN2tz8h8PJqw0dQNSOcVM0jLGaKdEkpkF+G29tsxBaISgzlo1q5ybsxzTt++V5nAwnxXdW3KDuFyB6QcrCcrFd8C85fFm6YIUJuQdBKAlDri41AYz9OZ7V9daJDaJMYP2TsdS3IjXsS8RaMd1hCMvMQnb8zUUQhd6mjmSUsnrZGXuO1uKeV4rjNaKbgWgx2ffPIgyO8385vkBfDLVhmEAuex6E3JzykRtBS1YOtg+ICkzazSM01Zm4QSKJXvkx2vsfPzV/3GArHvA5qKa1PmfDmUu5B0NNBCYUA2GMh7RkKA2gTTKQBQCUrtyD7G3PdM5yORaY2JIXu7vd/ar8el9P1yPlEBG7+GydF45plls7hXM80zedFy54MyuCPnoqO0niuLyJ4iPbu7zosFtjJnCIQ+xClwioGcJhsHt3DmDNCsvEWiFg/l4dNfYcWw0gMpAUB1XE3sE02R1KN5Qcxy1v0yE099UDG8YGrcuu1SB8oVK7YA+7KW7vfLxN4l1lR1HOYlLQhL7dEI8YJkjLy92mOvDk2MHTDf2NbjGIXjJuaIAKHAXQ/hhZ/6vnu49LLX5gKRgN76U3OYhGso+ptb2acLxhIrRqJ/6+NwNLWXcCHThrGnrLi8WqPCAiK80hQ8Eu3TXQstsOLQs8Pnfn77p298/iODUwMGC2aHXu6FxriTUWdNiGKVZhOwUrSYKc74RnZZrxFGZQ0T5rw6IylVkdhthYErlsW8w3K1EpwYtEZW6o7NsaA0ACipVfHM902z4d/pqPhXnTybWf8pklZlz+N2C5cfoJG3jRdand0Hi2P0ChJozkT2LdG7rBzzDJNJ657gEHzAacw8lduVZ7ixKVOhmLXYhWvNw7t2zf/a5o8dHJ+vJ9W+yeOvXfvOsoxRx+8/hcpM8j8MaO96o3f74IsychVi9yjncI3NoLkDBwpszHZSgnxo5QXPIMBwSJ0I4i2UJCFp1VZW6fKMx5KEgH6fD6EFfOHOZGqUlS7fG4CNfJKhhmcNeFZDpwSYHJaDW/JWJvkP9H2DU4SVQ0bSEqtJ7CMCuC20LmRbWMVsDcHlRPn5sFRsoqD3cZmsNqFLCouPN51/4pHy4FBHhxrrbh97cfLcfVMnQjIuLmT0vSX52JmVEQktSZQq8JGjrmiwpsy1vK5I0W4LDrNHAiFKvPkWcvkRb8pa20tJ2XltCSYqgJ8cm04oyP7N2LfZd0KkYXTz1PCsgVy/7fex/RzZXyQP8X8FHsxZCG0tIubGb+6zyqKLiYyfDCd95IzXT43jFLeFxkYeZgyJ9qPCwzoBQNU9D/OOMpLavaWqmVrMUyoNc3loKrdfFJEuvWOKgy0B1WYP4NI1ce9S+WSX8QC2z5noJ3H1dbHfPZFDCw75ZMv6pqy/FBXFbVGuS/CjkJl67AxYqhPc+bArKr5cE5pRaiCMhZH9mBoN1yW6H5C/fyC7aTv67DbyROPeDvlYFlGYEj+7g1sac8aBYL62SZtltQ96UcRpT+k/ypxmNDpU2721WkqEFEI0k/G0JzZdxmtJhvXMWypRQDW+QVVopFobg56C8oE7qN/7y0g6cWfs1FQAlEpMSsa3UdeCFGzoEydmM1KFWdYd+zZWEhBFUUFe9KpD9jkjwJ0PBkZZV66OZjCbi+diY/tFV+t8cV4y9RecucRffSG3LxNZIbvXVWGHMSL/HLh0zkgcoy5lErmTzHg2bmPlOSh3Aty1pTq4Ny2VlFIiAp2qiWolBDIz/5JcDSYoh7ETd5nliu1pdQx6Ehku6ARK546ILJZ2JV3VpQ6UKgBALbXxuOt+HcTsLAPCmcNFK1pudVOiw0Jyp6pky0PAfZtQHbeQdQYYfEY7LYP+quNWc+J5jty929XpnIVv34U0p27TBRugAe8wsr03GMor1WkvLLJGZWGDonVE2bxjvIYLaCiFoy82N7c9NVWdDBFSAzpNgBBq4boYsAmIKMeUCbiAtPfYz1NjTP3A8zznjS/7KWzlse1VumBylToVPRnXFqQMF5qcoYtLhDmJgUnZ7Z8xPdDR6I0Y8afdgVDg4R1SHQu9O7Iw1+ihqFWvH78RwHufeLHNl46Mxt3T0UTP/usb9tuUCNQ0atqlaP3pJ3EDDjx6mFs/itzOKGiN7qVYcY4AtRq3PjpZKvsjxV20CV4ytoX6fsHvvwpd7F5k740dgrYviccHxfgB6P6N/ZtfUrOdZLlLyh0AkI67kRwrR4J/y/Q8M4oFkFK7vTox5I6XdljPesmwVO37LRMH6bOd8ehqQM1SA4Fl9y9LFdGkUMT91JEgUqD40s7W3BYmiH0R268f+ZVDOuFFq9dhMti1WE5/J0n9wOfU+EE/RNzw8dsvbGfdpyz/Arijt1gDV56T9K0C8NK26u7np0plMYFUKEpYTiYRZvhhr2hmT3FGso5rc75hz2J7eXQfdBWJrcUcmRXE4h81tcY8M8iQbX0mLsvkCNJxy0BdaLUyzkzn/OI0KZD2fvvA5KAXSnA0tjvxBUIg6RTG9wNHh2abxrtiYyosTgDt/VQloAoVn4xnYipj+AKSCkh1qtpETypzNpz4ObJ3VK7yLHAUQoNplcnVH5Jzfl0A6VnJm34nOg+NroMSDbJgzdlCtox1QGtebSZ7mx8cHx/T5UoCCKCptahqV3kECvawAAbcnJkhBOtn4BhAApl3lG17ZK9oIBE3OBh48++Oumx0zuXRM965yAp04hBqY1GR3DCOwIYv5MxWlLC93xaaHHFTbIeFIhnake8hHDUmBoP2syqrp1ke9tU5X8puhcj7CNuwxFchQAqe877kfffI6/4N7f1WkzZoS0bnns/wn0JKtfx0bnibPX5i4bGikkwoRKQFV2EuFxIgCNwo7R+QdVcCmJrQm++fEiWEBijmrRhda0sOO24QjFzy/0bJrYiBUgXdS+yFwzvEX/cGH6fE3CjPcEwfrAlA5q+0PR7dh+pE1NHIsg2EK8CdBkgR5bJ09tt2xw7lIFLUqygEW1Ml0mp0cRqaLsxl3Rq7l6CjH7Vh1xunTInKG9Jk3wpc9iF0L1bLT9eje/UtH1YJLGSVLMBxo9/+EZBaOvvlqo+ys5+phhJs/AZYg4p+UiJ6edz9j4zu7UcfXIEUcsIb0b9awC0bJ3ZuqarEJZgFAmlT432VF63CnPOg94ANxWruabT1omsRASE5tMNhH1PEWZJ1OxJf9+IUtwhkh8281fbjyEtItSRWUpkwa22gYBjZikvt0rXIaEfG9+edizjMJFmxGWajYFPfSI5m93q4tPdj/lEONTjX74O0IPoKgVa1Mdul8/+Ax7+OVYhKwi4fMTCnTj+pBhK86m9k7eUKUIni1h/rR77kllXcEPQhA67DnjyiDN8Bkt39OOtdALTGAzePTk1orzYCUOV5nQe6k/0Bu9k/0aaqkBRAZFkEAA10LkTPUgBIJzm8MyNdH4iCy2Nch/Vc/kAYQCcJewbs7cM7wu4HH9AipOWXjAPr3vpLnWjrNVxh4lDEk8OYYXUh0qbd3ZOEKo84zxQLwfkMotyOpSdGOI1RtwD6nYqCRGFoF+/+mLmvK93Jmz8rZ/4CqKFrdpOGRPlym2kkpjTa58kbrsPZv2FnKBODctufq3QcscNlVl55lhEU7nVQI9a/VpadIsCOzVObHpxIEnvPDvWktLhra5sacklViXaWSE73/gwKw7wA1NA9y63aJg6p0d1Q9dHNLdW46Zoxeff+B+wJJmaUtvWgc5E1mANbfLayyDlKxJNVfPBc7f1o7yeAqWFODLoxHE8hjPBz8VYUEil3xQ00pxls243eNQEgK8+xwL9QkT6bbeq+/zN84HMUKFJ1LVRv+gKu+Vf2HwVNaA1tftdNgxppimrKpKKPf61+5808/VdNRdQ1fdPvY9s9Unbpn4wvcvEpy7LHXiZ0EIDWaOuWs95nSvzsppGJUXMyE0XZ6KLJhZWnBA4lxFukvEuJ9jGF62YQa8jC9WbyxUPbMHbAzHmzPtI51igjFzJnEOucSBCqrU96BwBQ1+TgjtB+JGrHIt0l8ezYSynQswSVbgCcGMb4Qa9zZgcGM1NKCAlVQsdCFOm5kKZPDcQ/UQYIVp2nO+cps3OvzlwZfxQwrda++4FSR7+c9EYASMpy7m/ISW/kE1/n09/D/qelOgxNlNp151JZ/Qp18lu5+nwtSmutlJLalL7lT+XhzyFRQP5Xy8JcO7eMII5VRnGuCpz+Nll9HoCdz00+ff9EpV0FL2f2naTVZaWHvL9v7NX9lEccYLP8YMmJtsjBrZgcQyLiT6/Lhtw4hlo0JQGBEqQG5x2lOhcIgPFBDu+sR5bwU9XQc4fHHODRGuw/OilVAHB0r0wO2sNFIMz6ojAoDY4h2danuuY3EEIBTWNMzBoMSZl3DJadgedug/tRrrhvOXclgqR2mN96l5o8jDOutWW7l+pzf1ud9V5MDmPsENNJtPclHfNR6TTPKYBK8fBOfv8P8cRXpVQyP0wZho6DQFFjjhkbPdyoNwaRavYuUhd8QABq/vi/R8ZH0qRkRjaNKRGqS+1fUn48Mstc7/1ll5wXBrOj1qU2tfA4w7/e87ho+PMXnNnFnPqJe2wPboEaQg0uOgEqEYAjezC800HGqJIcd4IA5/2qHYB5R9nHDj0vtSnjqs1LM7aOaNSZCGvMm70DUu4KIOflY6Y8JWV14puC9eQ6Y8kBUiApiZoc5Hffy2+/lwfdG9kEkop0LsDCtVhyInpX6HJnEAg1nvw2P/cqPPJls/XC7bOIoAwQrXHlGPChwDGkoc7/Qy46HuDmhyY33TcuJRGBEiizBZqsIVnS/Uxf2277y10Bh3p8bq6bYeuAXrRoJN2LsWg9AOqUOx+Noo+NTy56+usudxWLziTjSVFQy0+zT+zfjIkRZPeBmHAaehpcXbSaKlQKauE6W/mBrdSAeYcj1p+HrZH2AKjFx9G8t5PVbiOaxpjqTR8ATngdFx5ldwCaGUAmR4QIrShQIAl0yvs/w09foL/7u7L9PqmNiQ8msCkSAhjew8e/ln7htfzKW2XvU1JWXr6ubut5QvLfuZ/8aV1uRZE1jTWXyrm/oYDxEX3Lfx2uTkWD3JqlFmJd711JkoaxLw58OfRtvWI0rfIbPpFCFh0nPUsBcGw/9m+mAqLdgFneDLKJ18f8JMb81Sy3m7mCANj1mF+nLN5/bXyNdZWI9waz0iEL19tG9j0j0VBxwdB79ExkJ4Blp4lfmpjelma2nJIhEr3Lcca1/OH/UqX4pBwGoGKDbuAXgIhweA/u/gQf+ncsPkkvOVnmrUbnAlY6MTUiQ7u5+zHseQyHd4gmSiJKxX7dZjyCJD3+hQExWTzl/lKzawGu+ijbugT46Y0jLzw50dahLLAw6SclIDrV4Nqu2y2nLmRGCzyASxeLezvG3XKua/npMD97euA5DO8yPwgThj9z7tLtqnRO12rNF+5dZsOTTrlno4TwKG7BIetR3DpVxlFrSt8y9CwngOoY9m12SEt8x9xPnYoFUWKViFIZA2d4r5RzoIU0e2MylZ7xLj7weQ6+gCS3X9qtw8aLpoZIUSIKrI3Ji/dh2332IBsjUuWYFZjj522UjhdQ/ApUJr9lPVVujmVAsoZSr/wIB84UYNtTE3fdOFRqc1yZ3eRCJaJ1ZaDjzsWlp00SyY1XtxUXmZiQcw120CrF1a+wTe98CNVJlCL7CPU4Z5RHo66Iv7hsA7sWApCJQ3rvEyqJy0aOJQjBzWGjUScE569h1yIAHN3HQ9uVilJ1cUd8B81trWXh0XA/2Jfpb+OfiJs9ZjLt9Q7g4j+y01u3dc2akfexcLGHkTRhTUdKgoqgLKqsUFaSiP1NFZ9TD8bonndxkVETPkMbEko+3taIM9/NM39NgPER/Z1PD44P68S0YA83sUdPQMkJfT9IZDI6rjiypOAxCkgg0GTfUhk4jYDWmtvu9q6MBLQ4NmOg62/TO5ogKwIrz4MoAnrvU8nQTvijnsPj0TfxzxpLsrksrcGlp9JY4oEtMnGQSrybyTj3mJRAgyvOQMe8eOi4SNhQFEdkTAAIOeNXeNw1qJnNxXFqw5UIhuXlEJ8W4MGrP7rEFM6/GhLFCdjaaIa48SBB537FAgLUNNZeKa/6e6iEGrf8x9D2zdVSu99X4OtlCtVbeWl9352BbbfrJ3TB8xTHN8cSNbj0NPStEIBj+7n9ASjfEQuNGK9wR04h4h7eQJiUOHCuvbb9fkxOFCy9CTImHi9KuRmhJIIVZ9mrex6DnvSzFz8WQze9mkiUlKx/Xb0OvMALaZbGRC8LotSurv5HzF8FrfO2WhcIwh+7C954EInKMIwUsRei3ULucYdDLLL1HttfN56tprHyTLzxeumYJ8C93xu553sjSZn+YeNPjaJ1Wj6p79b+thcZqwN1ymMUTSPIYTojay6zO5d3PaYO7XCeks5XMgiFsK/92Y0WWdmS0Jr9R2PpCWKGzAt3RfYf+X3CTpi9MfgCVmiaXQuw/BT74M77wk3bB9JLDJE1U2P+UVhzKYpojjxTlGmwwlp0PF77SV3uoo62SjvEEbiO5pxRvsWtLWaDYPyIXZ6tCzESpGsFSbdvFQBqGitOk7d8WfpXAHjq3rGbPz9IZU4GNXwqMUk5QCPpKA2d0n9DeOHdW3O+4WgBgtZ6TcREV5+svczytOV21GoR18ELZqdK3o06q/VSSSErz5WuxQA4shu7HrHewlcUhOucn+XHgQQz7asBC9dJ/2oFyPgh7tpoXibIvTfkgnjUVw0c/3p0L8nDw+loGmOqP/cqc8IOieNei9d8Qqs2QDMazw2st74f9rPEd/O+1Lruwp6FR81Iq2qsfAXe9g3OXwvg+Scm/vsThybGUyVeI3GumRrt63t/PND+qHUhAcYLxJ2KkgkmjJUJEaTg0lNlyYkCcGpUP/cjuzYa7TYxW+/iSxK3FldMakKOucQ0y12PYOjF8Ltqoc++vIcSJM2vbNhJBAmseIWU2gDg4FYc3GYr8b7NGqZk7IualU6c8guO9QKZz/r1cNfn6HxMP8+NHR2hznyXvOafmLSJTu2AFq+OKAzBj/YobEWSaAByzeqb2FfC4TyRg9pRipmsESe8Tt7+DfYfLcCLmye/8tGDI4O1UuIcql3Ko8lYktKuhs5b/FmRNAwV16yVpUd09jvc8LfZRQCy7kqqMgDs2yT7nkDi5iQBh4jQLueKdUpxxEH4qIHOeVh9nv2+9UfQOtp4aMs6aOg8ZBbSGTGrcoKjL7QN7bhXpsaC0MIAkZgLgSAF116JpadGOq9TyRHP5iQObQXVE4Q65zfxc9fr9n6k0R45FdmfryKsJkaS9OnHfLRzBZkNGjHQNsvdqaaUcdEH8dYvo3epAC88MfFff7P/0N40KVvHHy9biN02XD6x78aVHfezEeqXqEnX/5CNMfCisw/rrrK2+OwPMTkeq0sY9l9lOuXF56GVMReNZNXZmL+WgJ4cwpY7XFLADT7G9WRMISNPEv2rZeAsAtApnrtd4gmLbz2rBYKsdKoLfk9UMtsYh8Z5JuY73ew2SZHT3oG+Ad7029j9FEoCUWLBqTurNWuXDOkXISii7GYMD21DM34FHDEQgx33GjVw4dHy6r/Dhream5sfGPv6xw8NDaaligSJ2xhnVU2l+soHLlh0vTDN/oBRsHXxeUv/9nE2HjMFl52eLD4eAKtj3PT9RAFhe7VfxQ+1uk0rxufFo0QAUCDHXY2kLIDe9Qj2brKZPL+UZEshY0b0IcvltTSw8hz0LBUAI7v1iw8kyneG/gXzvKdKKae+GavPrwMZRmVH9np4jtc6qquSIHDMZXLtrTzzWiRl6NSK0MFWCVLzQdCfyIVouSvy6Nk/froe/H2qtargrGvlXbdjw1uNr3jo1tEv//3BocG0VKpj1bgBESgSbecuumFpx9OR5zPvyAVTKexsZjWbkPWvY1IRALsfVS89KomEgnXSimK7XZSxsEE5NXXOx9pX2cee+aFUJ+FMEpKpI1TO2CCcmQmw7tV2qrLrQRnahbCjU6I/8cjQ7FmCCz4YFpt82sVO+5pZEhp7pmkeKyKCQM9yeePnsOFNvP2vZfvPKPb9UcnIkW4Ph9VKuB82pEYxzw07C1rNpZRUImsvk4v/yEhfgKkJ/aMbDv/0WyNaMymBMO/TuuUlE+5oAFjbiq6Hzp5/ffB6ZlhLtInWrK4HCcYTeZoYJ31LcOLrbE82fUemxuhPRXdv60ULcI4XQei+i6SEIKUccwnMuuzkMJ+9WfmFAWt/TruOw4yu6Dwpye4l6qiL7eB7+mZJtZRBe0qc94+eBCQ1cMHvY8mJwbzcwbTTmpGhWS+n5HydD0QesYoI110jqy/Gxq/o+z6FPQ+rlJIA5nUAN3YYBewo8jMagwGciHkl04hJg+WKHHMBzn4vjv85SdpM4X070u9cd+jpB8bKbZIosVkq+hdBPMSgpnSUxq5Y+vedso/MGrpblmfEmIjjy9UiJmeaAuuvkfnHgOD4fm76tvgfAhdnIf41W3OVbqHJbzWxr74JjexOeYt55VZvvwd7n0QisNsTI98QIwHz0a8/mVspOHA2+1YCkPGDsvVOJKDLrMHtLrSLfAYq1ch1lyXn/oZNsAYDtYPPiqWpi5puP9N0/s15zBgMESDaunHWu9Upb+Nzt/Hxr2LbjzG8h9ojFi90Z/yEk6ntrQAaGhBl+qZBEfYOyNpXyqm/hKMvhJlAAbWqfuiW0du/MnLgpWq5In4HrAc7oTsiQtFp+fxl/7y288fu6L1s3HJRJQblkcOy77EAkEoHTn2HeZ7P3Yr9m81ChK3SH1Hjq/V7CDJx33gvgdacv1aOvswWffKbqFZRjsNusfyD3Qf/LnL8GyiJANx+Hw5tkURZfJbB7zZIQlN6l8tVH0e5C5qRb7DT+QB2o1RxPRUbk3++3oz8FVOGTiwe/JFUPqFQ6ZYTXi8nvJ4Ht2Dr7XjuVr74UDq0M6lNOvhMqCgXaPqbBvRbI2vtPeUFq3HU+XLM5bLqFbp3AIDY0yG4ZePUHV8devaRcSXmV7tt57MqsPCMYMrODf3fv2DBdUjt0PQqt3kQ8fbkJkBOQZYpk7zVmkddKKvOA4C0ioe+pFIiRDXaVwudcxMXw01HbczKwB2ok9+E7kUEePhFefoHoiJ8mImV8JEqb2gCaGLealn/KpgE+RPflFoVJfvitU+VRkFC66RNve7jsuwUajMAMht4C2yg3mIANHwJ0/m0nOnU1yj+rr8cZxc9Qpq/BvPXyJnvwei+5OAW7H0Ku5/EwRcw8hKnDkptTGpVmC1hlU60deu2eegZkAVrSotP4IJj9fyjk44+U6WC+YFUbt9UveemkSfuHp+a1KUygsMAjA/IDWkRpGxb3vnkNSv/oiLjwToMp0Y10aV8zimAW9MnJWe+B6U2AfTOB7H1dlFwTdL/AxMlPDY2hkiLnMTtQAI0OufJKe8wWtRPfBOD26WsGjgBRnz7UWyHtK5BjrsKvQMCqKGd6ZZblGMsG3ENaVLk8v+Fk95KH4KzbU4bnTw1DHM568nV1eRuhKcy783Ygl2L2LWIK8+1KKY2IbVx1KZYmwIJpVhqR7lNknb4sxYABU5NpGPDLJWlu19ByR1fGbr9K6OTk2mphHLZO2EHVKNlNoH9teAaKvPadr9h9e/1l7cxFbgMZGaKLGHYmq+CyCjFdjWtagycrNa/2or+sS+iOg7/xoOPaG6mEZ39IcEULJwWEKiRJ1wmi48XgLUJPPWV7EbK7IwlC5esgK030ShXcNLPW5/43K0yuN2cA+vK+NAooKaGXPIBXPzBnIuLMHD4IZ5pqaEx1Tun+rv1F7MnMsWpWTjebHdMCZTa6Q6RjV2+hAegBC9smvrevw/t31ErV3jS+e1Ljy7/5L+HtUal4pg0VYvz5QaBRZtqNcq9at+bVr1/ZdvDTB0m8r88HS+6+Y1gdiE4uxprVKGBU96JSg8AHtyKp26UUghJHroQ3h6Cdnz63Py1QksSnPorNBa07S7Z+bCUHIQP0vLi9ODSyzGkkNTqc7HqXBI6neSjXw5vP8VPCKwlXfQBvPLvIPkUZS7G/U/N5nIU+ppLrZIioqdJc4VsJE2CwPhskcP70y2PTjz/1NToEFWCXVuqB3fXRGFilHd9a6TcBlGilORNM1IibE0iYJWV3uTwm476nTWddzK1wzRsu3NOzMMZxODHW4jvILVaeiJP/SXL+8NfwOBulJX5OZusQ3IdFXFhN7MMZpwoUnL1BbLmClM5H7heVSeRqBApYxxv/gaXH6W9BBCF069FuRMAt9/PrXcp5SUUIUmSUpLL/xSX/2W9JeWVVK/E7ADzNI0xFQLwutPw7I1cucLHi5i1lmQWroYOpHfdOPL4XWPDh9Jq1WSKkZSkXDG72JAk5gQctxPbicdhEZ98sS6pxrZFbS/83KoPrun6CdOQ4gtYO8c+6z7Az5UsHsMF70fPIgA8vIMP/6dKYvlGe4ij3oeI5u3ARxIROfe9KLcD4O5H8cwP3Js/wbyDVDOKdP0XESimKRetleOusjc23iDVMZSccBwkRKrR0StX/SPO/DXTfnP9SK7RBpaEmaQG6tFSk7v+ojRtFV4MfuYEAHj+iclvffLAri21chuSklQqNh8FgNoskxqTE7odbGLDnN3taXIthgFNaLYd03fPa1f88ZLKZoOTAjzyfHjEHfyGzQCYNFfYJiFAqjlwlmx4m+X/vuvl4DaUVcBdMcDyf7zV1lkSUnL1uXL8a63t3/8ZGRtCOSO3gNsyEdm7ZZtP0Snk+DennUsUIEM75NnvS8kwFJlLSi49Sb3mX3HMJUSBJQWdxurLNdqAZu2Z4iaL73pDlnrJAdFn2h9Stj7smQfHvvwPB0dH0kqHmO0UEqA0QJBa3DkFzhbdJMUvgllUy5RJWU2et/Dzly37eIcMWpyU13jdRnk7hfcTOkhmqkwtSi74gLT3AuD+Lfq+z5pwlE10R34lBkwezocpnkCUOu/9UukGoPc8gY1fj7bVm+SL3VSagV7wHsMJR2vpWSJn/qrdbLPx63J4J5NEqAFt5aIUTv8ledXfsHdlMIswH8hqvJFyG9MsMFMuDVp/3TYHh4D9Vx/Q3RWLTL22RHY/P/nVjx0YHdblNpem1bSSJ8zcViU2gxy3bxK7xkYI6JRTk1qS0to1ey/p/uP17beAxnOZ6ON+2y6rYxAuPxyhMEaLtIapGmX9q3DiG+1c6Wf/poZ3oWI7lI1pkbeLphO2MXGxsKax5mI5/vW2Qz/7Nxk9KBWBFr8z0OWrI7gkoQN+rYgp5Ix3ysJjBdAje/X91ydMBYmIMIWuQZauV5f/JTa8HR6oZCcIGZ1mBoRVc3ATR4aZctnPjENqFMVMij66INH1DN+uWHVS3/zZw0MHdbk9s/HSLaBI98Kkf2Gya2uq7RZhukaEmmmN1CIJIai0qYG1lbNf23vKiSOV/7yfQ4T/mQCXiCpANJY9W8qHQzdaHSBv68Elf26WdfWeR+XR/5CyROPFA8rg3kJTxmEyMg1SJ2W54AMsdwiAvU/iCe+W4v+dQMSNP9edwCEovYvl7Hfbvmy+SfY9jTKoUxDsHZBTr5XzfxPdSxk9EiaukbphZwtBQMGJeI3NCjPFGfC8PflmGqwCRsu2yCCnTNSLVmBEHrlj9OkHJsoVoTv63Ji/CTEpcdrlXRe+oee6D+zdv1ub17qdApmmmLdIzV9aWrCibWBtZcXayuKjknJFgOPScz7Am/+iVLHvWPnBmIlIdunX9dqApAgWBqmmxPm/ztUXgAA0f/xRGT2IkvsB5XDOYM5K/QK1tzMn4irlxKtl7VXmu777f8voASkpn59zsy8fkyWzaubFQGFKveHnseBYpbUoxeqEnkKiwHmrePLb5cz3YP4aRCHFiThvFg3TQC6F0hwHzxqAN6opNmqfm8mvCpsffxQ/miGCiVF9941DgV3big1w1Gxrl5Mv6nzphan9u2uiQLMJ1hXVlAUrK9d+aJHLcYLURmvJxX9MJPzp32FiGEmIaLnDu7x6M5uVQuwiCKSay0+Ri/7IJvE2fVee/KaUgs/LiCdWuQtQfncpTVOa7JynLvtLMT8ZsP0+PPZVSRDXE4zP201kT+YfktAafQPqvPebB6k1TvlFkTatIOteLX0rIi9nJRer1KclM5nFuqx0RtcNzKB4P5Of/8fLKV7OmR5HDMUOzAzwvCH6n7WMrm3dOLFnWy2puAmZ06ipr1rF2jM6lq4ub9s0OTWpiczPwSmlKhXZ8fTU9memDBvUBqUoAahKuPRP8Is36uVn6yqhLcbwxiyAe/nKxw46+3LhVgTUWnXIK/8WnQsEokf26lv+XPSkHakQgJL99WE6vBf9lxUboc5/PwZOTzV1bZI/+Vs1OWxtJWdAMbCLbN/aRqq1tMvV/6gWrVOkMmpo71XnvAtnvQt9KyJOwMxAziQkY92ZP3VGAQBhxlREM/+JMN8tJ604ARaFsLiKZjU4evKecdbCdvsstkf/4uSKX+wXkf27aqVK/Pqg+Ag1OcrH7hg1HgsSQj5IanLN5fLuW/Gaj3PBWmgypQ2g3qT8vFM8mPeRhWYypc7/TVl/tZijuO75F9n1hJ0UwGmC0atGrhaLAhCDcBGAqeaqc3D+7wmglMjjN3LT92yQiJSdqUMAiU83IrXWU5o9y9WbPycnv91sR6dP6ZNmSsxo13BO+Iw0WH+x0GIaRjgAM5/N5UC3B0/Mmp14t1nPej2WUDI2nD7/xDiU6QOtd7NVU6Cu+MX+pUdVSB4+UJWgeBvFabZ7Ec8/NjUxotu7wzlWTiQEIe29csHv8dS34+Ev6gc/z71PKUWVGH9CC2sE5sUON3OzDTBN5bhrcNlfpIQSYPvP5IFPS1kFvSETokM3o9SiC5YCQFPXkvbSZR9Cex8AjOzDnf+gzL487ewmkifg8t3iAF8KCjD/aBz/RnXOr2HhOsereSQTnbI7kiPx120sqf88W5rdckp9jtIBj2g4RX4hnzLIPEkAB/dUB/drVbYTc/tWokitqtOqvOqXe86+qpvUacrRw6km3U/K6BiLlMoYG9ajI+zoscfD0/Gk3MEBmkT3Ulz0B+qMX8HW2/HMTdx+Nw9uY00rAMruaIF/EkSKNIWsv1ze8Blp61UAJgbT739Qje1HkmQDV7xD1Mz7PRSvwwcpSpf8ll77KqVJJbjnE9j7GEolsAYb5u1OQBOFrWGnAMFywvmrsOJsOe61OPoye36mm6NOmxjKpiFnZjTRM9PuAT+StTk2vRXF+Tq24DpnWZQDu6tCJsrgaos7tWZSTi5/e98V7+gxM5okkVJJdAokfrpEO4oFkiDVHD5QW7isFNCvRKyaprUWUehaKBvegg1v4fAevvgQtv+Me5+UoW0Y34/JIVSnSKJUQsc8LD5RHfcGbngL2/tM8OH+Z7HzPhGAOt57adKrsB0Xv7ELbu+Aff041UghZ75TLvsriLLzi133o0ZRtYhZDQIpahpSgmrrZOdiLFgny8/CMRfKstPQ7c6tn2YlpBFQzqllGhOZ+SOzO7rZG4rTu98UlClgH62D3+aywSbm2uBLtTRlqWwvT01qQo45qf2KX+o/9syyASWmmr6FCVgzbTCq0oSQqQk9MljzLOR2y5qobPbU8qUnOXFY+lelvSv08dfI8deUqKU6xqkRjh2QiWERoNzJrkXoWiSqRA3YbLygZ7n0HYW9zyAhE+NHaBdv7FQImZeHzHcCKaGA7mU46z1y8QdZ7oDWIhBR+ox3p7s2qcn9EIEoaetFRx8rfexaIgvWy9LjZNF69q+RrvmSVIAQgb34ja1mgas0saTc7D4/3Y6/zjICTmdMDbxkHSwoerToweAxBAD37ahNTRDQoC63ycDq9jOu6D7r1Z3tXYkF1G5KteLYto0/nRT7ywj02MAM73Qq/NYrcrjBOAolnBpNv//HauMNSCfYsQCLTywdc74c+2oZOAuVbql0s2tptMfPujhlZ2YUAH0D8tb/4l3/jP2Py9BOjA2nTAWk0Bw4SLMxXOx4kSTRlU7dtUQtPlHWXS3rrpT+VREegwBqw1tk5fkYe8nsb0srvejsV23dSCp+gqgBpZ0NRUbiJl7ipllxwrihPTVR2kzSQE32NjUzpjwvjcKvt+iwkdddhPMeUYwTjyiBZWsq3X2qe15y7MmdJ13UveqEtrYOBRvzLJw3nVx6dFulIoA9gNLYkGeh1Ka6eqMjjEIXQoKDd34U934SJYhSHN4hh3dgyw9w78d44Z/h/D+gzf+ISYs4ROv271pFUlaejbd/GeODemS3HHpRRvdh4iCmhtPqmKpOQGtCUO5QnQvQ3ofepdK/qtS9hB3zabIVHg/b0w81IOgfQP+AUT7TVCYHObxHJocwvJN7N+t9z8px12DdlRm1OJW65FDBjL4ov+gjSrM9tPnns1nDJv6peBNdBGFnQeKfLZrNRRUGuEqNw/vTtk7p7PEpxwJmRDA8mH7qd18aOsgkEe1QtsC+7NnRrd7zD4sXrSiH7tB6LyvuvZv0dReoqYOAsW8F+7p2DaX5eNedeumJQm2EFfBblg8/k9W0Ey9jvxqoAvYXWAAFJA4Bicf0Ji/ksxAukxcle6kf/gIe/E89ukemhlVtDOkUqxOc0tI9T979I1l+2rRbNv5HKAa77lL0q3WBpvnBZ1tXdlEl31Y0p6tHUXm2XGLSmrnCvCUlI9L8Yr3jQZQidc+80vqzOu797qjqkMiHW31090tXr99NFmnSf3vsBhk9iIq56rYekIBURw+W9j+tlp3oRy0Kg0Q0lEEq6yTBPY/j0NYSSSiUyqXOebL0NJTajHuNsZsf4PWYhSLYdg++9zsYHxFAElASMfvp20SmDuHuf+Kb/hMul+HRTCO9FKCf7IdG5Fc9cx3PVlhcxwz2gLvh2JSHTMP5GnJfLWZ1725oXZTYC89Y0UHOfGXXw7eN1VIqCWxRozql5y8vdXQr71AkOleAACYO1zZ9p1QyjUhYQxNQ0wU4mDHjo3NmJGb6Yl8Zok55x9/inn/m+HBNa4iUSgna2njs1fLaT7GjP+ODsyIKiTC3HMx9GzkxoiqJS7oRbp8WE8Unvy2n36nXXKJ0hrdGepmV0/JuciYVFkVPS7PLgAdyGfBGlm58d/gcV1gUyV2t2alQ1hYH1rVtuKC9Op5GsQzU1FWuOqHdHEjq2c9Uu+thdWAzEnd2L91EjARRKlfQtQB1+o4pKw2BCJTis7frH35EJg4J0pLosqQKVVTH8MhX9V3/CjvHi6cCxZKyvelZoe3eKDdH9bhIU4+PpPf8mwLDe57TUSYR1qQYI4hYR7OKo0d6DKF1wS5BUH8/czok4KKDuRLmR26Z0X/MNGErtw+KyEVv6eudn+jUcQBojUpXsuaUtrj1+BdZNcAtt4mehFI2yCJiBUg650ufm2RlkWmmSw6DG04UoDd9j9Wq2QGqlKjE/MyBrhG1Z36oapPmd1C8EBjVkKnd1LnsdPSugPFHQVA0C46qBPX8rdj7lL/uwl0xBaSfLRP6VuSKmC3PIvtq4mRmbUxx/X5iktVOcZtmoIbFo2he2yyS2mK26SWrKpf9Qje0Dh3VXH1C29JVlehl87B/khCVTsm2e0W8mEIxAUSB/QPoXWb01nzeHHcaJF56nAlo9gm7LaBmKUyGX+TEIclXkIdKlh0BNNE7UFp/NbQm3cZICVhUJUqmDuORLxIuLyLNFNskDtjbRQqSbPk67GSHf6PswEyNKWfI+epE6m3BTwnjr/G4L1xfNF+y/4obhQR49jV9J13UPjWeGqEnFTnjlV1Jyb+XnUkbKgGGd2O/P+rE7ZV1W3ypgeUnmx9VzpHksI6p25g1wKkRju1TCRTMIUw02QoIEoWkNoLJERbGjpyc4kZO+UWWO4QaYMZfmPMIBNz4ZR7emashDlLZyWzUwlzQtLhqpsZUaKT5xpDtQ3ZaV19DYXY1gK3cvyKgkCiX1TXvmr9gQGqTOq1h4crSCWd3RP4msGK/7duMkZeAGC1ZdCWE1sDys9yMyiq2IdqINMWpEZWO2sjpgpG4YSWsojqcs6OGMck5GgycxRXn6BSAgtnUYrmx28DTA9vkuVsKHV78b5DbNO1aqTT5WsBrY3fY0JiK25iupQB0sghpJq0w6D9cyVZunmD/kvJb/nDxvKVJrapPekVnR0/i80IuktEf46D3bGTNnkrrt4LDCIVApQMD52Ssp3Cd3UywIhjI6qRKJwwOy3lpKIGuoTruonnW0KM6M10kUWqTs94rkrg6nSm5JxOBbLvTBv5Guii8npVzfKXJcgpmYFsxNXuj14HjKO8pmVx2w+RTvLvXg/Siko3y98Y24l46M7XO4+iTOt7xl4v3ba+tP7u9PsWaAST7n0YCk6W0dRnYRkBDFm/AwvUMiYSw3JV3ABGDAoBVpjWbpIjRmEH9aSo6lfjR+r6EDAhgojSJ41+PNZdg64/MSrDNoLpZnSTkyC6kVahyQ8DUBHrGOaTp1DFtvruemoW5vOf0TMygATtrip+KqPkstOhe0It9aUPrgWMrp17e1dHduAsGPU0OuX44geroTbj1V6LSld9Y31iEYQJhfoxA6zDovWS02fAZ9Sjj+qIVp6jntnC5XS76A5YrxsSMX6J/4xmAlKKcyyzchuUwh00bO54jSK/PYjZXbwGNcq+Zr3V+1Qko05PcU5FhFcQ6hqxeeEwKrJACSM9yi5vpctIQk6BCuQ3HXml8HSOPm+tPfD0a2Ik5Osp6Gp9R8t1SJbqu5HiT+AODPxNQAXLMFVh/DdJQrZgtTqROgWWniSq5xzPTK++hY0COnFhy2DSbCwydzkshJ5Li+7M4BzwfTRs8koHVsYvyaoBLDTSYhcbNhERNlpNcdoR1D4ZK176aVNSp1hogxPxelOhJpivOleWn2WaamlHBCCm1qUqH2/odIxwIoJKK2F/Q8y/eNSADqpxsSFKV5NK/0t1LmVq3J0okga5S96/Eab8crC8rDftvnMFvkjuYzdc6lovvT38O+LTcNLKqgtk+kPNGTfDdzMeKNO48Aay5rHb8m6sT5oJFTtRa9S9OrvgIS+31U436tiT3gUCpgraOqG3CJTShRNq70daHJjOWbOTLZ0OWnCRv/oJecEw6RdTMJhty0drym7+ABetsFqqgysj6G7b1sqhJrhzTrM2hmWl7alQiN/PP5ZlynzN3WbfWGNWApiaO3LSAZKmt/Mb/o3sWyZM3YPwQa9ACNXCmXP2PcvSFzdBbrhXal7rt7VKnqDYhoBSpxSYZLfxhpUvKHbAASeLpgdFGSNeZBYBofmO97LpXJ++6A49/nS89jrY2LDtNHfsa3bcid/JLI5JIDoVl6YNsA2F6jmOGi2G0b7RQmtM6jCZ9aTjFi+42KsO6muuvNG+xoGa6l3r3PY3dD2HsIPqPxuoL0NE/7ZBt0rqI6BvejMe/ISVlMkwQg8bImsaxl8q1P0BScU0U11QoB2thfmSZ5ozr0/lfvW5ST0YC0ejKpaAKq8tPmLLFSCo1yy0ohWxJA7Y8NbOVxkdl2meLrhR1OHOtkbcLRY1+Fh2HRceFG5ozGd+5Jv2/AHDim/n4NwRaJSUznzCLx2mK0oa3GktyQiqwmEYTbxH33pdzxNHBe8Fzx1KYZuYV322Qiykuz4LdR00czQySlnE4b8xW/OBMRk89YCpcCmhAzTxfvqhVJhmWvQiaN0jY6KlpmidByIlv4GnvRAowNfkAXdPVKcrpb8cZv+zUnGFshpFa7ITTerXoBw+ylUbdbnilQQ6zIfqpU8pMFj/srUI5aq1RNw4KWo2v1xeLrnie8ggiX2WDLVCzj3eNCqBIHLMIEzGJoDaBe/+VD16PwzslKemORTz1HclFv49Kt4XJkTHNtt1wl+S07qdQRI0h0ZFR89gya8w0U9ua9noDLhvedh04QsU3rBVoXnM9gAjFaH8QfmSfHH4BSVn6VqJjgR3yL/sVommw4HR8FhQBMIMxmauwsOnZGVPwJS9nr3HsnIq6EV/0bmMmTijHbTGMnZn9TdPTCKCgKB/jfXiYH82eZui3XpYu6moXpSzUa/Bbfo0fLQbg0++0bDTtMuPPVw9k5WhxSV4NjMtnLSkk37KM5z80ZjXUP10OojAZKxG3ce0FF6PmxEIoulU010XkG4o5PLLMz6wsaRpI6hchZmlJTdiY0XJKAarNqdynSfwjsV6zD+ZKovmA89en9eHGFTUvNF2mpFENuf42ggESVWCPs5tZBqQJq9OTMeKimUeGT5F4hIeLM6i+/lJhyRltQQkZtjp+Gz1ePMobFY7bLWJlJrFjhnH95ZCvbnosnE302w+ukuCPowolaqLw8VwDEVti0lIFDMfuGUCDYrP1THXnIlmaxQsFxcmG+gAXlfehrZDdUImfNhYO2QYiiCtqfGcuo0xzKgydsdOtHzP1V5h9HI0Mtyiy57hpdKUwzjS6VchAI2XM8tfD69MkdQGugJs40RfZlvfDvlJbc5GBsskcM8L4dXfyPtU6gLjd0L8GqZcZUMPAF509VM9G7H+mrapRiznUz/qMYNxWtPWvkbiOmGZjTJGHaN7hnGP3Lsd7cskaZcbjNXB11kv7glHNmTJFzBQg9Hqk3wBONelpnPNslM6mU540H+KR0Rcm8XOBL48ys54sCCfrLDORjpkfDPMNNepgjp36nqJRaqBFLToCOtL35lrUojpqGVOL5oxaxtSiOaOWMbVozqhlTC2aM2oZU4vmjFrG1KI5o5YxtWjOqGVMLZozahlTi+aMWsbUojmjljG1aM6oZUwtmjNqGVOL5oxaxtSiOaOWMbVozqhlTC2aM2oZU4vmjFrG1KI5o5YxtWjOqGVMLZozahlTi+aMWsbUojmjljG1aM6oZUwtmjNqGVOL5oxaxtSiOaOWMbVozqhlTC2aM2oZU4vmjFrG1KI5o5YxtWjOqGVMLZozahlTi+aMWsbUojmj/wdQ+MT1vz5ZTwAAAABJRU5ErkJggg==" alt="Pulciaro Travel" style={{ width: 34, height: 34, objectFit: "cover", borderRadius: "50%" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="pulciaro-display" style={{ fontSize: 24, fontWeight: 600, letterSpacing: 0.5 }}>Pulciaro Travel</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)" }}>Il salto più lungo, al costo più piccolo</div>
        </div>
        <button
          onClick={() => setView(view === "search" ? "saved" : "search")}
          className="pulciaro-pill"
          style={{
            padding: "10px 16px", borderRadius: 20, fontSize: 13, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 7, background: "var(--paper)",
            borderColor: view === "saved" ? "var(--coral)" : "var(--line)",
            fontWeight: 600, color: "var(--ink)", boxShadow: "0 6px 16px -10px rgba(37,61,49,0.35)",
          }}
        >
          {view === "search" ? (
            <>
              <TicketCheck size={15} color="var(--coral)" />
              I miei biglietti
              {savedTickets.length > 0 && (
                <span className="pulciaro-mono" style={{
                  background: "var(--coral)", color: "#fff", borderRadius: 12, padding: "1px 7px", fontSize: 11.5,
                }}>{savedTickets.length}</span>
              )}
            </>
          ) : (
            <>
              <ArrowLeft size={15} color="var(--coral)" />
              Torna alla ricerca
            </>
          )}
        </button>
      </div>

      {view === "saved" ? (
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <div className="pulciaro-display" style={{ fontSize: 19, fontWeight: 600, marginBottom: 4 }}>
            I miei biglietti salvati
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
            {savedLoaded
              ? (savedTickets.length > 0
                  ? `${savedTickets.length} biglietti salvati sulla tua pagina personale`
                  : "Non hai ancora salvato nessun biglietto. Trovane uno che ti piace e premi l'icona del segnalibro.")
              : "Caricamento..."}
          </div>
          {savedTickets.length > 0 && (
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 20,
            }}>
              {savedTickets.map((t) => (
                <div key={t.id} style={{
                  background: "var(--paper)", color: "var(--ink)", borderRadius: 14, overflow: "hidden",
                  boxShadow: "0 10px 26px -12px rgba(37,61,49,0.4)", cursor: "pointer",
                }} onClick={() => setModalTicket(t)}>
                  <div style={{ padding: "18px 20px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 20 }}>{t.flag}</span>
                          <span className="pulciaro-display" style={{ fontSize: 18, fontWeight: 600 }}>{t.name}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>{t.country} · {t.continent}</div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSave(t); }}
                        aria-label="Rimuovi dai salvati"
                        style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
                      >
                        <BookmarkCheck size={19} color="var(--coral)" />
                      </button>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)", margin: "10px 0 2px" }}>
                      {t.departureCode} → {t.code} · {t.monthLabel} · {t.nights} {t.nights === 1 ? "notte" : "notti"} · {t.people} {t.people === 1 ? "persona" : "persone"}
                    </div>
                    <div className="pulciaro-mono" style={{ fontSize: 24, fontWeight: 700, marginTop: 8, color: t.withinBudget ? "var(--ink)" : "#9c5238" }}>
                      €{t.total}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
      <>

      {/* Search card — boarding pass style */}
      <div style={{
        maxWidth: 1040, margin: "0 auto 40px", background: "var(--paper)", color: "var(--ink)",
        borderRadius: 14, display: "flex", flexWrap: "wrap", overflow: "hidden",
        boxShadow: "0 18px 40px -16px rgba(37,61,49,0.35)"
      }}>
        {/* Left stub: budget + nights */}
        <div style={{ flex: "1 1 340px", padding: "26px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <Wallet size={16} color="var(--violet)" />
            <span style={{ fontSize: 12.5, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, color: "var(--violet)" }}>Budget di viaggio</span>
          </div>
          <div className="pulciaro-mono" style={{ fontSize: 40, fontWeight: 700, lineHeight: 1, marginBottom: 14 }}>€{budget}</div>
          <input
            type="range" min={100} max={10000} step={50} value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="pulciaro-slider"
            style={{ width: "100%", marginBottom: 8 }}
            aria-label="Budget di viaggio in euro"
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--muted)", marginBottom: 24 }}>
            <span>€100</span><span>€10000</span>
          </div>

          <div style={{ fontSize: 12.5, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, color: "var(--muted)", marginBottom: 10 }}>
            Quante notti
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <button className="step-btn" onClick={() => adjustNights(-1)} aria-label="Riduci notti" style={{
              width: 34, height: 34, borderRadius: 8, border: "1px solid var(--line)", background: "transparent",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink)"
            }}><Minus size={15} /></button>
            <div className="pulciaro-mono" style={{ fontSize: 20, fontWeight: 700, minWidth: 70, textAlign: "center" }}>
              {nights} {nights === 1 ? "notte" : "notti"}
            </div>
            <button className="step-btn" onClick={() => adjustNights(1)} aria-label="Aumenta notti" style={{
              width: 34, height: 34, borderRadius: 8, border: "1px solid var(--line)", background: "transparent",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink)"
            }}><Plus size={15} /></button>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {NIGHT_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setNights(p.nights)}
                className="pulciaro-pill"
                style={{
                  padding: "6px 12px", borderRadius: 8, fontSize: 12.5, cursor: "pointer",
                  borderColor: nights === p.nights ? "var(--coral)" : "var(--line)",
                  background: nights === p.nights ? "var(--coral)" : "transparent",
                  color: nights === p.nights ? "#fff" : "var(--ink)",
                  fontWeight: nights === p.nights ? 600 : 400,
                }}
              >{p.label}</button>
            ))}
          </div>

          <div style={{ fontSize: 12.5, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, color: "var(--muted)", margin: "22px 0 10px" }}>
            Quante persone
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="step-btn" onClick={() => adjustPeople(-1)} aria-label="Riduci numero di persone" style={{
              width: 34, height: 34, borderRadius: 8, border: "1px solid var(--line)", background: "transparent",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink)"
            }}><Minus size={15} /></button>
            <div className="pulciaro-mono" style={{ fontSize: 20, fontWeight: 700, minWidth: 90, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Users size={16} color="var(--muted)" /> {people}
            </div>
            <button className="step-btn" onClick={() => adjustPeople(1)} aria-label="Aumenta numero di persone" style={{
              width: 34, height: 34, borderRadius: 8, border: "1px solid var(--line)", background: "transparent",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink)"
            }}><Plus size={15} /></button>
            <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{people === 1 ? "persona" : "persone"}</span>
          </div>
        </div>

        {/* Perforated divider */}
        <div style={{ position: "relative", width: 0, borderLeft: "2px dashed var(--line)", margin: "18px 0" }}>
          <div className="ticket-notch" style={{ left: -9, top: 0, transform: "translateY(-50%)" }} />
          <div className="ticket-notch" style={{ left: -9, top: "100%", transform: "translateY(-50%)" }} />
        </div>

        {/* Right stub: departure + month */}
        <div style={{ flex: "1 1 380px", padding: "26px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <MapPin size={16} color="var(--coral)" />
            <span style={{ fontSize: 12.5, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, color: "var(--coral)" }}>Parti da</span>
          </div>
          <select
            value={departure.code}
            onChange={(e) => setDeparture(DEPARTURE_CITIES.find((c) => c.code === e.target.value) || DEPARTURE_CITIES[0])}
            style={{
              width: "100%", padding: "9px 14px", borderRadius: 8, border: "1px solid var(--line)",
              background: "transparent", color: "var(--ink)", fontSize: 13.5, cursor: "pointer", marginBottom: 20,
            }}
            aria-label="Aeroporto di partenza"
          >
            {DEPARTURE_CITIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
            ))}
          </select>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <Calendar size={16} color="var(--coral)" />
            <span style={{ fontSize: 12.5, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, color: "var(--coral)" }}>Quando parti</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 12 }}>
            {MONTHS.map((m, i) => (
              <button
                key={m}
                onClick={() => setMonth(i)}
                className="month-btn"
                style={{
                  padding: "8px 0", borderRadius: 7, fontSize: 13, cursor: "pointer", textAlign: "center",
                  border: `1px solid ${month === i ? "var(--coral)" : "var(--line)"}`,
                  background: month === i ? "var(--coral)" : "transparent",
                  color: month === i ? "#fff" : "var(--ink)",
                  fontWeight: month === i ? 600 : 400,
                }}
              >{m}</button>
            ))}
          </div>
          <button
            onClick={() => setMonth("flex")}
            className="month-btn"
            style={{
              width: "100%", padding: "9px 0", borderRadius: 7, fontSize: 13.5, cursor: "pointer",
              border: `1px solid ${month === "flex" ? "var(--violet)" : "var(--line)"}`,
              background: month === "flex" ? "var(--violet)" : "transparent",
              color: month === "flex" ? "#fff" : "var(--ink)",
              fontWeight: month === "flex" ? 700 : 400,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          ><Sparkles size={14} /> Flessibile — trova il mese migliore</button>
        </div>
      </div>

      {/* Mode toggle: suggested vs specific */}
      <div style={{ maxWidth: 1040, margin: "0 auto 20px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button
          onClick={() => setMode("suggested")}
          className="pulciaro-pill"
          style={{
            padding: "9px 16px", borderRadius: 20, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            borderColor: mode === "suggested" ? "var(--coral)" : "var(--line)",
            background: mode === "suggested" ? "var(--paper)" : "transparent",
            fontWeight: mode === "suggested" ? 600 : 400,
          }}
        ><ListFilter size={14} /> Suggerimenti per te</button>
        <button
          onClick={() => setMode("specific")}
          className="pulciaro-pill"
          style={{
            padding: "9px 16px", borderRadius: 20, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            borderColor: mode === "specific" ? "var(--coral)" : "var(--line)",
            background: mode === "specific" ? "var(--paper)" : "transparent",
            fontWeight: mode === "specific" ? 600 : 400,
          }}
        ><Search size={14} /> Ho già una meta in mente</button>

        {mode === "specific" && (
          <select
            value={selectedCode}
            onChange={(e) => setSelectedCode(e.target.value)}
            style={{
              marginLeft: 4, padding: "9px 14px", borderRadius: 20, border: "1px solid var(--line)",
              background: "var(--paper)", color: "var(--ink)", fontSize: 13, cursor: "pointer",
            }}
          >
            {[...DESTINATIONS].sort((a, b) => a.name.localeCompare(b.name, "it")).map((d) => (
              <option key={d.code} value={d.code}>{d.flag} {d.name}, {d.country}</option>
            ))}
          </select>
        )}
      </div>

      {/* Budget tab: in budget vs fuori budget (only meaningful for suggested mode) */}
      {mode === "suggested" && (
        <div style={{ maxWidth: 1040, margin: "0 auto 20px", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => setBudgetTab("in")}
            style={{
              padding: "8px 16px", borderRadius: 20, fontSize: 12.5, cursor: "pointer", fontWeight: 600,
              border: `1px solid ${budgetTab === "in" ? "#2c6b45" : "var(--line)"}`,
              background: budgetTab === "in" ? "#dcefe0" : "transparent",
              color: budgetTab === "in" ? "#2c6b45" : "var(--ink)",
              display: "flex", alignItems: "center", gap: 6,
            }}
          ><TrendingDown size={14} /> Nel budget ({withinCount})</button>
          <button
            onClick={() => setBudgetTab("out")}
            style={{
              padding: "8px 16px", borderRadius: 20, fontSize: 12.5, cursor: "pointer", fontWeight: 600,
              border: `1px solid ${budgetTab === "out" ? "#9c4a34" : "var(--line)"}`,
              background: budgetTab === "out" ? "#f6e2da" : "transparent",
              color: budgetTab === "out" ? "#9c4a34" : "var(--ink)",
              display: "flex", alignItems: "center", gap: 6,
            }}
          ><TrendingUp size={14} /> Fuori budget ({outCount})</button>
        </div>
      )}

      {/* Results header */}
      <div style={{ maxWidth: 1040, margin: "0 auto 18px", display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div className="pulciaro-display" style={{ fontSize: 19, fontWeight: 600 }}>
          {mode === "specific" ? "La tua meta" : (budgetTab === "in" ? "Destinazioni nel budget" : "Destinazioni fuori budget")}
        </div>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>
          {mode === "specific"
            ? (results[0] && results[0].withinBudget ? "Rientra nel tuo budget" : "Supera il budget attuale")
            : (budgetTab === "in"
                ? (withinCount > 0 ? `${withinCount} destinazion${withinCount === 1 ? "e" : "i"} raggruppate per continente` : "Nessuna meta rientra ancora nel budget — prova la scheda \"Fuori budget\"")
                : (outCount > 0 ? `${outCount} destinazion${outCount === 1 ? "e" : "i"} sopra il budget attuale` : "Tutte le destinazioni rientrano nel budget 🎉"))}
        </div>
      </div>

      {/* Results grid */}
      {mode === "specific" ? (
        <div style={{ maxWidth: 1040, margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(280px, 420px)", gap: 16 }}>
          {results.map((r) => (
            <TicketCard
              key={r.code} r={r} departureCode={departure.code} nights={nights} people={people}
              budget={budget} month={month} saved={isSaved(ticketId(r, departure.code, r.month, nights, people))}
              onToggleSave={(res) => toggleSave(buildSnapshot(res))} onOpen={openModal}
            />
          ))}
        </div>
      ) : (
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          {groupedResults.length === 0 && (
            <div style={{
              background: "var(--paper)", borderRadius: 14, padding: "28px 24px", textAlign: "center",
              color: "var(--muted)", fontSize: 13.5,
            }}>
              Nessuna destinazione qui per ora — prova a cambiare budget o scheda.
            </div>
          )}
          {groupedResults.map(({ continent, total, countries }) => {
            const isCollapsed = !!collapsed[continent];
            return (
              <div key={continent} style={{ marginBottom: 20 }}>
                <button
                  onClick={() => toggleContinent(continent)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: "var(--bg-deep)", border: "none", borderRadius: 10, padding: "10px 16px",
                    cursor: "pointer", marginBottom: isCollapsed ? 0 : 12,
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14.5, color: "var(--ink)" }}>
                    <Globe2 size={16} color="var(--coral)" /> {continent}
                    <span className="pulciaro-mono" style={{ fontSize: 11.5, fontWeight: 400, color: "var(--muted)" }}>
                      ({total})
                    </span>
                  </span>
                  {isCollapsed ? <ChevronDown size={16} color="var(--muted)" /> : <ChevronUp size={16} color="var(--muted)" />}
                </button>

                {!isCollapsed && countries.map(({ country, items }) => (
                  <div key={country} style={{ marginBottom: 16 }}>
                    <div style={{
                      fontSize: 12.5, fontWeight: 600, color: "var(--muted)", margin: "0 4px 8px",
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                      <span style={{ fontSize: 15 }}>{items[0].flag}</span> {country}
                    </div>
                    <div style={{
                      display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16,
                    }}>
                      {items.map((r) => (
                        <TicketCard
                          key={r.code} r={r} departureCode={departure.code} nights={nights} people={people}
                          budget={budget} month={month} saved={isSaved(ticketId(r, departure.code, r.month, nights, people))}
                          onToggleSave={(res) => toggleSave(buildSnapshot(res))} onOpen={openModal}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ maxWidth: 1040, margin: "26px auto 0", display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, color: "var(--muted)" }}>
        <Info size={14} style={{ marginTop: 1, flexShrink: 0 }} />
        <span>Prototipo con dati di esempio: prezzi e stagionalità sono simulati. Apri il dettaglio di un biglietto per vedere il prezzo reale del volo da Duffel (richiede il backend configurato in <span className="pulciaro-mono">DUFFEL_PROXY_URL</span>). L'alloggio resta simulato.</span>
      </div>
      </>
      )}

      {/* Detail + share modal */}
      {modalTicket && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed", inset: 0, background: "rgba(37,61,49,0.55)", display: "flex",
            alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--paper)", color: "var(--ink)", borderRadius: 16, maxWidth: 460, width: "100%",
              maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px -20px rgba(37,61,49,0.5)",
            }}
          >
            <div style={{ padding: "20px 22px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 24 }}>{modalTicket.flag}</span>
                  <span className="pulciaro-display" style={{ fontSize: 20, fontWeight: 600 }}>{modalTicket.name}</span>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{modalTicket.country} · {modalTicket.continent}</div>
              </div>
              <button onClick={closeModal} aria-label="Chiudi" style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}>
                <X size={20} color="var(--muted)" />
              </button>
            </div>

            <div style={{ padding: "0 22px 6px", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--muted)" }}>
              <span className="pulciaro-mono">{modalTicket.departureCode}</span>
              <div style={{ flex: 1, borderTop: "1px dashed var(--line)" }} />
              <Plane size={13} style={{ transform: "rotate(90deg)" }} />
              <div style={{ flex: 1, borderTop: "1px dashed var(--line)" }} />
              <span className="pulciaro-mono">{modalTicket.code}</span>
            </div>
            <div style={{ padding: "0 22px 16px", fontSize: 12, color: "var(--muted)" }}>
              {modalTicket.departureName} → {modalTicket.name} · {modalTicket.monthLabel} · {modalTicket.nights} {modalTicket.nights === 1 ? "notte" : "notti"} · {modalTicket.people} {modalTicket.people === 1 ? "persona" : "persone"}
            </div>

            <div style={{ padding: "0 22px 18px" }}>
              <div style={{ display: "flex", gap: 10, padding: "12px 0", borderTop: "1px solid var(--bg-deep)" }}>
                <Plane size={15} color="var(--coral)" style={{ marginTop: 2 }} />
                <div style={{ fontSize: 12.5 }}>
                  <div style={{ fontWeight: 600 }}>{modalTicket.airline} · {modalTicket.departureCode} → {modalTicket.code}, andata e ritorno</div>
                  <div style={{ color: "var(--muted)" }} className="pulciaro-mono">
                    €{modalTicket.flightPerPerson} a persona{modalTicket.people > 1 ? ` · €${modalTicket.flight} totale per ${modalTicket.people} persone` : ""} <span style={{ opacity: 0.7 }}>(stima)</span>
                  </div>
                </div>
              </div>

              {/* Prezzo reale del volo, da Duffel */}
              <div style={{
                margin: "4px 0 2px", padding: "10px 12px", borderRadius: 10,
                background: "var(--bg)", border: "1px solid var(--line)",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--muted)" }}>
                    Prezzo reale del volo (Duffel)
                  </span>
                  <button
                    onClick={() => loadRealFlight(modalTicket)}
                    aria-label="Aggiorna prezzo reale"
                    style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2, display: "flex" }}
                  >
                    <RefreshCw size={13} color="var(--muted)" style={{ transform: realFlight === "loading" ? "rotate(180deg)" : "none", transition: "transform 0.3s" }} />
                  </button>
                </div>

                {realFlight === "loading" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--muted)", marginTop: 6 }}>
                    <Loader2 size={14} className="pulciaro-spin" /> Cerco voli reali su Duffel…
                  </div>
                )}

                {realFlight === "error" && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12, color: "#9c4a34", marginTop: 6 }}>
                    <AlertTriangle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                    <span>
                      Non riesco a contattare Duffel. Controlla che <code className="pulciaro-mono" style={{ fontSize: 11 }}>DUFFEL_PROXY_URL</code> punti al tuo backend e che la chiave API sia configurata.
                    </span>
                  </div>
                )}

                {realFlight === "empty" && (
                  <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 6 }}>
                    Nessuna offerta trovata da Duffel per questa rotta/data.
                  </div>
                )}

                {realFlight && realFlight !== "loading" && realFlight !== "error" && realFlight !== "empty" && realFlight.cheapest && (
                  <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <div className="pulciaro-mono" style={{ fontSize: 19, fontWeight: 700 }}>
                      {realFlight.cheapest.totalAmount} {realFlight.cheapest.currency}
                    </div>
                    {modalStops && (
                      <span className="pulciaro-mono" style={{ fontSize: 10.5, padding: "2px 7px", borderRadius: 10, background: "var(--bg-deep)" }}>
                        {modalStops}
                      </span>
                    )}
                    <div style={{ fontSize: 12, color: "var(--muted)", width: "100%" }}>
                      {realFlight.cheapest.airline}{realFlight.offers?.length > 1 ? ` · +${realFlight.offers.length - 1} altre offerte trovate` : ""}
                    </div>
                    {!modalLiveIsEur && (
                      <div style={{ fontSize: 11, color: "var(--muted)", width: "100%" }}>
                        Valuta diversa dall'euro: non sommata al totale qui sotto, che resta la stima.
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 10, padding: "12px 0", borderTop: "1px solid var(--bg-deep)" }}>
                <Building2 size={15} color="var(--coral)" style={{ marginTop: 2 }} />
                <div style={{ fontSize: 12.5 }}>
                  <div style={{ fontWeight: 600 }}>{modalTicket.stay}</div>
                  <div style={{ color: "var(--muted)" }} className="pulciaro-mono">€{modalTicket.hotelNight}/notte · {modalTicket.nights} notti = €{modalTicket.hotel}</div>
                </div>
              </div>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10,
                paddingTop: 14, borderTop: "2px dashed var(--line)",
              }}>
                <div>
                  <div className="pulciaro-mono" style={{ fontSize: 26, fontWeight: 700, color: modalWithinBudgetLive ? "var(--ink)" : "#9c5238" }}>
                    €{modalDisplayTotal}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
                    totale volo + alloggio {modalLiveIsEur ? "(volo reale)" : "(stima)"}
                  </div>
                </div>
                {modalWithinBudgetLive ? (
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: "#2c6b45", background: "#dcefe0", padding: "4px 9px", borderRadius: 20 }}>
                    risparmi €{modalTicket.budget - modalDisplayTotal}
                  </span>
                ) : (
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: "#9c4a34", background: "#f6e2da", padding: "4px 9px", borderRadius: 20 }}>
                    +€{modalDiff} sul budget
                  </span>
                )}
              </div>
            </div>

            <div style={{ padding: "16px 22px 22px", borderTop: "1px solid var(--bg-deep)" }}>
              <button
                onClick={() => toggleSave(modalTicket)}
                className="pulciaro-pill"
                style={{
                  width: "100%", padding: "11px 0", borderRadius: 10, fontSize: 13.5, cursor: "pointer",
                  fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  background: isSaved(modalTicket.id) ? "var(--coral)" : "transparent",
                  color: isSaved(modalTicket.id) ? "#fff" : "var(--ink)",
                  borderColor: "var(--coral)", marginBottom: 14,
                }}
              >
                {isSaved(modalTicket.id) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                {isSaved(modalTicket.id) ? "Salvato nella tua pagina personale" : "Salva questo biglietto"}
              </button>

              <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, color: "var(--muted)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Share2 size={13} /> Condividi con altri viaggiatori
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                <button onClick={() => doShareWhatsApp(modalTicket)} style={{
                  flex: "1 1 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "9px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "#e9f7ec",
                  color: "#1f7a3d", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                }}><MessageCircle size={14} /> WhatsApp</button>
                <button onClick={() => doShareTelegram(modalTicket)} style={{
                  flex: "1 1 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "9px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "#e8f2fb",
                  color: "#1b6fb0", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                }}><Send size={14} /> Telegram</button>
                <button onClick={() => doCopy(modalTicket)} style={{
                  flex: "1 1 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "9px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "transparent",
                  color: "var(--ink)", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                }}>{copyStatus ? <Check size={14} /> : <Copy size={14} />} Copia testo</button>
              </div>
              {navigator.share && (
                <button onClick={() => doWebShare(modalTicket)} className="pulciaro-pill" style={{
                  width: "100%", padding: "9px 0", borderRadius: 9, fontSize: 12.5, cursor: "pointer",
                  fontWeight: 600, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}><Share2 size={14} /> Altre app…</button>
              )}
              {copyStatus && (
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 8 }}>{copyStatus}</div>
              )}
              <textarea
                readOnly
                value={shareText(modalTicket)}
                onClick={(e) => e.target.select()}
                style={{
                  width: "100%", minHeight: 74, fontSize: 11.5, padding: 10, borderRadius: 8,
                  border: "1px solid var(--line)", color: "var(--muted)", fontFamily: "inherit", resize: "none",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
