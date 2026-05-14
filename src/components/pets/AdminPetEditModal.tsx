import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogTitle, DialogBody, DialogActions } from '../catalyst/dialog';
import { Button } from '../shared/Button';
import { updatePet, type PetEditPayload, type AdminPetRow } from '../../services/admin-pets';

interface Props {
  open: boolean;
  pet: AdminPetRow | null;
  onClose: () => void;
}

const SEX_OPTIONS = ['male', 'female', 'unknown'];

export function AdminPetEditModal({ open, pet, onClose }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [sex, setSex] = useState('unknown');
  const [color, setColor] = useState('');
  const [microchipId, setMicrochipId] = useState('');
  const [isNeutered, setIsNeutered] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState('');

  useEffect(() => {
    if (!open || !pet) return;
    setName(pet.name);
    setSpecies(pet.species);
    setBreed(pet.breed);
    setSex(pet.sex);
    // Color / microchip / neutered / DOB aren't in the list payload —
    // admin can still fill them in here; they'll write through to DB.
    setColor('');
    setMicrochipId('');
    setIsNeutered(false);
    setDateOfBirth('');
  }, [open, pet]);

  const mutation = useMutation({
    mutationFn: (payload: PetEditPayload) => {
      if (!pet) throw new Error('No pet');
      return updatePet(pet.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pets-species'] });
      onClose();
    },
  });

  if (!pet) return null;

  return (
    <Dialog open={open} onClose={onClose} size="lg">
      <DialogTitle>Edit pet — {pet.passportId}</DialogTitle>
      <DialogBody>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </Field>
            <Field label="Species">
              <input
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Breed">
              <input
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </Field>
            <Field label="Sex">
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                {SEX_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Color">
              <input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </Field>
            <Field label="Microchip ID">
              <input
                value={microchipId}
                onChange={(e) => setMicrochipId(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </Field>
          </div>

          <Field label="Date of birth">
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </Field>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isNeutered}
              onChange={(e) => setIsNeutered(e.target.checked)}
              className="rounded text-primary-500 focus:ring-primary-300"
            />
            <span className="text-sm text-neutral-700">Neutered / spayed</span>
          </label>

          {mutation.isError && (
            <p className="text-sm text-red-600">{(mutation.error as Error)?.message ?? 'Could not save.'}</p>
          )}
        </div>
      </DialogBody>
      <DialogActions>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button
          onClick={() => mutation.mutate({
            name: name.trim(),
            species: species.trim(),
            breed: breed.trim(),
            sex,
            color: color.trim() || null,
            microchipId: microchipId.trim() || null,
            isNeutered,
            dateOfBirth: dateOfBirth || null,
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
