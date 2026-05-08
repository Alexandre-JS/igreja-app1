import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router';
import { supabase } from '../services/supabase';
import { Member } from '../types/member';
import { showFeedback } from '../services/feedback';
import './Home.css';

// Componente simples de spinner
const Spinner = ({ message }: { message: string }) => (
  <div className="loading-overlay">
    <div className="spinner"></div>
    <p>{message}</p>
  </div>
);


// Cores para o gráfico de regiões
const regionColors = [
  '#4e73df', // Azul
  '#3ec170', // Verde
  '#ff9a2f', // Laranja
  '#f53d3d', // Vermelho
  '#7044ff'  // Roxo
];

// Interface para estatísticas de dashboard
interface DashboardStats {
  total: number;
  masculino: number;
  feminino: number;
  recentMembers: Member[];
  regioes: Record<string, number>;
  sociedades: Record<string, number>;
  funcoes: Record<string, number>;
  paroquias: Record<string, number>;
  idadeDistribuicao: Record<string, number>;
  tendencia: {
    ultimoMes: number;
    penultimoMes: number;
    percentualCrescimento: number;
  };
  atividade: {
    adicionados: number;
    editados: number;
    removidos: number;
  };
}

// Componente de tendência com seta indicadora
const TrendIndicator = ({ value }: { value: number }) => {
  if (value === 0) return <span className="trend-neutral">⟷ Estável</span>;
  if (value > 0) return <span className="trend-up">↑ +{value}%</span>;
  return <span className="trend-down">↓ {value}%</span>;
};

