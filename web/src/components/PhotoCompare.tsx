import { useEffect, useRef, useState } from 'react';
import { Camera, Check, ImagePlus, Sun, TriangleAlert } from 'lucide-react';
import { Btn, Chip, Field, Modal, Select, Spinner, Textarea } from './ui';
import { cn } from '../lib/utils';

const ANGLES = [
  { id: 'crown', label: 'Crown / top' },
  { id: 'front', label: 'Hairline / front' },
  { id: 'temple', label: 'Temple (left or right)' },
  { id: 'beard', label: 'Beard / cheeks' },
  { id: 'skin', label: 'Skin / face' }
];

const readAsImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });

const compress = async (file: File) => {
  const img = await readAsImage(file);
  const maxW = 900;
  const maxH = 1200;
  const scale = Math.min(1, maxW / img.width, maxH / img.height);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);

  // Lighting check: average luminance of the centre third (where the scalp is).
  const sample = ctx.getImageData(Math.round(w * 0.2), Math.round(h * 0.12), Math.round(w * 0.6), Math.round(h * 0.5));
  let sum = 0;
  for (let i = 0; i < sample.data.length; i += 4) {
    sum += 0.2126 * sample.data[i] + 0.7152 * sample.data[i + 1] + 0.0722 * sample.data[i + 2];
  }
  const brightness = Math.round(sum / (sample.data.length / 4));
  return { dataUrl: canvas.toDataURL('image/jpeg', 0.82), brightness };
};

const lightLabel = (b: number | null) => {
  if (b == null) return { label: 'Not checked', tone: 'default' as const };
  if (b < 55) return { label: 'Too dark — move to daylight', tone: 'danger' as const };
  if (b < 85) return { label: 'Low light — open a curtain', tone: 'warn' as const };
  if (b > 215) return { label: 'Overexposed — no flash', tone: 'warn' as const };
  return { label: 'Good light', tone: 'lime' as const };
};

export const PhotoCapture = ({
  open,
  onClose,
  onSaved,
  week
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  week?: number;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [brightness, setBrightness] = useState<number | null>(null);
  const [angle, setAngle] = useState('crown');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setDataUrl(null);
      setBrightness(null);
      setNotes('');
      setError(null);
    }
  }, [open]);

  const pick = async (file?: File | null) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const out = await compress(file);
      setDataUrl(out.dataUrl);
      setBrightness(out.brightness);
    } catch {
      setError('That file could not be read. Try a JPG or PNG.');
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!dataUrl) return;
    setSaving(true);
    try {
      const { api } = await import('../lib/api');
      await api.post('/app/photos', { dataUrl, angle, notes, lighting: brightness });
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Could not save the photo.');
    } finally {
      setSaving(false);
    }
  };

  const light = lightLabel(brightness);

  return (
    <Modal open={open} onClose={onClose} title="Standardised photo" width="max-w-xl">
      <p className="-mt-2 mb-4 text-[12.5px] leading-relaxed text-muted">
        The comparison only works if nothing changes except time. Same room, same light, dry hair, same distance.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />

      {!dataUrl ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="group relative flex aspect-[4/5] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink/20 bg-[linear-gradient(180deg,#f0ede4,#e8e4d8)] transition hover:border-ink/40"
        >
          <div className="absolute inset-6 rounded-[46%] border border-dashed border-ink/15" />
          <div className="absolute left-2 top-2 h-5 w-5 border-l-2 border-t-2 border-ink/25" />
          <div className="absolute right-2 top-2 h-5 w-5 border-r-2 border-t-2 border-ink/25" />
          <div className="absolute bottom-2 left-2 h-5 w-5 border-b-2 border-l-2 border-ink/25" />
          <div className="absolute bottom-2 right-2 h-5 w-5 border-b-2 border-r-2 border-ink/25" />
          {busy ? (
            <Spinner className="h-6 w-6" />
          ) : (
            <>
              <span className="grid h-12 w-12 place-items-center rounded-full bg-ink text-lime">
                <Camera className="h-5 w-5" />
              </span>
              <span className="text-[13px] font-medium">Take or upload a photo</span>
              <span className="text-[11px] text-muted">Align the target area inside the oval</span>
            </>
          )}
        </button>
      ) : (
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-ink">
          <img src={dataUrl} alt="Preview" className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-6 rounded-[46%] border border-lime/40" />
          <div className="absolute left-3 top-3 flex gap-2">
            <Chip tone="ink">Week {week ?? '—'}</Chip>
            <span className="rounded-full bg-ink/70 px-2.5 py-1 text-[10.5px] font-medium text-paper backdrop-blur">
              {ANGLES.find((a) => a.id === angle)?.label}
            </span>
          </div>
          <button
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-3 right-3 rounded-full bg-paper/90 px-3 py-1.5 text-[11px] font-medium backdrop-blur"
          >
            Retake
          </button>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label="Angle">
          <Select value={angle} onChange={(e) => setAngle(e.target.value)}>
            {ANGLES.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Lighting check">
          <div
            className={cn(
              'flex h-[42px] items-center gap-2 rounded-xl border px-3 text-[12px]',
              light.tone === 'lime' && 'border-forest/25 bg-forest/5 text-forest',
              light.tone === 'warn' && 'border-amber/30 bg-amber/5 text-amber',
              light.tone === 'danger' && 'border-danger/30 bg-danger/5 text-danger',
              light.tone === 'default' && 'border-line text-muted'
            )}
          >
            {light.tone === 'danger' || light.tone === 'warn' ? <TriangleAlert className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            {light.label}
            {brightness != null && <span className="ml-auto font-mono text-[10px] opacity-60">{brightness}</span>}
          </div>
        </Field>
      </div>

      <Field label="Note (optional)" className="mt-3">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Bathroom light, dry hair, day after wash."
          className="min-h-[64px]"
        />
      </Field>

      {error && <p className="mt-3 text-[12px] text-danger">{error}</p>}

      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-[11px] text-muted">Stored privately. Only your coach sees it.</span>
        <div className="flex gap-2">
          <Btn variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Btn>
          <Btn variant="primary" size="sm" onClick={save} loading={saving} disabled={!dataUrl} icon={<Check className="h-3.5 w-3.5" />}>
            Save to timeline
          </Btn>
        </div>
      </div>
    </Modal>
  );
};

export const CompareSlider = ({
  before,
  after,
  labelBefore,
  labelAfter
}: {
  before: string;
  after: string;
  labelBefore?: string;
  labelAfter?: string;
}) => {
  const [pos, setPos] = useState(50);
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-ink sm:aspect-[5/4]">
      <img src={after} alt="After" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={before} alt="Before" className="h-full w-full object-cover" />
      </div>
      <div className="absolute inset-y-0 w-px bg-lime" style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-lime bg-ink/80 backdrop-blur">
          <span className="text-[9px] font-semibold tracking-wider text-lime">⇆</span>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        aria-label="Compare before and after"
      />
      <span className="absolute bottom-3 left-3 rounded-full bg-ink/70 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-paper backdrop-blur">
        {labelBefore || 'Before'}
      </span>
      <span className="absolute bottom-3 right-3 rounded-full bg-lime px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-ink">
        {labelAfter || 'After'}
      </span>
    </div>
  );
};

export const PhotoPlaceholder = ({ onAdd }: { onAdd: () => void }) => (
  <button
    onClick={onAdd}
    className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-white/40 text-muted transition hover:border-ink/25 hover:text-ink"
  >
    <ImagePlus className="h-5 w-5" />
    <span className="text-[11.5px]">Add the first photo</span>
  </button>
);
