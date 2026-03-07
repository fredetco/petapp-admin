import { SAMPLE_PETS, type TestPetData } from '../../services/promptTesting';

interface SamplePetSelectorProps {
  value: TestPetData;
  onChange: (pet: TestPetData) => void;
}

export function SamplePetSelector({ value, onChange }: SamplePetSelectorProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-600 mb-1">Test Pet</label>
      <select
        value={value.name}
        onChange={(e) => {
          const pet = SAMPLE_PETS.find(p => p.name === e.target.value);
          if (pet) onChange(pet);
        }}
        className="w-full rounded-lg border-neutral-300 text-sm focus:border-admin-accent-500 focus:ring-admin-accent-500"
      >
        {SAMPLE_PETS.map(pet => (
          <option key={pet.name} value={pet.name}>
            {pet.name} — {pet.breed} — {pet.age} — {pet.city}
          </option>
        ))}
      </select>
    </div>
  );
}
