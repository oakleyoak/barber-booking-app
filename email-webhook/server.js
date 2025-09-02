const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Email webhook server is running' });
});

// Email sending endpoint
app.post('/send-email', (req, res) => {
  const { to, subject, html } = req.body;
  
  console.log('🚀 Email webhook received');
  console.log('To:', to);
  console.log('Subject:', subject);
  
  if (!to || !subject || !html) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields: to, subject, html' 
    });
  }
  
  // Escape HTML for PowerShell
  const escapedHtml = html.replace(/"/g, '`"').replace(/\$/g, '`$');
  
  // Call PowerShell script
  const scriptPath = path.join(__dirname, '..', 'send-email-powershell.ps1');
  const command = `powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}" -To "${to}" -Subject "${subject}" -Body "${escapedHtml}"`;
  
  console.log('📤 Executing PowerShell email script...');
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ PowerShell script failed:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message,
        stderr: stderr
      });
    }
    
    console.log('✅ PowerShell script output:', stdout);
    
    res.json({ 
      success: true, 
      message: 'Email sent successfully via PowerShell',
      output: stdout,
      timestamp: new Date().toISOString()
    });
  });
});

app.listen(port, () => {
  console.log(`🚀 Email webhook server running on http://localhost:${port}`);
  console.log('Endpoints:');
  console.log('  GET  /health - Health check');
  console.log('  POST /send-email - Send email via PowerShell');
});

module.exports = app;
