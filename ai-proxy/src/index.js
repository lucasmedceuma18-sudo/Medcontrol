const ALLOWED_ORIGIN = 'https://lucasmedceuma18-sudo.github.io';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-App-Secret',
  };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders() });
    }

    const appSecret = request.headers.get('X-App-Secret');
    if (!appSecret || appSecret !== env.APP_SECRET) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'invalid json body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    const model = body.model || 'gemini-2.0-flash';
    const geminiPayload = body.payload;
    if (!geminiPayload) {
      return new Response(JSON.stringify({ error: 'missing payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

    const geminiResp = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload),
    });

    const respText = await geminiResp.text();
    return new Response(respText, {
      status: geminiResp.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  },
};