const Home: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    masculino: 0,
    feminino: 0,
    recentMembers: [],
    regioes: {},
    sociedades: {},
    funcoes: {},
    paroquias: {},
    idadeDistribuicao: {},
    tendencia: {
      ultimoMes: 0,
      penultimoMes: 0,
      percentualCrescimento: 0,
    },
    atividade: {
      adicionados: 0,
      editados: 0,
      removidos: 0
    }
  });
  const [userName, setUserName] = useState<string>('');
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const [timeFrame, setTimeFrame] = useState<'week'|'month'|'year'>('month');
  const history = useHistory();
  
  useEffect(() => {
    fetchDashboardData();
    getCurrentUser();
    
    // Esconder a mensagem de boas-vindas após 5 segundos
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Usar o email ou metadados personalizados para obter o nome
        setUserName(user.email || 'usuário');
      }
    } catch (error) {
      console.error('Erro ao obter usuário:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Obter contagem total de membros
      const { count: totalCount, error: countError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      
      // Obter dados detalhados dos membros para análises avançadas
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*');
      
      if (membersError) throw membersError;
      
      const membersArray = membersData || [];
      
      // Contagem por gênero
      const masculino = membersArray.filter(m => m.genero === 'Masculino').length;
      const feminino = membersArray.filter(m => m.genero === 'Feminino').length;
      
      // Distribuição por região
      const regioes = membersArray.reduce((acc, member) => {
        if (member.regiao) {
          acc[member.regiao] = (acc[member.regiao] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      // Distribuição por sociedades
      const sociedades = membersArray.reduce((acc, member) => {
        if (member.sociedade) {
          acc[member.sociedade] = (acc[member.sociedade] || 0) + 1;
        } else {
          acc['Sem sociedade'] = (acc['Sem sociedade'] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      // Distribuição por funções
      const funcoes = membersArray.reduce((acc, member) => {
        if (member.funcao) {
          acc[member.funcao] = (acc[member.funcao] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      // Distribuição por paróquias
      const paroquias = membersArray.reduce((acc, member) => {
        if (member.paroquia) {
          acc[member.paroquia] = (acc[member.paroquia] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      // Distribuição por faixa etária (se houver campo de data_nascimento)
      const idadeDistribuicao = membersArray.reduce((acc, member) => {
        if (member.data_nascimento) {
          const idade = calcularIdade(member.data_nascimento);
          let faixa = '';
          
          if (idade <= 18) faixa = '0-18';
          else if (idade <= 30) faixa = '19-30';
          else if (idade <= 45) faixa = '31-45';
          else if (idade <= 60) faixa = '46-60';
          else faixa = '60+';
          
          acc[faixa] = (acc[faixa] || 0) + 1;
        } else {
          acc['Não informado'] = (acc['Não informado'] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      // Calcular tendência de crescimento
      const hoje = new Date();
      const umMesAtras = new Date();
      umMesAtras.setMonth(hoje.getMonth() - 1);
      
      const doisMesesAtras = new Date();
      doisMesesAtras.setMonth(hoje.getMonth() - 2);
      
      // Formato ISO para as datas
      const umMesAtrasISO = umMesAtras.toISOString();
      const doisMesesAtrasISO = doisMesesAtras.toISOString();
      
      // Contagem de membros adicionados no último mês
      const { count: ultimoMesCount, error: ultMesError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', umMesAtrasISO);
      
      if (ultMesError) throw ultMesError;
      
      // Contagem de membros adicionados no penúltimo mês
      const { count: penultimoMesCount, error: penultimoError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', doisMesesAtrasISO)
        .lt('created_at', umMesAtrasISO);
        
      if (penultimoError) throw penultimoError;
      
      // Calcular percentual de crescimento
      const ultimoMes = ultimoMesCount || 0;
      const penultimoMes = penultimoMesCount || 0;
      
      const percentualCrescimento = penultimoMes === 0 ? 
        ultimoMes > 0 ? 100 : 0 :
        Math.round(((ultimoMes - penultimoMes) / penultimoMes) * 100);
      
      // Atividade no sistema
      // Idealmente seria obtido de uma tabela de logs de atividade,
      // aqui usamos contagens aproximadas com base no timestamp updated_at
      
      const umSemanaAtras = new Date();
      umSemanaAtras.setDate(hoje.getDate() - 7);
      const umSemanaAtrasISO = umSemanaAtras.toISOString();
      
      const { count: ativCount, error: ativError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', umSemanaAtrasISO);
        
      if (ativError) throw ativError;
      
      // Obter membros recentes para o card de atividade
      const { data: recentData, error: recentError } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (recentError) throw recentError;
      
      setStats({
        total: totalCount || 0,
        masculino,
        feminino,
        recentMembers: recentData || [],
        regioes,
        sociedades,
        funcoes,
        paroquias,
        idadeDistribuicao,
        tendencia: {
          ultimoMes,
          penultimoMes,
          percentualCrescimento
        },
        atividade: {
          adicionados: ultimoMes,
          editados: (ativCount || 0) - (ultimoMes || 0),
          removidos: 0 // Idealmente seria obtido de uma tabela de logs
        }
      });
      
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      showFeedback('Erro ao carregar estatísticas', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para calcular idade a partir da data de nascimento
  const calcularIdade = (dataNascimento: string): number => {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    
    return idade;
  };

  // Calcular percentual por gênero
  const malePercent = stats.total > 0 ? Math.round((stats.masculino / stats.total) * 100) : 0;
  const femalePercent = stats.total > 0 ? Math.round((stats.feminino / stats.total) * 100) : 0;
  
  // Obter as três maiores regiões
  const topRegions = Object.entries(stats.regioes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);
  
  // Obter as principais sociedades
  const topSociedades = Object.entries(stats.sociedades)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);
    
  // Função para alternar período de tempo
  const handleTimeFrameChange = (frame: 'week'|'month'|'year') => {
    setTimeFrame(frame);
    // Aqui poderia recarregar os dados com base no período selecionado
  };

  return (
    <div className="dashboard-page scrollable-content">
      {isLoading && <Spinner message="Carregando estatísticas..." />}
      
      {/* Mensagem de boas-vindas temporária */}
      {showWelcome && userName && (
        <div className="welcome-message">
          <div className="welcome-content">
            <h2>Bem-vindo(a) ao Ekklesia, {userName.split('@')[0]}!</h2>
            <p>Sistema de gestão ICUM/SNF</p>
          </div>
        </div>
      )}
      
      <header className="page-header">
        <h1>Ekklesia - Dashboard</h1>
        <div className="header-actions">
          <div className="time-frame-selector">
            <button 
              className={`time-btn ${timeFrame === 'week' ? 'active' : ''}`}
              onClick={() => handleTimeFrameChange('week')}
            >
              Semana
            </button>
            <button 
              className={`time-btn ${timeFrame === 'month' ? 'active' : ''}`}
              onClick={() => handleTimeFrameChange('month')}
            >
              Mês
            </button>
            <button 
              className={`time-btn ${timeFrame === 'year' ? 'active' : ''}`}
              onClick={() => handleTimeFrameChange('year')}
            >
              Ano
            </button>
          </div>
          <button 
            className="refresh-button" 
            onClick={fetchDashboardData} 
            title="Atualizar dados"
          >
            ↻ Atualizar
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        {/* Cartões de métricas principais */}
        <section className="metrics-overview">
          <div className="metrics-grid">
            <div className="metric-card total-card">
              <div className="metric-header">
                <h3>Total de Membros</h3>
                <div className="metric-trend">
                  <TrendIndicator value={stats.tendencia.percentualCrescimento} />
                </div>
              </div>
              <div className="metric-value">{stats.total}</div>
              <div className="metric-footer">
                <span>+{stats.tendencia.ultimoMes} no último mês</span>
              </div>
            </div>

            <div className="metric-card male-card">
              <div className="metric-header">
                <h3>Homens</h3>
              </div>
              <div className="metric-value">{stats.masculino}</div>
              <div className="metric-footer">
                <span>{malePercent}% do total</span>
              </div>
            </div>

            <div className="metric-card female-card">
              <div className="metric-header">
                <h3>Mulheres</h3>
              </div>
              <div className="metric-value">{stats.feminino}</div>
              <div className="metric-footer">
                <span>{femalePercent}% do total</span>
              </div>
            </div>

            <div className="metric-card activity-card">
              <div className="metric-header">
                <h3>Atividade Recente</h3>
              </div>
              <div className="metric-activity">
                <div className="activity-metric">
                  <span className="activity-value">{stats.atividade.adicionados}</span>
                  <span className="activity-label">Adicionados</span>
                </div>
                <div className="activity-metric">
                  <span className="activity-value">{stats.atividade.editados}</span>
                  <span className="activity-label">Atualizados</span>
                </div>
              </div>
              <div className="metric-footer">
                <button 
                  className="view-all-link"
                  onClick={() => history.push('/app/members')}
                >
                  Ver todos os registros →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Gráficos analíticos */}
        <section className="analytics-section">
          <div className="analytics-grid">
            {/* Gráfico de distribuição por gênero */}
            <div className="analytics-card gender-chart">
              <h3 className="analytics-title">Distribuição por Gênero</h3>
              <div className="pie-chart-wrapper">
                <div 
                  className="pie-chart" 
                  style={{
                    background: stats.total > 0 
                      ? `conic-gradient(
                          #4e73df 0% ${malePercent}%,
                          #ff6b9a ${malePercent}% 100%
                        )`
                      : '#f0f0f0'
                  }}
                >
                  {stats.total === 0 && <span className="no-data">Sem dados</span>}
                </div>
                
                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="legend-color" style={{backgroundColor: '#4e73df'}}></span>
                    <span className="legend-label">Masculino</span>
                    <span className="legend-value">{stats.masculino} ({malePercent}%)</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{backgroundColor: '#ff6b9a'}}></span>
                    <span className="legend-label">Feminino</span>
                    <span className="legend-value">{stats.feminino} ({femalePercent}%)</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Gráfico de distribuição por região */}
            <div className="analytics-card region-chart">
              <h3 className="analytics-title">Distribuição por Região</h3>
              <div className="horizontal-chart">
                {Object.entries(stats.regioes)
                  .sort(([, a], [, b]) => b - a)
                  .map(([regiao, count], index) => {
                    const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                    return (
                      <div className="chart-row" key={regiao}>
                        <div className="chart-label">
                          <span className="region-name">{regiao}</span>
                        </div>
                        <div className="chart-bar-container">
                          <div 
                            className="chart-bar" 
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: regionColors[index % regionColors.length]
                            }}
                          >
                            <span className="chart-value">{count}</span>
                          </div>
                        </div>
                        <div className="chart-percent">{Math.round(percentage)}%</div>
                      </div>
                    );
                  })
                }
              </div>
            </div>
            
            {/* Nova tabela de distribuição por sociedades */}
            <div className="analytics-card sociedades-chart">
              <h3 className="analytics-title">Distribuição por Sociedades</h3>
              <div className="distribution-table">
                <table>
                  <thead>
                    <tr>
                      <th>Sociedade</th>
                      <th>Membros</th>
                      <th>Percentual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(stats.sociedades)
                      .sort(([, a], [, b]) => b - a)
                      .map(([sociedade, count]) => {
                        const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                        return (
                          <tr key={sociedade}>
                            <td>{sociedade}</td>
                            <td>{count}</td>
                            <td>{Math.round(percentage)}%</td>
                          </tr>
                        );
                      })
                    }
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Nova tabela de distribuição por funções */}
            <div className="analytics-card funcoes-chart">
              <h3 className="analytics-title">Distribuição por Funções</h3>
              <div className="distribution-table">
                <table>
                  <thead>
                    <tr>
                      <th>Função</th>
                      <th>Membros</th>
                      <th>Percentual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(stats.funcoes)
                      .sort(([, a], [, b]) => b - a)
                      .map(([funcao, count]) => {
                        const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                        return (
                          <tr key={funcao}>
                            <td>{funcao}</td>
                            <td>{count}</td>
                            <td>{Math.round(percentage)}%</td>
                          </tr>
                        );
                      })
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Seção de insights */}
        <section className="insights-section">
          <h2 className="section-title">Insights e Recomendações</h2>
          <div className="insights-grid">
            {/* Cartão de destaque */}
            <div className="insight-card highlight-card">
              <h3>Crescimento</h3>
              <div className="insight-value">
                <span className="large-number">{stats.tendencia.percentualCrescimento}%</span>
                <TrendIndicator value={stats.tendencia.percentualCrescimento} />
              </div>
              <p className="insight-description">
                {stats.tendencia.percentualCrescimento > 0 
                  ? 'Crescimento em relação ao mês anterior.' 
                  : stats.tendencia.percentualCrescimento < 0 
                    ? 'Queda em relação ao mês anterior.' 
                    : 'Estável em relação ao mês anterior.'}
              </p>
            </div>
            
            {/* Cartão de recomendação */}
            <div className="insight-card recommendation-card">
              <h3>Recomendação</h3>
              <p className="insight-description">
                {topRegions.length > 0 && `A região ${topRegions[0][0]} possui a maior concentração de membros (${topRegions[0][1]} pessoas). `}
                {stats.tendencia.percentualCrescimento <= 0 ? 'Considere estratégias para aumentar o número de novos membros.' : 'Continue com as estratégias atuais de crescimento.'}
              </p>
              <button 
                className="action-button"
                onClick={() => history.push('/app/members')}
              >
                Gerenciar membros
              </button>
            </div>
            
            {/* Cartão de distribuição demográfica */}
            <div className="insight-card demographic-card">
              <h3>Demografia</h3>
              <div className="demographic-stats">
                <div className="demographic-item">
                  <span className="demographic-label">Gênero predominante</span>
                  <span className="demographic-value">
                    {malePercent > femalePercent ? 'Masculino' : femalePercent > malePercent ? 'Feminino' : 'Equilibrado'}
                  </span>
                </div>
                <div className="demographic-item">
                  <span className="demographic-label">Região principal</span>
                  <span className="demographic-value">
                    {topRegions.length > 0 ? topRegions[0][0] : 'N/A'}
                  </span>
                </div>
                <div className="demographic-item">
                  <span className="demographic-label">Sociedade principal</span>
                  <span className="demographic-value">
                    {topSociedades.length > 0 ? topSociedades[0][0] : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Atividade recente */}
        {stats.recentMembers.length > 0 && (
          <section className="recent-activity">
            <h2 className="section-title">Atividade Recente</h2>
            <div className="activity-list">
              {stats.recentMembers.map(member => (
                <div className="activity-item" key={member.id}>
                  <div className="member-avatar">
                    {member.nome_completo.charAt(0).toUpperCase()}
                  </div>
                  <div className="activity-details">
                    <h3>{member.nome_completo}</h3>
                    <p>{member.regiao} • {member.paroquia}</p>
                    <p className="activity-meta">
                      <span className="activity-type">Adicionado</span>
                      <span className="activity-time">
                        {new Date(member.created_at ?? '').toLocaleDateString('pt-BR')}
                      </span>
                    </p>
                  </div>
                  <button 
                    className="view-button"
                    onClick={() => history.push(`/app/view/${member.id}`)}
                  >
                    Ver
                  </button>
                </div>
              ))}
            </div>
            
            <div className="view-all">
              <button 
                className="view-all-button"
                onClick={() => history.push('/app/members')}
              >
                Ver todos os membros
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Home;