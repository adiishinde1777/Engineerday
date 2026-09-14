import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const RENDER_API_URL = process.env.RENDER_API_URL || 'https://engineerday.onrender.com';

export async function pushToRender() {
  console.log(`🚀 Preparing to push local database teams to Render website (${RENDER_API_URL})...`);

  // 1. Read teams from local SQLite (which is continuously synced with MySQL)
  const sqliteDbPath = path.join(__dirname, '..', 'engineers_day.db');
  const db = new DatabaseSync(sqliteDbPath);
  const teams = db.prepare('SELECT * FROM teams WHERE (is_deleted = 0 OR is_deleted IS NULL)').all();

  console.log(`📦 Found ${teams.length} active teams in local database:`);
  teams.forEach(t => console.log(`   - ${t.team_name} (${t.game}) [Captain: ${t.captain}]`));

  if (teams.length === 0) {
    console.log('⚠️ No teams to push.');
    return;
  }

  // 2. Send to Render API endpoint
  try {
    const res = await fetch(`${RENDER_API_URL}/api/teams/sync-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teams })
    });

    const data = await res.json();
    if (data.success) {
      console.log(`\n🎉 SUCCESS! Pushed ${data.count || teams.length} teams to Render live website!`);
    } else {
      console.error(`\n❌ Render sync response error:`, data.message || data);
    }
  } catch (err) {
    console.error(`\n❌ Network error while pushing to Render:`, err.message);
    console.log(`👉 Make sure ${RENDER_API_URL} has finished deploying the latest code with /sync-push endpoint.`);
  }
}

if (process.argv[1] && process.argv[1].endsWith('push-to-render.js')) {
  pushToRender().finally(() => process.exit(0));
}
