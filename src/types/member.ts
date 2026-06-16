export interface Member {
    id: string;
    nome_completo: string;
    data_nascimento: string;
    genero: 'Masculino' | 'Feminino';
    telefone?: string; // Added telefone property
    email?: string;
    regiao: 'ESTE' | 'OESTE' | 'SUL' | 'SUDUESTE' | 'NORTE';
    paroquia: string;
    funcao: 'Pastor' | 'Evangelista' | 'Monitor' | 'Membro Normal';
    sociedade?: 'Dominical' | 'Jovens' | 'SNF' | 'SHV' | 'SS';
    endereco?: string;
    estado?: 'Batizado' | 'Confirmado'; // Added estado property
    foto_url?: string;
    created_at?: string;
    updated_at?: string; // Make it optional since it might not exist for all members
}

// This might already exist in your file - if not, add it
export const paroquiasPorRegiao = {
    ESTE: ['Munhava', 'Esturro', 'Massange', 'Ampara', 'Nova Sofala ', 'Baixo Buzi', 'Alto Buzi', 'Nhamidji', 'Tica', 'Dondo', 'Chamba', 'Inhamudima', 'C. de Machiquiri', 'Gorongosa', 'Mafambisse'],
    SUL: ['Malhangalene', 'Costa do Sol', 'Magoanine'],
    OESTE: ['Bairro 4', 'Manica', 'Tete', 'Chimoio', 'Muzingazi', 'Gondola', 'Lazaro Vinho', 'C. de Catandica', 'C. de Magoe'],
    SUDUESTE: ['Mambone', 'Manchanga', 'Goi-Goi', 'Chibabava', 'Machazi', 'Chiloane'],
    NORTE: ['Caia', 'Mopeia', 'Quelimane', 'Chinde', 'C. Nampula', 'C. Morumbala', 'C. Chiure'],
};