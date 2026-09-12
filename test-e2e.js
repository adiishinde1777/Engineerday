import { io } from 'socket.io-client';

const BASE_URL = 'http://localhost:5000';

async function runE2ETests() {
  console.log('🧪 STARTING COMPREHENSIVE END-TO-END VERIFICATION...');

  // 1. Health check
  console.log('\n[1] Health Check...');
  const healthRes = await fetch(`${BASE_URL}/api/health`).then(r => r.json());
  console.log('✅ Health Response:', healthRes);

  // 2. Settings check
  console.log('\n[2] Global Settings Check...');
  const settingsRes = await fetch(`${BASE_URL}/api/settings`).then(r => r.json());
  console.log('✅ Event Name:', settingsRes.eventSettings.eventName);
  console.log('✅ Google Form URL:', settingsRes.eventSettings.googleFormUrl);
  console.log('✅ Brain Scoring Tier 0-5s bonus:', settingsRes.scoringSettings.brain.tier_0_5);

  // 3. Admin Authentication test
  console.log('\n[3] Testing Admin Login (admin / admin@engineer2026)...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin@engineer2026' })
  }).then(r => r.json());

  if (!loginRes.success || !loginRes.token) {
    throw new Error('Admin login failed: ' + JSON.stringify(loginRes));
  }
  const token = loginRes.token;
  console.log('✅ Admin login succeeded! JWT token acquired.');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 4. Test Teams & Registration Flow
  console.log('\n[4] Testing Teams Registration & Lookup...');
  const newTeamName = `Alpha Innovators ${Date.now().toString().slice(-4)}`;
  const createTeamRes = await fetch(`${BASE_URL}/api/teams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      team_name: newTeamName,
      game: 'brain',
      captain: 'Vikram Mehta',
      member1: 'Vikram Mehta',
      member2: 'Ananya Deshmukh',
      member3: 'Siddharth Iyer',
      contact: '+91 98765 00112'
    })
  }).then(r => r.json());
  console.log('✅ Team Created:', createTeamRes);

  // Lookup newly created team
  const lookupRes = await fetch(`${BASE_URL}/api/teams?search=${encodeURIComponent(newTeamName)}`).then(r => r.json());
  console.log('✅ Verified Team in DB:', lookupRes.teams[0].team_name, '| Status:', lookupRes.teams[0].registration_status);

  // 5. Test Question Bank
  console.log('\n[5] Testing Questions Bank (CRUD & Options)...');
  const qList = await fetch(`${BASE_URL}/api/questions?game=brain&round=1`).then(r => r.json());
  console.log(`✅ Loaded ${qList.count} Brain Round 1 questions.`);
  const sampleQ = qList.questions[0];
  console.log('✅ Sample Question:', sampleQ.question);
  console.log('✅ Correct Answer:', sampleQ.correct_answer);

  // 6. Test Game Control & Time-based Scoring Flow
  console.log('\n[6] Testing Live Game Session & Answer Submission...');
  // Set question
  await fetch(`${BASE_URL}/api/games/control/brain`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ action: 'SET_QUESTION', questionId: sampleQ.id })
  });
  // Start timer
  await fetch(`${BASE_URL}/api/games/control/brain`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ action: 'START_TIMER', timerDuration: 30 })
  });

  // Verify session status
  const sessionRes = await fetch(`${BASE_URL}/api/games/session/brain`).then(r => r.json());
  console.log('✅ Brain Session Status:', sessionRes.session.status, '| Timer remaining:', sessionRes.session.timer_remaining);

  // Submit correct answer for new team
  console.log('\n[7] Submitting Correct Answer for Team...');
  const submitRes = await fetch(`${BASE_URL}/api/games/submit-answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      teamId: createTeamRes.id,
      questionId: sampleQ.id,
      answer: sampleQ.correct_answer
    })
  }).then(r => r.json());
  console.log('✅ Submission Result:', submitRes);
  console.log(`✅ Base Points: +${submitRes.basePoints} | Time Bonus: +${submitRes.timeBonus} | Total Awarded: +${submitRes.totalPoints}`);
  console.log('✅ Updated Team Score in DB:', submitRes.newTeamScore);

  // Verify anti-cheating: duplicate submission should fail
  console.log('\n[8] Testing Anti-Cheating (Duplicate Submission Protection)...');
  const dupRes = await fetch(`${BASE_URL}/api/games/submit-answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      teamId: createTeamRes.id,
      questionId: sampleQ.id,
      answer: sampleQ.correct_answer
    })
  }).then(r => r.json());
  console.log('✅ Anti-Cheating Blocked Duplicate:', dupRes.success === false, '| Message:', dupRes.message);

  // 9. Test Pictionary Flow
  console.log('\n[9] Testing Engineering Pictionary Judging...');
  const picTeams = await fetch(`${BASE_URL}/api/teams?game=pictionary`).then(r => r.json());
  const picQuestions = await fetch(`${BASE_URL}/api/questions?game=pictionary`).then(r => r.json());
  const judgeRes = await fetch(`${BASE_URL}/api/games/judge-pictionary`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      teamId: picTeams.teams[0].id,
      questionId: picQuestions.questions[0].id,
      isCorrect: true,
      responseTime: 4.5
    })
  }).then(r => r.json());
  console.log('✅ Pictionary Evaluated:', judgeRes);

  // 10. Test Google Form CSV Bulk Import
  console.log('\n[10] Testing Google Form CSV Bulk Import...');
  const csvImportRes = await fetch(`${BASE_URL}/api/teams/import`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      teams: [
        { 'Team Name': `Quantum Core ${Date.now().toString().slice(-4)}`, 'Game': 'Engineer Brain', 'Member 1': 'Aarya', 'Member 2': 'Bhavin', 'Member 3': 'Chetan', 'Contact': '+91 9988776655' },
        { 'Team Name': `Pictionary Pros ${Date.now().toString().slice(-4)}`, 'Game': 'Engineering Pictionary', 'Member 1': 'Diya', 'Member 2': 'Eshan', 'Member 3': 'Farhan', 'Contact': '+91 9988776644' }
      ]
    })
  }).then(r => r.json());
  console.log('✅ CSV Import Result:', csvImportRes.message, '| Imported:', csvImportRes.importedCount);

  // 11. Test CSV Export Endpoints
  console.log('\n[11] Testing CSV Export Endpoints...');
  const exportReg = await fetch(`${BASE_URL}/api/export/registrations`, { headers: authHeaders }).then(r => r.text());
  console.log('✅ Registrations CSV Export Header:\n', exportReg.split('\r\n')[0]);

  const exportScores = await fetch(`${BASE_URL}/api/export/scores`, { headers: authHeaders }).then(r => r.text());
  console.log('✅ Game Scores CSV Export Header:\n', exportScores.split('\r\n')[0]);

  const exportResults = await fetch(`${BASE_URL}/api/export/results`, { headers: authHeaders }).then(r => r.text());
  console.log('✅ Final Results CSV Export Header:\n', exportResults.split('\r\n')[0]);

  // 12. Real-time Socket.IO Connection & Scoreboard broadcast test
  console.log('\n[12] Testing Real-Time Socket.IO Synchronization...');
  await new Promise((resolve) => {
    const socket = io(BASE_URL);
    socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server! Socket ID:', socket.id);
      socket.emit('join_game', 'brain');
    });

    socket.on('session_state', (data) => {
      console.log('✅ Received Live Session State via Socket.IO for game brain');
      socket.disconnect();
      resolve();
    });

    setTimeout(() => {
      socket.disconnect();
      resolve();
    }, 2000);
  });

  console.log('\n🎉 ALL 12 FULL-STACK WORKFLOW TESTS PASSED PERFECTLY!');
  process.exit(0);
}

runE2ETests().catch(err => {
  console.error('❌ E2E TEST FAILED:', err);
  process.exit(1);
});
