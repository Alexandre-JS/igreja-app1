import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { IonIcon } from '@ionic/react';
import { checkmarkCircleOutline, alertCircleOutline } from 'ionicons/icons';
import { supabase } from '../services/supabase';
import './PublicVerify.css';

interface PublicCard {
    nome_completo: string;
    funcao: string;
    regiao: string;
    paroquia: string;
    estado: string | null;
    foto_url: string | null;
}

const PublicVerify: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [card, setCard] = useState<PublicCard | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const fetchCard = async () => {
            try {
                setIsLoading(true);
                const { data, error } = await supabase.rpc('get_member_public_card', { p_id: id });

                if (error || !data || data.length === 0) {
                    setNotFound(true);
                    return;
                }

                setCard(data[0]);
            } catch (error) {
                console.error('Erro ao verificar membro:', error);
                setNotFound(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCard();
    }, [id]);

    return (
        <div className="verify-page">
            <div className="verify-header">
                <img src="/logoigreja.jpg" alt="Logo" className="verify-logo-img" />
                <span className="verify-logo">ICUM / SNF</span>
            </div>

            <div className="verify-content">
                {isLoading && (
                    <div className="verify-card">
                        <p>Verificando...</p>
                    </div>
                )}

                {!isLoading && notFound && (
                    <div className="verify-card verify-invalid">
                        <IonIcon icon={alertCircleOutline} className="verify-icon" />
                        <h2>Registo não encontrado</h2>
                        <p>Não foi possível confirmar este cartão. Verifique se o código está correto.</p>
                    </div>
                )}

                {!isLoading && card && (
                    <div className="verify-card verify-valid">
                        <IonIcon icon={checkmarkCircleOutline} className="verify-icon" />

                        <div className="verify-photo">
                            {card.foto_url ? (
                                <img src={card.foto_url} alt={card.nome_completo} />
                            ) : (
                                <span>{card.nome_completo.charAt(0).toUpperCase()}</span>
                            )}
                        </div>

                        <h2>{card.nome_completo}</h2>
                        <p className="verify-subtitle">Membro confirmado da ICUM / SNF</p>

                        <div className="verify-details">
                            <div className="verify-detail-item">
                                <span className="verify-label">Função</span>
                                <span className="verify-value">{card.funcao}</span>
                            </div>
                            <div className="verify-detail-item">
                                <span className="verify-label">Região</span>
                                <span className="verify-value">{card.regiao}</span>
                            </div>
                            <div className="verify-detail-item">
                                <span className="verify-label">Paróquia</span>
                                <span className="verify-value">{card.paroquia}</span>
                            </div>
                            {card.estado && (
                                <div className="verify-detail-item">
                                    <span className="verify-label">Estado</span>
                                    <span className="verify-value">{card.estado}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicVerify;
