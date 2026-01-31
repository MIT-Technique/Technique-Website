"use client";
import Footer from "../../../components/Footer/Footer";
import { useState, useEffect } from "react";
import * as React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { Button } from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import Alert from "@mui/material/Alert";
import { useTranslations } from 'next-intl';

// Shared MUI text field styling
const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: "#E5E5E5" },
    "&:hover fieldset": { borderColor: "#D0D0D0" },
    "&.Mui-focused fieldset": { borderColor: "#750014" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "#750014" },
};

// Generate year options for old pictures (1861 to current year)
const currentYear = new Date().getFullYear();
const allYearOptions = [];
for (let y = currentYear; y >= 1861; y--) {
  allYearOptions.push(y);
}

export default function AlumniInquiryPage() {
  const t = useTranslations('pages.alumniInquiry');
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [category, setCategory] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingZip, setShippingZip] = useState("");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const [availableYearbookYears, setAvailableYearbookYears] = useState([]);
  const [loadingYears, setLoadingYears] = useState(false);
  const vertical = "top";
  const horizontal = "center";

  const categoryOptions = [
    { value: "oldYearbooks", label: t('fields.categoryOptions.oldYearbooks') },
    { value: "oldPictures", label: t('fields.categoryOptions.oldPictures') },
    { value: "other", label: t('fields.categoryOptions.other') },
  ];

  const showYearDropdown = category === "oldYearbooks" || category === "oldPictures";
  const isYearbookCategory = category === "oldYearbooks";
  const showShippingFields = isYearbookCategory && selectedYear;

  // Fetch available yearbook years when yearbook category is selected
  useEffect(() => {
    if (isYearbookCategory && availableYearbookYears.length === 0) {
      setLoadingYears(true);
      fetch('/api/yearbook-inventory?available=true')
        .then(res => res.json())
        .then(data => {
          setAvailableYearbookYears(data.years || []);
        })
        .catch(() => {
          setAvailableYearbookYears([]);
        })
        .finally(() => {
          setLoadingYears(false);
        });
    }
  }, [isYearbookCategory, availableYearbookYears.length]);

  function handleClose() {
    setOpen(false);
    setError(false);
  }

  function handleCategoryChange(value) {
    setCategory(value);
    setSelectedYear("");
    setShippingAddress("");
    setShippingCity("");
    setShippingState("");
    setShippingZip("");
  }

  const sendInquiry = async () => {
    // Build data object with conditional fields
    const data = {
      name,
      email,
      graduationYear,
      category: categoryOptions.find(opt => opt.value === category)?.label || category,
      message,
    };

    if (showYearDropdown && selectedYear) {
      data.requestedYear = selectedYear;
    }

    if (showShippingFields && shippingAddress) {
      data.shippingAddress = shippingAddress;
      data.shippingCity = shippingCity;
      data.shippingState = shippingState;
      data.shippingZip = shippingZip;
    }

    try {
      const response = await fetch("/api/sendContactForm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: "alumni",
          data,
        }),
      });

      if (!response.ok) throw new Error("Failed to send inquiry");
      console.log("Inquiry sent successfully");
      setName("");
      setEmail("");
      setGraduationYear("");
      setCategory("");
      setSelectedYear("");
      setShippingAddress("");
      setShippingCity("");
      setShippingState("");
      setShippingZip("");
      setMessage("");
      setOpen(true);
    } catch (err) {
      console.error(err);
      setError(true);
      setOpen(true);
    }
  };

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        <section className="section-tight container-narrow">
          <div className="text-center mb-8">
            <h1 className="mb-2">{t('title')}</h1>
            <p className="text-text-secondary">
              {t('description')}
            </p>
          </div>

          <Box
            component="form"
            className="card-elevated"
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
            onSubmit={async (event) => {
              event.preventDefault();
              await sendInquiry();
            }}
          >
            <TextField
              required
              label={t('fields.name')}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              value={name}
              onChange={(event) => setName(event.target.value)}
              name="name"
              sx={textFieldSx}
              fullWidth
            />
            <TextField
              required
              label={t('fields.email')}
              variant="outlined"
              type="email"
              InputLabelProps={{ shrink: true }}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              name="email"
              sx={textFieldSx}
              fullWidth
            />
            <TextField
              label={t('fields.graduationYear')}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              value={graduationYear}
              onChange={(event) => setGraduationYear(event.target.value)}
              name="graduationYear"
              sx={textFieldSx}
              fullWidth
            />
            <TextField
              required
              select
              label={t('fields.category')}
              value={category}
              onChange={(event) => handleCategoryChange(event.target.value)}
              name="category"
              sx={textFieldSx}
              fullWidth
            >
              {categoryOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            {/* Year dropdown - shown for oldYearbooks and oldPictures */}
            {showYearDropdown && (
              <TextField
                required
                select
                label={t('fields.yearRequested')}
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
                name="selectedYear"
                sx={textFieldSx}
                fullWidth
                disabled={isYearbookCategory && loadingYears}
              >
                <MenuItem value="" disabled>
                  {isYearbookCategory && loadingYears ? t('fields.loadingYears') : t('fields.selectYear')}
                </MenuItem>
                {isYearbookCategory
                  ? availableYearbookYears.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))
                  : allYearOptions.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))
                }
              </TextField>
            )}

            {/* No yearbooks available message */}
            {isYearbookCategory && !loadingYears && availableYearbookYears.length === 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-700 font-medium text-sm">
                  {t('fields.noYearbooksAvailable')}
                </p>
              </div>
            )}

            {/* Shipping address fields - shown when yearbook year is selected */}
            {showShippingFields && (
              <>
                <p className="text-sm text-text-secondary -mb-1">
                  {t('fields.shippingTitle')}
                </p>
                <TextField
                  label={t('fields.shippingAddress')}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  value={shippingAddress}
                  onChange={(event) => setShippingAddress(event.target.value)}
                  name="shippingAddress"
                  placeholder={t('fields.shippingAddressPlaceholder')}
                  sx={textFieldSx}
                  fullWidth
                />
                <div className="grid grid-cols-3 gap-2">
                  <TextField
                    label={t('fields.shippingCity')}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    value={shippingCity}
                    onChange={(event) => setShippingCity(event.target.value)}
                    name="shippingCity"
                    sx={textFieldSx}
                    fullWidth
                  />
                  <TextField
                    label={t('fields.shippingState')}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    value={shippingState}
                    onChange={(event) => setShippingState(event.target.value)}
                    name="shippingState"
                    sx={textFieldSx}
                    fullWidth
                  />
                  <TextField
                    label={t('fields.shippingZip')}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    value={shippingZip}
                    onChange={(event) => setShippingZip(event.target.value)}
                    name="shippingZip"
                    sx={textFieldSx}
                    fullWidth
                  />
                </div>
              </>
            )}

            <TextField
              required
              label={t('fields.message')}
              variant="outlined"
              multiline
              rows={4}
              InputLabelProps={{ shrink: true }}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              name="message"
              sx={textFieldSx}
              fullWidth
            />
            <Button
              type="submit"
              variant="contained"
              disabled={isYearbookCategory && (loadingYears || availableYearbookYears.length === 0)}
              sx={{
                mt: 2,
                backgroundColor: "#750014",
                "&:hover": {
                  backgroundColor: "#5C0010",
                },
                "&:active": {
                  backgroundColor: "#5C0010",
                  transform: "translateY(1px)",
                },
                "&:disabled": {
                  backgroundColor: "#ccc",
                },
                transition: "all 0.2s ease",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 500,
                py: 1.5,
                boxShadow: "none",
              }}
              fullWidth
            >
              {t('submitButton')}
            </Button>
          </Box>
        </section>
      </main>

      <Snackbar
        anchorOrigin={{ vertical, horizontal }}
        open={open}
        onClose={handleClose}
        autoHideDuration={4000}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            sx={{ p: 0.5 }}
            onClick={handleClose}
          >
            <CloseIcon />
          </IconButton>
        }
      >
        <Alert
          onClose={handleClose}
          severity={error ? "error" : "success"}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {error ? t('error') : t('success')}
        </Alert>
      </Snackbar>
      <Footer />
    </>
  );
}
