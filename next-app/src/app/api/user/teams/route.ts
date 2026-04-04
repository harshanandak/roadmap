import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveActiveTeam } from '@/lib/teams/active-team';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { activeTeamId } = await resolveActiveTeam(supabase, user.id);

    const { data: teamMemberships, error } = await supabase
      .from('team_members')
      .select(`
        id,
        team_id,
        role,
        joined_at,
        teams:team_id (
          id,
          name,
          plan
        )
      `)
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('Error fetching team memberships:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      activeTeamId,
      teams: (teamMemberships || []).map((membership) => ({
        ...membership,
        is_active: membership.team_id === activeTeamId,
      })),
    });
  } catch (error: unknown) {
    console.error('Error in GET /api/user/teams:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
