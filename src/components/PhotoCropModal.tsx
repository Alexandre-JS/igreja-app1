import React, { useCallback, useState } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import './PhotoCropModal.css';

interface PhotoCropModalProps {
    imageSrc: string;
    onConfirm: (cropArea: Area) => void;
    onCancel: () => void;
    isSaving?: boolean;
}

const PhotoCropModal: React.FC<PhotoCropModalProps> = ({ imageSrc, onConfirm, onCancel, isSaving = false }) => {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedArea, setCroppedArea] = useState<Area | null>(null);

    const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
        setCroppedArea(areaPixels);
    }, []);

    const handleConfirm = () => {
        if (croppedArea) onConfirm(croppedArea);
    };

    return (
        <div className="photo-crop-overlay">
            <div className="photo-crop-content">
                <h3>Ajustar foto</h3>
                <p className="photo-crop-hint">
                    Arraste para posicionar e use o zoom para enquadrar a parte mais importante da foto (rosto e meio corpo).
                </p>

                <div className="photo-crop-area">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                </div>

                <div className="photo-crop-zoom">
                    <label htmlFor="photo-crop-zoom-range">Zoom</label>
                    <input
                        id="photo-crop-zoom-range"
                        type="range"
                        min={1}
                        max={3}
                        step={0.1}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                    />
                </div>

                <div className="photo-crop-actions">
                    <button
                        type="button"
                        className="photo-crop-confirm-btn"
                        onClick={handleConfirm}
                        disabled={isSaving || !croppedArea}
                    >
                        {isSaving ? 'Enviando...' : 'Usar esta foto'}
                    </button>
                    <button
                        type="button"
                        className="photo-crop-cancel-btn"
                        onClick={onCancel}
                        disabled={isSaving}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PhotoCropModal;
