"use client";
import * as React from "react";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Typography,
  Autocomplete,
  Paper,
  Popper,
  ClickAwayListener,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useTranslations, useLocale } from "next-intl";

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: "#E5E5E5" },
    "&:hover fieldset": { borderColor: "#D0D0D0" },
    "&.Mui-focused fieldset": { borderColor: "#750014" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "#750014" },
};

const buttonSx = {
  backgroundColor: "#750014",
  "&:hover": { backgroundColor: "#5C0010" },
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  fontWeight: 500,
  py: 1.5,
  boxShadow: "none",
};

const linkButtonSx = {
  textTransform: "none",
  color: "#750014",
  p: 0,
  minWidth: "auto",
  "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
};

export default function OrganizationAuthModal({ open, onClose }) {
  const t = useTranslations("pages.login.org");
  const locale = useLocale();

  // Organizations list
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // Form fields
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [password, setPassword] = useState("");

  // Dropdown state
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const dropdownAnchorRef = useRef(null);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotSelectedOrg, setForgotSelectedOrg] = useState(null);
  const [forgotInputValue, setForgotInputValue] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Field-level error states
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Fetch organizations when modal opens
  useEffect(() => {
    if (open) {
      fetchOrganizations();
    }
  }, [open]);

  const fetchOrganizations = async () => {
    setLoadingOrgs(true);
    try {
      const res = await fetch("/api/organizations/list", { cache: "no-store" });
      const data = await res.json();
      if (data.organizations) {
        setOrganizations(data.organizations);
      }
    } catch (err) {
      console.error("Failed to fetch organizations:", err);
    } finally {
      setLoadingOrgs(false);
    }
  };

  // Sort and group organizations - clubs first, then living groups, then sports, alphabetically within each group
  const typeOrder = { club: 0, living_group: 1, sports: 2 };
  const sortedOrganizations = useMemo(() => {
    return [...organizations].sort((a, b) => {
      const orderA = typeOrder[a.type] ?? 99;
      const orderB = typeOrder[b.type] ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });
  }, [organizations]);

  // Get group label for an organization
  const getGroupLabel = (option) => {
    if (option.type === "club") return t("clubsGroup");
    if (option.type === "sports") return t("sportsGroup");
    return t("livingGroupsGroup");
  };

  const resetForm = () => {
    setSelectedOrg(null);
    setInputValue("");
    setPassword("");
    setError("");
    setSuccess("");
    setShowForgotPassword(false);
    setForgotSelectedOrg(null);
    setForgotInputValue("");
    setFieldErrors({});
    setTouched({});
    setShowDropdown(false);
    setDropdownSearch("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateSignIn = () => {
    if (!inputValue.trim()) return t("organizationRequired");
    if (!password) return t("passwordRequired");
    return null;
  };

  // Field-level validation
  const validateField = (field, value) => {
    switch (field) {
      case "organization":
        if (!value || !value.trim()) return t("organizationRequired");
        return null;
      case "password":
        if (!value) return t("passwordRequired");
        return null;
      default:
        return null;
    }
  };

  const handleBlur = (field, value) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, value);
    setFieldErrors((prev) => ({ ...prev, [field]: error }));
  };

  // Filter organizations for dropdown based on search
  const filteredDropdownOrgs = useMemo(() => {
    if (!dropdownSearch.trim()) return sortedOrganizations;
    const search = dropdownSearch.toLowerCase();
    return sortedOrganizations.filter(org =>
      org.name.toLowerCase().includes(search)
    );
  }, [sortedOrganizations, dropdownSearch]);

  // Select organization from dropdown
  const handleSelectOrg = (org) => {
    setInputValue(org.name);
    setSelectedOrg(org);
    setShowDropdown(false);
    setDropdownSearch("");
    setFieldErrors((prev) => ({ ...prev, organization: null }));
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateSignIn();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Find org by name if user typed manually (case-insensitive)
    let orgToUse = selectedOrg;
    if (!orgToUse || orgToUse.name.toLowerCase() !== inputValue.trim().toLowerCase()) {
      const foundOrg = organizations.find(
        org => org.name.toLowerCase() === inputValue.trim().toLowerCase()
      );
      if (foundOrg) {
        orgToUse = foundOrg;
      }
    }

    setLoading(true);
    try {
      const payload = {
        password,
        orgType: orgToUse?.type || "club", // Default to club, API will handle validation
        name: inputValue.trim(),
        locale,
      };

      const res = await fetch("/api/auth/org-signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "EMAIL_NOT_VERIFIED") {
          setError(t("emailNotVerified"));
        } else if (data.code === "INVALID_CREDENTIALS") {
          setError(t("invalidCredentials"));
        } else if (data.code === "LG_NOT_FOUND" || data.code === "CLUB_NOT_FOUND" || data.code === "SPORTS_NOT_FOUND") {
          setError(t("organizationNotFound"));
        } else {
          setError(data.error || t("invalidCredentials"));
        }
        return;
      }

      setSuccess(t("successRedirecting"));
      window.location.href = data.redirectUrl || `/${locale}/`;
    } catch (err) {
      setError(t("invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!forgotSelectedOrg) {
      setError(t("organizationRequired"));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        orgType: forgotSelectedOrg.type,
        name: forgotSelectedOrg.name,
      };

      const res = await fetch("/api/auth/org-forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok && data.code === "NO_LEADER") {
        setError(t("noLeaderError"));
        return;
      }

      // Show success message
      if (forgotSelectedOrg.type === "club") {
        setSuccess(t("resetLinkSent"));
      } else {
        setSuccess(data.message || t("resetSentToLeader"));
      }
    } catch (err) {
      setSuccess(t("resetLinkSent"));
    } finally {
      setLoading(false);
    }
  };

  // Custom Paper component for Autocomplete dropdown with max 3 visible items
  const CustomPaper = (props) => (
    <Paper
      {...props}
      sx={{
        maxHeight: 180, // Allow room for group headers + 3 items
        overflow: "auto",
      }}
    />
  );

  // Forgot Password View
  if (showForgotPassword) {
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {t("forgotPasswordTitle")}
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t("forgotPasswordDescription")}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleForgotPassword}>
            <Autocomplete
              options={sortedOrganizations}
              groupBy={getGroupLabel}
              getOptionLabel={(option) => option.name || ""}
              value={forgotSelectedOrg}
              onChange={(event, newValue) => {
                setForgotSelectedOrg(newValue);
              }}
              inputValue={forgotInputValue}
              onInputChange={(event, newInputValue) => {
                setForgotInputValue(newInputValue);
              }}
              loading={loadingOrgs}
              PaperComponent={CustomPaper}
              renderGroup={(params) => (
                <li key={params.key}>
                  <Typography
                    sx={{
                      position: "sticky",
                      top: 0,
                      padding: "8px 16px",
                      backgroundColor: "#f5f5f5",
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "#666",
                      borderBottom: "1px solid #e0e0e0",
                    }}
                  >
                    {params.group}
                  </Typography>
                  <ul style={{ padding: 0, margin: 0 }}>{params.children}</ul>
                </li>
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id} style={{ paddingTop: '10px', paddingBottom: '6px' }}>
                  <Typography variant="body1">{option.name}</Typography>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t("selectOrganization")}
                  placeholder={t("searchOrganization")}
                  sx={{ ...textFieldSx, mb: 3 }}
                  disabled={loading || success}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingOrgs ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              noOptionsText={t("noOrganizationsFound")}
              disabled={loading || success}
            />

            {forgotSelectedOrg?.type === "living_group" && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: "0.85rem" }}>
                {t("forgotPasswordLivingGroupInfo")}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || success || !forgotSelectedOrg}
              sx={buttonSx}
            >
              {loading ? t("sendingResetLink") : t("sendResetLink")}
            </Button>

            <Button
              fullWidth
              onClick={() => {
                setShowForgotPassword(false);
                setForgotSelectedOrg(null);
                setForgotInputValue("");
                setError("");
                setSuccess("");
              }}
              sx={{ mt: 2, textTransform: "none" }}
            >
              {t("backToSignIn")}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {t("signInTitle")}
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSignIn} sx={{ mt: 1 }}>
          {/* Organization Input with Dropdown Button */}
          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }} ref={dropdownAnchorRef}>
            <TextField
              fullWidth
              label={t("selectOrganization")}
              placeholder={t("searchOrganization")}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                // Clear selectedOrg if user manually edits
                if (selectedOrg && e.target.value !== selectedOrg.name) {
                  setSelectedOrg(null);
                }
                setFieldErrors((prev) => ({ ...prev, organization: null }));
              }}
              onBlur={() => handleBlur("organization", inputValue)}
              error={touched.organization && !!fieldErrors.organization}
              sx={textFieldSx}
              disabled={loading}
              autoComplete="organization"
              name="organization"
            />
            <IconButton
              onClick={() => {
                setShowDropdown(!showDropdown);
                setDropdownSearch("");
              }}
              disabled={loading || loadingOrgs}
              sx={{
                border: "1px solid #E5E5E5",
                borderRadius: 1,
                width: 56,
                height: 56,
                flexShrink: 0,
                "&:hover": { borderColor: "#D0D0D0", backgroundColor: "#f5f5f5" },
              }}
            >
              {loadingOrgs ? (
                <CircularProgress size={20} />
              ) : (
                <ArrowDropDownIcon />
              )}
            </IconButton>
          </Box>
          {/* Error message outside the flexbox */}
          {touched.organization && fieldErrors.organization && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75, display: "block" }}>
              {fieldErrors.organization}
            </Typography>
          )}
          <Box sx={{ mb: 2 }} />

          {/* Dropdown Popper */}
          <Popper
            open={showDropdown}
            anchorEl={dropdownAnchorRef.current}
            placement="bottom-start"
            style={{ zIndex: 1301, width: dropdownAnchorRef.current?.offsetWidth || 300 }}
          >
            <ClickAwayListener onClickAway={() => setShowDropdown(false)}>
              <Paper sx={{ maxHeight: 300, overflow: "auto", boxShadow: 3 }}>
                {/* Search within dropdown */}
                <Box sx={{ p: 1, borderBottom: "1px solid #e0e0e0" }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder={t("searchOrganization")}
                    value={dropdownSearch}
                    onChange={(e) => setDropdownSearch(e.target.value)}
                    autoFocus
                    sx={textFieldSx}
                  />
                </Box>

                {/* Grouped organizations list */}
                {filteredDropdownOrgs.length === 0 ? (
                  <Typography sx={{ p: 2, color: "#666" }}>
                    {t("noOrganizationsFound")}
                  </Typography>
                ) : (
                  <>
                    {/* Clubs */}
                    {filteredDropdownOrgs.filter(o => o.type === "club").length > 0 && (
                      <>
                        <Typography
                          sx={{
                            position: "sticky",
                            top: 0,
                            padding: "8px 12px",
                            backgroundColor: "#f5f5f5",
                            fontWeight: 600,
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: "#666",
                            borderBottom: "1px solid #e0e0e0",
                          }}
                        >
                          {t("clubsGroup")}
                        </Typography>
                        {filteredDropdownOrgs
                          .filter(o => o.type === "club")
                          .map((org) => (
                            <Box
                              key={org.id}
                              onClick={() => handleSelectOrg(org)}
                              sx={{
                                px: 2,
                                pt: 2,
                                mb: 0,
                                cursor: "pointer",
                                "&:hover": { backgroundColor: "#f5f5f5" },
                                backgroundColor: selectedOrg?.id === org.id ? "#e3f2fd" : "transparent",
                              }}
                            >
                              <Typography variant="body1">{org.name}</Typography>
                            </Box>
                          ))}
                      </>
                    )}

                    {/* Living Groups */}
                    {filteredDropdownOrgs.filter(o => o.type === "living_group").length > 0 && (
                      <>
                        <Typography
                          sx={{
                            position: "sticky",
                            top: 0,
                            padding: "8px 16px",
                            backgroundColor: "#f5f5f5",
                            fontWeight: 600,
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: "#666",
                            borderBottom: "1px solid #e0e0e0",
                          }}
                        >
                          {t("livingGroupsGroup")}
                        </Typography>
                        {filteredDropdownOrgs
                          .filter(o => o.type === "living_group")
                          .map((org) => (
                            <Box
                              key={org.id}
                              onClick={() => handleSelectOrg(org)}
                              sx={{
                                px: 2,
                                pt: 2,
                                pb: 0,
                                cursor: "pointer",
                                "&:hover": { backgroundColor: "#f5f5f5" },
                                backgroundColor: selectedOrg?.id === org.id ? "#e3f2fd" : "transparent",
                              }}
                            >
                              <Typography variant="body1">{org.name}</Typography>
                            </Box>
                          ))}
                      </>
                    )}

                    {/* Sports */}
                    {filteredDropdownOrgs.filter(o => o.type === "sports").length > 0 && (
                      <>
                        <Typography
                          sx={{
                            position: "sticky",
                            top: 0,
                            padding: "8px 16px",
                            backgroundColor: "#f5f5f5",
                            fontWeight: 600,
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: "#666",
                            borderBottom: "1px solid #e0e0e0",
                          }}
                        >
                          {t("sportsGroup")}
                        </Typography>
                        {filteredDropdownOrgs
                          .filter(o => o.type === "sports")
                          .map((org) => (
                            <Box
                              key={org.id}
                              onClick={() => handleSelectOrg(org)}
                              sx={{
                                px: 2,
                                pt: 2,
                                pb: 0,
                                cursor: "pointer",
                                "&:hover": { backgroundColor: "#f5f5f5" },
                                backgroundColor: selectedOrg?.id === org.id ? "#e3f2fd" : "transparent",
                              }}
                            >
                              <Typography variant="body1">{org.name}</Typography>
                            </Box>
                          ))}
                      </>
                    )}
                  </>
                )}
              </Paper>
            </ClickAwayListener>
          </Popper>

          <TextField
            fullWidth
            type="password"
            label={t("password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => handleBlur("password", password)}
            error={touched.password && !!fieldErrors.password}
            helperText={touched.password && fieldErrors.password}
            sx={{ ...textFieldSx, mb: 3 }}
            disabled={loading}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={buttonSx}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "white" }} />
            ) : (
              t("signInButton")
            )}
          </Button>

          {/* Forgot Password */}
          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Button
              size="small"
              onClick={() => window.open('mailto:tnq-exec@mit.edu', '_blank')}
              sx={linkButtonSx}
            >
              {t("unexpectedIssues")}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
