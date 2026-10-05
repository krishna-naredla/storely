import React, { useState, useEffect } from 'react';
import {
  Armchair,
  Grid,
  Plus,
  Trash2,
  Check,
  Ban,
  Crown,
  Sparkles,
  Layers,
  RefreshCw,
  Info,
} from 'lucide-react';
import { EventSeatingChart, EventSeat, EventSeatingSection } from '../../types';

interface VisualSeatingChartCreatorProps {
  value?: EventSeatingChart;
  onChange: (chart: EventSeatingChart) => void;
  onCapacityChange?: (capacity: number) => void;
}

const DEFAULT_SECTIONS: EventSeatingSection[] = [
  { id: 'sec_vip', name: 'VIP Front Row', color: '#8B5CF6', rowsCount: 2, seatsPerRow: 8 },
  { id: 'sec_prem', name: 'Premium Central', color: '#3B82F6', rowsCount: 3, seatsPerRow: 10 },
  { id: 'sec_gen', name: 'General Admission', color: '#10B981', rowsCount: 4, seatsPerRow: 10 },
];

export const VisualSeatingChartCreator: React.FC<VisualSeatingChartCreatorProps> = ({
  value,
  onChange,
  onCapacityChange,
}) => {
  const [enabled, setEnabled] = useState(value?.enabled || false);
  const [layoutType, setLayoutType] = useState<'theatre' | 'grid' | 'banquet' | 'stadium'>(
    value?.layoutType || 'theatre'
  );
  const [sections, setSections] = useState<EventSeatingSection[]>(
    value?.sections || DEFAULT_SECTIONS
  );
  const [seats, setSeats] = useState<EventSeat[]>(value?.seats || []);
  const [selectedSeat, setSelectedSeat] = useState<EventSeat | null>(null);

  // Initialize or generate initial grid if empty
  useEffect(() => {
    if (value) {
      setEnabled(value.enabled);
      if (value.layoutType) setLayoutType(value.layoutType);
      if (value.sections) setSections(value.sections);
      if (value.seats) setSeats(value.seats);
    } else if (seats.length === 0) {
      generateSeatsFromSections(DEFAULT_SECTIONS);
    }
  }, []);

  const generateSeatsFromSections = (currentSections: EventSeatingSection[]) => {
    const newSeats: EventSeat[] = [];
    const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let rowIndex = 0;

    currentSections.forEach((section) => {
      for (let r = 0; r < section.rowsCount; r++) {
        const rowLabel = rowLetters[rowIndex % rowLetters.length] || `R${rowIndex + 1}`;
        for (let s = 1; s <= section.seatsPerRow; s++) {
          const seatId = `${rowLabel}${s}`;
          newSeats.push({
            id: seatId,
            row: rowLabel,
            number: s,
            label: `${rowLabel}-${s}`,
            section: section.name,
            status: 'available',
          });
        }
        rowIndex++;
      }
    });

    setSeats(newSeats);
    notifyChanges(enabled, layoutType, currentSections, newSeats);
  };

  const notifyChanges = (
    isEnabled: boolean,
    type: 'theatre' | 'grid' | 'banquet' | 'stadium',
    secs: EventSeatingSection[],
    allSeats: EventSeat[]
  ) => {
    const activeSeatsCount = allSeats.filter((s) => s.status !== 'blocked').length;
    const updatedChart: EventSeatingChart = {
      enabled: isEnabled,
      layoutType: type,
      sections: secs,
      totalSeats: activeSeatsCount,
      seats: allSeats,
      allowCustomerSelection: true,
    };
    onChange(updatedChart);
    if (onCapacityChange && isEnabled) {
      onCapacityChange(activeSeatsCount);
    }
  };

  const handleToggleEnabled = (checked: boolean) => {
    setEnabled(checked);
    if (checked && seats.length === 0) {
      generateSeatsFromSections(sections);
    } else {
      notifyChanges(checked, layoutType, sections, seats);
    }
  };

  const handleSeatClick = (seat: EventSeat) => {
    // Cycle seat status: available -> blocked -> available
    const nextStatus = seat.status === 'available' ? 'blocked' : 'available';
    const updated = seats.map((s) => (s.id === seat.id ? { ...s, status: nextStatus } : s));
    setSeats(updated);
    notifyChanges(enabled, layoutType, sections, updated);
  };

  const handleAddSection = () => {
    const newSec: EventSeatingSection = {
      id: `sec_${Date.now()}`,
      name: `Tier ${sections.length + 1}`,
      color: '#6366F1',
      rowsCount: 2,
      seatsPerRow: 8,
    };
    const updated = [...sections, newSec];
    setSections(updated);
    generateSeatsFromSections(updated);
  };

  const handleRemoveSection = (secId: string) => {
    if (sections.length <= 1) return;
    const updated = sections.filter((s) => s.id !== secId);
    setSections(updated);
    generateSeatsFromSections(updated);
  };

  const handleSectionParamChange = (
    secId: string,
    field: 'name' | 'color' | 'rowsCount' | 'seatsPerRow',
    val: any
  ) => {
    const updated = sections.map((s) => (s.id === secId ? { ...s, [field]: val } : s));
    setSections(updated);
    generateSeatsFromSections(updated);
  };

  const totalActiveSeats = seats.filter((s) => s.status !== 'blocked').length;
  const blockedSeatsCount = seats.filter((s) => s.status === 'blocked').length;

  // Group seats by row for rendering
  const rowsMap = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {} as Record<string, EventSeat[]>);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-5">
      {/* Header Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
            <Armchair className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">Visual Seating Chart Creator</h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700">
                Interactive Map
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Define rows, sections, and assigned seat numbers for your venue.
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => handleToggleEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          <span className="ml-2 text-xs font-semibold text-slate-700">
            {enabled ? 'Seating Enabled' : 'Disabled (Open Seating)'}
          </span>
        </label>
      </div>

      {enabled && (
        <div className="space-y-5">
          {/* Layout Controls & Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Layout Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Venue Layout Format</label>
              <select
                value={layoutType}
                onChange={(e) => {
                  const t = e.target.value as any;
                  setLayoutType(t);
                  notifyChanges(enabled, t, sections, seats);
                }}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="theatre">Stage / Theatre Front</option>
                <option value="grid">Classroom / Grid Row</option>
                <option value="stadium">Stadium / Tiered Steps</option>
                <option value="banquet">Round Banquet Tables</option>
              </select>
            </div>

            {/* Total Capacity Counter */}
            <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-purple-900 block">Total Active Seats</span>
                <span className="text-lg font-extrabold text-purple-700">{totalActiveSeats}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Blocked Seats</span>
                <span className="text-xs font-bold text-amber-600">{blockedSeatsCount}</span>
              </div>
            </div>

            {/* Reset / Regenerate */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => generateSeatsFromSections(sections)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate Map Grid
              </button>
            </div>
          </div>

          {/* Sections Builder */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Seating Sections & Rows</span>
              <button
                type="button"
                onClick={handleAddSection}
                className="flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-700"
              >
                <Plus className="w-3.5 h-3.5" /> Add Section
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
                >
                  <div
                    className="w-4 h-4 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: sec.color }}
                  />
                  <input
                    type="text"
                    value={sec.name}
                    onChange={(e) => handleSectionParamChange(sec.id, 'name', e.target.value)}
                    placeholder="Section Name"
                    className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1 flex-1 min-w-[120px]"
                  />
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="text-[10px] text-slate-500">Rows:</span>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={sec.rowsCount}
                      onChange={(e) =>
                        handleSectionParamChange(sec.id, 'rowsCount', Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="w-12 text-xs font-semibold bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-center"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="text-[10px] text-slate-500">Seats/Row:</span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={sec.seatsPerRow}
                      onChange={(e) =>
                        handleSectionParamChange(sec.id, 'seatsPerRow', Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="w-12 text-xs font-semibold bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-center"
                    />
                  </div>
                  {sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(sec.id)}
                      className="p-1 rounded-lg text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Seating Map Canvas */}
          <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white overflow-x-auto">
            {/* Stage / Front Banner */}
            <div className="w-full max-w-md mx-auto mb-6">
              <div className="h-4 rounded-t-full bg-linear-to-b from-purple-500/80 to-purple-800/40 border-t border-purple-400/60 shadow-[0_-5px_15px_rgba(168,85,247,0.3)]"></div>
              <p className="text-[10px] font-bold text-center tracking-widest text-purple-300 uppercase mt-1">
                STAGE / SCREEN FRONT
              </p>
            </div>

            {/* Visual Seat Rows */}
            <div className="space-y-3 min-w-[340px] flex flex-col items-center">
              {Object.entries(rowsMap).map(([rowLabel, rowSeats]: [string, EventSeat[]]) => (
                <div key={rowLabel} className="flex items-center gap-2">
                  <span className="w-5 text-center text-xs font-bold text-purple-300 select-none">
                    {rowLabel}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {rowSeats.map((seat) => {
                      const isBlocked = seat.status === 'blocked';
                      const isVIP = seat.section?.toLowerCase().includes('vip');

                      return (
                        <button
                          key={seat.id}
                          type="button"
                          onClick={() => handleSeatClick(seat)}
                          title={`${seat.label} (${seat.section || 'General'}) - ${isBlocked ? 'Blocked' : 'Available'}. Click to toggle.`}
                          className={`group relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all duration-150 select-none ${
                            isBlocked
                              ? 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-pointer hover:border-slate-500'
                              : isVIP
                              ? 'bg-purple-600 text-white shadow-xs hover:bg-purple-500 hover:scale-105 active:scale-95'
                              : 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-500 hover:scale-105 active:scale-95'
                          }`}
                        >
                          {isBlocked ? (
                            <Ban className="w-3 h-3 text-slate-500" />
                          ) : isVIP ? (
                            <Crown className="w-3 h-3 text-purple-200" />
                          ) : (
                            seat.number
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <span className="w-5 text-center text-xs font-bold text-purple-300 select-none">
                    {rowLabel}
                  </span>
                </div>
              ))}
            </div>

            {/* Map Legend */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-emerald-600"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-purple-600 flex items-center justify-center">
                  <Crown className="w-2.5 h-2.5 text-purple-200" />
                </div>
                <span>VIP Seat</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <Ban className="w-2.5 h-2.5 text-slate-500" />
                </div>
                <span>Blocked / Reserved</span>
              </div>
              <span className="text-slate-500 text-[10px]">
                (💡 Click any seat on the map to block or unblock it)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
