"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  TextField,
  Button,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTranslations, useLocale } from "next-intl";

const DORM_OPTIONS = [
  "Baker House",
  "Burton-Conner House",
  "East Campus",
  "Macgregor House",
  "Maseeh Hall",
  "McCormick Hall",
  "New House",
  "New Vassar",
  "Next House",
  "Random Hall",
  "Simmons Hall",
];

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

const toggleButtonGroupSx = {
  mb: 3,
  width: "100%",
  "& .MuiToggleButton-root": {
    flex: 1,
    textTransform: "none",
    fontWeight: 500,
    borderColor: "#E5E5E5",
    "&.Mui-selected": {
      backgroundColor: "#750014",
      color: "white",
      "&:hover": {
        backgroundColor: "#5C0010",
      },
    },
  },
};

export default function OrganizationAuthModal({ open, onClose }) {
  const t = useTranslations("pages.login.org");
  const locale = useLocale();

  // View state: 'signIn' or 'signUp'
  const [view, setView] = useState("signIn");

  // Common fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Sign in specific - org type toggle for sign in
  const [signInOrgType, setSignInOrgType] = useState("club");
  const [signInName, setSignInName] = useState(""); // For living group sign in

  // Sign up specific fields
  const [orgType, setOrgType] = useState("club");
  const [clubName, setClubName] = useState("");
  const [livingGroupType, setLivingGroupType] = useState("");
  const [dormName, setDormName] = useState("");
  const [fsilgName, setFsilgName] = useState("");

  // Dorm availability check
  const [takenDorms, setTakenDorms] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotOrgType, setForgotOrgType] = useState("club");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotName, setForgotName] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Field-level error states
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Fetch dorm availability when sign up view opens with living group selected
  useEffect(() => {
    if (open && view === "signUp" && orgType === "living_group") {
      fetchDormAvailability();
    }
  }, [open, view, orgType]);

  const fetchDormAvailability = async () => {
    setLoadingAvailability(true);
    try {
      const res = await fetch("/api/living-groups/check-availability");
      const data = await res.json();
      if (data.takenDorms) {
        setTakenDorms(data.takenDorms);
      }
    } catch (err) {
      console.error("Failed to check dorm availability:", err);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setOrgType("club");
    setSignInOrgType("club");
    setSignInName("");
    setClubName("");
    setLivingGroupType("");
    setDormName("");
    setFsilgName("");
    setError("");
    setSuccess("");
    setShowForgotPassword(false);
    setForgotOrgType("club");
    setForgotEmail("");
    setForgotName("");
    setFieldErrors({});
    setTouched({});
  };

  const handleClose = () => {
    resetForm();
    setView("signIn");
    onClose();
  };

  const switchView = (newView) => {
    setView(newView);
    setError("");
    setSuccess("");
  };

  const validateEmail = (email) => {
    if (!email) return t("emailRequired");
    if (!email.toLowerCase().endsWith("@mit.edu")) return t("emailInvalid");
    return null;
  };

  const validateSignIn = () => {
    if (signInOrgType === "club") {
      const emailError = validateEmail(email);
      if (emailError) return emailError;
    } else {
      if (!signInName.trim()) return t("livingGroupNameRequired");
    }
    if (!password) return t("passwordRequired");
    return null;
  };

  const validateSignUp = () => {
    if (!password) return t("passwordRequired");
    const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    if (password.length < 8 || !hasNumberOrSymbol) return t("passwordMin");
    if (password !== confirmPassword) return t("passwordMismatch");

    if (orgType === "club") {
      const emailError = validateEmail(email);
      if (emailError) return emailError;
      if (!clubName.trim()) return t("clubNameRequired");
    } else {
      // Living group - no email required
      if (!livingGroupType) return t("livingGroupTypeRequired");
      if (livingGroupType === "dorm" && !dormName) return t("dormRequired");
      if (livingGroupType === "fsilg" && !fsilgName.trim()) return t("fsilgNameRequired");
    }
    return null;
  };

  // Field-level validation
  const validateField = (field, value) => {
    switch (field) {
      case "email":
      case "forgotEmail":
        if (!value) return t("emailRequired");
        if (!value.toLowerCase().endsWith("@mit.edu")) return t("emailInvalid");
        return null;
      case "password":
        if (!value) return t("passwordRequired");
        const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
        if (value.length < 8 || !hasNumberOrSymbol) return t("passwordMin");
        return null;
      case "confirmPassword":
        if (!value) return t("passwordRequired");
        if (value !== password) return t("passwordMismatch");
        return null;
      case "clubName":
        if (!value.trim()) return t("clubNameRequired");
        return null;
      case "livingGroupType":
        if (!value) return t("livingGroupTypeRequired");
        return null;
      case "dormName":
        if (!value) return t("dormRequired");
        return null;
      case "fsilgName":
        if (!value.trim()) return t("fsilgNameRequired");
        return null;
      case "signInName":
      case "forgotName":
        if (!value.trim()) return t("livingGroupNameRequired");
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

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateSignIn();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        password,
        orgType: signInOrgType,
      };

      if (signInOrgType === "club") {
        payload.email = email;
      } else {
        payload.name = signInName.trim();
      }

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
        } else if (data.code === "LG_NOT_FOUND") {
          setError(t("livingGroupNotFound"));
        } else {
          setError(data.error || t("invalidCredentials"));
        }
        return;
      }

      setSuccess(t("signInSuccess"));
      setTimeout(() => {
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        }
      }, 1000);
    } catch (err) {
      setError(t("invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateSignUp();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        password,
        organizationType: orgType,
      };

      if (orgType === "club") {
        payload.email = email;
        payload.clubName = clubName.trim();
      } else {
        // Living group - no email needed
        payload.livingGroupType = livingGroupType;
        if (livingGroupType === "dorm") {
          payload.dormName = dormName;
        } else {
          payload.fsilgName = fsilgName.trim();
        }
      }

      const res = await fetch("/api/auth/org-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "EMAIL_EXISTS") {
          setError(t("accountExists"));
        } else if (data.code === "CLUB_NAME_EXISTS") {
          setError(t("clubNameExists"));
        } else if (data.code === "LG_NAME_EXISTS") {
          setError(t("livingGroupNameExists"));
        } else {
          setError(data.error || "Sign up failed");
        }
        return;
      }

      // Different success message and redirect for clubs vs living groups
      if (orgType === "club") {
        setSuccess(t("signUpSuccess"));
        // Clubs need email verification, so don't redirect immediately
      } else {
        setSuccess(t("signUpSuccessLivingGroup"));
        // Living groups don't need email verification, auto-sign in and redirect
        // Get the name used for signup
        const lgName = livingGroupType === "dorm" ? dormName : fsilgName.trim();
        try {
          const signInRes = await fetch("/api/auth/org-signin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              password,
              orgType: "living_group",
              name: lgName,
            }),
          });

          if (signInRes.ok) {
            setTimeout(() => {
              window.location.href = `/${locale}/living-group`;
            }, 1000);
          }
        } catch (signInErr) {
          // If auto-signin fails, they can still sign in manually
          console.error("Auto sign-in failed:", signInErr);
        }
      }
    } catch (err) {
      setError("Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (forgotOrgType === "club") {
      const emailError = validateEmail(forgotEmail);
      if (emailError) {
        setError(emailError);
        return;
      }
    } else {
      if (!forgotName.trim()) {
        setError(t("livingGroupNameRequired"));
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        orgType: forgotOrgType,
      };

      if (forgotOrgType === "club") {
        payload.email = forgotEmail;
      } else {
        payload.name = forgotName.trim();
      }

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
      if (forgotOrgType === "club") {
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

          {/* Organization Type Toggle */}
          <ToggleButtonGroup
            value={forgotOrgType}
            exclusive
            onChange={(e, value) => {
              if (value) {
                setForgotOrgType(value);
                setError("");
                setSuccess("");
              }
            }}
            sx={toggleButtonGroupSx}
          >
            <ToggleButton value="club">{t("signInOrgTypeClub")}</ToggleButton>
            <ToggleButton value="living_group">{t("signInOrgTypeLivingGroup")}</ToggleButton>
          </ToggleButtonGroup>

          {forgotOrgType === "living_group" && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: "0.85rem" }}>
              {t("forgotPasswordLivingGroupInfo")}
            </Typography>
          )}

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
            {forgotOrgType === "club" ? (
              <TextField
                fullWidth
                label={t("email")}
                placeholder={t("emailPlaceholder")}
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                onBlur={() => handleBlur("forgotEmail", forgotEmail)}
                error={touched.forgotEmail && !!fieldErrors.forgotEmail}
                helperText={touched.forgotEmail && fieldErrors.forgotEmail}
                sx={{ ...textFieldSx, mb: 3 }}
                disabled={loading || success}
              />
            ) : (
              <TextField
                fullWidth
                label={t("livingGroupName")}
                placeholder={t("livingGroupNamePlaceholder")}
                value={forgotName}
                onChange={(e) => setForgotName(e.target.value)}
                onBlur={() => handleBlur("forgotName", forgotName)}
                error={touched.forgotName && !!fieldErrors.forgotName}
                helperText={touched.forgotName && fieldErrors.forgotName}
                sx={{ ...textFieldSx, mb: 3 }}
                disabled={loading || success}
              />
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || success}
              sx={buttonSx}
            >
              {loading ? t("sendingResetLink") : t("sendResetLink")}
            </Button>

            <Button
              fullWidth
              onClick={() => {
                setShowForgotPassword(false);
                setForgotEmail("");
                setForgotName("");
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
        {view === "signIn" ? t("signInTitle") : t("signUpTitle")}
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

        {/* Sign In View */}
        {view === "signIn" && (
          <Box component="form" onSubmit={handleSignIn}>
            {/* Organization Type Toggle for Sign In */}
            <ToggleButtonGroup
              value={signInOrgType}
              exclusive
              onChange={(e, value) => {
                if (value) {
                  setSignInOrgType(value);
                  setError("");
                }
              }}
              sx={toggleButtonGroupSx}
            >
              <ToggleButton value="club">{t("signInOrgTypeClub")}</ToggleButton>
              <ToggleButton value="living_group">{t("signInOrgTypeLivingGroup")}</ToggleButton>
            </ToggleButtonGroup>

            {signInOrgType === "club" ? (
              <TextField
                fullWidth
                label={t("email")}
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur("email", email)}
                error={touched.email && !!fieldErrors.email}
                helperText={touched.email && fieldErrors.email}
                sx={{ ...textFieldSx, mb: 2 }}
                disabled={loading}
              />
            ) : (
              <TextField
                fullWidth
                label={t("livingGroupName")}
                placeholder={t("livingGroupNamePlaceholder")}
                value={signInName}
                onChange={(e) => setSignInName(e.target.value)}
                onBlur={() => handleBlur("signInName", signInName)}
                error={touched.signInName && !!fieldErrors.signInName}
                helperText={touched.signInName && fieldErrors.signInName}
                sx={{ ...textFieldSx, mb: 2 }}
                disabled={loading}
              />
            )}

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

            {/* Switch to Sign Up */}
            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Typography variant="body2" component="span" color="text.secondary">
                {t("needAccount")}{" "}
              </Typography>
              <Button
                size="small"
                onClick={() => switchView("signUp")}
                sx={linkButtonSx}
              >
                {t("signUp")}
              </Button>
            </Box>

            {/* Forgot Password */}
            <Box sx={{ textAlign: "center", mt: 1 }}>
              <Button
                size="small"
                onClick={() => setShowForgotPassword(true)}
                sx={linkButtonSx}
              >
                {t("forgotPassword")}
              </Button>
            </Box>
          </Box>
        )}

        {/* Sign Up View */}
        {view === "signUp" && (
          <Box component="form" onSubmit={handleSignUp}>
            {/* Organization Type Tabs */}
            <Tabs
              value={orgType === "club" ? 0 : 1}
              onChange={(e, value) => {
                setOrgType(value === 0 ? "club" : "living_group");
                setError("");
              }}
              variant="fullWidth"
              sx={{
                mb: 3,
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 500,
                },
                "& .MuiTab-root.Mui-selected": {
                  color: "#750014",
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: "#750014",
                },
              }}
            >
              <Tab label={t("club")} />
              <Tab label={t("livingGroup")} />
            </Tabs>

            {/* Club-specific fields */}
            {orgType === "club" && (
              <>
                <TextField
                  fullWidth
                  label={t("email")}
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur("email", email)}
                  error={touched.email && !!fieldErrors.email}
                  helperText={touched.email && fieldErrors.email}
                  sx={{ ...textFieldSx, mb: 2 }}
                  disabled={loading}
                />
                <TextField
                  fullWidth
                  type="password"
                  label={t("password")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur("password", password)}
                  error={touched.password && !!fieldErrors.password}
                  helperText={touched.password && fieldErrors.password}
                  sx={{ ...textFieldSx, mb: 2 }}
                  disabled={loading}
                />
                <TextField
                  fullWidth
                  type="password"
                  label={t("confirmPassword")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => handleBlur("confirmPassword", confirmPassword)}
                  error={touched.confirmPassword && !!fieldErrors.confirmPassword}
                  helperText={touched.confirmPassword && fieldErrors.confirmPassword}
                  sx={{ ...textFieldSx, mb: 2 }}
                  disabled={loading}
                />
                <TextField
                  fullWidth
                  label={t("clubName")}
                  placeholder={t("clubNamePlaceholder")}
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  onBlur={() => handleBlur("clubName", clubName)}
                  error={touched.clubName && !!fieldErrors.clubName}
                  helperText={(touched.clubName && fieldErrors.clubName) || t("clubNameCannotChange")}
                  sx={{ ...textFieldSx, mb: 3 }}
                  disabled={loading}
                />
              </>
            )}

            {/* Living Group-specific fields - NO EMAIL */}
            {orgType === "living_group" && (
              <>
                {/* Living Group Type FIRST */}
                <FormControl
                  fullWidth
                  sx={{ ...textFieldSx, mb: 2 }}
                  error={touched.livingGroupType && !!fieldErrors.livingGroupType}
                >
                  <InputLabel>{t("livingGroupType")}</InputLabel>
                  <Select
                    value={livingGroupType}
                    label={t("livingGroupType")}
                    onChange={(e) => {
                      setLivingGroupType(e.target.value);
                      setDormName("");
                      setFsilgName("");
                    }}
                    onBlur={() => handleBlur("livingGroupType", livingGroupType)}
                    disabled={loading}
                  >
                    <MenuItem value="dorm">{t("dorm")}</MenuItem>
                    <MenuItem value="fsilg">{t("fsilg")}</MenuItem>
                  </Select>
                  {touched.livingGroupType && fieldErrors.livingGroupType && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                      {fieldErrors.livingGroupType}
                    </Typography>
                  )}
                </FormControl>

                {/* Dorm dropdown with availability check */}
                {livingGroupType === "dorm" && (
                  <FormControl
                    fullWidth
                    sx={{ ...textFieldSx, mb: 2 }}
                    error={touched.dormName && !!fieldErrors.dormName}
                  >
                    <InputLabel>{t("selectDorm")}</InputLabel>
                    <Select
                      value={dormName}
                      label={t("selectDorm")}
                      onChange={(e) => setDormName(e.target.value)}
                      onBlur={() => handleBlur("dormName", dormName)}
                      disabled={loading || loadingAvailability}
                    >
                      {DORM_OPTIONS.map((dorm) => {
                        const isTaken = takenDorms.includes(dorm);
                        return (
                          <MenuItem
                            key={dorm}
                            value={dorm}
                            disabled={isTaken}
                            sx={isTaken ? { color: "text.disabled" } : {}}
                          >
                            {dorm}{isTaken ? ` ${t("dormTaken")}` : ""}
                          </MenuItem>
                        );
                      })}
                    </Select>
                    {touched.dormName && fieldErrors.dormName && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                        {fieldErrors.dormName}
                      </Typography>
                    )}
                  </FormControl>
                )}

                {/* FSILG name input */}
                {livingGroupType === "fsilg" && (
                  <TextField
                    fullWidth
                    label={t("fsilgName")}
                    placeholder={t("fsilgNamePlaceholder")}
                    value={fsilgName}
                    onChange={(e) => setFsilgName(e.target.value)}
                    onBlur={() => handleBlur("fsilgName", fsilgName)}
                    error={touched.fsilgName && !!fieldErrors.fsilgName}
                    helperText={touched.fsilgName && fieldErrors.fsilgName}
                    sx={{ ...textFieldSx, mb: 2 }}
                    disabled={loading}
                  />
                )}

                {/* Password fields AFTER name selection */}
                <TextField
                  fullWidth
                  type="password"
                  label={t("password")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur("password", password)}
                  error={touched.password && !!fieldErrors.password}
                  helperText={touched.password && fieldErrors.password}
                  sx={{ ...textFieldSx, mb: 2 }}
                  disabled={loading}
                />
                <TextField
                  fullWidth
                  type="password"
                  label={t("confirmPassword")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => handleBlur("confirmPassword", confirmPassword)}
                  error={touched.confirmPassword && !!fieldErrors.confirmPassword}
                  helperText={touched.confirmPassword && fieldErrors.confirmPassword}
                  sx={{ ...textFieldSx, mb: 3 }}
                  disabled={loading}
                />
              </>
            )}

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
                t("signUpButton")
              )}
            </Button>

            {/* Switch to Sign In */}
            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Typography variant="body2" component="span" color="text.secondary">
                {t("haveAccount")}{" "}
              </Typography>
              <Button
                size="small"
                onClick={() => switchView("signIn")}
                sx={linkButtonSx}
              >
                {t("signIn")}
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
