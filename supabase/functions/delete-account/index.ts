// Supabase Edge Function: delete-account
//
// Deletes the calling user's account (auth record + all their data) using the
// Supabase service-role key so that RLS policies don't block the admin call.
//
// Deploy: npx supabase functions deploy delete-account

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Server misconfiguration: missing Supabase credentials.');
    }

    // Verify the calling user via their JWT.
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    // Resolve the user id from the JWT using the /auth/v1/user endpoint.
    const userRes = await fetch(supabaseUrl + '/auth/v1/user', {
      headers: {
        Authorization: 'Bearer ' + jwt,
        apikey: serviceRoleKey,
      },
    });

    if (!userRes.ok) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const { id: userId } = await userRes.json();
    if (!userId) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    // Delete the user using the admin API (requires service role key).
    const deleteRes = await fetch(
      supabaseUrl + '/auth/v1/admin/users/' + userId,
      {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + serviceRoleKey,
          apikey: serviceRoleKey,
        },
      },
    );

    if (!deleteRes.ok) {
      const body = await deleteRes.text();
      throw new Error('Failed to delete user: ' + body);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      500,
    );
  }
});

export {};
