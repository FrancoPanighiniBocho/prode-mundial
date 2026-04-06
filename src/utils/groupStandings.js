/**
 * Compute group standings from match results.
 * Returns an object keyed by group letter, each containing
 * an array of team standings sorted by points > GD > GF.
 */
export function computeGroupStandings(matches, teams) {
  if (!matches || !teams) return {};

  // Initialize standings
  const standings = {};
  for (const [code, team] of Object.entries(teams)) {
    if (!team.group) continue;
    if (!standings[team.group]) standings[team.group] = {};
    standings[team.group][code] = {
      team_code: code,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0,
    };
  }

  // Process finished group matches
  for (const match of Object.values(matches)) {
    if (match.stage !== 'group' || match.status !== 'finished' || !match.result) continue;
    const { home_team, away_team, group } = match;
    const { home_score, away_score } = match.result;
    if (!standings[group]?.[home_team] || !standings[group]?.[away_team]) continue;

    const home = standings[group][home_team];
    const away = standings[group][away_team];

    home.played++;
    away.played++;
    home.gf += home_score;
    home.ga += away_score;
    away.gf += away_score;
    away.ga += home_score;

    if (home_score > away_score) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (home_score < away_score) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += 1;
      away.points += 1;
    }

    home.gd = home.gf - home.ga;
    away.gd = away.gf - away.ga;
  }

  // Sort each group
  const sorted = {};
  for (const [group, teamMap] of Object.entries(standings)) {
    sorted[group] = Object.values(teamMap).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.team_code.localeCompare(b.team_code);
    });
  }

  return sorted;
}
