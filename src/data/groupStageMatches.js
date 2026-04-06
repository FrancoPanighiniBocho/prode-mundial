// All datetimes are UTC milliseconds.
// Schedule sourced from FIFA/Sky Sports. UK times (BST = UTC+1) converted to UTC.
// Argentina time (ART) = UTC-3, so subtract 3 hours from UTC for local display.

function utc(dateStr, hourUTC, minuteUTC = 0) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, m - 1, d, hourUTC, minuteUTC);
}

export const GROUP_STAGE_MATCHES = [
  // === Group A: Mexico, South Korea, South Africa, Czechia ===
  { id: 'GS-01', match_number: 1,  group: 'A', home_team: 'MEX', away_team: 'RSA', datetime: utc('2026-06-11', 19, 0),  venue: 'Estadio Azteca', city: 'Mexico City' },
  { id: 'GS-02', match_number: 2,  group: 'A', home_team: 'KOR', away_team: 'CZE', datetime: utc('2026-06-12', 2, 0),   venue: 'Estadio Akron', city: 'Guadalajara' },
  { id: 'GS-03', match_number: 25, group: 'A', home_team: 'CZE', away_team: 'RSA', datetime: utc('2026-06-18', 16, 0),  venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { id: 'GS-04', match_number: 28, group: 'A', home_team: 'MEX', away_team: 'KOR', datetime: utc('2026-06-19', 1, 0),   venue: 'Estadio Akron', city: 'Guadalajara' },
  { id: 'GS-05', match_number: 53, group: 'A', home_team: 'RSA', away_team: 'KOR', datetime: utc('2026-06-25', 1, 0),   venue: 'Estadio BBVA', city: 'Monterrey' },
  { id: 'GS-06', match_number: 54, group: 'A', home_team: 'CZE', away_team: 'MEX', datetime: utc('2026-06-25', 1, 0),   venue: 'Estadio Azteca', city: 'Mexico City' },

  // === Group B: Canada, Switzerland, Qatar, Bosnia & Herzegovina ===
  { id: 'GS-07', match_number: 3,  group: 'B', home_team: 'CAN', away_team: 'BIH', datetime: utc('2026-06-12', 19, 0),  venue: 'BMO Field', city: 'Toronto' },
  { id: 'GS-08', match_number: 5,  group: 'B', home_team: 'QAT', away_team: 'SUI', datetime: utc('2026-06-13', 19, 0),  venue: "Levi's Stadium", city: 'Santa Clara' },
  { id: 'GS-09', match_number: 26, group: 'B', home_team: 'SUI', away_team: 'BIH', datetime: utc('2026-06-18', 19, 0),  venue: 'SoFi Stadium', city: 'Los Angeles' },
  { id: 'GS-10', match_number: 27, group: 'B', home_team: 'CAN', away_team: 'QAT', datetime: utc('2026-06-18', 22, 0),  venue: 'BC Place', city: 'Vancouver' },
  { id: 'GS-11', match_number: 49, group: 'B', home_team: 'SUI', away_team: 'CAN', datetime: utc('2026-06-24', 19, 0),  venue: 'BC Place', city: 'Vancouver' },
  { id: 'GS-12', match_number: 50, group: 'B', home_team: 'BIH', away_team: 'QAT', datetime: utc('2026-06-24', 19, 0),  venue: 'Lumen Field', city: 'Seattle' },

  // === Group C: Brazil, Morocco, Haiti, Scotland ===
  { id: 'GS-13', match_number: 6,  group: 'C', home_team: 'BRA', away_team: 'MAR', datetime: utc('2026-06-13', 22, 0),  venue: 'MetLife Stadium', city: 'New Jersey' },
  { id: 'GS-14', match_number: 7,  group: 'C', home_team: 'HAI', away_team: 'SCO', datetime: utc('2026-06-14', 1, 0),   venue: 'Gillette Stadium', city: 'Foxborough' },
  { id: 'GS-15', match_number: 30, group: 'C', home_team: 'SCO', away_team: 'MAR', datetime: utc('2026-06-19', 22, 0),  venue: 'Gillette Stadium', city: 'Foxborough' },
  { id: 'GS-16', match_number: 31, group: 'C', home_team: 'BRA', away_team: 'HAI', datetime: utc('2026-06-20', 1, 0),   venue: 'Lincoln Financial Field', city: 'Philadelphia' },
  { id: 'GS-17', match_number: 51, group: 'C', home_team: 'SCO', away_team: 'BRA', datetime: utc('2026-06-24', 22, 0),  venue: 'Hard Rock Stadium', city: 'Miami' },
  { id: 'GS-18', match_number: 52, group: 'C', home_team: 'MAR', away_team: 'HAI', datetime: utc('2026-06-24', 22, 0),  venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },

  // === Group D: USA, Paraguay, Australia, Turkey ===
  { id: 'GS-19', match_number: 4,  group: 'D', home_team: 'USA', away_team: 'PAR', datetime: utc('2026-06-13', 1, 0),   venue: 'SoFi Stadium', city: 'Los Angeles' },
  { id: 'GS-20', match_number: 8,  group: 'D', home_team: 'AUS', away_team: 'TUR', datetime: utc('2026-06-14', 4, 0),   venue: 'BC Place', city: 'Vancouver' },
  { id: 'GS-21', match_number: 29, group: 'D', home_team: 'USA', away_team: 'AUS', datetime: utc('2026-06-19', 19, 0),  venue: 'Lumen Field', city: 'Seattle' },
  { id: 'GS-22', match_number: 32, group: 'D', home_team: 'TUR', away_team: 'PAR', datetime: utc('2026-06-20', 4, 0),   venue: "Levi's Stadium", city: 'Santa Clara' },
  { id: 'GS-23', match_number: 60, group: 'D', home_team: 'PAR', away_team: 'AUS', datetime: utc('2026-06-26', 2, 0),   venue: "Levi's Stadium", city: 'Santa Clara' },
  { id: 'GS-24', match_number: 59, group: 'D', home_team: 'TUR', away_team: 'USA', datetime: utc('2026-06-26', 2, 0),   venue: 'SoFi Stadium', city: 'Los Angeles' },

  // === Group E: Germany, Curacao, Ivory Coast, Ecuador ===
  { id: 'GS-25', match_number: 9,  group: 'E', home_team: 'GER', away_team: 'CUR', datetime: utc('2026-06-14', 17, 0),  venue: 'NRG Stadium', city: 'Houston' },
  { id: 'GS-26', match_number: 11, group: 'E', home_team: 'CIV', away_team: 'ECU', datetime: utc('2026-06-14', 23, 0),  venue: 'Lincoln Financial Field', city: 'Philadelphia' },
  { id: 'GS-27', match_number: 34, group: 'E', home_team: 'GER', away_team: 'CIV', datetime: utc('2026-06-20', 20, 0),  venue: 'BMO Field', city: 'Toronto' },
  { id: 'GS-28', match_number: 35, group: 'E', home_team: 'ECU', away_team: 'CUR', datetime: utc('2026-06-21', 0, 0),   venue: 'Arrowhead Stadium', city: 'Kansas City' },
  { id: 'GS-29', match_number: 55, group: 'E', home_team: 'ECU', away_team: 'GER', datetime: utc('2026-06-25', 20, 0),  venue: 'MetLife Stadium', city: 'New Jersey' },
  { id: 'GS-30', match_number: 56, group: 'E', home_team: 'CUR', away_team: 'CIV', datetime: utc('2026-06-25', 20, 0),  venue: 'Lincoln Financial Field', city: 'Philadelphia' },

  // === Group F: Netherlands, Japan, Sweden, Tunisia ===
  { id: 'GS-31', match_number: 10, group: 'F', home_team: 'NED', away_team: 'JPN', datetime: utc('2026-06-14', 20, 0),  venue: 'AT&T Stadium', city: 'Arlington' },
  { id: 'GS-32', match_number: 12, group: 'F', home_team: 'SWE', away_team: 'TUN', datetime: utc('2026-06-15', 2, 0),   venue: 'Estadio BBVA', city: 'Monterrey' },
  { id: 'GS-33', match_number: 33, group: 'F', home_team: 'NED', away_team: 'SWE', datetime: utc('2026-06-20', 17, 0),  venue: 'NRG Stadium', city: 'Houston' },
  { id: 'GS-34', match_number: 36, group: 'F', home_team: 'TUN', away_team: 'JPN', datetime: utc('2026-06-21', 4, 0),   venue: 'Estadio BBVA', city: 'Monterrey' },
  { id: 'GS-35', match_number: 57, group: 'F', home_team: 'TUN', away_team: 'NED', datetime: utc('2026-06-25', 23, 0),  venue: 'Arrowhead Stadium', city: 'Kansas City' },
  { id: 'GS-36', match_number: 58, group: 'F', home_team: 'JPN', away_team: 'SWE', datetime: utc('2026-06-25', 23, 0),  venue: 'AT&T Stadium', city: 'Arlington' },

  // === Group G: Belgium, Egypt, Iran, New Zealand ===
  { id: 'GS-37', match_number: 14, group: 'G', home_team: 'BEL', away_team: 'EGY', datetime: utc('2026-06-15', 19, 0),  venue: 'Lumen Field', city: 'Seattle' },
  { id: 'GS-38', match_number: 16, group: 'G', home_team: 'IRN', away_team: 'NZL', datetime: utc('2026-06-16', 1, 0),   venue: 'SoFi Stadium', city: 'Los Angeles' },
  { id: 'GS-39', match_number: 38, group: 'G', home_team: 'BEL', away_team: 'IRN', datetime: utc('2026-06-21', 19, 0),  venue: 'SoFi Stadium', city: 'Los Angeles' },
  { id: 'GS-40', match_number: 40, group: 'G', home_team: 'NZL', away_team: 'EGY', datetime: utc('2026-06-22', 1, 0),   venue: 'BC Place', city: 'Vancouver' },
  { id: 'GS-41', match_number: 65, group: 'G', home_team: 'NZL', away_team: 'BEL', datetime: utc('2026-06-27', 3, 0),   venue: 'BC Place', city: 'Vancouver' },
  { id: 'GS-42', match_number: 66, group: 'G', home_team: 'EGY', away_team: 'IRN', datetime: utc('2026-06-27', 3, 0),   venue: 'Lumen Field', city: 'Seattle' },

  // === Group H: Spain, Uruguay, Saudi Arabia, Cape Verde ===
  { id: 'GS-43', match_number: 13, group: 'H', home_team: 'ESP', away_team: 'CPV', datetime: utc('2026-06-15', 16, 0),  venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { id: 'GS-44', match_number: 15, group: 'H', home_team: 'KSA', away_team: 'URU', datetime: utc('2026-06-15', 22, 0),  venue: 'Hard Rock Stadium', city: 'Miami' },
  { id: 'GS-45', match_number: 37, group: 'H', home_team: 'ESP', away_team: 'KSA', datetime: utc('2026-06-21', 16, 0),  venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { id: 'GS-46', match_number: 39, group: 'H', home_team: 'URU', away_team: 'CPV', datetime: utc('2026-06-21', 22, 0),  venue: 'Hard Rock Stadium', city: 'Miami' },
  { id: 'GS-47', match_number: 64, group: 'H', home_team: 'URU', away_team: 'ESP', datetime: utc('2026-06-27', 0, 0),   venue: 'Estadio Akron', city: 'Guadalajara' },
  { id: 'GS-48', match_number: 63, group: 'H', home_team: 'CPV', away_team: 'KSA', datetime: utc('2026-06-27', 0, 0),   venue: 'NRG Stadium', city: 'Houston' },

  // === Group I: France, Senegal, Iraq, Norway ===
  { id: 'GS-49', match_number: 17, group: 'I', home_team: 'FRA', away_team: 'SEN', datetime: utc('2026-06-16', 19, 0),  venue: 'MetLife Stadium', city: 'New Jersey' },
  { id: 'GS-50', match_number: 18, group: 'I', home_team: 'IRQ', away_team: 'NOR', datetime: utc('2026-06-16', 22, 0),  venue: 'Gillette Stadium', city: 'Foxborough' },
  { id: 'GS-51', match_number: 42, group: 'I', home_team: 'FRA', away_team: 'IRQ', datetime: utc('2026-06-22', 21, 0),  venue: 'Lincoln Financial Field', city: 'Philadelphia' },
  { id: 'GS-52', match_number: 43, group: 'I', home_team: 'NOR', away_team: 'SEN', datetime: utc('2026-06-23', 0, 0),   venue: 'MetLife Stadium', city: 'New Jersey' },
  { id: 'GS-53', match_number: 61, group: 'I', home_team: 'NOR', away_team: 'FRA', datetime: utc('2026-06-26', 19, 0),  venue: 'Gillette Stadium', city: 'Foxborough' },
  { id: 'GS-54', match_number: 62, group: 'I', home_team: 'SEN', away_team: 'IRQ', datetime: utc('2026-06-26', 19, 0),  venue: 'BMO Field', city: 'Toronto' },

  // === Group J: Argentina, Algeria, Austria, Jordan ===
  { id: 'GS-55', match_number: 19, group: 'J', home_team: 'ARG', away_team: 'ALG', datetime: utc('2026-06-17', 1, 0),   venue: 'Arrowhead Stadium', city: 'Kansas City' },
  { id: 'GS-56', match_number: 20, group: 'J', home_team: 'AUT', away_team: 'JOR', datetime: utc('2026-06-17', 4, 0),   venue: "Levi's Stadium", city: 'Santa Clara' },
  { id: 'GS-57', match_number: 41, group: 'J', home_team: 'ARG', away_team: 'AUT', datetime: utc('2026-06-22', 17, 0),  venue: 'AT&T Stadium', city: 'Arlington' },
  { id: 'GS-58', match_number: 44, group: 'J', home_team: 'JOR', away_team: 'ALG', datetime: utc('2026-06-23', 3, 0),   venue: "Levi's Stadium", city: 'Santa Clara' },
  { id: 'GS-59', match_number: 72, group: 'J', home_team: 'JOR', away_team: 'ARG', datetime: utc('2026-06-28', 2, 0),   venue: 'AT&T Stadium', city: 'Arlington' },
  { id: 'GS-60', match_number: 71, group: 'J', home_team: 'ALG', away_team: 'AUT', datetime: utc('2026-06-28', 2, 0),   venue: 'Arrowhead Stadium', city: 'Kansas City' },

  // === Group K: Portugal, Colombia, Uzbekistan, DR Congo ===
  { id: 'GS-61', match_number: 21, group: 'K', home_team: 'POR', away_team: 'COD', datetime: utc('2026-06-17', 17, 0),  venue: 'NRG Stadium', city: 'Houston' },
  { id: 'GS-62', match_number: 24, group: 'K', home_team: 'UZB', away_team: 'COL', datetime: utc('2026-06-18', 2, 0),   venue: 'Estadio Azteca', city: 'Mexico City' },
  { id: 'GS-63', match_number: 45, group: 'K', home_team: 'POR', away_team: 'UZB', datetime: utc('2026-06-23', 17, 0),  venue: 'NRG Stadium', city: 'Houston' },
  { id: 'GS-64', match_number: 48, group: 'K', home_team: 'COL', away_team: 'COD', datetime: utc('2026-06-24', 2, 0),   venue: 'Estadio Akron', city: 'Guadalajara' },
  { id: 'GS-65', match_number: 69, group: 'K', home_team: 'COL', away_team: 'POR', datetime: utc('2026-06-27', 23, 30), venue: 'Hard Rock Stadium', city: 'Miami' },
  { id: 'GS-66', match_number: 70, group: 'K', home_team: 'COD', away_team: 'UZB', datetime: utc('2026-06-27', 23, 30), venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },

  // === Group L: England, Croatia, Ghana, Panama ===
  { id: 'GS-67', match_number: 22, group: 'L', home_team: 'ENG', away_team: 'CRO', datetime: utc('2026-06-17', 20, 0),  venue: 'AT&T Stadium', city: 'Arlington' },
  { id: 'GS-68', match_number: 23, group: 'L', home_team: 'GHA', away_team: 'PAN', datetime: utc('2026-06-17', 23, 0),  venue: 'BMO Field', city: 'Toronto' },
  { id: 'GS-69', match_number: 46, group: 'L', home_team: 'ENG', away_team: 'GHA', datetime: utc('2026-06-23', 20, 0),  venue: 'Gillette Stadium', city: 'Foxborough' },
  { id: 'GS-70', match_number: 47, group: 'L', home_team: 'PAN', away_team: 'CRO', datetime: utc('2026-06-23', 23, 0),  venue: 'BMO Field', city: 'Toronto' },
  { id: 'GS-71', match_number: 67, group: 'L', home_team: 'PAN', away_team: 'ENG', datetime: utc('2026-06-27', 21, 0),  venue: 'MetLife Stadium', city: 'New Jersey' },
  { id: 'GS-72', match_number: 68, group: 'L', home_team: 'CRO', away_team: 'GHA', datetime: utc('2026-06-27', 21, 0),  venue: 'Lincoln Financial Field', city: 'Philadelphia' },
];
