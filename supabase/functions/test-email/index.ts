import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Log all environment variables to see what we have
    console.log("=== DEBUGGING EMAIL FUNCTION ===");
    console.log("SMTP_HOST:", Deno.env.get('SMTP_HOST'));
    console.log("SMTP_PORT:", Deno.env.get('SMTP_PORT'));
    console.log("SMTP_USER:", Deno.env.get('SMTP_USER'));
    console.log("SMTP_PASS:", Deno.env.get('SMTP_PASS') ? "***SET***" : "NOT SET");
    console.log("SMTP_FROM:", Deno.env.get('SMTP_FROM'));
    
    const { to, subject, html } = await req.json();
    
    // Use hardcoded values as fallback to test if the issue is environment secrets
    const smtpHost = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com';
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587');
    const smtpUser = Deno.env.get('SMTP_USER') || 'edgeandcobarber@gmail.com';
    const smtpPass = Deno.env.get('SMTP_PASS') || 'hapwtpmvkqkuniqr';
    const fromEmail = Deno.env.get('SMTP_FROM') || 'edgeandcobarber@gmail.com';

    console.log(`Attempting connection to ${smtpHost}:${smtpPort}`);
    console.log(`User: ${smtpUser}`);
    console.log(`Password length: ${smtpPass.length}`);
    
    const client = new SmtpClient();
    
    await client.connectTLS({
      hostname: smtpHost,
      port: smtpPort,
      username: smtpUser,
      password: smtpPass,
    });
    
    console.log("✅ SMTP Connection successful!");

    await client.send({
      from: fromEmail,
      to: to,
      subject: subject,
      html: html,
    });

    await client.close();
    console.log("✅ Email sent successfully!");
    
    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully!' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
