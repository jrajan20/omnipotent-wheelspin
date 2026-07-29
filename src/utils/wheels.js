import { supabase } from './supabase';

// Slice colors are generated on the fly (HSL) instead of drawn from a fixed
// palette, so a wheel can have any number of options. Each new color is chosen
// at random but kept as distinct as possible from the colors already in use.
function hueFromColor(color) {
  const match = /hsl\(\s*(\d+(?:\.\d+)?)/i.exec(color ?? '');
  return match ? Number(match[1]) : null;
}

function hueDistance(a, b) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

// Pick a random hue kept as far as possible from the hues already used so no
// two slices share a color.
export function randomColor(usedColors = []) {
  const usedHues = usedColors.map(hueFromColor).filter((hue) => hue !== null);
  let bestHue = Math.floor(Math.random() * 360);
  if (usedHues.length) {
    let bestGap = -1;
    for (let i = 0; i < 48; i += 1) {
      const hue = Math.floor(Math.random() * 360);
      const gap = Math.min(...usedHues.map((used) => hueDistance(used, hue)));
      if (gap > bestGap) {
        bestGap = gap;
        bestHue = hue;
      }
    }
  }
  return `hsl(${bestHue} 68% 55%)`;
}

export function makeItem(label, usedColors = []) {
  return {
    id: crypto.randomUUID(),
    label: String(label).trim(),
    color: randomColor(usedColors),
  };
}

// Turn a list of label strings into colored wheel items with distinct colors.
export function itemsFromLabels(labels) {
  const items = [];
  for (const raw of labels ?? []) {
    const label = String(raw).trim();
    if (!label) continue;
    items.push(makeItem(label, items.map((item) => item.color)));
  }
  return items;
}

export async function saveWheel({
  id,
  title,
  description = null,
  options,
  isPublic,
  userId,
}) {
  if (id) {
    const { data, error } = await supabase
      .from('wheels')
      .update({ title, description, options, is_public: isPublic })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('wheels')
    .insert({
      user_id: userId,
      title,
      description,
      options,
      is_public: isPublic,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchMyWheels(userId) {
  const { data, error } = await supabase
    .from('wheels')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchSharedWheel(shareId) {
  const { data, error } = await supabase
    .from('wheels')
    .select('*')
    .eq('share_id', shareId)
    .eq('is_public', true)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteWheel(id) {
  const { error } = await supabase.from('wheels').delete().eq('id', id);
  if (error) throw error;
}

export async function setWheelPublic(id, isPublic) {
  const { data, error } = await supabase
    .from('wheels')
    .update({ is_public: isPublic })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Best-effort spin counter. Only the owner can update (RLS); errors are ignored.
export async function incrementSpinCount(id, current) {
  await supabase
    .from('wheels')
    .update({ spin_count: (current ?? 0) + 1 })
    .eq('id', id);
}
