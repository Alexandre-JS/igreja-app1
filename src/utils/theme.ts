// =============================================
// Gestor de tema (claro / escuro / sistema)
//
// - A escolha do utilizador é guardada em localStorage.
// - Por defeito (sem escolha guardada) segue o tema do sistema
//   operativo (prefers-color-scheme) e reage a mudanças em tempo real.
// - O tema efetivo é aplicado como atributo `data-theme` no <html>,
//   que o CSS em src/theme/variables.css usa para trocar os tokens.
// =============================================

export type ThemeChoice = 'light' | 'dark' | 'system';
export type EffectiveTheme = 'light' | 'dark';

const STORAGE_KEY = 'ekklesia-theme';

const media = () =>
    typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null;

export const systemPrefersDark = (): boolean => !!media()?.matches;

export const getThemeChoice = (): ThemeChoice => {
    const stored = (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY)) as ThemeChoice | null;
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
};

const resolveEffective = (choice: ThemeChoice): EffectiveTheme =>
    choice === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : choice;

const applyEffective = (effective: EffectiveTheme): void => {
    if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', effective);
    }
};

export const getEffectiveTheme = (): EffectiveTheme => resolveEffective(getThemeChoice());

/** Guarda a escolha, aplica-a e devolve o tema efetivo resultante. */
export const setThemeChoice = (choice: ThemeChoice): EffectiveTheme => {
    try {
        localStorage.setItem(STORAGE_KEY, choice);
    } catch {
        /* localStorage indisponível (modo privado) — aplica na mesma */
    }
    const effective = resolveEffective(choice);
    applyEffective(effective);
    return effective;
};

/** Alterna entre claro e escuro, fixando a escolha explicitamente. */
export const toggleTheme = (): EffectiveTheme =>
    setThemeChoice(getEffectiveTheme() === 'dark' ? 'light' : 'dark');

/**
 * Inicializa o tema. Deve ser chamado o mais cedo possível (main.tsx).
 * Devolve uma função para remover o listener do sistema, se necessário.
 */
export const initTheme = (): (() => void) => {
    applyEffective(getEffectiveTheme());

    const m = media();
    if (!m) return () => {};

    const onSystemChange = () => {
        // Só seguir o sistema quando o utilizador não fixou uma escolha.
        if (getThemeChoice() === 'system') {
            applyEffective(systemPrefersDark() ? 'dark' : 'light');
        }
    };

    m.addEventListener('change', onSystemChange);
    return () => m.removeEventListener('change', onSystemChange);
};
