// src/lib/dashboard.ts

export function getDashboardHTML(): string {
	return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SEO Schema Generator - Dashboard</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    header {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }
    
    h1 {
      color: #333;
      margin-bottom: 10px;
    }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .stat-label {
      color: #666;
      font-size: 14px;
      margin-bottom: 10px;
    }
    
    .stat-value {
      color: #667eea;
      font-size: 32px;
      font-weight: bold;
    }
    
    .progress-bar {
      width: 100%;
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      margin-top: 10px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      background: #667eea;
      transition: width 0.3s ease;
    }
    
    table {
      width: 100%;
      background: white;
      border-collapse: collapse;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    thead {
      background: #f5f5f5;
    }
    
    th {
      padding: 15px;
      text-align: left;
      color: #333;
      font-weight: 600;
      border-bottom: 2px solid #e0e0e0;
      font-size: 13px;
    }
    
    td {
      padding: 15px;
      border-bottom: 1px solid #e0e0e0;
      color: #666;
    }
    
    tr:hover {
      background: #f9f9f9;
    }
    
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    
    .badge-article {
      background: #e3f2fd;
      color: #1976d2;
    }
    
    .badge-product {
      background: #f3e5f5;
      color: #7b1fa2;
    }
    
    .badge-localbusiness {
      background: #e8f5e9;
      color: #388e3c;
    }
    
    .badge-service {
      background: #fff3e0;
      color: #f57c00;
    }
    
    .token-cell {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      background: #f5f5f5;
      padding: 8px 12px;
      border-radius: 4px;
      display: inline-block;
    }
    
    .token-input {
      color: #1976d2;
      font-weight: 600;
    }
    
    .token-output {
      color: #f57c00;
      font-weight: 600;
    }
    
    .token-total {
      color: #388e3c;
      font-weight: 700;
    }
    
    .loading {
      text-align: center;
      padding: 40px;
      color: white;
    }
    
    .error {
      background: #ffebee;
      color: #c62828;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    
    .empty {
      text-align: center;
      padding: 40px;
      color: #999;
    }
    
    h2 {
      color: white;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>📊 SEO Schema Generator Dashboard</h1>
      <p>View your generation history and usage statistics</p>
    </header>
    
    <div class="stats" id="stats">
      <div class="loading">Loading statistics...</div>
    </div>
    
    <div>
      <h2>Generation History</h2>
      <div id="generations">
        <div class="loading">Loading generations...</div>
      </div>
    </div>
  </div>
  
  <script>
    const API_BASE = window.location.origin;
    
    async function loadData() {
      try {
        // Get token from localStorage or prompt
        let token = localStorage.getItem('api_token');
        if (!token) {
          token = prompt('Enter your API token:');
          if (!token) return;
          localStorage.setItem('api_token', token);
        }
        
        // Fetch generations
        const response = await fetch(\`\${API_BASE}/api/generations\`, {
          headers: {
            'Authorization': \`Bearer \${token}\`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to load data');
        }
        
        const data = await response.json();
        
        if (!data.ok) {
          throw new Error(data.error.message);
        }
        
        renderStats(data.data.usage, data.data.limit);
        renderGenerations(data.data.generations);
      } catch (error) {
        document.getElementById('stats').innerHTML = \`<div class="error">\${error.message}</div>\`;
        document.getElementById('generations').innerHTML = \`<div class="error">\${error.message}</div>\`;
      }
    }
    
    function renderStats(used, limit) {
      const percentage = (used / limit) * 100;
      document.getElementById('stats').innerHTML = \`
        <div class="stat-card">
          <div class="stat-label">Usage This Month</div>
          <div class="stat-value">\${used}/\${limit}</div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: \${percentage}%"></div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Remaining</div>
          <div class="stat-value">\${limit - used}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Usage %</div>
          <div class="stat-value">\${Math.round(percentage)}%</div>
        </div>
      \`;
    }
    
    function renderGenerations(generations) {
      if (!generations || generations.length === 0) {
        document.getElementById('generations').innerHTML = '<div class="empty">No generations yet</div>';
        return;
      }
      
      const rows = generations.map(g => {
        const total = g.tokens_input + g.tokens_output;
        return \`
          <tr>
            <td>\${new Date(g.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
            <td><span class="badge badge-\${g.content_type.toLowerCase()}">\${g.content_type}</span></td>
            <td><strong>\${g.input_title.substring(0, 45)}...</strong></td>
            <td>\${g.meta_title.substring(0, 40)}...</td>
            <td>
              <div class="token-cell">
                <span class="token-input">\${g.tokens_input}</span> | 
                <span class="token-output">\${g.tokens_output}</span> | 
                <span class="token-total">\${total}</span>
              </div>
            </td>
            <td><span style="color: green; font-weight: 600;">✓</span></td>
          </tr>
        \`;
      }).join('');
      
      document.getElementById('generations').innerHTML = \`
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Input Title</th>
              <th>Generated Title</th>
              <th>Tokens (In | Out | Total)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            \${rows}
          </tbody>
        </table>
      \`;
    }
    
    loadData();
  </script>
</body>
</html>
  `;
}
