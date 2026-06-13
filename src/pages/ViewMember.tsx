import React, { useEffect, useRef, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { supabase } from '../services/supabase';
import { Member } from '../types/member';
import { showFeedback } from '../services/feedback';
import MemberCard from '../components/MemberCard';
import './ViewMember.css';

// Spinner minimalista
const Spinner = () => <div className="spinner"></div>;

const ViewMember: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const history = useHistory();
    const [member, setMember] = useState<Member | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showCard, setShowCard] = useState(false);
    const [isGeneratingCard, setIsGeneratingCard] = useState(false);
    const [isSharingCard, setIsSharingCard] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchMember();
    }, [id]);

    const fetchMember = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('members')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                showFeedback('Erro ao carregar dados do membro', 'error');
                history.push('/app/members');
                return;
            }

            setMember(data);
        } catch (error) {
            showFeedback('Erro ao acessar o servidor', 'error');
            history.push('/app/members');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = () => {
        history.push(`/app/edit/${id}`);
    };

    const handleBack = () => {
        history.goBack();
    };

    const handleDownloadCard = async () => {
        if (!cardRef.current || !member) return;

        try {
            setIsGeneratingCard(true);
            const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });

            const link = document.createElement('a');
            link.download = `cartao-${member.nome_completo.trim().replace(/\s+/g, '_')}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Erro ao gerar cartão:', error);
            showFeedback('Erro ao gerar o cartão. Tente novamente.', 'error');
        } finally {
            setIsGeneratingCard(false);
        }
    };

    const handleShareCard = async () => {
        if (!cardRef.current || !member) return;

        const registerUrl = `${window.location.origin}/register`;
        const shareText = `Já estou cadastrado(a) na Sociedade da Nova Família da ICUM, e você do que está a esperar? Cadastre-se já: ${registerUrl}`;
        const fileName = `cartao-${member.nome_completo.trim().replace(/\s+/g, '_')}.png`;

        try {
            setIsSharingCard(true);
            const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], fileName, { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Cartão de Membro',
                    text: shareText,
                });
            } else if (navigator.share) {
                await navigator.share({
                    title: 'Cartão de Membro',
                    text: shareText,
                    url: registerUrl,
                });
            } else {
                await navigator.clipboard.writeText(shareText);
                const link = document.createElement('a');
                link.download = fileName;
                link.href = dataUrl;
                link.click();
                showFeedback('Mensagem copiada e cartão baixado. Agora é só partilhar!', 'success');
            }
        } catch (error) {
            if ((error as Error).name !== 'AbortError') {
                console.error('Erro ao partilhar cartão:', error);
                showFeedback('Erro ao partilhar o cartão. Tente novamente.', 'error');
            }
        } finally {
            setIsSharingCard(false);
        }
    };

    if (isLoading) {
        return (
            <div className="view-member-page scrollable-content">
                <div className="loading-overlay">
                    <Spinner />
                    <p>Carregando dados...</p>
                </div>
            </div>
        );
    }

    if (!member) {
        return (
            <div className="view-member-page scrollable-content">
                <div className="error-container">
                    <h2>Membro não encontrado</h2>
                    <p>O membro que você está tentando visualizar não foi encontrado.</p>
                    <button 
                        className="primary-button" 
                        onClick={() => history.push('/app/members')}
                    >
                        Voltar à Lista de Membros
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="view-member-page scrollable-content">
            <header className="page-header">
                <h1>Detalhes do Membro</h1>
                <div className="header-actions">
                    <button
                        onClick={() => setShowCard(true)}
                        className="card-btn"
                    >
                        Gerar Cartão
                    </button>
                    <button
                        onClick={handleEdit}
                        className="edit-btn"
                    >
                        Editar
                    </button>
                    <button
                        onClick={handleBack}
                        className="back-btn"
                    >
                        Voltar
                    </button>
                </div>
            </header>

            <main className="member-details">
                <div className="member-header">
                    <div className="member-avatar large">
                        {member.foto_url ? (
                            <img src={member.foto_url} alt={member.nome_completo} className="member-avatar-photo" />
                        ) : (
                            member.nome_completo.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="member-title">
                        <h2>{member.nome_completo}</h2>
                        <div className="member-subtitle">
                            <span className="tag">{member.funcao}</span>
                            <span className="tag">{member.regiao}</span>
                        </div>
                    </div>
                </div>

                <div className="details-section">
                    <h3>Informações Pessoais</h3>
                    <div className="details-grid">
                        <div className="detail-item">
                            <div className="detail-label">Data de Nascimento</div>
                            <div className="detail-value">
                                {new Date(member.data_nascimento).toLocaleDateString('pt-BR')}
                            </div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">Gênero</div>
                            <div className="detail-value">{member.genero}</div>
                        </div>
                        {member.telefone && (
                            <div className="detail-item">
                                <div className="detail-label">Telefone</div>
                                <div className="detail-value">{member.telefone}</div>
                            </div>
                        )}
                        {member.email && (
                            <div className="detail-item">
                                <div className="detail-label">Email</div>
                                <div className="detail-value">{member.email}</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="details-section">
                    <h3>Informações Eclesiásticas</h3>
                    <div className="details-grid">
                        <div className="detail-item">
                            <div className="detail-label">Região</div>
                            <div className="detail-value">{member.regiao}</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">Paróquia</div>
                            <div className="detail-value">{member.paroquia}</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">Função</div>
                            <div className="detail-value">{member.funcao}</div>
                        </div>
                        {member.estado && (
                            <div className="detail-item">
                                <div className="detail-label">Estado</div>
                                <div className="detail-value">{member.estado}</div>
                            </div>
                        )}
                        {member.sociedade && (
                            <div className="detail-item">
                                <div className="detail-label">Sociedade</div>
                                <div className="detail-value">{member.sociedade}</div>
                            </div>
                        )}
                    </div>
                </div>

                {member.endereco && (
                    <div className="details-section">
                        <h3>Endereço</h3>
                        <div className="details-grid">
                            <div className="detail-item full-width">
                                <div className="detail-label">Endereço Completo</div>
                                <div className="detail-value">{member.endereco}</div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="details-footer">
                    <p className="record-info">
                        Cadastrado em: {new Date(member.created_at || '').toLocaleDateString('pt-BR')}
                        {member.updated_at && member.updated_at !== member.created_at && (
                            <span> | Última atualização: {new Date(member.updated_at).toLocaleDateString('pt-BR')}</span>
                        )}
                    </p>
                </div>
            </main>

            {showCard && (
                <div className="card-modal-overlay" onClick={() => setShowCard(false)}>
                    <div className="card-modal-content" onClick={(e) => e.stopPropagation()}>
                        <MemberCard member={member} ref={cardRef} />

                        <div className="card-modal-actions">
                            <button
                                className="card-share-btn"
                                onClick={handleShareCard}
                                disabled={isSharingCard}
                            >
                                {isSharingCard ? 'Preparando...' : 'Partilhar'}
                            </button>
                            <button
                                className="card-download-btn"
                                onClick={handleDownloadCard}
                                disabled={isGeneratingCard}
                            >
                                {isGeneratingCard ? 'Gerando...' : 'Baixar Cartão'}
                            </button>
                            <button
                                className="card-close-btn"
                                onClick={() => setShowCard(false)}
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewMember;
