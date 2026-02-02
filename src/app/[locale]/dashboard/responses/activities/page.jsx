'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { downloadImagesAsZip } from '../../../../../lib/utils/downloadImages';

export default function ResponsesActivitiesPage() {
  const t = useTranslations('dashboard.responses');
  const tc = useTranslations('dashboard.responses.common');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingCandids, setDownloadingCandids] = useState(false);
  const [downloadingSW, setDownloadingSW] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/responses/activities');
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleDownloadCandids = async () => {
    setDownloadingCandids(true);
    try {
      await downloadImagesAsZip('community-candids', 'community-candids.zip');
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setDownloadingCandids(false);
    }
  };

  const handleDownloadStudentWork = async () => {
    setDownloadingSW(true);
    try {
      await downloadImagesAsZip('student-work-images', 'student-work-images.zip');
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setDownloadingSW(false);
    }
  };

  if (loading) return <p className="text-text-secondary">{tc('loading')}</p>;
  if (!data) return <p className="text-text-secondary">{tc('noData')}</p>;

  const { candids, studentWork, stats, candidImageCount, studentWorkImageCount } = data;

  return (
    <div>
      <h2 className="text-lg font-medium mb-4">{t('activities.title')}</h2>

      {/* Community Candids Section */}
      <h3 className="text-md font-medium mb-3">{t('activities.candidsTitle')}</h3>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="px-3 py-2 rounded-lg border border-border bg-bg-secondary">
          <p className="text-xs text-text-secondary">{t('activities.totalCandids')}</p>
          <p className="text-lg font-medium">{stats.totalCandids}</p>
        </div>
        <div className="px-3 py-2 rounded-lg border border-border bg-bg-secondary flex-1 min-w-[150px]">
          <p className="text-xs text-text-secondary">{t('activities.uniqueEvents')}</p>
          <p className="text-sm mt-1">{stats.uniqueEvents.length > 0 ? stats.uniqueEvents.join(', ') : '—'}</p>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-x-auto mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="text-left p-3 font-medium">{t('activities.email')}</th>
              <th className="text-left p-3 font-medium">{t('activities.eventName')}</th>
              <th className="text-left p-3 font-medium">{t('activities.eventDescription')}</th>
              <th className="text-center p-3 font-medium">{t('clubs.images')}</th>
            </tr>
          </thead>
          <tbody>
            {candids.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="p-3 text-xs">{c.email}</td>
                <td className="p-3">{c.eventName || '—'}</td>
                <td className="p-3 text-xs max-w-xs truncate">{c.eventDescription || '—'}</td>
                <td className="p-3 text-center">{c.imageCount}</td>
              </tr>
            ))}
            {candids.length === 0 && (
              <tr><td colSpan={4} className="p-3 text-center text-text-secondary">{tc('noData')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-8">
        <button
          onClick={handleDownloadCandids}
          disabled={downloadingCandids}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 text-sm"
        >
          {downloadingCandids ? tc('downloading') : t('activities.downloadCandidImages')}
        </button>
        <span className="text-sm text-text-secondary">{tc('imageCount', { count: candidImageCount })}</span>
      </div>

      {/* Student Work Section */}
      <h3 className="text-md font-medium mb-3">{t('activities.studentWorkTitle')}</h3>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="px-3 py-2 rounded-lg border border-border bg-bg-secondary">
          <p className="text-xs text-text-secondary">{t('activities.totalStudentWork')}</p>
          <p className="text-lg font-medium">{stats.totalStudentWork}</p>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-x-auto mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="text-left p-3 font-medium">{t('activities.email')}</th>
              <th className="text-left p-3 font-medium">{t('activities.projectTitle')}</th>
              <th className="text-left p-3 font-medium">{t('activities.projectMembers')}</th>
              <th className="text-center p-3 font-medium">{t('clubs.images')}</th>
            </tr>
          </thead>
          <tbody>
            {studentWork.map((sw) => (
              <tr key={sw.id} className="border-b border-border last:border-0">
                <td className="p-3 text-xs">{sw.email}</td>
                <td className="p-3">{sw.projectTitle}</td>
                <td className="p-3 text-xs">{sw.members.join(', ')}</td>
                <td className="p-3 text-center">{sw.imageCount}</td>
              </tr>
            ))}
            {studentWork.length === 0 && (
              <tr><td colSpan={4} className="p-3 text-center text-text-secondary">{tc('noData')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={handleDownloadStudentWork}
          disabled={downloadingSW}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 text-sm"
        >
          {downloadingSW ? tc('downloading') : t('activities.downloadStudentWorkImages')}
        </button>
        <span className="text-sm text-text-secondary">{tc('imageCount', { count: studentWorkImageCount })}</span>
      </div>
    </div>
  );
}
