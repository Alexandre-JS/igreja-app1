import React, { useState, useEffect, useRef } from 'react';
import { Area } from 'react-easy-crop';
import { Member, paroquiasPorRegiao } from '../types/member';
import { supabase } from '../services/supabase';
import { showFeedback } from '../services/feedback';
import { getCroppedImageBlob } from '../utils/cropImage';
import PhotoCropModal from './PhotoCropModal';
import './MemberForm.css';

interface MemberFormProps {
    onSubmit: (member: Partial<Member>) => void;
    onCancel?: () => void;
    initialData?: Partial<Member>;
}

const MemberForm: React.FC<MemberFormProps> = ({ onSubmit, onCancel, initialData = {} }) => {
    const [formData, setFormData] = useState<Partial<Member>>({});
    const [paroquias, setParoquias] = useState<string[]>([]);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Initialize form data from initialData once on mount, and when initialData changes
    useEffect(() => {
        setFormData(prevData => ({ ...prevData, ...initialData }));
    }, [initialData]);

    // Update paroquias when region changes
    useEffect(() => {
        if (formData.regiao && paroquiasPorRegiao[formData.regiao]) {
            setParoquias(paroquiasPorRegiao[formData.regiao]);
        } else {
            setParoquias([]);
        }
    }, [formData.regiao]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showFeedback('Selecione um ficheiro de imagem válido', 'warning');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showFeedback('A imagem deve ter no máximo 5MB', 'warning');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => setCropImageSrc(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleCropConfirm = async (cropArea: Area) => {
        if (!cropImageSrc) return;

        try {
            setIsUploadingPhoto(true);

            const blob = await getCroppedImageBlob(cropImageSrc, cropArea);
            const fileName = `${formData.id || crypto.randomUUID()}-${Date.now()}.jpg`;

            const { error: uploadError } = await supabase.storage
                .from('member-photos')
                .upload(fileName, blob, { upsert: true, contentType: 'image/jpeg' });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('member-photos').getPublicUrl(fileName);
            setFormData(prev => ({ ...prev, foto_url: data.publicUrl }));
            showFeedback('Foto carregada com sucesso', 'success');
        } catch (error) {
            console.error('[MemberForm] Erro ao enviar foto:', error);
            showFeedback('Erro ao enviar a foto. Tente novamente.', 'error');
        } finally {
            setIsUploadingPhoto(false);
            setCropImageSrc(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleCropCancel = () => {
        setCropImageSrc(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemovePhoto = () => {
        setFormData(prev => ({ ...prev, foto_url: undefined }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <form onSubmit={handleSubmit} className="member-form">
            {/* Foto do Membro */}
            <div className="form-section">
                <h3>Foto do Membro</h3>
                <div className="photo-upload-row">
                    <div className="photo-preview">
                        {formData.foto_url ? (
                            <img src={formData.foto_url} alt="Foto do membro" />
                        ) : (
                            <span className="photo-placeholder">Sem foto</span>
                        )}
                    </div>
                    <div className="photo-upload-actions">
                        <label className="photo-upload-btn">
                            {isUploadingPhoto ? 'Enviando...' : 'Escolher foto'}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                disabled={isUploadingPhoto}
                                hidden
                            />
                        </label>
                        {formData.foto_url && (
                            <button
                                type="button"
                                className="photo-remove-btn"
                                onClick={handleRemovePhoto}
                                disabled={isUploadingPhoto}
                            >
                                Remover foto
                            </button>
                        )}
                        <p className="step-hint">Formatos de imagem, até 5MB. Depois de escolher, ajuste o enquadramento da foto.</p>
                    </div>
                </div>
            </div>

            {/* Informações Pessoais */}
            <div className="form-section">
                <h3>Informações Pessoais</h3>
                <div className="form-row">
                    <div className="form-group required-field">
                        <label htmlFor="nome_completo">Nome Completo</label>
                        <input
                            type="text"
                            id="nome_completo"
                            name="nome_completo"
                            value={formData.nome_completo || ''}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Nome completo do membro"
                            required
                        />
                    </div>

                    <div className="form-group required-field">
                        <label htmlFor="data_nascimento">Data de Nascimento</label>
                        <input
                            type="date"
                            id="data_nascimento"
                            name="data_nascimento"
                            value={formData.data_nascimento || ''}
                            onChange={handleChange}
                            className="form-control"
                            required
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group required-field">
                        <label htmlFor="genero">Gênero</label>
                        <select
                            id="genero"
                            name="genero"
                            value={formData.genero || ''}
                            onChange={handleChange}
                            className="form-control"
                            required
                        >
                            <option value="">Selecione o gênero</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Feminino">Feminino</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="telefone">Telefone</label>
                        <input
                            type="tel"
                            id="telefone"
                            name="telefone"
                            value={formData.telefone || ''}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Digite o número de telefone"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email || ''}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Digite o email de contato"
                        />
                    </div>
                </div>
            </div>

            {/* Informações da Igreja */}
            <div className="form-section">
                <h3>Informações da Igreja</h3>
                <div className="form-row">
                    <div className="form-group required-field">
                        <label htmlFor="regiao">Região</label>
                        <select
                            id="regiao"
                            name="regiao"
                            value={formData.regiao || ''}
                            onChange={handleChange}
                            className="form-control"
                            required
                        >
                            <option value="">Selecione a região</option>
                            <option value="ESTE">ESTE</option>
                            <option value="OESTE">OESTE</option>
                            <option value="SUL">SUL</option>
                            <option value="SUDUESTE">SUDUESTE</option>
                            <option value="NORTE">NORTE</option>
                        </select>
                    </div>

                    <div className="form-group required-field">
                        <label htmlFor="paroquia">Paróquia</label>
                        <select
                            id="paroquia"
                            name="paroquia"
                            value={formData.paroquia || ''}
                            onChange={handleChange}
                            className="form-control"
                            disabled={!formData.regiao}
                            required
                        >
                            <option value="">Selecione a paróquia</option>
                            {paroquias.map(paroquia => (
                                <option key={paroquia} value={paroquia}>
                                    {paroquia}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group required-field">
                        <label htmlFor="funcao">Função</label>
                        <select
                            id="funcao"
                            name="funcao"
                            value={formData.funcao || ''}
                            onChange={handleChange}
                            className="form-control"
                            required
                        >
                            <option value="">Selecione a função</option>
                            <option value="Pastor">Pastor</option>
                            <option value="Evangelista">Evangelista</option>
                            <option value="Monitor">Monitor</option>
                            <option value="Membro Normal">Membro Normal</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="estado">Estado</label>
                        <select
                            id="estado"
                            name="estado"
                            value={formData.estado || ''}
                            onChange={handleChange}
                            className="form-control"
                        >
                            <option value="">Não informado</option>
                            <option value="Batizado">Batizado</option>
                            <option value="Confirmado">Confirmado</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="sociedade">Sociedade</label>
                        <select
                            id="sociedade"
                            name="sociedade"
                            value={formData.sociedade || ''}
                            onChange={handleChange}
                            className="form-control"
                        >
                            <option value="">Nenhuma</option>
                            <option value="Dominical">Dominical</option>
                            <option value="Jovens">Jovens</option>
                            <option value="SNF">SNF</option>
                            <option value="SHV">SHV</option>
                            <option value="SS">SS</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="form-actions">
                <button 
                    type="submit" 
                    className="submit-btn"
                >
                    {initialData && Object.keys(initialData).length > 0 ? 'Atualizar' : 'Cadastrar'}
                </button>
                
                {onCancel && (
                    <button
                        type="button"
                        className="cancel-btn form-cancel-btn"
                        onClick={onCancel}
                    >
                        Cancelar
                    </button>
                )}
            </div>

            {cropImageSrc && (
                <PhotoCropModal
                    imageSrc={cropImageSrc}
                    onConfirm={handleCropConfirm}
                    onCancel={handleCropCancel}
                    isSaving={isUploadingPhoto}
                />
            )}
        </form>
    );
};

export default MemberForm;