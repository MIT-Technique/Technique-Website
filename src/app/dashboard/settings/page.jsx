"use client";

import { useEffect, useState } from "react";
import Switch from "@mui/material/Switch";

export default function SettingsPage() {
  const [formSettings, setFormSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState({});
  const [savingSchedule, setSavingSchedule] = useState({});
  const [savedSchedule, setSavedSchedule] = useState({});
  const [notes, setNotes] = useState({});
  const [savingNote, setSavingNote] = useState({});

  // Hire rate state
  const [hireRate, setHireRate] = useState("");
  const [savingRate, setSavingRate] = useState(false);
  const [rateSaved, setRateSaved] = useState(false);

  const forms = [
    { name: "senior_bio", label: "Senior Bio Form" },
    { name: "club_form", label: "Club Form" },
    { name: "living_group_booking", label: "Living Group Booking" },
    { name: "sports_form", label: "Sports Form" },
  ];

  useEffect(() => {
    fetchSettings();
    fetchHireRate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchSettings() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/form-settings");
      const data = await res.json();
      const settings = data.formSettings || [];
      setFormSettings(settings);

      const initialSchedules = {};
      const initialNotes = {};
      settings.forEach((s) => {
        initialSchedules[s.form_name] = {
          closes_at: s.closes_at ? toLocalDatetime(s.closes_at) : "",
          reopens_at: s.reopens_at ? toLocalDatetime(s.reopens_at) : "",
        };
        initialNotes[s.form_name] = s.note || "";
      });
      setSchedules(initialSchedules);
      setNotes(initialNotes);
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  }

  function toLocalDatetime(isoString) {
    if (!isoString) return "";
    const d = new Date(isoString);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }

  function isEffectivelyClosed(setting) {
    if (!setting) return false;
    if (setting.is_frozen) return true;
    const now = new Date();
    if (setting.closes_at && new Date(setting.closes_at) <= now) {
      if (setting.reopens_at && new Date(setting.reopens_at) <= now)
        return false;
      if (
        setting.unfrozen_at &&
        new Date(setting.unfrozen_at) >= new Date(setting.closes_at)
      )
        return false;
      return true;
    }
    return false;
  }

  function isScheduleOverridden(setting) {
    if (!setting) return false;
    if (setting.is_frozen) return false;
    const now = new Date();
    if (setting.closes_at && new Date(setting.closes_at) <= now) {
      if (setting.reopens_at && new Date(setting.reopens_at) <= now)
        return false;
      if (
        setting.unfrozen_at &&
        new Date(setting.unfrozen_at) >= new Date(setting.closes_at)
      )
        return true;
    }
    return false;
  }

  function wouldScheduleClose(setting) {
    if (!setting) return false;
    const now = new Date();
    if (setting.closes_at && new Date(setting.closes_at) <= now) {
      if (setting.reopens_at && new Date(setting.reopens_at) <= now)
        return false;
      return true;
    }
    return false;
  }

  const orgForms = ["club_form", "sports_form", "living_group_booking"];

  async function handleToggleClose(formName) {
    const setting = formSettings.find((s) => s.form_name === formName);
    const effectivelyClosed = isEffectivelyClosed(setting);

    if (
      effectivelyClosed &&
      !setting?.is_frozen &&
      wouldScheduleClose(setting)
    ) {
      const confirmed = confirm(
        "This form is currently closed by its schedule. Opening it will override the schedule. The schedule dates will remain but be inactive until you close the form again. Continue?",
      );
      if (!confirmed) return;
    }

    if (!effectivelyClosed && orgForms.includes(formName)) {
      const confirmed = confirm(
        "Closing this form will prevent the organization from submitting or editing any information through their portal. Continue?",
      );
      if (!confirmed) return;
    }

    const newFrozen = !effectivelyClosed;

    // Optimistic update
    setFormSettings((prev) =>
      prev.map((s) =>
        s.form_name === formName
          ? {
              ...s,
              is_frozen: newFrozen,
              unfrozen_at: newFrozen ? s.unfrozen_at : new Date().toISOString(),
            }
          : s,
      ),
    );

    try {
      const res = await fetch("/api/admin/form-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formName,
          freeze: newFrozen,
        }),
      });
      if (!res.ok) fetchSettings(); // revert on failure
    } catch (error) {
      console.error("Error updating form setting:", error);
      fetchSettings(); // revert on failure
    }
  }

  async function handleSaveSchedule(formName, overrideSchedule) {
    const schedule = overrideSchedule || schedules[formName] || {};
    const setting = formSettings.find((s) => s.form_name === formName);
    const isClosed = setting?.is_frozen || false;

    const currentClosesAt = setting?.closes_at
      ? toLocalDatetime(setting.closes_at)
      : "";
    const currentReopensAt = setting?.reopens_at
      ? toLocalDatetime(setting.reopens_at)
      : "";
    if (
      schedule.closes_at === currentClosesAt &&
      schedule.reopens_at === currentReopensAt
    )
      return;

    setSavingSchedule((prev) => ({ ...prev, [formName]: true }));
    setSavedSchedule((prev) => ({ ...prev, [formName]: false }));
    try {
      const res = await fetch("/api/admin/form-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formName,
          freeze: isClosed,
          closes_at: schedule.closes_at
            ? new Date(schedule.closes_at).toISOString()
            : null,
          reopens_at: schedule.reopens_at
            ? new Date(schedule.reopens_at).toISOString()
            : null,
        }),
      });
      if (res.ok) {
        // Update local state instead of refetching
        setFormSettings((prev) =>
          prev.map((s) =>
            s.form_name === formName
              ? {
                  ...s,
                  closes_at: schedule.closes_at
                    ? new Date(schedule.closes_at).toISOString()
                    : null,
                  reopens_at: schedule.reopens_at
                    ? new Date(schedule.reopens_at).toISOString()
                    : null,
                }
              : s,
          ),
        );
        setSavedSchedule((prev) => ({ ...prev, [formName]: true }));
        setTimeout(
          () => setSavedSchedule((prev) => ({ ...prev, [formName]: false })),
          2000,
        );
      }
    } catch (error) {
      console.error("Error saving schedule:", error);
    } finally {
      setSavingSchedule((prev) => ({ ...prev, [formName]: false }));
    }
  }

  async function handleSaveNote(formName) {
    const setting = formSettings.find((s) => s.form_name === formName);
    const isClosed = setting?.is_frozen || false;

    setSavingNote((prev) => ({ ...prev, [formName]: true }));
    try {
      const res = await fetch("/api/admin/form-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formName,
          freeze: isClosed,
          note: notes[formName] || null,
        }),
      });
      if (res.ok) fetchSettings();
    } catch (error) {
      console.error("Error saving note:", error);
    } finally {
      setSavingNote((prev) => ({ ...prev, [formName]: false }));
    }
  }

  function handleScheduleChange(formName, field, value) {
    setSchedules((prev) => ({
      ...prev,
      [formName]: { ...prev[formName], [field]: value },
    }));
  }

  function handleClearDate(formName, field) {
    const updated = { ...schedules[formName], [field]: "" };
    setSchedules((prev) => ({ ...prev, [formName]: updated }));
    handleSaveSchedule(formName, updated);
  }

  function getFormStatus(formName) {
    const setting = formSettings.find((s) => s.form_name === formName);
    if (!setting)
      return {
        isClosed: false,
        isManual: false,
        isScheduled: false,
        isOverridden: false,
      };

    const effectivelyClosed = isEffectivelyClosed(setting);
    const overridden = isScheduleOverridden(setting);

    if (setting.is_frozen) {
      return {
        isClosed: true,
        isManual: true,
        isScheduled: false,
        isOverridden: false,
      };
    }
    if (effectivelyClosed) {
      return {
        isClosed: true,
        isManual: false,
        isScheduled: true,
        isOverridden: false,
      };
    }
    if (overridden) {
      return {
        isClosed: false,
        isManual: false,
        isScheduled: false,
        isOverridden: true,
      };
    }

    const now = new Date();
    if (setting.closes_at && new Date(setting.closes_at) > now) {
      return {
        isClosed: false,
        isManual: false,
        isScheduled: false,
        isOverridden: false,
        scheduledClose: setting.closes_at,
      };
    }

    return {
      isClosed: false,
      isManual: false,
      isScheduled: false,
      isOverridden: false,
    };
  }

  function hasUnsavedNote(formName) {
    const setting = formSettings.find((s) => s.form_name === formName);
    return (notes[formName] || "") !== (setting?.note || "");
  }

  async function fetchHireRate() {
    try {
      const res = await fetch("/api/hire/rate");
      const data = await res.json();
      setHireRate(String(data.rate || 85));
    } catch (error) {
      console.error("Error fetching hire rate:", error);
      setHireRate("85");
    }
  }

  async function handleSaveRate() {
    const rate = parseFloat(hireRate);
    if (isNaN(rate) || rate <= 0) return;
    setSavingRate(true);
    setRateSaved(false);
    try {
      const res = await fetch("/api/hire/rate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate }),
      });
      if (res.ok) {
        setRateSaved(true);
        setTimeout(() => setRateSaved(false), 4000);
      }
    } catch (error) {
      console.error("Error saving hire rate:", error);
    } finally {
      setSavingRate(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h3 className="text-md font-medium mb-4">{"Form Status"}</h3>
        <p className="text-sm text-text-secondary mb-4">
          {
            "Close forms to prevent users from making changes. You can also schedule auto-close and reopen times."
          }
        </p>

        {loading ? (
          <p className="text-text-secondary">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {forms.map((form) => {
              const status = getFormStatus(form.name);
              const isClosed = status.isClosed;
              const schedule = schedules[form.name] || {};
              const unsavedNote = hasUnsavedNote(form.name);
              const scheduleDisabled = status.isOverridden;

              return (
                <div
                  key={form.name}
                  className="p-4 border border-border rounded-lg"
                >
                  <div className="flex justify-between items-center">
                    <p className="font-medium">{form.label}</p>
                    <Switch
                      checked={!isClosed}
                      onChange={() => handleToggleClose(form.name)}
                      size="small"
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": {
                          color: "#16a34a",
                        },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                          {
                            backgroundColor: "#16a34a",
                          },
                      }}
                    />
                  </div>

                  {/* Status details */}
                  <div className="mt-1">
                    {status.isScheduled && (
                      <p className="text-xs text-text-secondary">
                        ({"auto-closed by schedule"})
                      </p>
                    )}
                    {status.scheduledClose && (
                      <p className="text-xs text-text-secondary">
                        (
                        {`Scheduled to close on ${new Date(status.scheduledClose).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`}
                        )
                      </p>
                    )}
                  </div>

                  {/* Note section */}
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <label className="text-xs font-medium text-text-secondary block mb-1">
                      {"Admin Note"}
                    </label>
                    <textarea
                      value={notes[form.name] || ""}
                      onChange={(e) =>
                        setNotes((prev) => ({
                          ...prev,
                          [form.name]: e.target.value,
                        }))
                      }
                      placeholder={
                        "Optional note displayed to users on the form page..."
                      }
                      className="w-full border border-border rounded px-2 py-1 text-sm min-h-[60px] resize-y"
                      rows={2}
                    />
                    {unsavedNote && (
                      <button
                        onClick={() => handleSaveNote(form.name)}
                        disabled={savingNote[form.name]}
                        className="mt-1 px-3 py-1 text-xs bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50"
                      >
                        {savingNote[form.name] ? "..." : "Save Note"}
                      </button>
                    )}
                  </div>

                  {/* Schedule section */}
                  <div
                    className={`mt-3 pt-3 border-t border-border/50 ${scheduleDisabled ? "opacity-50" : ""}`}
                  >
                    {scheduleDisabled && (
                      <p className="text-xs text-amber-600 mb-2 font-medium">
                        {
                          "Schedule inactive — manually overridden. Close the form to re-activate the schedule."
                        }
                      </p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-text-secondary block mb-1">
                          {"Auto-close date"}
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="datetime-local"
                            value={schedule.closes_at || ""}
                            onChange={(e) =>
                              handleScheduleChange(
                                form.name,
                                "closes_at",
                                e.target.value,
                              )
                            }
                            onBlur={() => handleSaveSchedule(form.name)}
                            className="border border-border rounded px-2 py-1 text-sm flex-1 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            disabled={scheduleDisabled}
                          />
                          {schedule.closes_at && !scheduleDisabled && (
                            <button
                              onClick={() =>
                                handleClearDate(form.name, "closes_at")
                              }
                              className="text-xs text-text-secondary hover:text-red-500 px-1"
                              title={"Clear"}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-text-secondary block mb-1">
                          {"Auto-reopen date"}
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="datetime-local"
                            value={schedule.reopens_at || ""}
                            onChange={(e) =>
                              handleScheduleChange(
                                form.name,
                                "reopens_at",
                                e.target.value,
                              )
                            }
                            onBlur={() => handleSaveSchedule(form.name)}
                            className="border border-border rounded px-2 py-1 text-sm flex-1 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            disabled={scheduleDisabled}
                          />
                          {schedule.reopens_at && !scheduleDisabled && (
                            <button
                              onClick={() =>
                                handleClearDate(form.name, "reopens_at")
                              }
                              className="text-xs text-text-secondary hover:text-red-500 px-1"
                              title={"Clear"}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    {savingSchedule[form.name] && (
                      <p className="mt-1 text-xs text-text-secondary">
                        {"Saving..."}
                      </p>
                    )}
                    {savedSchedule[form.name] && !savingSchedule[form.name] && (
                      <p className="mt-1 text-xs text-green-600">{"Saved!"}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hire Rate */}
      <div className="mb-8">
        <h3 className="text-md font-medium mb-4">{"Hire Rate"}</h3>
        <p className="text-sm text-text-secondary mb-4">
          {"Set the hourly rate for event photography requests."}
        </p>
        <div className="flex items-center gap-3 max-w-xs">
          <label className="text-sm font-medium whitespace-nowrap">
            {"Hourly Rate ($)"}
          </label>
          <input
            type="number"
            value={hireRate}
            onChange={(e) => setHireRate(e.target.value)}
            min="1"
            step="1"
            className="border border-border rounded px-3 py-2 text-sm w-24"
          />
          <button
            onClick={handleSaveRate}
            disabled={savingRate}
            className="px-4 py-2 bg-accent text-white rounded text-sm hover:bg-accent/90 disabled:opacity-50"
          >
            {savingRate ? "Saving..." : "Save"}
          </button>
        </div>
        {rateSaved && (
          <p className="text-sm text-green-600 mt-2">
            {"Rate updated successfully."}
          </p>
        )}
      </div>
    </div>
  );
}
