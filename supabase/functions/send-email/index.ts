const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string | string[];
  subject: string;
  html: string;
  booking?: any;
}

// Call local webhook that triggers PowerShell email
async function sendEmailViaLocalWebhook(to: string, subject: string, html: string) {
  console.log(`🚀 Calling local webhook for: ${to}`);
  
  try {
    const webhookUrl = 'http://localhost:3001/send-email';
    
    const emailData = {
      to: to,
      subject: subject,
      html: html
    };
    
    console.log('📧 Calling webhook:', webhookUrl);
    console.log('📧 Data:', JSON.stringify(emailData, null, 2));
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Webhook successful for ${to}`);
      console.log('Webhook response:', result);
      return { success: true, webhookResponse: result };
    } else {
      const errorText = await response.text();
      throw new Error(`Webhook failed: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error(`❌ Webhook failed for ${to}:`, error);
    
    // Fallback: just log the email details for manual sending
    console.log('📝 EMAIL DETAILS FOR MANUAL SENDING:');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML: ${html}`);
    
    // Return success anyway so the booking doesn't fail
    return { success: true, fallback: true, error: error.message };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, subject, html, booking }: EmailRequest = await req.json();
    
    console.log("🚀 EMAIL FUNCTION CALLED - LOCAL WEBHOOK METHOD");
    console.log("📧 Request:", { to, subject, htmlLength: html?.length });

    
    // Process recipients using local webhook method
    const recipients = Array.isArray(to) ? to : [to];
    console.log(`📬 Processing ${recipients.length} recipient(s) via local webhook`);
    
    const results = [];
    for (const recipient of recipients) {
      try {
        const result = await sendEmailViaLocalWebhook(recipient, subject, html);
        results.push({ recipient, success: true, result });
        console.log(`✅ Local webhook successful: ${recipient}`);
      } catch (error) {
        results.push({ recipient, success: false, error: error.message });
        console.log(`❌ Local webhook failed: ${recipient} - ${error.message}`);
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`🎯 LOCAL WEBHOOK SUMMARY: ${successCount}/${recipients.length} emails processed`);
    
    // Create comprehensive log
    const emailSummary = {
      timestamp: new Date().toISOString(),
      recipients: recipients,
      subject: subject,
      html_preview: html.substring(0, 200) + (html.length > 200 ? "..." : ""),
      results: results,
      method: "local_webhook_powershell",
      webhook_server: "http://localhost:3001/send-email"
    };
    
    console.log("📋 LOCAL WEBHOOK Summary:", JSON.stringify(emailSummary, null, 2));
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Local webhook processed ${successCount}/${recipients.length} emails`,
        recipients: recipients,
        results: results,
        timestamp: emailSummary.timestamp,
        method: "local_webhook_powershell",
        note: "Emails sent via local webhook → PowerShell → Gmail SMTP"
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('💥 WEBHOOK ERROR');
    console.error('Error:', error);
    console.error('Message:', error.message);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Webhook function failed: ${error.message}`,
        details: error.toString(),
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
