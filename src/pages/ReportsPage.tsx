import React, { useState } from 'react';
import { usePolar } from '../context';
import { PolarReport } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { DataTable, Column } from '../components/common/DataTable';
import { SearchBar } from '../components/common/SearchBar';
import { FilterDropdown } from '../components/common/FilterDropdown';
import { Modal } from '../components/common/Modal';
import {
  FileText,
  Download,
  Eye,
  Layers,
  CheckCircle2,
  FileSpreadsheet,
  FileCode,
  Sparkles
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { reports } = usePolar();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [selectedReport, setSelectedReport] = useState<PolarReport | null>(null);
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  const filteredData = reports.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reportCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.station.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All Categories' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSimulatedDownload = (report: PolarReport, format: string) => {
    setDownloadFeedback(`Generating verified ${format} export for ${report.reportCode}...`);
    setTimeout(() => {
      setDownloadFeedback(`Successfully exported ${report.title} (${report.fileSize}) to local drive.`);
      setTimeout(() => setDownloadFeedback(null), 4000);
    }, 1200);
  };

  const columns: Column<PolarReport>[] = [
    {
      key: 'reportCode',
      header: 'Report Code',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-xs text-cyan-400 bg-cyan-950/80 px-2 py-1 rounded border border-cyan-500/20">
          {row.reportCode}
        </span>
      )
    },
    {
      key: 'title',
      header: 'Scientific & Operations Report Title',
      sortable: true,
      render: (row) => (
        <div className="max-w-md">
          <div className="font-bold text-white group-hover:text-cyan-300 transition-colors">
            {row.title}
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
            <span>By {row.author}</span>
            <span>•</span>
            <span className="text-cyan-300">{(row.station || 'All Stations').split('&')[0]}</span>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (row) => (
        <span className="text-xs font-mono text-slate-300 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
          {row.category}
        </span>
      )
    },
    {
      key: 'dateGenerated',
      header: 'Date Generated',
      sortable: true,
      render: (row) => (
        <div className="text-xs font-mono text-slate-300">
          {row.dateGenerated}
        </div>
      )
    },
    {
      key: 'fileSize',
      header: 'Format & Size',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
          <span className="px-1.5 py-0.5 rounded font-bold text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-500/30">
            {row.format}
          </span>
          <span>{row.fileSize}</span>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedReport(row);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/30 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSimulatedDownload(row, row.format);
            }}
            className="p-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg"
            title="Download Report"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <PageHeader
        title="Mission Analytics, Audits & Polar Reports"
        subtitle="Environmental Madrid compliance logs, paleoclimate data yields, and fuel consumption telemetry"
        icon={FileText}
        badge={`${reports.length} VERIFIED AUDITS`}
      />

      {/* Download Alert / Toast simulation */}
      {downloadFeedback && (
        <div className="p-3 bg-cyan-950/90 border border-cyan-500/40 rounded-xl flex items-center justify-between text-xs text-cyan-200 font-mono animate-in fade-in-50 shadow-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>{downloadFeedback}</span>
          </div>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Generated Audits"
          value={reports.length}
          subtitle="All station publications"
          icon={FileText}
          variant="cyan"
        />
        <StatCard
          title="Madrid Protocol"
          value="100% PASS"
          subtitle="Zero waste compliance"
          icon={CheckCircle2}
          variant="emerald"
        />
        <StatCard
          title="Ice Core Specimen"
          value="348.6 m"
          subtitle="Paleoclimate record depth"
          icon={Layers}
          variant="blue"
        />
        <StatCard
          title="Diesel Saved"
          value="-14.8%"
          subtitle="Wind-hybrid turbine offset"
          icon={Sparkles}
          variant="purple"
        />
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by report title, code, author, station..."
          className="flex-1 w-full"
        />
        <FilterDropdown
          value={categoryFilter}
          options={[
            'All Categories',
            'Logistics & Fuel',
            'Environmental Compliance',
            'Scientific Output',
            'Medical & Health',
            'Asset Telemetry'
          ]}
          onChange={setCategoryFilter}
          className="w-full sm:w-56"
        />
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredData}
        keyExtractor={(item) => item.id}
        onRowClick={(item) => setSelectedReport(item)}
        pageSize={8}
      />

      {/* Report Preview Modal */}
      {selectedReport && (
        <Modal
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          title={selectedReport.title}
          subtitle={`Report Code: ${selectedReport.reportCode} | Author: ${selectedReport.author}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            {/* Header info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Category</span>
                <span className="font-bold text-cyan-400">{selectedReport.category}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Station Coverage</span>
                <span className="font-bold text-white">{selectedReport.station}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Publication Date</span>
                <span className="font-bold text-white">{selectedReport.dateGenerated}</span>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="space-y-1.5 text-xs">
              <span className="font-mono font-bold text-slate-300 uppercase tracking-wider block">Executive Summary & Abstract</span>
              <p className="text-slate-300 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 leading-relaxed font-sans">
                {selectedReport.summary}
              </p>
            </div>

            {/* Key Verified Metrics Table */}
            <div className="space-y-2">
              <span className="font-mono font-bold text-slate-300 uppercase tracking-wider block text-xs">
                Key Analytical Metrics & Findings
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedReport.metrics.map((metric, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-mono">{metric.label}:</span>
                    <span className="text-xs font-bold text-cyan-300 font-mono">{metric.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Export Simulation Bar */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-400 font-mono">Export Scientific Dataset:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSimulatedDownload(selectedReport, 'PDF')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-rose-400" />
                  <span>PDF Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulatedDownload(selectedReport, 'CSV')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>CSV Dataset</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulatedDownload(selectedReport, 'JSON')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                >
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                  <span>JSON Payload</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
