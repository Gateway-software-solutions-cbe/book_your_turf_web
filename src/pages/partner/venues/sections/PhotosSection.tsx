import React, { useRef } from "react";

interface Props {
  newImages: File[];
  existingImages: { id: number; url: string }[];
  onAdd: (files: File[]) => void;
  onRemoveNew: (idx: number) => void;
  onRemoveExisting: (id: number) => void;
}

const MAX = 5;

const PhotosSection: React.FC<Props> = ({
  newImages,
  existingImages,
  onAdd,
  onRemoveNew,
  onRemoveExisting,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const total = newImages.length + existingImages.length;

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = MAX - total;
    onAdd(files.slice(0, remaining));
    e.target.value = "";
  };

  return (
    <section className="pt-form-section">
      <header className="pt-form-section-header">
        <span className="pt-form-section-icon">📷</span>
        <div>
          <h3>Venue Photos</h3>
          <p>Add up to {MAX} photos</p>
        </div>
      </header>

      <div className="pt-photos-grid">
        {existingImages.map((img) => (
          <div key={`e-${img.id}`} className="pt-photo-tile">
            <img src={img.url} alt="venue" />
            <button
              type="button"
              className="pt-photo-remove"
              onClick={() => onRemoveExisting(img.id)}
              aria-label="Remove"
            >
              ✕
            </button>
          </div>
        ))}

        {newImages.map((file, idx) => (
          <div key={`n-${idx}`} className="pt-photo-tile">
            <img src={URL.createObjectURL(file)} alt="new" />
            <button
              type="button"
              className="pt-photo-remove"
              onClick={() => onRemoveNew(idx)}
              aria-label="Remove"
            >
              ✕
            </button>
          </div>
        ))}

        {total < MAX && (
          <button
            type="button"
            className="pt-photo-add"
            onClick={() => inputRef.current?.click()}
          >
            <span className="pt-photo-add-icon">+</span>
            <span>Add Photo</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handlePick}
      />

      <div className="pt-photos-hint">
        ⓘ Add at least 1 photo to continue
      </div>
    </section>
  );
};

export default PhotosSection;