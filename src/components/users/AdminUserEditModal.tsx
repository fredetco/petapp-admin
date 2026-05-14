import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogTitle, DialogBody, DialogActions } from '../catalyst/dialog';
import { Button } from '../shared/Button';
import { updateUserProfile, type UserEditPayload } from '../../services/users';
import type { UserListEntry } from '../../services/users';

interface Props {
  open: boolean;
  user: UserListEntry | null;
  onClose: () => void;
}

const LANGUAGES = ['en', 'fr', 'es'];
const REMINDER_FREQUENCIES = ['minimal', 'normal', 'extra'];

export function AdminUserEditModal({ open, user, onClose }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('en');
  const [reminderFrequency, setReminderFrequency] = useState('normal');
  const [timezone, setTimezone] = useState('America/Toronto');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [bonusAiTokens, setBonusAiTokens] = useState(0);
  const [bonusChatMessages, setBonusChatMessages] = useState(0);

  // Hydrate when opening. We re-read on every open so the modal
  // reflects the latest list data even if the user was edited
  // elsewhere.
  useEffect(() => {
    if (!open || !user) return;
    setName(user.name ?? '');
    setLanguage(user.language);
    setTimezone(user.timezone);
    // Reminder frequency and notifications aren't in the list payload;
    // default to safe values. The detail page has the real ones, but
    // re-fetching here is overkill — admin can always reopen for fresh.
    setReminderFrequency('normal');
    setNotificationsEnabled(false);
    setBonusAiTokens(user.bonusAiTokens ?? 0);
    setBonusChatMessages(user.bonusChatMessages ?? 0);
  }, [open, user]);

  const mutation = useMutation({
    mutationFn: (payload: UserEditPayload) => {
      if (!user) throw new Error('No user');
      return updateUserProfile(user.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      if (user) queryClient.invalidateQueries({ queryKey: ['admin-user', user.id] });
      onClose();
    },
  });

  if (!user) return null;

  return (
    <Dialog open={open} onClose={onClose} size="lg">
      <DialogTitle>Edit user</DialogTitle>
      <DialogBody>
        <div className="space-y-4">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Language">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                {LANGUAGES.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
              </select>
            </Field>
            <Field label="Reminder frequency">
              <select
                value={reminderFrequency}
                onChange={(e) => setReminderFrequency(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                {REMINDER_FREQUENCIES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Timezone">
            <input
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="America/Toronto"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </Field>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              className="rounded text-primary-500 focus:ring-primary-300"
            />
            <span className="text-sm text-neutral-700">Notifications enabled</span>
          </label>

          {/* ── Bonus AI tokens (admin grant) ─────────────────── */}
          <div className="pt-3 border-t border-neutral-100">
            <h3 className="text-sm font-bold text-neutral-700 mb-2">AI bonus grants</h3>
            <p className="text-xs text-neutral-500 mb-3">
              Stacked on top of the free monthly cap. Persist across months until consumed.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Bonus care plans (per pet)">
                <input
                  type="number"
                  min={0}
                  value={bonusAiTokens}
                  onChange={(e) => setBonusAiTokens(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </Field>
              <Field label="Bonus chat messages">
                <input
                  type="number"
                  min={0}
                  value={bonusChatMessages}
                  onChange={(e) => setBonusChatMessages(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </Field>
            </div>
          </div>

          {mutation.isError && (
            <p className="text-sm text-red-600">
              {(mutation.error as Error)?.message ?? 'Could not save.'}
            </p>
          )}
        </div>
      </DialogBody>
      <DialogActions>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button
          onClick={() => mutation.mutate({
            name: name.trim() || null,
            language,
            reminderFrequency,
            timezone,
            notificationsEnabled,
            bonusAiTokens,
            bonusChatMessages,
          })}
          loading={mutation.isPending}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-neutral-600 block mb-1.5">{label}</label>
      {children}
    </div>
  );
}
