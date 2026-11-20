import { useState, useRef } from 'react';
import { applyRules } from '../config';
import { FIELD_KEYS, postProfile, prefillFrom } from '../lib/profile';

// Engineering student profile (Settings tab). Everything here switches on ONLY when the sheet's answer contains `profile_locked`
// (the new script). With the old script `supported` stays false: Settings is hidden and nothing is prefilled.
// `sinks` is filled by the page after the other hooks exist: prefill (Predictor / Cutoff Explorer) and student (name, category, score).
export default function useProfile({ config, endpoint, currentToken }) {
  const [profile, setProfile] = useState(null);       // the saved values, in the script's field names
  const [supported, setSupported] = useState(false);
  const [locked, setLocked] = useState(false);
  const sinks = useRef({});
  const enabled = !!(config.profile && config.profile.enabled);

  // Sheet category (raw or already normalised) -> the allowed name used in the form ("OBC-NCL" for OBC).
  const catName = (raw) => {
    if (!raw) return '';
    const internal = applyRules(raw, config.student.categoryRules);
    return internal === 'OBC' ? 'OBC-NCL' : internal;
  };
  const fromSheet = (s) => {
    const p = {};
    FIELD_KEYS.forEach(k => { p[k] = s[k] === undefined ? (k === 'desired_branches' ? [] : null) : s[k]; });
    p.category = catName(s.category);
    return p;
  };

  // Called by useStudent with the getStudent data.
  const onSheet = (s) => {
    if (!enabled || !s || typeof s.profile_locked !== 'boolean') return;
    const p = fromSheet(s);
    setSupported(true); setLocked(s.profile_locked); setProfile(p);
    if (sinks.current.prefill) sinks.current.prefill(prefillFrom(p));
  };

  // Returns { ok, fields?, message? }. The profile in the response replaces what we hold; the dashboard updates from it.
  const save = async (changes) => {
    if (!endpoint || !currentToken) return { ok: false, error: 'server_error' };
    const res = await postProfile(endpoint, currentToken, changes);
    if (res.ok && res.profile) {
      const p = { ...fromSheet(res.profile), category: res.profile.category || '' };
      setProfile(p);
      if (sinks.current.student) sinks.current.student(p);
      if (sinks.current.prefill) sinks.current.prefill(prefillFrom(p));
      return { ok: true };
    }
    if (res.error === 'locked') setLocked(true);
    return { ok: false, error: res.error || 'server_error', fields: res.fields };
  };

  return { profile, profileSupported: enabled && supported, profileLocked: locked, saveProfile: save, profileOnSheet: onSheet, profileSinks: sinks };
}
