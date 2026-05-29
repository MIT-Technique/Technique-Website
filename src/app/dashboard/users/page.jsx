"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";
import { useUser } from "@/hooks/useUser";

const PAGE_SIZE = 15;
const ACCESS_OPTIONS = [
  { key: "clubs", label: "Clubs" },
  { key: "living_groups", label: "Living Groups" },
  { key: "sports", label: "Sports" },
  { key: "seniors", label: "Seniors" },
];

export default function UsersPage() {
  const { user: currentUser } = useUser();
  const isAdmin = currentUser?.role === "admin";
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(0);
  const searchParams = useSearchParams();
  const userTypeFilter = searchParams.get("type") || "all";

  // Reset page when user type filter changes
  useEffect(() => {
    setPage(0);
  }, [userTypeFilter]);

  // Admin designation state
  const [adminCount, setAdminCount] = useState(0);
  const [maxAdmins, setMaxAdmins] = useState(2);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [designatingUserId, setDesignatingUserId] = useState(null);

  // Staph toggle state
  const [togglingStaphUserId, setTogglingStaphUserId] = useState(null);

  // Access popover state
  const [accessPopoverUserId, setAccessPopoverUserId] = useState(null);
  const [accessPopoverPos, setAccessPopoverPos] = useState({ top: 0, left: 0 });
  const [accessDraft, setAccessDraft] = useState([]);
  const [savingAccess, setSavingAccess] = useState(false);

  // Create staph state
  const [showCreateStaph, setShowCreateStaph] = useState(false);
  const [newStaphKerb, setNewStaphKerb] = useState("");
  const [newStaphName, setNewStaphName] = useState("");
  const [newStaphAccess, setNewStaphAccess] = useState([]);
  const [creatingStaph, setCreatingStaph] = useState(false);
  const [staphCreated, setStaphCreated] = useState(false);

  // Photographer management state
  const [showAddPhotographer, setShowAddPhotographer] = useState(false);
  const [newPhotographerKerb, setNewPhotographerKerb] = useState("");
  const [newPhotographerName, setNewPhotographerName] = useState("");
  const [addingPhotographer, setAddingPhotographer] = useState(false);
  const [photographerAdded, setPhotographerAdded] = useState(false);

  // Generated password state (shown when promoting a photographer to staph/admin)
  const [promotionPassword, setPromotionPassword] = useState(null);
  const [promotionEmail, setPromotionEmail] = useState(null);

  // Ellipsis action menu state
  const [actionMenuUserId, setActionMenuUserId] = useState(null);
  const [actionMenuPos, setActionMenuPos] = useState({ top: 0, left: 0 });
  const actionMenuRef = useRef(null);

  // Confirmation modal state
  const [confirmAction, setConfirmAction] = useState(null);

  // Reset password state
  const [resetPasswordResult, setResetPasswordResult] = useState(null); // { userId, loginKey }
  const [resetPasswordLoading, setResetPasswordLoading] = useState(null); // userId
  const [resetCopied, setResetCopied] = useState(false);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter]);

  // Fetch admin designation info
  useEffect(() => {
    fetchAdminInfo();
  }, []);

  async function fetchAdminInfo() {
    try {
      const res = await fetch("/api/admin/designate-admin");
      const data = await res.json();
      setAdminCount(data.count || 0);
      setMaxAdmins(data.max || 2);
      setIsSuperAdmin(data.isSuperAdmin || false);
    } catch (error) {
      console.error("Error fetching admin info:", error);
    }
  }

  // Close action menu on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) {
        setActionMenuUserId(null);
      }
    }
    if (actionMenuUserId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [actionMenuUserId]);

  async function handleDisableUser(userId) {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive: false }),
      });
      if (res.ok) fetchUsers();
    } catch (error) {
      console.error("Error disabling user:", error);
    }
  }

  async function handleEnableUser(userId) {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive: true }),
      });
      if (res.ok) fetchUsers();
    } catch (error) {
      console.error("Error enabling user:", error);
    }
  }

  async function handleDeleteUser(userId) {
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  }

  async function handleResetPassword(userId) {
    setResetPasswordLoading(userId);
    setResetPasswordResult(null);
    try {
      const res = await fetch("/api/admin/org-login-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "reset" }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetPasswordResult({
          userId,
          loginKey: data.loginKey,
          emailSent: data.emailSent,
        });
      } else {
        alert(data.error || "Failed to reset password");
      }
    } catch {
      alert("Failed to reset password");
    } finally {
      setResetPasswordLoading(null);
    }
  }

  async function fetchUsers() {
    try {
      setLoading(true);
      let url = "/api/admin/users";
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      setUsers(data.users || []);
      setPage(0);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      setPromotionPassword(null);
      setPromotionEmail(null);
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.generatedPassword) {
          setPromotionPassword(data.generatedPassword);
          setPromotionEmail(data.user?.email);
        }
        fetchUsers();
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  }

  async function handleDesignateAdmin(userId) {
    if (!confirm("Designate this staph member as admin?")) return;

    setDesignatingUserId(userId);
    try {
      const res = await fetch("/api/admin/designate-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        fetchUsers();
        fetchAdminInfo();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to designate admin");
      }
    } catch (error) {
      console.error("Error designating admin:", error);
    } finally {
      setDesignatingUserId(null);
    }
  }

  async function handleToggleStaph(userId, currentIsStaph) {
    const confirmMsg = currentIsStaph
      ? "Revoke staph access from this user?"
      : "Grant staph access to this user?";
    if (!confirm(confirmMsg)) return;

    setTogglingStaphUserId(userId);
    try {
      const res = await fetch("/api/admin/toggle-staph", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to toggle staph status");
      }
    } catch (error) {
      console.error("Error toggling staph:", error);
    } finally {
      setTogglingStaphUserId(null);
    }
  }

  function openAccessPopover(user, e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const popoverHeight = 220;
    setAccessPopoverPos({
      top:
        spaceBelow > popoverHeight
          ? rect.bottom + 4
          : rect.top - popoverHeight - 4,
      left: rect.left,
    });
    setAccessPopoverUserId(user.id);
    setAccessDraft(user.access || []);
  }

  function toggleAccessDraft(key) {
    setAccessDraft((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  async function saveAccess(userId) {
    setSavingAccess(true);
    try {
      const res = await fetch("/api/admin/update-access", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, access: accessDraft }),
      });
      if (res.ok) {
        setAccessPopoverUserId(null);
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update access");
      }
    } catch (error) {
      console.error("Error updating access:", error);
    } finally {
      setSavingAccess(false);
    }
  }

  async function handleCreateStaph() {
    if (!newStaphKerb.trim() || !newStaphName.trim()) return;
    setCreatingStaph(true);
    setStaphCreated(false);
    try {
      const res = await fetch("/api/admin/create-staph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kerb: newStaphKerb.trim(),
          name: newStaphName.trim(),
          access: newStaphAccess,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStaphCreated(true);
        fetchUsers();
        setTimeout(() => {
          resetCreateStaph();
        }, 2000);
      } else {
        alert(data.error || "Failed to create staph account");
      }
    } catch (error) {
      console.error("Error creating staph:", error);
    } finally {
      setCreatingStaph(false);
    }
  }

  function resetCreateStaph() {
    setShowCreateStaph(false);
    setNewStaphKerb("");
    setNewStaphName("");
    setNewStaphAccess([]);
    setStaphCreated(false);
  }

  async function handleAddPhotographer() {
    if (!newPhotographerKerb.trim() || !newPhotographerName.trim()) return;
    setAddingPhotographer(true);
    setPhotographerAdded(false);
    try {
      const res = await fetch("/api/admin/create-photographer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kerb: newPhotographerKerb.trim(),
          name: newPhotographerName.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPhotographerAdded(true);
        setNewPhotographerKerb("");
        setNewPhotographerName("");
        fetchUsers();
        setTimeout(() => setPhotographerAdded(false), 4000);
      } else {
        alert(data.error || "Failed to add photographer");
      }
    } catch (error) {
      console.error("Error creating photographer:", error);
    } finally {
      setAddingPhotographer(false);
    }
  }

  function resetAddPhotographer() {
    setShowAddPhotographer(false);
    setNewPhotographerKerb("");
    setNewPhotographerName("");
    setPhotographerAdded(false);
  }

  const ORG_ROLES = ["club", "living_group", "sports"];
  const baseFilteredUsers =
    userTypeFilter === "individual"
      ? users.filter((u) => !ORG_ROLES.includes(u.role))
      : userTypeFilter === "orgs"
        ? users.filter((u) => ORG_ROLES.includes(u.role))
        : users;

  const filteredUsers = baseFilteredUsers;
  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const paginatedUsers = filteredUsers.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  return (
    <div>
      {/* Search, Pagination, and Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={"Search by email or name"}
          className="border border-border rounded px-3 py-2 text-sm flex-1 min-w-[200px]"
        />
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-2 py-1 text-sm border border-border rounded disabled:opacity-30 hover:bg-bg-secondary"
          >
            ←
          </button>
          <span className="text-sm text-text-muted px-2 whitespace-nowrap">
            {page + 1} / {totalPages || 1}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-2 py-1 text-sm border border-border rounded disabled:opacity-30 hover:bg-bg-secondary"
          >
            →
          </button>
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-border rounded px-3 py-2 text-sm"
        >
          <option value="all">{"All Roles"}</option>
          <option value="club">{"Club"}</option>
          <option value="living_group">{"Living Group"}</option>
          <option value="sports">{"Sports"}</option>
          <option value="admin">{"Admin"}</option>
        </select>
      </div>

      {/* Generated password banner (shown when promoting a photographer to staph/admin) */}
      {isAdmin && promotionPassword && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-800 font-medium mb-1">
            Login credentials generated for {promotionEmail}
          </p>
          <div className="flex items-center gap-2">
            <code className="text-sm bg-white px-2 py-1 rounded border border-green-300 select-all">
              {promotionPassword}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(promotionPassword)}
              className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              {"Copy"}
            </button>
            <button
              onClick={() => {
                setPromotionPassword(null);
                setPromotionEmail(null);
              }}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
            >
              {"Done"}
            </button>
          </div>
        </div>
      )}

      {/* Reset password result banner */}
      {isAdmin && resetPasswordResult && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-800 font-medium mb-1">
            {"Password has been reset."}{" "}
            {resetPasswordResult.emailSent
              ? "An email with the new credentials has been sent."
              : "Email failed to send — share the password manually."}
          </p>
          <div className="flex items-center gap-2">
            <code className="text-sm bg-white px-2 py-1 rounded border border-green-300 select-all">
              {resetPasswordResult.loginKey}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(resetPasswordResult.loginKey);
                setResetCopied(true);
                setTimeout(() => setResetCopied(false), 2000);
              }}
              className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              {resetCopied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={() => setResetPasswordResult(null)}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
            >
              {"Done"}
            </button>
          </div>
        </div>
      )}

      {/* Users List */}
      {loading ? (
        <p className="text-text-secondary">Loading...</p>
      ) : filteredUsers.length === 0 ? (
        <p className="text-text-secondary">{"No users found"}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2">{"Email"}</th>
                <th className="text-left py-2 px-2">{"Name"}</th>
                <th className="text-left py-2 px-2">{"Role"}</th>
                <th className="text-left py-2 px-2">{"Access"}</th>
                <th className="text-left py-2 px-2">{"Status"}</th>
                <th className="py-2 px-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border/50 group/row"
                >
                  <td
                    className="py-2 px-2 max-w-[200px] truncate"
                    title={user.email}
                  >
                    {user.email}
                  </td>
                  <td
                    className="py-2 px-2 max-w-[150px] truncate"
                    title={user.name}
                  >
                    {user.name}
                  </td>
                  <td className="py-2 px-2">
                    {isAdmin ? (
                      ORG_ROLES.includes(user.role) ? (
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleRoleChange(user.id, e.target.value)
                          }
                          className="border border-border rounded px-2 py-1 text-xs"
                        >
                          <option value="club">Club</option>
                          <option value="living_group">Living Group</option>
                          <option value="sports">Sports</option>
                        </select>
                      ) : (
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleRoleChange(user.id, e.target.value)
                          }
                          className="border border-border rounded px-2 py-1 text-xs"
                        >
                          <option value="staph">Staph</option>
                          <option value="admin">Admin</option>
                          <option value="photographer">Photographer</option>
                        </select>
                      )
                    ) : (
                      <span className="text-xs capitalize">
                        {user.role.replace(/_/g, " ")}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 relative">
                    {isAdmin &&
                    ![
                      "club",
                      "living_group",
                      "sports",
                      "photographer",
                    ].includes(user.role) ? (
                      <>
                        <button
                          onClick={(e) =>
                            accessPopoverUserId === user.id
                              ? setAccessPopoverUserId(null)
                              : openAccessPopover(user, e)
                          }
                          className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                        >
                          {"Permissions"}
                          {user.access?.length > 0 &&
                            ` (${user.access.length})`}
                        </button>
                        {accessPopoverUserId === user.id && (
                          <div
                            style={{
                              position: "fixed",
                              top: accessPopoverPos.top,
                              left: accessPopoverPos.left,
                              zIndex: 50,
                            }}
                            className="bg-white border border-border rounded-lg shadow-lg p-3 min-w-[200px]"
                          >
                            <p className="text-xs font-medium mb-2">
                              {"Response Access"}
                            </p>
                            {ACCESS_OPTIONS.map((opt) => (
                              <label
                                key={opt.key}
                                className="flex items-center gap-2 py-1 text-xs cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={accessDraft.includes(opt.key)}
                                  onChange={() => toggleAccessDraft(opt.key)}
                                  className="rounded"
                                />
                                {opt.label}
                              </label>
                            ))}
                            <div className="flex gap-2 mt-2 pt-2 border-t border-border">
                              <button
                                onClick={() => saveAccess(user.id)}
                                disabled={savingAccess}
                                className="text-xs px-2 py-1 bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50"
                              >
                                {savingAccess ? "..." : "Save"}
                              </button>
                              <button
                                onClick={() => setAccessPopoverUserId(null)}
                                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                              >
                                {"Cancel"}
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-text-muted">—</span>
                    )}
                  </td>
                  <td className="py-2 px-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        user.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          if (actionMenuUserId === user.id) {
                            setActionMenuUserId(null);
                          } else {
                            const rect =
                              e.currentTarget.getBoundingClientRect();
                            setActionMenuPos({
                              top: rect.bottom + 4,
                              left: rect.right - 180,
                            });
                            setActionMenuUserId(user.id);
                          }
                        }}
                        className={`text-lg px-2 py-0.5 rounded hover:bg-gray-100 transition-opacity ${
                          actionMenuUserId === user.id
                            ? "opacity-100"
                            : "opacity-0 group-hover/row:opacity-100"
                        }`}
                      >
                        ⋯
                      </button>
                    )}
                    {isAdmin && actionMenuUserId === user.id && (
                      <div
                        ref={actionMenuRef}
                        style={{
                          position: "fixed",
                          top: actionMenuPos.top,
                          left: actionMenuPos.left,
                          zIndex: 50,
                        }}
                        className="bg-white border border-border rounded-lg shadow-lg py-1 w-[180px]"
                      >
                        {/* Disable / Enable */}
                        {user.is_active ? (
                          <button
                            onClick={() => {
                              setActionMenuUserId(null);
                              setConfirmAction({
                                type: "disable",
                                userId: user.id,
                                title: "Disable User",
                                message:
                                  "Are you sure you want to disable this user? They will not be able to log in.",
                              });
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50"
                          >
                            {"Disable User"}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setActionMenuUserId(null);
                              setConfirmAction({
                                type: "enable",
                                userId: user.id,
                                title: "Enable User",
                                message:
                                  "Are you sure you want to re-enable this user?",
                              });
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50"
                          >
                            {"Enable User"}
                          </button>
                        )}

                        {/* Designate Admin */}
                        {isSuperAdmin &&
                          user.role === "staph" &&
                          user.is_staph &&
                          adminCount < maxAdmins && (
                            <button
                              onClick={() => {
                                setActionMenuUserId(null);
                                handleDesignateAdmin(user.id);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50"
                            >
                              {"Designate Admin"}
                            </button>
                          )}

                        {/* Reset Password */}
                        {user.supabase_auth_id && (
                          <button
                            onClick={() => {
                              setActionMenuUserId(null);
                              setConfirmAction({
                                type: "resetPassword",
                                userId: user.id,
                                title: "Reset Password",
                                message:
                                  "Generate a new password for this user? The old password will stop working. An email with the new credentials will be sent.",
                              });
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50"
                          >
                            {"Reset Password"}
                          </button>
                        )}

                        {/* Delete User */}
                        <button
                          onClick={() => {
                            setActionMenuUserId(null);
                            setConfirmAction({
                              type: "delete",
                              userId: user.id,
                              title: "Delete User",
                              message:
                                "Are you sure you want to permanently delete this user? This cannot be undone.",
                            });
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-red-50 text-red-600"
                        >
                          {"Delete User"}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Staph + Photographer Buttons - only on Individual tab */}
      {userTypeFilter === "individual" && (
        <div className="mt-8 border-t border-border pt-6">
          <div className="flex gap-3">
            {isAdmin && (
              <button
                onClick={() => setShowCreateStaph(true)}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 text-sm"
              >
                {"Create Staph Account"}
              </button>
            )}
            <button
              onClick={() => setShowAddPhotographer(true)}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 text-sm"
            >
              {"Add Photographer"}
            </button>
          </div>
        </div>
      )}

      {/* Create Staph Modal */}
      {isAdmin && showCreateStaph && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={resetCreateStaph}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-medium">{"Create Staph Account"}</h3>
            <div>
              <label className="block text-xs text-text-secondary mb-1">
                {"MIT Kerberos"}
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newStaphKerb}
                  onChange={(e) => setNewStaphKerb(e.target.value)}
                  placeholder="kerb"
                  className="border border-border rounded px-3 py-2 text-sm flex-1"
                  disabled={staphCreated}
                />
                <span className="text-sm text-text-muted">@mit.edu</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">
                {"Name"}
              </label>
              <input
                type="text"
                value={newStaphName}
                onChange={(e) => setNewStaphName(e.target.value)}
                placeholder="Full Name"
                className="border border-border rounded px-3 py-2 text-sm w-full"
                disabled={staphCreated}
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">
                {"Permissions"}
              </label>
              <div className="flex flex-wrap gap-3">
                {ACCESS_OPTIONS.map((opt) => (
                  <label
                    key={opt.key}
                    className="flex items-center gap-1.5 text-xs cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={newStaphAccess.includes(opt.key)}
                      onChange={() =>
                        setNewStaphAccess((prev) =>
                          prev.includes(opt.key)
                            ? prev.filter((k) => k !== opt.key)
                            : [...prev, opt.key],
                        )
                      }
                      className="rounded"
                      disabled={staphCreated}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {staphCreated && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-800 font-medium">
                  {"Account created. Copy the password before closing:"}
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={resetCreateStaph}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm"
              >
                {"Cancel"}
              </button>
              {!staphCreated && (
                <button
                  onClick={handleCreateStaph}
                  disabled={
                    creatingStaph ||
                    !newStaphKerb.trim() ||
                    !newStaphName.trim()
                  }
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 text-sm"
                >
                  {creatingStaph ? "..." : "Create Account"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Photographer Modal */}
      {showAddPhotographer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={resetAddPhotographer}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-medium">{"Add Photographer"}</h3>
            <div>
              <label className="block text-xs text-text-secondary mb-1">
                {"Photographer Email"}
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newPhotographerKerb}
                  onChange={(e) => setNewPhotographerKerb(e.target.value)}
                  placeholder="kerb"
                  className="border border-border rounded px-3 py-2 text-sm flex-1"
                />
                <span className="text-sm text-text-muted">@mit.edu</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">
                {"Name (optional)"} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newPhotographerName}
                onChange={(e) => setNewPhotographerName(e.target.value)}
                placeholder="Full Name"
                className="border border-border rounded px-3 py-2 text-sm w-full"
                required
              />
            </div>

            {photographerAdded && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-800 font-medium">
                  {"Photographer added successfully."}
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={resetAddPhotographer}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm"
              >
                {"Cancel"}
              </button>
              <button
                onClick={handleAddPhotographer}
                disabled={
                  addingPhotographer ||
                  !newPhotographerKerb.trim() ||
                  !newPhotographerName.trim()
                }
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 text-sm"
              >
                {addingPhotographer ? "..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for disable/enable/delete */}
      <ConfirmationModal
        open={!!confirmAction}
        title={confirmAction?.title || ""}
        message={confirmAction?.message || ""}
        isDangerous={
          confirmAction?.type === "delete" || confirmAction?.type === "disable"
        }
        onConfirm={async () => {
          if (!confirmAction) return;
          const { type, userId } = confirmAction;
          setConfirmAction(null);
          if (type === "disable") await handleDisableUser(userId);
          else if (type === "enable") await handleEnableUser(userId);
          else if (type === "delete") await handleDeleteUser(userId);
          else if (type === "resetPassword") await handleResetPassword(userId);
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
