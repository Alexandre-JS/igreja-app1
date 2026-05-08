import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Member } from '../types/member';

const COLUMNS = [
    { header: 'Nome Completo',    key: 'nome_completo' },
    { header: 'Género',           key: 'genero' },
    { header: 'Região',           key: 'regiao' },
    { header: 'Paróquia',         key: 'paroquia' },
    { header: 'Função',           key: 'funcao' },
    { header: 'Sociedade',        key: 'sociedade' },
    { header: 'Estado',           key: 'estado' },
    { header: 'Telefone',         key: 'telefone' },
    { header: 'Email',            key: 'email' },
    { header: 'Data Nascimento',  key: 'data_nascimento' },
] as const;

function buildRows(members: Member[]): string[][] {
    return members.map(m =>
        COLUMNS.map(col => (m[col.key as keyof Member] as string) || '—')
    );
}

export function exportToPDF(members: Member[], filename = 'membros'): void {
    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setFontSize(14);
    doc.text('Ekklesia — Lista de Membros ICUM/SNF', 14, 15);
    doc.setFontSize(10);
    doc.text(`Total: ${members.length} membros   •   Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 22);

    autoTable(doc, {
        head: [COLUMNS.map(c => c.header)],
        body: buildRows(members),
        startY: 28,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [56, 128, 255], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 255] },
    });

    doc.save(`${filename}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportToExcel(members: Member[], filename = 'membros'): void {
    const headers = COLUMNS.map(c => c.header);
    const rows = buildRows(members);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Larguras de coluna
    ws['!cols'] = COLUMNS.map(() => ({ wch: 20 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Membros');

    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
