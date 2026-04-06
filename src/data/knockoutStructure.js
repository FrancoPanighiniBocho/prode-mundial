// Knockout matches — teams TBD until admin assigns them.
// All datetimes are UTC milliseconds.
// UK times (BST = UTC+1) converted to UTC.

function utc(dateStr, hourUTC, minuteUTC = 0) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, m - 1, d, hourUTC, minuteUTC);
}

export const KNOCKOUT_MATCHES = [
  // === Round of 32 ===
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

  // === Round of 16 ===
  { id: 'R16-01', match_number: 89,  stage: 'r16', home_placeholder: 'W74', away_placeholder: 'W77', datetime: utc('2026-07-04', 21, 0),  venue: 'Lincoln Financial Field', city: 'Philadelphia' },
  { id: 'R16-02', match_number: 90,  stage: 'r16', home_placeholder: 'W73', away_placeholder: 'W75', datetime: utc('2026-07-04', 17, 0),  venue: 'NRG Stadium', city: 'Houston' },
  { id: 'R16-03', match_number: 91,  stage: 'r16', home_placeholder: 'W76', away_placeholder: 'W78', datetime: utc('2026-07-05', 20, 0),  venue: 'MetLife Stadium', city: 'New Jersey' },
  { id: 'R16-04', match_number: 92,  stage: 'r16', home_placeholder: 'W79', away_placeholder: 'W80', datetime: utc('2026-07-06', 0, 0),   venue: 'Estadio Azteca', city: 'Mexico City' },
  { id: 'R16-05', match_number: 93,  stage: 'r16', home_placeholder: 'W83', away_placeholder: 'W84', datetime: utc('2026-07-06', 19, 0),  venue: 'AT&T Stadium', city: 'Arlington' },
  { id: 'R16-06', match_number: 94,  stage: 'r16', home_placeholder: 'W81', away_placeholder: 'W82', datetime: utc('2026-07-07', 0, 0),   venue: 'Lumen Field', city: 'Seattle' },
  { id: 'R16-07', match_number: 95,  stage: 'r16', home_placeholder: 'W86', away_placeholder: 'W88', datetime: utc('2026-07-07', 16, 0),  venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { id: 'R16-08', match_number: 96,  stage: 'r16', home_placeholder: 'W85', away_placeholder: 'W87', datetime: utc('2026-07-07', 20, 0),  venue: 'BC Place', city: 'Vancouver' },

  // === Quarter-Finals ===
  { id: 'QF-01', match_number: 97,  stage: 'qf', home_placeholder: 'W89', away_placeholder: 'W90', datetime: utc('2026-07-09', 20, 0), venue: 'Gillette Stadium', city: 'Foxborough' },
  { id: 'QF-02', match_number: 98,  stage: 'qf', home_placeholder: 'W93', away_placeholder: 'W94', datetime: utc('2026-07-10', 19, 0), venue: 'SoFi Stadium', city: 'Los Angeles' },
  { id: 'QF-03', match_number: 99,  stage: 'qf', home_placeholder: 'W91', away_placeholder: 'W92', datetime: utc('2026-07-11', 21, 0), venue: 'Hard Rock Stadium', city: 'Miami' },
  { id: 'QF-04', match_number: 100, stage: 'qf', home_placeholder: 'W95', away_placeholder: 'W96', datetime: utc('2026-07-12', 1, 0),  venue: 'Arrowhead Stadium', city: 'Kansas City' },

  // === Semi-Finals ===
  { id: 'SF-01', match_number: 101, stage: 'sf', home_placeholder: 'W97', away_placeholder: 'W98', datetime: utc('2026-07-14', 19, 0), venue: 'AT&T Stadium', city: 'Arlington' },
  { id: 'SF-02', match_number: 102, stage: 'sf', home_placeholder: 'W99', away_placeholder: 'W100', datetime: utc('2026-07-15', 19, 0), venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },

  // === Third Place ===
  { id: 'TP-01', match_number: 103, stage: 'third_place', home_placeholder: 'L101', away_placeholder: 'L102', datetime: utc('2026-07-18', 21, 0), venue: 'Hard Rock Stadium', city: 'Miami' },

  // === Final ===
  { id: 'FI-01', match_number: 104, stage: 'final', home_placeholder: 'W101', away_placeholder: 'W102', datetime: utc('2026-07-19', 19, 0), venue: 'MetLife Stadium', city: 'New Jersey' },
];
