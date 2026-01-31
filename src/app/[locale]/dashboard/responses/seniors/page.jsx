'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function ResponsesSeniorsPage() {
  const t = useTranslations('dashboard.responses');
  const tc = useTranslations('dashboard.responses.common');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/responses/seniors');
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error('Error fetching senior responses:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/responses/export/senior-bios');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'senior-bios.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <p className="text-text-secondary">{tc('loading')}</p>;
  if (!data) return <p className="text-text-secondary">{tc('noData')}</p>;

  const { seniors, stats } = data;

  return (
    <div>
      <h2 className="text-lg font-medium mb-4">{t('seniors.title')}</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-lg border border-border bg-bg-secondary">
          <p className="text-sm text-text-secondary">{t('seniors.totalBios')}</p>
          <p className="text-2xl font-medium">{stats.total}</p>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="text-left p-3 font-medium">{t('seniors.name')}</th>
              <th className="text-left p-3 font-medium">{t('seniors.major')}</th>
              <th className="text-left p-3 font-medium">{t('seniors.minor')}</th>
              <th className="text-left p-3 font-medium">{t('seniors.secondMajor')}</th>
              <th className="text-left p-3 font-medium">{t('seniors.quote')}</th>
              <th className="text-left p-3 font-medium">{t('seniors.achievements')}</th>
            </tr>
          </thead>
          <tbody>
            {seniors.map((bio) => (
              <tr key={bio.id} className="border-b border-border last:border-0">
                <td className="p-3 whitespace-nowrap">{bio.first_name} {bio.last_name}</td>
                <td className="p-3">{bio.major || '—'}</td>
                <td className="p-3">{bio.minor || '—'}</td>
                <td className="p-3">{bio.second_major || '—'}</td>
                <td className="p-3 max-w-xs truncate">{bio.quote || '—'}</td>
                <td className="p-3 max-w-xs truncate">{bio.achievements || '—'}</td>
              </tr>
            ))}
            {seniors.length === 0 && (
              <tr><td colSpan={6} className="p-3 text-center text-text-secondary">{tc('noData')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 text-sm"
        >
          {exporting ? tc('exporting') : t('seniors.exportBios')}
        </button>
      </div>
    </div>
  );
}
