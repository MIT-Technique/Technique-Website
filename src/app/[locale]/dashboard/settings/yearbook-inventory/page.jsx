'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const ITEMS_PER_PAGE = 10;

export default function YearbookInventoryPage() {
  const t = useTranslations('dashboard.settings');
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingYear, setEditingYear] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryPage, setInventoryPage] = useState(0);
  const [newYear, setNewYear] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [addingYear, setAddingYear] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/yearbook-inventory');
      const data = await res.json();
      setInventory(data.inventory || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateInventory(year, quantity) {
    try {
      const res = await fetch('/api/admin/yearbook-inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, quantity: parseInt(quantity) || 0 }),
      });

      if (res.ok) {
        setEditingYear(null);
        setEditValue('');
        fetchInventory();
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
    }
  }

  function startEdit(year, currentQuantity) {
    setEditingYear(year);
    setEditValue(currentQuantity.toString());
  }

  function cancelEdit() {
    setEditingYear(null);
    setEditValue('');
  }

  async function handleAddYear() {
    const year = parseInt(newYear);
    const quantity = parseInt(newQuantity) || 0;
    if (!year) return;
    setAddingYear(true);
    try {
      const res = await fetch('/api/admin/yearbook-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, quantity }),
      });
      if (res.ok) {
        setNewYear('');
        setNewQuantity('');
        setShowAddForm(false);
        fetchInventory();
      }
    } catch (error) {
      console.error('Error adding year:', error);
    } finally {
      setAddingYear(false);
    }
  }

  const filteredInventory = inventory.filter(item =>
    item.year.toString().includes(inventorySearch)
  );

  const totalPages = Math.ceil(filteredInventory.length / ITEMS_PER_PAGE);
  const paginatedInventory = filteredInventory.slice(
    inventoryPage * ITEMS_PER_PAGE,
    (inventoryPage + 1) * ITEMS_PER_PAGE
  );

  function handleSearchChange(value) {
    setInventorySearch(value);
    setInventoryPage(0);
  }

  return (
    <div>
      <h3 className="text-md font-medium mb-2">{t('inventory.title')}</h3>
      <p className="text-sm text-text-secondary mb-4">{t('inventory.description')}</p>

      {/* Search, Add, and Navigation */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={t('inventory.searchPlaceholder')}
            value={inventorySearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="max-w-[10rem] px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
          />
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-9 h-9 flex items-center justify-center border border-border rounded-lg text-text-secondary hover:bg-bg-secondary text-lg"
              title={t('inventory.add')}
            >
              +
            </button>
          ) : (
            <>
              <input
                type="number"
                placeholder={t('inventory.year')}
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                className="w-20 px-2 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
                autoFocus
              />
              <input
                type="number"
                min="0"
                placeholder={t('inventory.quantity')}
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                className="w-20 px-2 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
              />
              <button
                onClick={handleAddYear}
                disabled={!newYear || addingYear}
                className="px-3 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50"
              >
                {addingYear ? '...' : t('inventory.add')}
              </button>
              <button
                onClick={() => { setShowAddForm(false); setNewYear(''); setNewQuantity(''); }}
                className="px-2 py-2 text-sm text-text-muted hover:text-text-primary"
              >
                {t('inventory.cancel')}
              </button>
            </>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">
              {inventoryPage * ITEMS_PER_PAGE + 1}-{Math.min((inventoryPage + 1) * ITEMS_PER_PAGE, filteredInventory.length)} of {filteredInventory.length}
            </span>
            <button
              onClick={() => setInventoryPage(p => Math.max(0, p - 1))}
              disabled={inventoryPage === 0}
              className="p-1 border border-border rounded hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setInventoryPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={inventoryPage >= totalPages - 1}
              className="p-1 border border-border rounded hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-text-secondary">Loading...</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary">
              <tr>
                <th className="px-4 py-3 text-left font-medium">{t('inventory.year')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('inventory.quantity')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('inventory.status')}</th>
                <th className="px-4 py-3 text-right font-medium">{t('inventory.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-text-secondary">
                    {t('inventory.noResults')}
                  </td>
                </tr>
              ) : (
                paginatedInventory.map((item) => (
                  <tr key={item.year} className="hover:bg-bg-secondary/50">
                    <td className="px-4 py-3 font-medium">{item.year}</td>
                    <td className="px-4 py-3">
                      {editingYear === item.year ? (
                        <input
                          type="number"
                          min="0"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-20 px-2 py-1 border border-border rounded text-sm focus:outline-none focus:border-accent"
                          autoFocus
                        />
                      ) : (
                        item.quantity
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        item.quantity > 0
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {item.quantity > 0 ? t('inventory.inStock') : t('inventory.outOfStock')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editingYear === item.year ? (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleUpdateInventory(item.year, editValue)}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            {t('inventory.save')}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1 text-xs border border-border rounded hover:bg-bg-secondary"
                          >
                            {t('inventory.cancel')}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(item.year, item.quantity)}
                          className="px-3 py-1 text-xs border border-border rounded hover:bg-bg-secondary"
                        >
                          {t('inventory.edit')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
