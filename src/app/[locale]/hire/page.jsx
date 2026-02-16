"use client";
import React, { useState, useEffect, useCallback } from "react";
import Footer from "../../../components/Footer/Footer";
import Image from "next/image";
import { useTranslations } from "next-intl";

const EVENT_TYPES = ["conference", "performance", "social", "competition", "other"];

function HirePage() {
  const t = useTranslations("pages.hire");

  const [photographerEmail, setPhotographerEmail] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Check session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (data.photographerEmail) {
          setPhotographerEmail(data.photographerEmail);
        }
      } catch (e) {
        console.error("Session check error:", e);
      } finally {
        setCheckingSession(false);
      }
    }
    checkSession();
  }, []);

  const images = [
    {
      src: "/images/other_images/Alison_Soong/20240915-P1050432.jpg",
      photographer: "Alison Soong",
    },
    {
      src: "/images/other_images/Jade_Chongsathapornpong/_TNA2320.jpg",
      photographer: "Jade Chongsathapornpong",
    },
    {
      src: "/images/other_images/Jade_Chongsathapornpong/_TNA3975C.jpg",
      photographer: "Jade Chongsathapornpong",
    },
  ];

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        {/* Hero Section */}
        <section className="section-tight container-text text-center">
          <h1 className="mb-4">{t("title")}</h1>
          <p className="text-lg text-text-secondary font-light">{t("hero")}</p>
        </section>

        {/* Main Content: Form or Photographer Panel */}
        <section className="section container-text">
          {photographerEmail ? (
            <PhotographerPanel
              t={t}
              photographerEmail={photographerEmail}
              onSignOut={() => setPhotographerEmail(null)}
            />
          ) : (
            <>
              <HireRequestForm t={t} />
              <PhotographerSignIn
                t={t}
                onSignIn={(email) => setPhotographerEmail(email)}
              />
            </>
          )}
        </section>

        {/* Image Gallery Strip */}
        <section className="w-full mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3">
            {images.map((image, index) => (
              <figure
                key={index}
                className="relative aspect-[4/3] group overflow-hidden"
              >
                <Image
                  src={image.src}
                  alt={t("imageAlt", { photographer: image.photographer })}
                  fill={true}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  priority={index < 3}
                  style={{ objectFit: "cover" }}
                  className="transition-transform duration-500 group-hover:scale-105"
                />
                <figcaption className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-end justify-end p-4">
                  <span className="text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {image.photographer}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Description Section */}
        <section className="section container-text text-center">
          <p className="mb-4">{t("description")}</p>
        </section>
      </main>
      <Footer />
    </>
  );
}

// ─── Hire Request Form ───────────────────────────────────────────────────────

function HireRequestForm({ t }) {
  const [rate, setRate] = useState(null);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const [form, setForm] = useState({
    requesterName: "",
    requesterEmail: "",
    eventName: "",
    eventType: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    location: "",
    description: "",
    confirmationCode: "",
  });

  useEffect(() => {
    fetch("/api/hire/rate")
      .then((r) => r.json())
      .then((data) => setRate(data.rate))
      .catch(() => setRate(85));
  }, []);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Reset lookup state when code or email changes
    if (field === "confirmationCode" || field === "requesterEmail") {
      setLookupDone(false);
    }
  }

  // Look up existing request when code and email are both filled
  async function handleLookup() {
    if (!form.confirmationCode || !form.requesterEmail) return;
    setLookingUp(true);
    setError("");
    try {
      const params = new URLSearchParams({
        code: form.confirmationCode,
        email: form.requesterEmail,
      });
      const res = await fetch(`/api/hire/request?${params}`);
      const data = await res.json();
      if (data.found) {
        setForm((prev) => ({
          ...prev,
          requesterName: data.request.requesterName,
          eventName: data.request.eventName,
          eventType: data.request.eventType,
          eventDate: data.request.eventDate,
          startTime: data.request.startTime,
          endTime: data.request.endTime,
          location: data.request.location,
          description: data.request.description,
        }));
        setLookupDone(true);
      } else {
        setError("No request found with that code and email.");
      }
    } catch (err) {
      setError("Failed to look up request");
    } finally {
      setLookingUp(false);
    }
  }

  // Calculate duration and cost
  const durationHours = (() => {
    if (!form.startTime || !form.endTime) return 0;
    const [sh, sm] = form.startTime.split(":").map(Number);
    const [eh, em] = form.endTime.split(":").map(Number);
    const diff = (eh * 60 + em - (sh * 60 + sm)) / 60;
    return diff > 0 ? Math.round(diff * 100) / 100 : 0;
  })();

  const totalCost = rate && durationHours > 0 ? Math.round(rate * durationHours * 100) / 100 : 0;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const body = {
        requesterName: form.requesterName,
        requesterEmail: form.requesterEmail,
        eventName: form.eventName,
        eventType: form.eventType,
        eventDate: form.eventDate,
        startTime: form.startTime,
        endTime: form.endTime,
        location: form.location,
        description: form.description,
      };

      if (isUpdateMode && form.confirmationCode) {
        body.confirmationCode = form.confirmationCode;
      }

      const res = await fetch("/api/hire/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setConfirmation(data);
    } catch (err) {
      setError("Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCopyCode() {
    if (confirmation?.confirmationCode) {
      navigator.clipboard.writeText(confirmation.confirmationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function resetForm() {
    setConfirmation(null);
    setCopied(false);
    setIsUpdateMode(false);
    setLookupDone(false);
    setForm({
      requesterName: "",
      requesterEmail: "",
      eventName: "",
      eventType: "",
      eventDate: "",
      startTime: "",
      endTime: "",
      location: "",
      description: "",
      confirmationCode: "",
    });
  }

  async function handleCancel() {
    if (!confirmation?.confirmationCode) return;
    setCancelling(true);
    setError("");
    try {
      const params = new URLSearchParams({
        code: confirmation.confirmationCode,
        email: confirmation.requesterEmail || form.requesterEmail,
      });
      const res = await fetch(`/api/hire/request?${params}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to cancel request");
        setCancelling(false);
        return;
      }
      resetForm();
    } catch (err) {
      setError("Failed to cancel request");
      setCancelling(false);
    }
  }

  function handleEdit() {
    if (!confirmation?.confirmationCode) return;
    const code = confirmation.confirmationCode;
    const email = confirmation.requesterEmail || form.requesterEmail;
    setConfirmation(null);
    setCopied(false);
    setIsUpdateMode(true);
    setForm((prev) => ({
      ...prev,
      confirmationCode: code,
      requesterEmail: email,
    }));
    setLookupDone(false);
  }

  // Today's date in YYYY-MM-DD for min attribute
  const today = new Date().toLocaleDateString("en-CA"); // en-CA gives YYYY-MM-DD

  // Generate 30-minute interval time options (00:00 – 23:30)
  const allTimeSlots = (() => {
    const slots = [];
    for (let h = 0; h < 24; h++) {
      for (const m of [0, 30]) {
        const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        const hour12 = h % 12 || 12;
        const ampm = h >= 12 ? "PM" : "AM";
        const label = `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
        slots.push({ value, label });
      }
    }
    return slots;
  })();

  // If the selected date is today, filter out past time slots
  const startTimeSlots = (() => {
    if (form.eventDate !== today) return allTimeSlots;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return allTimeSlots.filter((slot) => {
      const [h, m] = slot.value.split(":").map(Number);
      return h * 60 + m > nowMinutes;
    });
  })();

  // End time slots: only show times after the selected start time
  const endTimeSlots = (() => {
    if (!form.startTime) return allTimeSlots;
    const [sh, sm] = form.startTime.split(":").map(Number);
    const startMinutes = sh * 60 + sm;
    return allTimeSlots.filter((slot) => {
      const [h, m] = slot.value.split(":").map(Number);
      return h * 60 + m > startMinutes;
    });
  })();

  const inputClass = "w-full bg-transparent border-b border-border-dark/40 px-0 py-2.5 text-sm text-text-primary placeholder:text-text-muted/60 outline-none transition-colors duration-200 focus:border-accent";
  const labelClass = "block text-[11px] uppercase tracking-widest text-text-muted mb-1.5";
  const selectClass = "w-full bg-transparent border-b border-border-dark/40 pr-5 py-2.5 text-sm text-text-primary outline-none transition-colors duration-200 focus:border-accent appearance-none cursor-pointer bg-[length:10px] bg-[right_0_center] bg-no-repeat bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%20-1%2010%206%22%3E%3Cpath%20d%3D%22M0%200l5%204%205-4%22%20fill%3D%22none%22%20stroke%3D%22%23999%22%20stroke-width%3D%221.2%22%2F%3E%3C%2Fsvg%3E')]";

  // Confirmation view
  if (confirmation) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="w-12 h-px bg-accent mx-auto mb-8" />
        <h2 className="text-2xl font-light tracking-tight mb-2">
          {confirmation.updated ? t("confirmation.updated") : t("confirmation.title")}
        </h2>

        <p className="text-xs uppercase tracking-widest text-text-muted mt-8 mb-3">{t("confirmation.code")}</p>
        <div className="flex items-center justify-center gap-3 mb-6">
          <code className="text-2xl font-light tracking-[0.3em] text-text-primary select-all">
            {confirmation.confirmationCode}
          </code>
          <button
            onClick={handleCopyCode}
            className="text-[11px] uppercase tracking-widest text-accent hover:text-accent-hover transition-colors"
          >
            {copied ? t("confirmation.copied") : t("confirmation.copyCode")}
          </button>
        </div>

        <div className="w-full h-px bg-border mb-6" />

        <p className="text-sm text-text-secondary font-light pb-1">
          {t("confirmation.rateBreakdown", {
            rate: `$${confirmation.hourlyRate}`,
            hours: confirmation.durationHours,
            total: confirmation.totalCost.toFixed(2),
          })}
        </p>

        <p className="text-xs text-text-muted font-light mb-8">{t("confirmation.saveCode")}</p>

        {error && <p className="text-xs text-red-700 mb-4">{error}</p>}

        <button onClick={resetForm} className="btn-primary">
          {t("confirmation.submitAnother")}
        </button>

        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={handleEdit}
            className="text-[11px] uppercase tracking-widest text-text-muted hover:text-accent transition-colors"
          >
            {t("confirmation.edit")}
          </button>
          <span className="text-border">·</span>
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="text-[11px] uppercase tracking-widest text-text-muted hover:text-red-600 disabled:opacity-50 transition-colors"
          >
            {cancelling ? t("confirmation.cancelling") : t("confirmation.cancel")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="border border-border/70 rounded px-8 py-10 sm:px-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-8 h-px bg-accent mx-auto mb-5" />
          <h2 className="text-xl font-light tracking-tight">
            {isUpdateMode ? t("form.updateTitle") : t("form.title")}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Update mode lookup */}
          {isUpdateMode && (
            <div className="space-y-6 pb-6 mb-2 border-b border-border/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <label className={labelClass}>{t("form.confirmationCodeLabel")}</label>
                  <input
                    type="text"
                    value={form.confirmationCode}
                    onChange={(e) => updateField("confirmationCode", e.target.value.toUpperCase())}
                    placeholder={t("form.confirmationCodePlaceholder")}
                    className={`${inputClass} font-mono tracking-wider`}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("form.emailForUpdate")}</label>
                  <input
                    type="email"
                    value={form.requesterEmail}
                    onChange={(e) => updateField("requesterEmail", e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                    required
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleLookup}
                disabled={lookingUp || !form.confirmationCode || !form.requesterEmail}
                className="text-[11px] uppercase tracking-widest text-accent hover:text-accent-hover disabled:opacity-30 transition-colors"
              >
                {lookingUp ? "Looking up..." : lookupDone ? "Request loaded" : "Load existing request"}
              </button>
            </div>
          )}

          {/* Name & Email */}
          <div className={`grid grid-cols-1 ${isUpdateMode ? '' : 'sm:grid-cols-2'} gap-x-6 gap-y-5`}>
            <div>
              <label className={labelClass}>{t("form.requesterName")}</label>
              <input
                type="text"
                value={form.requesterName}
                onChange={(e) => updateField("requesterName", e.target.value)}
                className={inputClass}
                required
              />
            </div>
            {!isUpdateMode && (
            <div>
              <label className={labelClass}>{t("form.requesterEmail")}</label>
              <input
                type="email"
                value={form.requesterEmail}
                onChange={(e) => updateField("requesterEmail", e.target.value)}
                className={inputClass}
                required
              />
            </div>
            )}
          </div>

          {/* Event Name & Type */}
          <div className="grid grid-cols-[1fr_9rem] gap-x-6">
            <div>
              <label className={labelClass}>{t("form.eventName")}</label>
              <input
                type="text"
                value={form.eventName}
                onChange={(e) => updateField("eventName", e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>{t("form.eventType")}</label>
              <select
                value={form.eventType}
                onChange={(e) => updateField("eventType", e.target.value)}
                className={selectClass}
                required
              >
                <option value="" disabled></option>
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`form.eventTypes.${type}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className={labelClass}>{t("form.location")}</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => updateField("location", e.target.value)}
              placeholder={t("form.locationPlaceholder")}
              className={inputClass}
            />
          </div>

          {/* Date & Times */}
          <div className="grid grid-cols-3 gap-x-6">
            <div>
              <label className={labelClass}>{t("form.eventDate")}</label>
              <input
                type="date"
                value={form.eventDate}
                onChange={(e) => updateField("eventDate", e.target.value)}
                min={today}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>{t("form.startTime")}</label>
              <select
                value={form.startTime}
                onChange={(e) => {
                  updateField("startTime", e.target.value);
                  // Clear end time if it's no longer valid
                  if (form.endTime) {
                    const [sh, sm] = e.target.value.split(":").map(Number);
                    const [eh, em] = form.endTime.split(":").map(Number);
                    if (eh * 60 + em <= sh * 60 + sm) updateField("endTime", "");
                  }
                }}
                className={selectClass}
                required
              >
                <option value="" disabled></option>
                {startTimeSlots.map((slot) => (
                  <option key={slot.value} value={slot.value}>{slot.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t("form.endTime")}</label>
              <select
                value={form.endTime}
                onChange={(e) => updateField("endTime", e.target.value)}
                className={selectClass}
                required
              >
                <option value="" disabled></option>
                {endTimeSlots.map((slot) => (
                  <option key={slot.value} value={slot.value}>{slot.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cost estimate */}
          {rate && durationHours > 0 && (
            <div className="flex items-baseline justify-between py-3 border-y border-border/40">
              <span className="text-[11px] uppercase tracking-widest text-text-muted">{t("form.estimatedCost")}</span>
              <span className="text-sm text-text-primary">
                ${rate}/hr &times; {durationHours} hrs ={" "}
                <span className="font-medium text-accent">${totalCost.toFixed(2)}</span>
              </span>
            </div>
          )}

          {/* Description */}
          <div>
            <label className={labelClass}>{t("form.description")}</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder={t("form.descriptionPlaceholder")}
              rows={3}
              className={`${inputClass} resize-y border-b-0 border-l border-l-border/30 pl-3`}
            />
          </div>

          {error && <p className="text-xs text-red-700">{error}</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full disabled:opacity-50 mt-2"
          >
            {submitting ? t("form.submitting") : t("form.submit")}
          </button>
        </form>
      </div>

      <p className="text-center mt-5">
        <button
          onClick={() => setIsUpdateMode(!isUpdateMode)}
          className="text-[11px] uppercase tracking-widest text-text-muted hover:text-accent transition-colors"
        >
          {isUpdateMode ? t("form.switchToNew") : t("form.switchToUpdate")}
        </button>
      </p>
    </div>
  );
}

// ─── Photographer Sign In ────────────────────────────────────────────────────

function PhotographerSignIn({ t, onSignIn }) {
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");

  async function handleSignIn(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    setSigningIn(true);

    try {
      const res = await fetch("/api/hire/photographer-signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.authorized) {
        setError(t("photographer.unauthorized"));
        return;
      }

      onSignIn(email.trim().toLowerCase());
    } catch (err) {
      setError("Failed to sign in");
    } finally {
      setSigningIn(false);
    }
  }

  if (!expanded) {
    return (
      <p className="text-center mt-8">
        <button
          onClick={() => setExpanded(true)}
          className="text-[11px] uppercase tracking-widest text-text-muted hover:text-accent transition-colors"
        >
          {t("photographer.signIn")}
        </button>
      </p>
    );
  }

  return (
    <div className="mt-8 max-w-xs mx-auto">
      <form onSubmit={handleSignIn} className="flex items-center gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("photographer.emailPlaceholder")}
          autoFocus
          className="flex-1 border-b border-border-dark/40 bg-transparent px-0 py-1.5 text-xs outline-none focus:border-accent transition-colors"
          required
        />
        <button
          type="submit"
          disabled={signingIn || !email.trim()}
          className="text-[11px] uppercase tracking-widest text-accent hover:text-accent-hover disabled:opacity-30 whitespace-nowrap transition-colors"
        >
          {signingIn ? t("photographer.signingIn") : t("photographer.signInButton")}
        </button>
      </form>
      {error && <p className="text-[11px] text-red-700 mt-1 text-center">{error}</p>}
    </div>
  );
}

// ─── Photographer Panel ──────────────────────────────────────────────────────

function PhotographerPanel({ t, photographerEmail, onSignOut }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/hire/requests");
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (e) {
      console.error("Error fetching requests:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function handleClaim(requestId) {
    setClaimingId(requestId);
    try {
      const res = await fetch("/api/hire/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      if (res.ok) {
        fetchRequests();
      }
    } catch (e) {
      console.error("Error claiming:", e);
    } finally {
      setClaimingId(null);
    }
  }

  async function handleSignOut() {
    try {
      // Clear photographer session
      await fetch("/api/hire/photographer-signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "", signOut: true }),
      });
    } catch (e) {
      // Ignore - we'll clear locally regardless
    }
    onSignOut();
  }

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const myClaimedRequests = requests.filter(
    (r) => r.status === "claimed" && r.claimed_by === photographerEmail
  );
  const otherRequests = requests.filter(
    (r) => r.status !== "pending" && !(r.status === "claimed" && r.claimed_by === photographerEmail)
  );

  function statusBadge(status) {
    const styles = {
      pending: "border-amber-400/60 text-amber-700 bg-amber-50",
      claimed: "border-blue-400/60 text-blue-700 bg-blue-50",
      completed: "border-emerald-400/60 text-emerald-700 bg-emerald-50",
      cancelled: "border-red-300/60 text-red-600 bg-red-50",
    };
    return (
      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm border ${styles[status] || "border-gray-300 bg-gray-50 text-gray-600"}`}>
        {t(`photographer.status${status.charAt(0).toUpperCase() + status.slice(1)}`)}
      </span>
    );
  }

  function RequestCard({ request, showClaim }) {
    const dateStr = new Date(request.event_date + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeStr = `${request.start_time?.slice(0, 5)} – ${request.end_time?.slice(0, 5)} EST`;

    return (
      <div className="border-l-2 border-accent/30 pl-4 py-2">
        <div className="flex justify-between items-center mb-1.5">
          <h4 className="text-sm font-medium text-text-primary">{request.event_name}</h4>
          {statusBadge(request.status)}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[12px] text-text-muted">
          <span>{dateStr}</span>
          <span>{timeStr}</span>
          {request.location && <span>{request.location}</span>}
        </div>
        <div className="flex flex-wrap justify-between items-center mt-1.5 text-[12px]">
          <span className="text-text-muted">
            {request.requester_name} · {request.requester_email}
          </span>
          <span className="text-text-primary font-medium">
            ${request.hourly_rate}/hr &times; {request.duration_hours}h = ${request.total_cost}
          </span>
        </div>
        {request.claimed_by && request.status === "claimed" && (
          <p className="text-[11px] text-blue-600/80 mt-1">
            {t("photographer.claimedBy", { email: request.claimed_by })}
          </p>
        )}
        {showClaim && request.status === "pending" && (
          <button
            onClick={() => handleClaim(request.id)}
            disabled={claimingId === request.id}
            className="mt-2 px-3 py-1 bg-accent text-white text-[11px] uppercase tracking-wider hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            {claimingId === request.id
              ? t("photographer.claiming")
              : t("photographer.claimButton")}
          </button>
        )}
      </div>
    );
  }

  const PAGE_SIZE = 2;
  const [pendingPage, setPendingPage] = useState(0);
  const [claimedPage, setClaimedPage] = useState(0);
  const [otherPage, setOtherPage] = useState(0);

  // Reset pages when requests change
  useEffect(() => {
    setPendingPage(0);
    setClaimedPage(0);
    setOtherPage(0);
  }, [requests]);

  function PaginatedSection({ title, items, emptyText, page, setPage, showClaim }) {
    const totalPages = Math.ceil(items.length / PAGE_SIZE);
    const paged = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[11px] uppercase tracking-widest text-text-muted">{title}</h3>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="text-text-muted hover:text-text-primary disabled:opacity-25 transition-colors"
                aria-label="Previous page"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <span className="text-[10px] tabular-nums text-text-muted">
                {page + 1}/{totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="text-text-muted hover:text-text-primary disabled:opacity-25 transition-colors"
                aria-label="Next page"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          )}
        </div>
        {items.length === 0 ? (
          <p className="text-[12px] text-text-muted/60 italic">{emptyText}</p>
        ) : (
          <div className="space-y-3">
            {paged.map((r) => (
              <RequestCard key={r.id} request={r} showClaim={showClaim} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-baseline mb-8">
        <h2 className="text-lg font-light tracking-wide text-text-primary">{t("photographer.panelTitle")}</h2>
        <button
          onClick={handleSignOut}
          className="text-[11px] uppercase tracking-wider text-text-muted hover:text-red-600 transition-colors"
        >
          {t("photographer.signOut")}
        </button>
      </div>

      {loading ? (
        <p className="text-[12px] text-text-muted">Loading...</p>
      ) : (
        <>
          <PaginatedSection
            title={t("photographer.pendingRequests")}
            items={pendingRequests}
            emptyText={t("photographer.noRequests")}
            page={pendingPage}
            setPage={setPendingPage}
            showClaim
          />
          <PaginatedSection
            title={t("photographer.myClaimedEvents")}
            items={myClaimedRequests}
            emptyText={t("photographer.noClaimed")}
            page={claimedPage}
            setPage={setClaimedPage}
            showClaim={false}
          />
          {otherRequests.length > 0 && (
            <PaginatedSection
              title={t("photographer.allRequests")}
              items={otherRequests}
              emptyText=""
              page={otherPage}
              setPage={setOtherPage}
              showClaim={false}
            />
          )}
        </>
      )}
    </div>
  );
}

export default HirePage;
