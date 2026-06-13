export interface SupabaseError {
    code: string;
    message: string;
    details?: string | null;
}

export const getErrorMessage = (error: SupabaseError): string => {
    const errorMessages: Record<string, string> = {
        '23502': 'Campo obrigatório não preenchido',
        '23505': 'Já existe um membro registado com este nome e data de nascimento',
        '42501': 'Sem permissão para realizar esta ação. A sua conta pode não estar configurada como administrador no servidor.',
        'PGRST301': 'Sem permissão para realizar esta ação',
        'default': 'Ocorreu um erro inesperado'
    };

    const fieldErrors: Record<string, string> = {
        'data_nascimento': 'Data de Nascimento',
        'nome_completo': 'Nome Completo',
        'genero': 'Gênero',
        'regiao': 'Região',
        'paroquia': 'Paróquia'
    };

    if (error.code === '23502') {
        const field = error.message.match(/column "([^"]+)"/)?.[1];
        const fieldName = field ? fieldErrors[field] || field : 'desconhecido';
        return `Campo "${fieldName}" é obrigatório`;
    }

    return errorMessages[error.code] || errorMessages.default;
};

// Traduz mensagens de erro da autenticação do Supabase (signUp, signIn, etc.)
// para mensagens amigáveis em português.
export const getAuthErrorMessage = (error: { message?: string } | Error | unknown): string => {
    const message = (error as { message?: string })?.message || '';

    const patterns: Array<[RegExp, string]> = [
        [/invalid login credentials/i, 'Email ou senha incorretos'],
        [/email not confirmed/i, 'Email ainda não confirmado. Verifique a caixa de entrada (e o spam) e clique no link de confirmação.'],
        [/already registered|already exists/i, 'Já existe uma conta registada com este email'],
        [/password should be at least/i, 'A senha deve ter pelo menos 6 caracteres'],
        [/unable to validate email address|invalid.*email/i, 'O formato do email é inválido'],
        [/email rate limit exceeded/i, 'Limite de envio de emails atingido. Aguarde alguns minutos e tente novamente.'],
        [/for security purposes.*after \d+ seconds/i, 'Aguarde alguns segundos antes de tentar novamente'],
        [/user not found/i, 'Utilizador não encontrado'],
        [/network|fetch/i, 'Erro de conexão. Verifique a sua internet e tente novamente.'],
    ];

    for (const [pattern, friendly] of patterns) {
        if (pattern.test(message)) return friendly;
    }

    return message || 'Ocorreu um erro inesperado. Tente novamente.';
};