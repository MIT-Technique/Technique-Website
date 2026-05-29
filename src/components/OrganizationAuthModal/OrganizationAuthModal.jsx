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

export default function OrganizationAuthModal({ open, onClose, defaultTab = "organization" }) {
  // Tab state
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Staph login state
  const [staphEmail, setStaphEmail] = useState("");
  const [staphPassword, setStaphPassword] = useState("");
  const [staphLoading, setStaphLoading] = useState(false);
  const [staphMessage, setStaphMessage] = useState({ type: "", text: "" });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizations]);

  // Get group label for an organization
  const getGroupLabel = (option) => {
    if (option.type === "club") return "Clubs";
    if (option.type === "sports") return "Sports";
    return "Living Groups";
  };

  // Reset tab to defaultTab when modal opens
  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);

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
    setStaphEmail("");
    setStaphPassword("");
    setStaphLoading(false);
    setStaphMessage({ type: "", text: "" });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateSignIn = () => {
    if (!inputValue.trim()) return "Please select an organization";
    if (!password) return "Password is required";
    return null;
  };

  // Field-level validation
  const validateField = (field, value) => {
    switch (field) {
      case "organization":
        if (!value || !value.trim()) return "Please select an organization";
        return null;
      case "password":
        if (!value) return "Password is required";
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
      };

      const res = await fetch("/api/auth/org-signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "EMAIL_NOT_VERIFIED") {
          setError("Please verify your email before signing in");
        } else if (data.code === "INVALID_CREDENTIALS") {
          setError("Invalid credentials");
        } else if (data.code === "LG_NOT_FOUND" || data.code === "CLUB_NOT_FOUND" || data.code === "SPORTS_NOT_FOUND") {
          setError("Organization not found");
        } else {
          setError(data.error || "Invalid credentials");
        }
        return;
      }

      setSuccess("Success! Redirecting…");
      window.location.href = data.redirectUrl || `/`;
    } catch (err) {
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!forgotSelectedOrg) {
      setError("Please select an organization");
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
        setError("No leader assigned to this Living Group. Please contact tnq-exec@mit.edu for assistance.");
        return;
      }

      // Show success message
      if (forgotSelectedOrg.type === "club") {
        setSuccess("If an account exists, a reset link has been sent.");
      } else {
        setSuccess(data.message || "Password reset info has been sent. Check with your Living Group Leader.");
      }
    } catch (err) {
      setSuccess("If an account exists, a reset link has been sent.");
    } finally {
      setLoading(false);
    }
  };

  const handleStaphLogin = async (e) => {
    e.preventDefault();
    if (!staphPassword) {
      setStaphMessage({ type: "error", text: "Password is required" });
      return;
    }
    setStaphLoading(true);
    setStaphMessage({ type: "", text: "" });
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: staphEmail || undefined, password: staphPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setStaphMessage({ type: "success", text: "Login successful! Redirecting..." });
        setTimeout(() => {
          window.location.href = data.redirectUrl;
        }, 500);
      } else {
        setStaphMessage({ type: "error", text: data.error || "Invalid credentials. Please try again." });
      }
    } catch (err) {
      setStaphMessage({ type: "error", text: "Invalid credentials. Please try again." });
    } finally {
      setStaphLoading(false);
    }
  };

  // Switch tab and clear errors
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setError("");
    setSuccess("");
    setStaphMessage({ type: "", text: "" });
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
          {"Reset Password"}
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {"Select your organization to receive a password reset link."}
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
                  label={"Name"}
                  placeholder={"Search for your organization..."}
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
              noOptionsText={"No organizations found"}
              disabled={loading || success}
            />

            {forgotSelectedOrg?.type === "living_group" && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: "0.85rem" }}>
                {"A password reset link will be sent to your Living Group Leader's email."}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || success || !forgotSelectedOrg}
              sx={buttonSx}
            >
              {loading ? "Sending..." : "Send Reset Link"}
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
              {"Back to Sign In"}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  const tabStyle = (tab) => ({
    flex: 1,
    py: 1.5,
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    borderBottom: activeTab === tab ? "2px solid #750014" : "2px solid transparent",
    color: activeTab === tab ? "#750014" : "#999",
    borderRadius: 0,
    "&:hover": { backgroundColor: "transparent", color: activeTab === tab ? "#750014" : "#666" },
  });

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
        {"Sign In"}
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Tabs */}
      <Box sx={{ display: "flex", borderBottom: "1px solid #e0e0e0", px: 3 }}>
        <Button disableRipple onClick={() => handleTabSwitch("organization")} sx={tabStyle("organization")}>
          {"Organization"}
        </Button>
        <Button disableRipple onClick={() => handleTabSwitch("staph")} sx={tabStyle("staph")}>
          {"Staph"}
        </Button>
      </Box>

      <DialogContent>
        {activeTab === "organization" ? (
          <>
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
                  label={"Name"}
                  placeholder={"Search for your organization..."}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
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
                    <Box sx={{ p: 1, borderBottom: "1px solid #e0e0e0" }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder={"Search for your organization..."}
                        value={dropdownSearch}
                        onChange={(e) => setDropdownSearch(e.target.value)}
                        autoFocus
                        sx={textFieldSx}
                      />
                    </Box>

                    {filteredDropdownOrgs.length === 0 ? (
                      <Typography sx={{ p: 2, color: "#666" }}>
                        {"No organizations found"}
                      </Typography>
                    ) : (
                      <>
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
                              {"Clubs"}
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
                              {"Living Groups"}
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
                              {"Sports"}
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
                label={"Password"}
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
                  "Sign In"
                )}
              </Button>

              <Box sx={{ textAlign: "center", mt: 2 }}>
                <Button
                  size="small"
                  onClick={() => window.open('mailto:tnq-exec@mit.edu', '_blank')}
                  sx={linkButtonSx}
                >
                  {"Unexpected issues?"}
                </Button>
              </Box>
            </Box>
          </>
        ) : (
          /* Staph Login Tab */
          <>
            {staphMessage.text && (
              <Alert severity={staphMessage.type === "success" ? "success" : "error"} sx={{ mb: 2 }}>
                {staphMessage.text}
              </Alert>
            )}

            <Box component="form" onSubmit={handleStaphLogin} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                type="email"
                label={"Email"}
                placeholder={"Leave blank for admin login"}
                value={staphEmail}
                onChange={(e) => setStaphEmail(e.target.value)}
                sx={{ ...textFieldSx, mb: 2 }}
                disabled={staphLoading}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                fullWidth
                type="password"
                label={"Password"}
                placeholder={"Enter password"}
                value={staphPassword}
                onChange={(e) => setStaphPassword(e.target.value)}
                sx={{ ...textFieldSx, mb: 3 }}
                disabled={staphLoading}
                InputLabelProps={{ shrink: true }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={staphLoading || !staphPassword}
                sx={buttonSx}
              >
                {staphLoading ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Sign In"
                )}
              </Button>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
