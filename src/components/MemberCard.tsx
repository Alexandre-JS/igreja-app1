import React, { forwardRef, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Member } from '../types/member';
import './MemberCard.css';

interface MemberCardProps {
    member: Member;
}

const MemberCard = forwardRef<HTMLDivElement, MemberCardProps>(({ member }, ref) => {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

    useEffect(() => {
        const verifyUrl = `${window.location.origin}/verificar/${member.id}`;
        QRCode.toDataURL(verifyUrl, {
            width: 160,
            margin: 1,
            color: { dark: '#1a365d', light: '#ffffff' },
        })
            .then(setQrCodeUrl)
            .catch(err => console.error('Erro ao gerar QR code:', err));
    }, [member.id]);

    return (
        <div className="member-card" ref={ref}>
            <div className="member-card-header">
                <img src="/logoigreja.jpg" alt="Logo" className="member-card-logo" />
                <div className="member-card-org">
                    <strong>SNF</strong>
                    <span>Cartão de Membro</span>
                </div>
            </div>

            <div className="member-card-photo">
                {member.foto_url ? (
                    <img src={member.foto_url} alt={member.nome_completo} />
                ) : (
                    <span>{member.nome_completo.charAt(0).toUpperCase()}</span>
                )}
            </div>

            <h2 className="member-card-name">{member.nome_completo}</h2>
            <span className="member-card-role">{member.funcao}</span>

            <div className="member-card-details">
                <div className="member-card-detail-item">
                    <span className="member-card-label">Região</span>
                    <span className="member-card-value">{member.regiao}</span>
                </div>
                <div className="member-card-detail-item">
                    <span className="member-card-label">Paróquia</span>
                    <span className="member-card-value">{member.paroquia}</span>
                </div>
                {member.estado && (
                    <div className="member-card-detail-item">
                        <span className="member-card-label">Estado</span>
                        <span className="member-card-value">{member.estado}</span>
                    </div>
                )}
            </div>

            <div className="member-card-footer">
                {qrCodeUrl && (
                    <img src={qrCodeUrl} alt="QR Code de verificação" className="member-card-qr" />
                )}
                <p className="member-card-verify-text">Escaneie para verificar a autenticidade</p>
            </div>
        </div>
    );
});

export default MemberCard;
