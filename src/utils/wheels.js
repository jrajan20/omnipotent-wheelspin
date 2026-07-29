import { supabase } from './supabase';

// Palette used to color wheel slices. Distinct, high-contrast hues.
export const WHEEL_COLORS = [
  '#7048e8',
  '#f76707',
  '#0ca678',
  '#e64980',
  '#1c7ed6',
  '#f59f00',
  '#ae3ec9',
  '#37b24d',
  '#f03e3e',
  '#1098ad',
];

export function colorForIndex(index) {
  return WHEEL_COLORS[index % WHEEL_COLORS.length];
}

export function makeItem(label, index) {
  return {
    id: crypto.randomUUID(),
    label: String(label).trim(),
    color: colorForIndex(index),
  };
}

// Turn a list of label strings into colored wheel items.
export function itemsFromLabels(labels) {
  return (labels ?? [])
    .map((label) => String(label).trim())
    .filter(Boolean)
    .map((label, index) => makeItem(label, index));
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
