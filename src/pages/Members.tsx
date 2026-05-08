import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router';
import { supabase } from '../services/supabase';
import { Member } from '../types/member';
import { showFeedback, confirmAction } from '../services/feedback';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { exportToPDF, exportToExcel } from '../services/export';
import './Members.css';

// Registrando os componentes do Chart.js
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Spinner minimalista
const Spinner = () => <div className="spinner"></div>;

// Interfaces para os componentes
interface MemberTableProps {
    members: Member[];
    onView: (member: Member) => void; // Changed from onEdit to onView
    onEdit: (member: Member) => void; // Added new onEdit prop
    onDelete: (id: string) => void;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    rowsPerPage: number;
    onRowsPerPageChange: (rows: number) => void;
    totalMembers: number;
}

interface FiltersState {
    search: string;
    regiao: string;
    genero: string;
}

interface FilterBarProps {
    onSearch: (value: string) => void;
    onFilterChange: (filterName: string, value: string) => void;
    filters: FiltersState;
}

interface ChartsProps {
    members: Member[];
}

// Componente de tabela de membros
const MemberTable: React.FC<MemberTableProps> = ({ 
    members, 
    onView,  // Changed from onEdit to onView
    onEdit,  // Added new onEdit prop
    onDelete, 
    currentPage, 
    totalPages, 
    onPageChange, 
    rowsPerPage, 
    onRowsPerPageChange, 
    totalMembers 
}) => {
    return (
        <div>
            <div className="member-table-container">
                <table className="member-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Gênero</th>
                            <th>Região</th>
                            <th>Paróquia</th>
                            <th>Função</th>
                            <th>Sociedade</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.map(member => (
                            <tr key={member.id}>
                                <td>{member.nome_completo}</td>
                                <td>{member.genero}</td>
                                <td>{member.regiao}</td>
                                <td>{member.paroquia}</td>
                                <td>{member.funcao}</td>
                                <td>{member.sociedade || '-'}</td>
                                <td className="action-buttons">
                                    <button onClick={() => onView(member)} className="view-btn">
                                        Ver
                                    </button>
                                    <button onClick={() => onEdit(member)} className="edit-btn">
                                        Editar
                                    </button>
                                    <button onClick={() => onDelete(member.id)} className="delete-btn">
                                        Excluir
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={onRowsPerPageChange}
                totalItems={totalMembers}
            />
        </div>
    );
};

// Componente de filtros
const FilterBar: React.FC<FilterBarProps> = ({ onSearch, onFilterChange, filters }) => {
    return (
        <div className="filter-bar">
            <input 
                type="text" 
                placeholder="Buscar por nome..." 
                value={filters.search}
                onChange={(e) => onSearch(e.target.value)}
                className="search-input"
            />
            <div className="filters">
                <select 
                    value={filters.regiao}
                    onChange={(e) => onFilterChange('regiao', e.target.value)}
                    className="filter-select"
                >
                    <option value="">Todas as regiões</option>
                    <option value="ESTE">ESTE</option>
                    <option value="OESTE">OESTE</option>
                    <option value="SUL">SUL</option>
                    <option value="SUDUESTE">SUDUESTE</option>
                    <option value="NORTE">NORTE</option>
                </select>
                
                <select 
                    value={filters.genero}
                    onChange={(e) => onFilterChange('genero', e.target.value)}
                    className="filter-select"
                >
                    <option value="">Todos os gêneros</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                </select>
            </div>
        </div>
    );
};

// Componente de gráficos estatísticos
const Charts: React.FC<ChartsProps> = ({ members }) => {
    // Dados para gráficos
    const totalMembers = members.length;
    const maleCount = members.filter(m => m.genero === 'Masculino').length;
    const femaleCount = members.filter(m => m.genero === 'Feminino').length;
    
    // Contagem por região
    const regionCounts = members.reduce((acc: Record<string, number>, member) => {
        acc[member.regiao] = (acc[member.regiao] || 0) + 1;
        return acc;
    }, {});
    
    // Dados para gráfico de pizza (gênero)
    const genderData = {
        labels: ['Masculino', 'Feminino'],
        datasets: [
            {
                data: [maleCount, femaleCount],
                backgroundColor: ['#4e73df', '#e74a3b'],
                hoverBackgroundColor: ['#2e59d9', '#d52a1a'],
                borderWidth: 1,
            },
        ],
    };
    
    // Dados para gráfico de barras (regiões)
    const regionsData = {
        labels: Object.keys(regionCounts),
        datasets: [
            {
                label: 'Membros por Região',
                data: Object.values(regionCounts),
                backgroundColor: '#36b9cc',
                borderColor: '#2c9faf',
                borderWidth: 1,
            },
        ],
    };
    
    return (
        <div className="stats-dashboard">
            <div className="stats-summary">
                <div className="stat-box total">
                    <h3>Total de Membros</h3>
                    <div className="stat-value">{totalMembers}</div>
                </div>
                <div className="stat-box male">
                    <h3>Homens</h3>
                    <div className="stat-value">{maleCount}</div>
                    <div className="stat-percentage">{totalMembers ? Math.round((maleCount / totalMembers) * 100) : 0}%</div>
                </div>
                <div className="stat-box female">
                    <h3>Mulheres</h3>
                    <div className="stat-value">{femaleCount}</div>
                    <div className="stat-percentage">{totalMembers ? Math.round((femaleCount / totalMembers) * 100) : 0}%</div>
                </div>
            </div>
            
            <div className="charts-container">
                <div className="chart-box">
                    <h3>Distribuição por Gênero</h3>
                    <div className="chart-wrapper">
                        <Pie data={genderData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>
                <div className="chart-box">
                    <h3>Membros por Região</h3>
                    <div className="chart-wrapper">
                        <Bar 
                            data={regionsData} 
                            options={{ 
                                responsive: true, 
                                maintainAspectRatio: false,
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        ticks: {
                                            precision: 0
                                        }
                                    }
                                }
                            }} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Pagination component
interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    rowsPerPage: number;
    onRowsPerPageChange: (rows: number) => void;
    totalItems: number;
}

const Pagination: React.FC<PaginationProps> = ({ 
    currentPage, 
    totalPages, 
    onPageChange, 
    rowsPerPage, 
    onRowsPerPageChange,
    totalItems 
}) => {
    // Create an array of page numbers to show
    const getPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5;
        
        if (totalPages <= maxPagesToShow) {
            // Show all pages if there are few
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always include first page
            pages.push(1);
            
            // Current page neighborhood
            let startPage = Math.max(2, currentPage - 1);
            let endPage = Math.min(totalPages - 1, currentPage + 1);
            
            // Add ellipsis if needed
            if (startPage > 2) {
                pages.push(-1); // -1 represents ellipsis
            }
            
            // Add pages around current
            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }
            
            // Add ellipsis if needed
            if (endPage < totalPages - 1) {
                pages.push(-2); // -2 represents ellipsis
            }
            
            // Always include last page
            if (totalPages > 1) {
                pages.push(totalPages);
            }
        }
        
        return pages;
    };
    
    const pageNumbers = getPageNumbers();
    const startItem = (currentPage - 1) * rowsPerPage + 1;
    const endItem = Math.min(currentPage * rowsPerPage, totalItems);
    
    return (
        <div className="pagination-container">
            <button 
                className="pagination-button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                &laquo; Anterior
            </button>
            
            {pageNumbers.map((page, index) => (
                page < 0 ? (
                    <span key={`ellipsis-${index}`} className="pagination-info">...</span>
                ) : (
                    <button 
                        key={`page-${page}`}
                        className={`pagination-button ${currentPage === page ? 'active' : ''}`}
                        onClick={() => onPageChange(page)}
                        disabled={currentPage === page}
                    >
                        {page}
                    </button>
                )
            ))}
            
            <button 
                className="pagination-button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
            >
                Próximo &raquo;
            </button>
            
            <div className="pagination-info">
                Exibindo {totalItems ? `${startItem}-${endItem} de ${totalItems}` : '0-0 de 0'} registros
            </div>
            
            <div className="pagination-select-container">
                <label className="pagination-select-label">Mostrar:</label>
                <select 
                    className="pagination-select"
                    value={rowsPerPage}
                    onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
                >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                </select>
            </div>
        </div>
    );
};

