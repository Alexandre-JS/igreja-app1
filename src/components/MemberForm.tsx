import React, { useState, useEffect } from 'react';
import { Member, paroquiasPorRegiao } from '../types/member';

interface MemberFormProps {
    onSubmit: (member: Partial<Member>) => void;
    onCancel?: () => void;
    initialData?: Partial<Member>;
}

const MemberForm: React.FC<MemberFormProps> = ({ onSubmit, onCancel, initialData = {} }) => {
    const [formData, setFormData] = useState<Partial<Member>>({});
    const [paroquias, setParoquias] = useState<string[]>([]);
    
    // Initialize form data from initialData once on mount, and when initialData changes
    useEffect(() => {
        setFormData(prevData => ({
            ...prevData,
            ...initialData
        }));
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

    return (
        <form onSubmit={handleSubmit} className="member-form">
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
        </form>
    );
};

export default MemberForm;