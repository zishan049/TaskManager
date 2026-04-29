const fs = require('fs');

async function getLogs() {
  const token = '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';
  const headers = {
    'Authorization': `token ${token}`,
    'User-Agent': 'Node.js'
  };

  try {
    const runsRes = await fetch('https://api.github.com/repos/zishan049/TaskManager/actions/runs?per_page=1', { headers });
    const runsData = await runsRes.json();
    const runId = runsData.workflow_runs[0].id;
    console.log('Run ID:', runId);

    const jobsRes = await fetch(`https://api.github.com/repos/zishan049/TaskManager/actions/runs/${runId}/jobs`, { headers });
    const jobsData = await jobsRes.json();
    const jobId = jobsData.jobs[0].id;
    console.log('Job ID:', jobId);

    const logsRes = await fetch(`https://api.github.com/repos/zishan049/TaskManager/actions/jobs/${jobId}/logs`, { headers });
    const logsText = await logsRes.text();
    
    fs.writeFileSync('logs.txt', logsText);
    console.log('Logs written to logs.txt');
  } catch (error) {
    console.error('Error:', error);
  }
}

getLogs();