const Members: React.FC = () => {
    const [pageMembers, setPageMembers] = useState<Member[]>([]);
    const [allFilteredMembers, setAllFilteredMembers] = useState<Member[]>([]);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [filters, setFilters] = useState<FiltersState>({
        search: '',
        regiao: '',
        genero: '',
    });
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const history = useHistory();

    const totalPages = Math.ceil(totalCount / rowsPerPage);

    const applyFilters = (query: any, f: FiltersState) => {
        if (f.search) query = query.ilike('nome_completo', `%${f.search}%`);
        if (f.regiao)  query = query.eq('regiao', f.regiao);
        if (f.genero)  query = query.eq('genero', f.genero);
        return query;
    };

    const loadMembers = async (page: number, rows: number, f: FiltersState) => {
        try {
            setIsLoading(true);

            const from = (page - 1) * rows;
            const to = from + rows - 1;

            const [pageResult, allResult] = await Promise.all([
                applyFilters(
                    supabase.from('members').select('*').order('nome_completo').range(from, to),
                    f
                ),
                applyFilters(
                    supabase.from('members').select('*', { count: 'exact' }).order('nome_completo'),
                    f
                ),
            ]);

            if (pageResult.error) throw pageResult.error;
            if (allResult.error) throw allResult.error;

            setPageMembers(pageResult.data || []);
            setAllFilteredMembers(allResult.data || []);
            setTotalCount(allResult.count || 0);
        } catch (error) {
            showFeedback('Erro ao carregar membros', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadMembers(1, rowsPerPage, filters);
    }, []);

    const handleDelete = async (id: string) => {
        const confirmed = await confirmAction(
            'Confirmar exclusão',
            'Tem certeza que deseja excluir este membro? Esta ação não pode ser desfeita.',
            'Excluir',
            'Cancelar'
        );
        if (!confirmed) return;

        try {
            setIsLoading(true);
            const { error } = await supabase.from('members').delete().eq('id', id);
            if (error) throw error;
            await loadMembers(currentPage, rowsPerPage, filters);
            showFeedback('Membro removido com sucesso', 'success');
        } catch (error) {
            showFeedback('Erro ao remover membro', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (value: string) => {
        const newFilters = { ...filters, search: value };
        setFilters(newFilters);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setCurrentPage(1);
            loadMembers(1, rowsPerPage, newFilters);
        }, 350);
    };

    const handleFilterChange = (filterName: string, value: string) => {
        const newFilters = { ...filters, [filterName]: value };
        setFilters(newFilters);
        setCurrentPage(1);
        loadMembers(1, rowsPerPage, newFilters);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        loadMembers(page, rowsPerPage, filters);
    };

    const handleRowsPerPageChange = (rows: number) => {
        setRowsPerPage(rows);
        setCurrentPage(1);
        loadMembers(1, rows, filters);
    };

    const clearFilters = () => {
        const cleared = { search: '', regiao: '', genero: '' };
        setFilters(cleared);
        setCurrentPage(1);
        loadMembers(1, rowsPerPage, cleared);
    };

    return (
        <div className="members-page scrollable-content">
            {isLoading && (
                <div className="loading-overlay">
                    <Spinner />
                    <p>Carregando membros...</p>
                </div>
            )}

            <header className="page-header">
                <h1>Ekklesia - Gestão de Membros</h1>
                <div className="header-actions">
                    <button onClick={() => history.push('/app/add')} className="add-btn">
                        + Novo
                    </button>
                    <button
                        className="export-btn"
                        onClick={() => exportToPDF(allFilteredMembers)}
                        title="Exportar para PDF"
                    >
                        PDF
                    </button>
                    <button
                        className="export-btn export-btn--excel"
                        onClick={() => exportToExcel(allFilteredMembers)}
                        title="Exportar para Excel"
                    >
                        Excel
                    </button>
                </div>
            </header>

            <div className="filters-section">
                <FilterBar
                    onSearch={handleSearch}
                    onFilterChange={handleFilterChange}
                    filters={filters}
                />
                <div className="results-count">
                    {totalCount} {totalCount === 1 ? 'membro encontrado' : 'membros encontrados'}
                </div>
            </div>

            <main className="members-content">
                <Charts members={allFilteredMembers} />

                {totalCount > 0 ? (
                    <MemberTable
                        members={pageMembers}
                        onView={(m) => history.push(`/app/view/${m.id}`)}
                        onEdit={(m) => history.push(`/app/edit/${m.id}`)}
                        onDelete={handleDelete}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleRowsPerPageChange}
                        totalMembers={totalCount}
                    />
                ) : (
                    <div className="empty-state">
                        <p>Nenhum membro encontrado com os filtros atuais.</p>
                        {(filters.search || filters.regiao || filters.genero) && (
                            <button className="clear-filters-btn" onClick={clearFilters}>
                                Limpar filtros
                            </button>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Members;