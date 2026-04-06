const crypto = require('crypto');

const FIREBASE_URL = 'https://dog-calendar-96cd5-default-rtdb.firebaseio.com';
const BASE = `${FIREBASE_URL}/prode`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function sha256(message) {
  return crypto.createHash('sha256').update(message).digest('hex');
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function utc(dateStr, hourUTC, minuteUTC = 0) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, m - 1, d, hourUTC, minuteUTC);
}

async function fbPut(path, data) {
  const res = await fetch(`${BASE}${path}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function fbPatch(path, data) {
  const res = await fetch(`${BASE}${path}.json`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function fbGet(path) {
  const res = await fetch(`${BASE}${path}.json`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function fbDelete(path) {
  const res = await fetch(`${BASE}${path}.json`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
}

// ---------------------------------------------------------------------------
// Team data (inlined from src/data/teams.js)
// ---------------------------------------------------------------------------

const TEAMS = [
  { code: 'MEX', name: 'Mexico', name_es: 'México', group: 'A', iso: 'mx' },
  { code: 'KOR', name: 'South Korea', name_es: 'Corea del Sur', group: 'A', iso: 'kr' },
  { code: 'RSA', name: 'South Africa', name_es: 'Sudáfrica', group: 'A', iso: 'za' },
  { code: 'CZE', name: 'Czechia', name_es: 'Chequia', group: 'A', iso: 'cz' },
  { code: 'CAN', name: 'Canada', name_es: 'Canadá', group: 'B', iso: 'ca' },
  { code: 'SUI', name: 'Switzerland', name_es: 'Suiza', group: 'B', iso: 'ch' },
  { code: 'QAT', name: 'Qatar', name_es: 'Catar', group: 'B', iso: 'qa' },
  { code: 'BIH', name: 'Bosnia & Herzegovina', name_es: 'Bosnia y Herzegovina', group: 'B', iso: 'ba' },
  { code: 'BRA', name: 'Brazil', name_es: 'Brasil', group: 'C', iso: 'br' },
  { code: 'MAR', name: 'Morocco', name_es: 'Marruecos', group: 'C', iso: 'ma' },
  { code: 'HAI', name: 'Haiti', name_es: 'Haití', group: 'C', iso: 'ht' },
  { code: 'SCO', name: 'Scotland', name_es: 'Escocia', group: 'C', iso: 'gb-sct' },
  { code: 'USA', name: 'United States', name_es: 'Estados Unidos', group: 'D', iso: 'us' },
  { code: 'PAR', name: 'Paraguay', name_es: 'Paraguay', group: 'D', iso: 'py' },
  { code: 'AUS', name: 'Australia', name_es: 'Australia', group: 'D', iso: 'au' },
  { code: 'TUR', name: 'Turkey', name_es: 'Turquía', group: 'D', iso: 'tr' },
  { code: 'GER', name: 'Germany', name_es: 'Alemania', group: 'E', iso: 'de' },
  { code: 'ECU', name: 'Ecuador', name_es: 'Ecuador', group: 'E', iso: 'ec' },
  { code: 'CIV', name: 'Ivory Coast', name_es: 'Costa de Marfil', group: 'E', iso: 'ci' },
  { code: 'CUR', name: 'Curacao', name_es: 'Curazao', group: 'E', iso: 'cw' },
  { code: 'NED', name: 'Netherlands', name_es: 'Países Bajos', group: 'F', iso: 'nl' },
  { code: 'JPN', name: 'Japan', name_es: 'Japón', group: 'F', iso: 'jp' },
  { code: 'SWE', name: 'Sweden', name_es: 'Suecia', group: 'F', iso: 'se' },
  { code: 'TUN', name: 'Tunisia', name_es: 'Túnez', group: 'F', iso: 'tn' },
  { code: 'BEL', name: 'Belgium', name_es: 'Bélgica', group: 'G', iso: 'be' },
  { code: 'EGY', name: 'Egypt', name_es: 'Egipto', group: 'G', iso: 'eg' },
  { code: 'IRN', name: 'Iran', name_es: 'Irán', group: 'G', iso: 'ir' },
  { code: 'NZL', name: 'New Zealand', name_es: 'Nueva Zelanda', group: 'G', iso: 'nz' },
  { code: 'ESP', name: 'Spain', name_es: 'España', group: 'H', iso: 'es' },
  { code: 'URU', name: 'Uruguay', name_es: 'Uruguay', group: 'H', iso: 'uy' },
  { code: 'KSA', name: 'Saudi Arabia', name_es: 'Arabia Saudita', group: 'H', iso: 'sa' },
  { code: 'CPV', name: 'Cape Verde', name_es: 'Cabo Verde', group: 'H', iso: 'cv' },
  { code: 'FRA', name: 'France', name_es: 'Francia', group: 'I', iso: 'fr' },
  { code: 'SEN', name: 'Senegal', name_es: 'Senegal', group: 'I', iso: 'sn' },
  { code: 'IRQ', name: 'Iraq', name_es: 'Irak', group: 'I', iso: 'iq' },
  { code: 'NOR', name: 'Norway', name_es: 'Noruega', group: 'I', iso: 'no' },
  { code: 'ARG', name: 'Argentina', name_es: 'Argentina', group: 'J', iso: 'ar' },
  { code: 'ALG', name: 'Algeria', name_es: 'Argelia', group: 'J', iso: 'dz' },
  { code: 'AUT', name: 'Austria', name_es: 'Austria', group: 'J', iso: 'at' },
  { code: 'JOR', name: 'Jordan', name_es: 'Jordania', group: 'J', iso: 'jo' },
  { code: 'POR', name: 'Portugal', name_es: 'Portugal', group: 'K', iso: 'pt' },
  { code: 'COL', name: 'Colombia', name_es: 'Colombia', group: 'K', iso: 'co' },
  { code: 'UZB', name: 'Uzbekistan', name_es: 'Uzbekistán', group: 'K', iso: 'uz' },
  { code: 'COD', name: 'DR Congo', name_es: 'RD Congo', group: 'K', iso: 'cd' },
  { code: 'ENG', name: 'England', name_es: 'Inglaterra', group: 'L', iso: 'gb-eng' },
  { code: 'CRO', name: 'Croatia', name_es: 'Croacia', group: 'L', iso: 'hr' },
  { code: 'GHA', name: 'Ghana', name_es: 'Ghana', group: 'L', iso: 'gh' },
  { code: 'PAN', name: 'Panama', name_es: 'Panamá', group: 'L', iso: 'pa' },
];

// ---------------------------------------------------------------------------
// Group stage matches (inlined from src/data/groupStageMatches.js)
// ---------------------------------------------------------------------------

const GROUP_STAGE_MATCHES = [
  // Group A
  { id: 'GS-01', match_number: 1,  group: 'A', home_team: 'MEX', away_team: 'RSA', datetime: utc('2026-06-11', 19, 0),  venue: 'Estadio Azteca', city: 'Mexico City' },
  { id: 'GS-02', match_number: 2,  group: 'A', home_team: 'KOR', away_team: 'CZE', datetime: utc('2026-06-12', 2, 0),   venue: 'Estadio Akron', city: 'Guadalajara' },
  { id: 'GS-03', match_number: 25, group: 'A', home_team: 'CZE', away_team: 'RSA', datetime: utc('2026-06-18', 16, 0),  venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { id: 'GS-04', match_number: 28, group: 'A', home_team: 'MEX', away_team: 'KOR', datetime: utc('2026-06-19', 1, 0),   venue: 'Estadio Akron', city: 'Guadalajara' },
  { id: 'GS-05', match_number: 53, group: 'A', home_team: 'RSA', away_team: 'KOR', datetime: utc('2026-06-25', 1, 0),   venue: 'Estadio BBVA', city: 'Monterrey' },
  { id: 'GS-06', match_number: 54, group: 'A', home_team: 'CZE', away_team: 'MEX', datetime: utc('2026-06-25', 1, 0),   venue: 'Estadio Azteca', city: 'Mexico City' },
  // Group B
  { id: 'GS-07', match_number: 3,  group: 'B', home_team: 'CAN', away_team: 'BIH', datetime: utc('2026-06-12', 19, 0),  venue: 'BMO Field', city: 'Toronto' },
  { id: 'GS-08', match_number: 5,  group: 'B', home_team: 'QAT', away_team: 'SUI', datetime: utc('2026-06-13', 19, 0),  venue: "Levi's Stadium", city: 'Santa Clara' },
  { id: 'GS-09', match_number: 26, group: 'B', home_team: 'SUI', away_team: 'BIH', datetime: utc('2026-06-18', 19, 0),  venue: 'SoFi Stadium', city: 'Los Angeles' },
  { id: 'GS-10', match_number: 27, group: 'B', home_team: 'CAN', away_team: 'QAT', datetime: utc('2026-06-18', 22, 0),  venue: 'BC Place', city: 'Vancouver' },
  { id: 'GS-11', match_number: 49, group: 'B', home_team: 'SUI', away_team: 'CAN', datetime: utc('2026-06-24', 19, 0),  venue: 'BC Place', city: 'Vancouver' },
  { id: 'GS-12', match_number: 50, group: 'B', home_team: 'BIH', away_team: 'QAT', datetime: utc('2026-06-24', 19, 0),  venue: 'Lumen Field', city: 'Seattle' },
  // Group C
  { id: 'GS-13', match_number: 6,  group: 'C', home_team: 'BRA', away_team: 'MAR', datetime: utc('2026-06-13', 22, 0),  venue: 'MetLife Stadium', city: 'New Jersey' },
  { id: 'GS-14', match_number: 7,  group: 'C', home_team: 'HAI', away_team: 'SCO', datetime: utc('2026-06-14', 1, 0),   venue: 'Gillette Stadium', city: 'Foxborough' },
  { id: 'GS-15', match_number: 30, group: 'C', home_team: 'SCO', away_team: 'MAR', datetime: utc('2026-06-19', 22, 0),  venue: 'Gillette Stadium', city: 'Foxborough' },
  { id: 'GS-16', match_number: 31, group: 'C', home_team: 'BRA', away_team: 'HAI', datetime: utc('2026-06-20', 1, 0),   venue: 'Lincoln Financial Field', city: 'Philadelphia' },
  { id: 'GS-17', match_number: 51, group: 'C', home_team: 'SCO', away_team: 'BRA', datetime: utc('2026-06-24', 22, 0),  venue: 'Hard Rock Stadium', city: 'Miami' },
  { id: 'GS-18', match_number: 52, group: 'C', home_team: 'MAR', away_team: 'HAI', datetime: utc('2026-06-24', 22, 0),  venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  // Group D
  { id: 'GS-19', match_number: 4,  group: 'D', home_team: 'USA', away_team: 'PAR', datetime: utc('2026-06-13', 1, 0),   venue: 'SoFi Stadium', city: 'Los Angeles' },
  { id: 'GS-20', match_number: 8,  group: 'D', home_team: 'AUS', away_team: 'TUR', datetime: utc('2026-06-14', 4, 0),   venue: 'BC Place', city: 'Vancouver' },
  { id: 'GS-21', match_number: 29, group: 'D', home_team: 'USA', away_team: 'AUS', datetime: utc('2026-06-19', 19, 0),  venue: 'Lumen Field', city: 'Seattle' },
  { id: 'GS-22', match_number: 32, group: 'D', home_team: 'TUR', away_team: 'PAR', datetime: utc('2026-06-20', 4, 0),   venue: "Levi's Stadium", city: 'Santa Clara' },
  { id: 'GS-23', match_number: 60, group: 'D', home_team: 'PAR', away_team: 'AUS', datetime: utc('2026-06-26', 2, 0),   venue: "Levi's Stadium", city: 'Santa Clara' },
  { id: 'GS-24', match_number: 59, group: 'D', home_team: 'TUR', away_team: 'USA', datetime: utc('2026-06-26', 2, 0),   venue: 'SoFi Stadium', city: 'Los Angeles' },
  // Group E
  { id: 'GS-25', match_number: 9,  group: 'E', home_team: 'GER', away_team: 'CUR', datetime: utc('2026-06-14', 17, 0),  venue: 'NRG Stadium', city: 'Houston' },
  { id: 'GS-26', match_number: 11, group: 'E', home_team: 'CIV', away_team: 'ECU', datetime: utc('2026-06-14', 23, 0),  venue: 'Lincoln Financial Field', city: 'Philadelphia' },
  { id: 'GS-27', match_number: 34, group: 'E', home_team: 'GER', away_team: 'CIV', datetime: utc('2026-06-20', 20, 0),  venue: 'BMO Field', city: 'Toronto' },
  { id: 'GS-28', match_number: 35, group: 'E', home_team: 'ECU', away_team: 'CUR', datetime: utc('2026-06-21', 0, 0),   venue: 'Arrowhead Stadium', city: 'Kansas City' },
  { id: 'GS-29', match_number: 55, group: 'E', home_team: 'ECU', away_team: 'GER', datetime: utc('2026-06-25', 20, 0),  venue: 'MetLife Stadium', city: 'New Jersey' },
  { id: 'GS-30', match_number: 56, group: 'E', home_team: 'CUR', away_team: 'CIV', datetime: utc('2026-06-25', 20, 0),  venue: 'Lincoln Financial Field', city: 'Philadelphia' },
  // Group F
  { id: 'GS-31', match_number: 10, group: 'F', home_team: 'NED', away_team: 'JPN', datetime: utc('2026-06-14', 20, 0),  venue: 'AT&T Stadium', city: 'Arlington' },
  { id: 'GS-32', match_number: 12, group: 'F', home_team: 'SWE', away_team: 'TUN', datetime: utc('2026-06-15', 2, 0),   venue: 'Estadio BBVA', city: 'Monterrey' },
  { id: 'GS-33', match_number: 33, group: 'F', home_team: 'NED', away_team: 'SWE', datetime: utc('2026-06-20', 17, 0),  venue: 'NRG Stadium', city: 'Houston' },
  { id: 'GS-34', match_number: 36, group: 'F', home_team: 'TUN', away_team: 'JPN', datetime: utc('2026-06-21', 4, 0),   venue: 'Estadio BBVA', city: 'Monterrey' },
  { id: 'GS-35', match_number: 57, group: 'F', home_team: 'TUN', away_team: 'NED', datetime: utc('2026-06-25', 23, 0),  venue: 'Arrowhead Stadium', city: 'Kansas City' },
  { id: 'GS-36', match_number: 58, group: 'F', home_team: 'JPN', away_team: 'SWE', datetime: utc('2026-06-25', 23, 0),  venue: 'AT&T Stadium', city: 'Arlington' },
  // Group G
  { id: 'GS-37', match_number: 14, group: 'G', home_team: 'BEL', away_team: 'EGY', datetime: utc('2026-06-15', 19, 0),  venue: 'Lumen Field', city: 'Seattle' },
  { id: 'GS-38', match_number: 16, group: 'G', home_team: 'IRN', away_team: 'NZL', datetime: utc('2026-06-16', 1, 0),   venue: 'SoFi Stadium', city: 'Los Angeles' },
  { id: 'GS-39', match_number: 38, group: 'G', home_team: 'BEL', away_team: 'IRN', datetime: utc('2026-06-21', 19, 0),  venue: 'SoFi Stadium', city: 'Los Angeles' },
  { id: 'GS-40', match_number: 40, group: 'G', home_team: 'NZL', away_team: 'EGY', datetime: utc('2026-06-22', 1, 0),   venue: 'BC Place', city: 'Vancouver' },
  { id: 'GS-41', match_number: 65, group: 'G', home_team: 'NZL', away_team: 'BEL', datetime: utc('2026-06-27', 3, 0),   venue: 'BC Place', city: 'Vancouver' },
  { id: 'GS-42', match_number: 66, group: 'G', home_team: 'EGY', away_team: 'IRN', datetime: utc('2026-06-27', 3, 0),   venue: 'Lumen Field', city: 'Seattle' },
  // Group H
  { id: 'GS-43', match_number: 13, group: 'H', home_team: 'ESP', away_team: 'CPV', datetime: utc('2026-06-15', 16, 0),  venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { id: 'GS-44', match_number: 15, group: 'H', home_team: 'KSA', away_team: 'URU', datetime: utc('2026-06-15', 22, 0),  venue: 'Hard Rock Stadium', city: 'Miami' },
  { id: 'GS-45', match_number: 37, group: 'H', home_team: 'ESP', away_team: 'KSA', datetime: utc('2026-06-21', 16, 0),  venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { id: 'GS-46', match_number: 39, group: 'H', home_team: 'URU', away_team: 'CPV', datetime: utc('2026-06-21', 22, 0),  venue: 'Hard Rock Stadium', city: 'Miami' },
  { id: 'GS-47', match_number: 64, group: 'H', home_team: 'URU', away_team: 'ESP', datetime: utc('2026-06-27', 0, 0),   venue: 'Estadio Akron', city: 'Guadalajara' },
  { id: 'GS-48', match_number: 63, group: 'H', home_team: 'CPV', away_team: 'KSA', datetime: utc('2026-06-27', 0, 0),   venue: 'NRG Stadium', city: 'Houston' },
  // Group I
  { id: 'GS-49', match_number: 17, group: 'I', home_team: 'FRA', away_team: 'SEN', datetime: utc('2026-06-16', 19, 0),  venue: 'MetLife Stadium', city: 'New Jersey' },
  { id: 'GS-50', match_number: 18, group: 'I', home_team: 'IRQ', away_team: 'NOR', datetime: utc('2026-06-16', 22, 0),  venue: 'Gillette Stadium', city: 'Foxborough' },
  { id: 'GS-51', match_number: 42, group: 'I', home_team: 'FRA', away_team: 'IRQ', datetime: utc('2026-06-22', 21, 0),  venue: 'Lincoln Financial Field', city: 'Philadelphia' },
  { id: 'GS-52', match_number: 43, group: 'I', home_team: 'NOR', away_team: 'SEN', datetime: utc('2026-06-23', 0, 0),   venue: 'MetLife Stadium', city: 'New Jersey' },
  { id: 'GS-53', match_number: 61, group: 'I', home_team: 'NOR', away_team: 'FRA', datetime: utc('2026-06-26', 19, 0),  venue: 'Gillette Stadium', city: 'Foxborough' },
  { id: 'GS-54', match_number: 62, group: 'I', home_team: 'SEN', away_team: 'IRQ', datetime: utc('2026-06-26', 19, 0),  venue: 'BMO Field', city: 'Toronto' },
  // Group J
  { id: 'GS-55', match_number: 19, group: 'J', home_team: 'ARG', away_team: 'ALG', datetime: utc('2026-06-17', 1, 0),   venue: 'Arrowhead Stadium', city: 'Kansas City' },
  { id: 'GS-56', match_number: 20, group: 'J', home_team: 'AUT', away_team: 'JOR', datetime: utc('2026-06-17', 4, 0),   venue: "Levi's Stadium", city: 'Santa Clara' },
  { id: 'GS-57', match_number: 41, group: 'J', home_team: 'ARG', away_team: 'AUT', datetime: utc('2026-06-22', 17, 0),  venue: 'AT&T Stadium', city: 'Arlington' },
  { id: 'GS-58', match_number: 44, group: 'J', home_team: 'JOR', away_team: 'ALG', datetime: utc('2026-06-23', 3, 0),   venue: "Levi's Stadium", city: 'Santa Clara' },
  { id: 'GS-59', match_number: 72, group: 'J', home_team: 'JOR', away_team: 'ARG', datetime: utc('2026-06-28', 2, 0),   venue: 'AT&T Stadium', city: 'Arlington' },
  { id: 'GS-60', match_number: 71, group: 'J', home_team: 'ALG', away_team: 'AUT', datetime: utc('2026-06-28', 2, 0),   venue: 'Arrowhead Stadium', city: 'Kansas City' },
  // Group K
  { id: 'GS-61', match_number: 21, group: 'K', home_team: 'POR', away_team: 'COD', datetime: utc('2026-06-17', 17, 0),  venue: 'NRG Stadium', city: 'Houston' },
  { id: 'GS-62', match_number: 24, group: 'K', home_team: 'UZB', away_team: 'COL', datetime: utc('2026-06-18', 2, 0),   venue: 'Estadio Azteca', city: 'Mexico City' },
  { id: 'GS-63', match_number: 45, group: 'K', home_team: 'POR', away_team: 'UZB', datetime: utc('2026-06-23', 17, 0),  venue: 'NRG Stadium', city: 'Houston' },
  { id: 'GS-64', match_number: 48, group: 'K', home_team: 'COL', away_team: 'COD', datetime: utc('2026-06-24', 2, 0),   venue: 'Estadio Akron', city: 'Guadalajara' },
  { id: 'GS-65', match_number: 69, group: 'K', home_team: 'COL', away_team: 'POR', datetime: utc('2026-06-27', 23, 30), venue: 'Hard Rock Stadium', city: 'Miami' },
  { id: 'GS-66', match_number: 70, group: 'K', home_team: 'COD', away_team: 'UZB', datetime: utc('2026-06-27', 23, 30), venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  // Group L
  { id: 'GS-67', match_number: 22, group: 'L', home_team: 'ENG', away_team: 'CRO', datetime: utc('2026-06-17', 20, 0),  venue: 'AT&T Stadium', city: 'Arlington' },
  { id: 'GS-68', match_number: 23, group: 'L', home_team: 'GHA', away_team: 'PAN', datetime: utc('2026-06-17', 23, 0),  venue: 'BMO Field', city: 'Toronto' },
  { id: 'GS-69', match_number: 46, group: 'L', home_team: 'ENG', away_team: 'GHA', datetime: utc('2026-06-23', 20, 0),  venue: 'Gillette Stadium', city: 'Foxborough' },
  { id: 'GS-70', match_number: 47, group: 'L', home_team: 'PAN', away_team: 'CRO', datetime: utc('2026-06-23', 23, 0),  venue: 'BMO Field', city: 'Toronto' },
  { id: 'GS-71', match_number: 67, group: 'L', home_team: 'PAN', away_team: 'ENG', datetime: utc('2026-06-27', 21, 0),  venue: 'MetLife Stadium', city: 'New Jersey' },
  { id: 'GS-72', match_number: 68, group: 'L', home_team: 'CRO', away_team: 'GHA', datetime: utc('2026-06-27', 21, 0),  venue: 'Lincoln Financial Field', city: 'Philadelphia' },
];

// ---------------------------------------------------------------------------
// Knockout matches (inlined from src/data/knockoutStructure.js)
// ---------------------------------------------------------------------------

const KNOCKOUT_MATCHES = [
  { id: 'R32-01', match_number: 73,  stage: 'r32', home_placeholder: '2nd Group A', away_placeholder: '2nd Group B', datetime: utc('2026-06-28', 19, 0),  venue: 'SoFi Stadium', city: 'Los Angeles' },
  { id: 'R32-02', match_number: 74,  stage: 'r32', home_placeholder: '1st Group E', away_placeholder: 'Best 3rd (A/B/C/D/F)', datetime: utc('2026-06-29', 20, 30), venue: 'Gillette Stadium', city: 'Foxborough' },
  { id: 'R32-03', match_number: 75,  stage: 'r32', home_placeholder: '1st Group F', away_placeholder: '2nd Group C', datetime: utc('2026-06-30', 1, 0),   venue: 'Estadio BBVA', city: 'Monterrey' },
  { id: 'R32-04', match_number: 76,  stage: 'r32', home_placeholder: '1st Group C', away_placeholder: '2nd Group F', datetime: utc('2026-06-29', 17, 0),  venue: 'NRG Stadium', city: 'Houston' },
  { id: 'R32-05', match_number: 77,  stage: 'r32', home_placeholder: '1st Group I', away_placeholder: 'Best 3rd (C/D/F/G/H)', datetime: utc('2026-06-30', 21, 0), venue: 'MetLife Stadium', city: 'New Jersey' },
  { id: 'R32-06', match_number: 78,  stage: 'r32', home_placeholder: '2nd Group E', away_placeholder: '2nd Group I', datetime: utc('2026-06-30', 17, 0),  venue: 'AT&T Stadium', city: 'Arlington' },
  { id: 'R32-07', match_number: 79,  stage: 'r32', home_placeholder: '1st Group A', away_placeholder: 'Best 3rd (C/E/F/H/I)', datetime: utc('2026-07-01', 1, 0), venue: 'Estadio Azteca', city: 'Mexico City' },
  { id: 'R32-08', match_number: 80,  stage: 'r32', home_placeholder: '1st Group L', away_placeholder: 'Best 3rd (E/H/I/J/K)', datetime: utc('2026-07-01', 16, 0), venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { id: 'R32-09', match_number: 81,  stage: 'r32', home_placeholder: '1st Group D', away_placeholder: 'Best 3rd (B/E/F/I/J)', datetime: utc('2026-07-02', 0, 0), venue: "Levi's Stadium", city: 'Santa Clara' },
  { id: 'R32-10', match_number: 82,  stage: 'r32', home_placeholder: '1st Group G', away_placeholder: 'Best 3rd (A/E/H/I/J)', datetime: utc('2026-07-01', 20, 0), venue: 'Lumen Field', city: 'Seattle' },
  { id: 'R32-11', match_number: 83,  stage: 'r32', home_placeholder: '2nd Group K', away_placeholder: '2nd Group L', datetime: utc('2026-07-02', 23, 0),  venue: 'BMO Field', city: 'Toronto' },
  { id: 'R32-12', match_number: 84,  stage: 'r32', home_placeholder: '1st Group H', away_placeholder: '2nd Group J', datetime: utc('2026-07-02', 19, 0),  venue: 'SoFi Stadium', city: 'Los Angeles' },
  { id: 'R32-13', match_number: 85,  stage: 'r32', home_placeholder: '1st Group B', away_placeholder: 'Best 3rd (E/F/G/I/J)', datetime: utc('2026-07-03', 3, 0), venue: 'BC Place', city: 'Vancouver' },
  { id: 'R32-14', match_number: 86,  stage: 'r32', home_placeholder: '1st Group J', away_placeholder: '2nd Group H', datetime: utc('2026-07-03', 22, 0),  venue: 'Hard Rock Stadium', city: 'Miami' },
  { id: 'R32-15', match_number: 87,  stage: 'r32', home_placeholder: '1st Group K', away_placeholder: 'Best 3rd (D/E/I/J/L)', datetime: utc('2026-07-04', 1, 30), venue: 'Arrowhead Stadium', city: 'Kansas City' },
  { id: 'R32-16', match_number: 88,  stage: 'r32', home_placeholder: '2nd Group D', away_placeholder: '2nd Group G', datetime: utc('2026-07-03', 18, 0),  venue: 'AT&T Stadium', city: 'Arlington' },
  // R16
  { id: 'R16-01', match_number: 89,  stage: 'r16', home_placeholder: 'W74', away_placeholder: 'W77', datetime: utc('2026-07-04', 21, 0),  venue: 'Lincoln Financial Field', city: 'Philadelphia' },
  { id: 'R16-02', match_number: 90,  stage: 'r16', home_placeholder: 'W73', away_placeholder: 'W75', datetime: utc('2026-07-04', 17, 0),  venue: 'NRG Stadium', city: 'Houston' },
  { id: 'R16-03', match_number: 91,  stage: 'r16', home_placeholder: 'W76', away_placeholder: 'W78', datetime: utc('2026-07-05', 20, 0),  venue: 'MetLife Stadium', city: 'New Jersey' },
  { id: 'R16-04', match_number: 92,  stage: 'r16', home_placeholder: 'W79', away_placeholder: 'W80', datetime: utc('2026-07-06', 0, 0),   venue: 'Estadio Azteca', city: 'Mexico City' },
  { id: 'R16-05', match_number: 93,  stage: 'r16', home_placeholder: 'W83', away_placeholder: 'W84', datetime: utc('2026-07-06', 19, 0),  venue: 'AT&T Stadium', city: 'Arlington' },
  { id: 'R16-06', match_number: 94,  stage: 'r16', home_placeholder: 'W81', away_placeholder: 'W82', datetime: utc('2026-07-07', 0, 0),   venue: 'Lumen Field', city: 'Seattle' },
  { id: 'R16-07', match_number: 95,  stage: 'r16', home_placeholder: 'W86', away_placeholder: 'W88', datetime: utc('2026-07-07', 16, 0),  venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { id: 'R16-08', match_number: 96,  stage: 'r16', home_placeholder: 'W85', away_placeholder: 'W87', datetime: utc('2026-07-07', 20, 0),  venue: 'BC Place', city: 'Vancouver' },
  // QF
  { id: 'QF-01', match_number: 97,  stage: 'qf', home_placeholder: 'W89', away_placeholder: 'W90', datetime: utc('2026-07-09', 20, 0), venue: 'Gillette Stadium', city: 'Foxborough' },
  { id: 'QF-02', match_number: 98,  stage: 'qf', home_placeholder: 'W93', away_placeholder: 'W94', datetime: utc('2026-07-10', 19, 0), venue: 'SoFi Stadium', city: 'Los Angeles' },
  { id: 'QF-03', match_number: 99,  stage: 'qf', home_placeholder: 'W91', away_placeholder: 'W92', datetime: utc('2026-07-11', 21, 0), venue: 'Hard Rock Stadium', city: 'Miami' },
  { id: 'QF-04', match_number: 100, stage: 'qf', home_placeholder: 'W95', away_placeholder: 'W96', datetime: utc('2026-07-12', 1, 0),  venue: 'Arrowhead Stadium', city: 'Kansas City' },
  // SF
  { id: 'SF-01', match_number: 101, stage: 'sf', home_placeholder: 'W97', away_placeholder: 'W98', datetime: utc('2026-07-14', 19, 0), venue: 'AT&T Stadium', city: 'Arlington' },
  { id: 'SF-02', match_number: 102, stage: 'sf', home_placeholder: 'W99', away_placeholder: 'W100', datetime: utc('2026-07-15', 19, 0), venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  // Third place
  { id: 'TP-01', match_number: 103, stage: 'third_place', home_placeholder: 'L101', away_placeholder: 'L102', datetime: utc('2026-07-18', 21, 0), venue: 'Hard Rock Stadium', city: 'Miami' },
  // Final
  { id: 'FI-01', match_number: 104, stage: 'final', home_placeholder: 'W101', away_placeholder: 'W102', datetime: utc('2026-07-19', 19, 0), venue: 'MetLife Stadium', city: 'New Jersey' },
];

// ---------------------------------------------------------------------------
// Test users
// ---------------------------------------------------------------------------

const TEST_USERS = [
  { id: 'user_alice', name: 'Alice' },
  { id: 'user_bob',   name: 'Bob' },
  { id: 'user_carol', name: 'Carol' },
  { id: 'user_dave',  name: 'Dave' },
  { id: 'user_eve',   name: 'Eve' },
];

const GOLEADOR_CANDIDATES = [
  'Messi', 'Mbappé', 'Haaland', 'Vinicius Jr.', 'Kane',
  'Lewandowski', 'Salah', 'Lautaro Martínez', 'Julián Álvarez', 'Rashford',
];

// ---------------------------------------------------------------------------
// Main simulation
// ---------------------------------------------------------------------------

async function simulate() {
  console.log('=== PRODE MUNDIAL SIMULATION ===\n');

  // -----------------------------------------------------------------------
  // Step 1: Reset & Seed
  // -----------------------------------------------------------------------
  console.log('[1/6] Clearing /prode ...');
  await fbDelete('');
  console.log('  Cleared.');

  console.log('[2/6] Seeding config, teams, and matches ...');

  // Config
  const adminHash = await sha256('admin123');
  const config = {
    admin_password_hash: adminHash,
    tournament_phase: 'group_stage',
    knockout_phases_open: {
      r32: false, r16: false, qf: false, sf: false, finals: false,
    },
  };
  await fbPut('/config', config);
  console.log('  Config seeded.');

  // Create default tournament
  await fbPut('/tournaments/default', { name: 'Prode Mundial 2026', created_at: Date.now() });
  console.log('  Default tournament created.');

  // Teams (keyed by code)
  const teamsObj = {};
  for (const t of TEAMS) {
    teamsObj[t.code] = t;
  }
  await fbPut('/teams', teamsObj);
  console.log(`  ${TEAMS.length} teams seeded.`);

  // Group stage matches (keyed by id)
  const matchesObj = {};
  for (const m of GROUP_STAGE_MATCHES) {
    matchesObj[m.id] = {
      ...m,
      stage: 'group',
      status: 'scheduled',
      result: null,
    };
  }
  // Knockout matches
  for (const m of KNOCKOUT_MATCHES) {
    matchesObj[m.id] = {
      ...m,
      home_team: null,
      away_team: null,
      status: 'scheduled',
      result: null,
    };
  }
  await fbPut('/matches', matchesObj);
  console.log(`  ${GROUP_STAGE_MATCHES.length} group + ${KNOCKOUT_MATCHES.length} knockout matches seeded.`);

  // -----------------------------------------------------------------------
  // Step 2: Create test users
  // -----------------------------------------------------------------------
  console.log('[3/6] Creating 5 test users ...');
  const pinHash = await sha256('1234');
  const usersObj = {};
  for (const u of TEST_USERS) {
    usersObj[u.id] = {
      name: u.name,
      pin_hash: pinHash,
      has_completed_initial_predictions: true,
      created_at: Date.now(),
    };
  }
  await fbPut('/t/default/users', usersObj);
  console.log('  Users created: ' + TEST_USERS.map(u => u.id).join(', '));

  // -----------------------------------------------------------------------
  // Step 3: Generate predictions for each user
  // -----------------------------------------------------------------------
  console.log('[4/6] Generating predictions for all users ...');
  const teamCodes = TEAMS.map(t => t.code);

  for (const u of TEST_USERS) {
    const preds = {};
    for (const m of GROUP_STAGE_MATCHES) {
      preds[m.id] = {
        home_score: rand(0, 3),
        away_score: rand(0, 3),
      };
    }
    await fbPut(`/t/default/predictions/${u.id}`, preds);

    // Special predictions
    const special = {
      champion: pick(teamCodes),
      goleador: pick(GOLEADOR_CANDIDATES),
    };
    await fbPut(`/t/default/special_predictions/${u.id}`, special);

    console.log(`  ${u.id}: 72 match predictions + champion=${special.champion}, goleador=${special.goleador}`);
  }

  // -----------------------------------------------------------------------
  // Step 4: Simulate group stage results
  // -----------------------------------------------------------------------
  console.log('[5/6] Simulating group stage results (72 matches) ...');

  // Build all results in one batch to minimize API calls
  const resultUpdates = {};
  for (const m of GROUP_STAGE_MATCHES) {
    resultUpdates[`${m.id}/status`] = 'finished';
    resultUpdates[`${m.id}/result`] = {
      home_score: rand(0, 3),
      away_score: rand(0, 3),
    };
  }
  await fbPatch('/matches', resultUpdates);
  console.log('  All 72 group matches marked as finished with random results.');

  // -----------------------------------------------------------------------
  // Step 5: Verify data
  // -----------------------------------------------------------------------
  console.log('[6/6] Verifying data ...');
  const allMatches = await fbGet('/matches');

  let finishedCount = 0;
  let scheduledKnockout = 0;
  for (const [id, match] of Object.entries(allMatches)) {
    if (match.status === 'finished') finishedCount++;
    if (id.startsWith('R32-') || id.startsWith('R16-') || id.startsWith('QF-') ||
        id.startsWith('SF-') || id.startsWith('TP-') || id.startsWith('FI-')) {
      if (match.status === 'scheduled') scheduledKnockout++;
    }
  }

  const allUsers = await fbGet('/t/default/users');
  const userCount = Object.keys(allUsers).length;

  const allPredictions = await fbGet('/t/default/predictions');
  const predUserCount = Object.keys(allPredictions).length;

  console.log('\n=== VERIFICATION SUMMARY ===');
  console.log(`  Group matches finished:    ${finishedCount} / 72`);
  console.log(`  Knockout matches scheduled: ${scheduledKnockout} / ${KNOCKOUT_MATCHES.length}`);
  console.log(`  Users created:             ${userCount}`);
  console.log(`  Users with predictions:    ${predUserCount}`);

  if (finishedCount === 72 && userCount === 5 && predUserCount === 5) {
    console.log('  Status: ALL OK');
  } else {
    console.log('  Status: MISMATCH - check data manually');
  }

  // -----------------------------------------------------------------------
  // Step 6: Print test credentials
  // -----------------------------------------------------------------------
  console.log('\n=== TEST CREDENTIALS ===');
  console.log('  Admin password: admin123');
  console.log('  ---');
  for (const u of TEST_USERS) {
    console.log(`  Username: ${u.id}  |  PIN: 1234`);
  }
  console.log('\n=== SIMULATION COMPLETE ===');
}

simulate().catch((err) => {
  console.error('Simulation failed:', err);
  process.exit(1);
});
