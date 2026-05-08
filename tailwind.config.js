/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores customizadas para o tema da igreja
        primary: {
          50: '#f8f9fc',
          100: '#eef2f9',
          200: '#d1d9f1',
          300: '#abb9e8',
          400: '#8499de',
          500: '#4e73df',
          600: '#3256bd',
          700: '#26418f',
          800: '#1a2c61',
          900: '#0d1630',
        },
        church: {
          gold: '#D4A574',
          darkblue: '#224abe',
          lightblue: '#4e73df',
          primary: '#4e73df',
          'primary-dark': '#224abe',
          secondary: '#858796',
          bg: '#ffffff',
        }
      },
      fontFamily: {
        'church': ['Merriweather', 'serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'gradient': 'gradient 15s ease infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { 
            transform: 'translateY(0px) rotate(0deg)',
            opacity: '0.5'
          },
          '50%': { 
            transform: 'translateY(-20px) rotate(180deg)',
            opacity: '0.8'
          }
        },
        glow: {
          '0%': { 
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' 
          },
          '100%': { 
            boxShadow: '0 0 30px rgba(147, 51, 234, 0.8)' 
          }
        },
        shimmer: {
          '0%': { 
            backgroundPosition: '-200% 0' 
          },
          '100%': { 
            backgroundPosition: '200% 0' 
          }
        },
        gradient: {
          '0%, 100%': {
            backgroundSize: '200% 200%',
            backgroundPosition: 'left center'
          },
          '50%': {
            backgroundSize: '200% 200%',
            backgroundPosition: 'right center'
          }
        }
      },
      // Adicionar utilitários de scroll personalizados
      height: {
        'dynamic-screen': 'calc(var(--vh, 1vh) * 100)',
      },
    },
  },
  variants: {
    extend: {
      // ...existing code...
    },
  },
  plugins: [
    // ...existing code...
    
    // Plugin para corrigir a altura da tela em dispositivos móveis
    function({ addBase }) {
      addBase({
        ':root': {
          '--vh': '1vh',
        }
      });
    },
  ],
  // Garantir que o Tailwind não sobrescreva nossos estilos de scroll
  corePlugins: {
    // ...existing code...
    container: false, // Desabilitar container do Tailwind se estiver causando problemas
  },
};
