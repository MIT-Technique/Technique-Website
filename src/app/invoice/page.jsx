"use client";
import Footer from "../../components/Footer/Footer";
import { useState } from "react";
import * as React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { Button } from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import Alert from "@mui/material/Alert";

// Shared MUI text field styling
const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: "#E5E5E5" },
    "&:hover fieldset": { borderColor: "#D0D0D0" },
    "&.Mui-focused fieldset": { borderColor: "#750014" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "#750014" },
};

export default function InvoicePage() {
  const [orgName, setOrgName] = useState("");
  const [photographerName, setPhotographerName] = useState("");
  const [eventName, setEventName] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [totalHours, setTotalHours] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [costObject, setCostObject] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const vertical = "top";
  const horizontal = "center";

  function handleClose() {
    setOpen(false);
    setError(false);
  }

  function formatToMMDDYYYY(dateString) {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  const sendInvoice = async () => {
    const pdfData = {
      cast9d67e7e0383511f099c92fb5678df49d: formatToMMDDYYYY(Date.now()),
      caste96492b0383511f099c92fb5678df49d: totalHours,
      cast2704f0b0383611f099c92fb5678df49d: hourlyRate,
      cast340493b0383611f099c92fb5678df49d: totalHours * hourlyRate,
      cast5a9096a0383611f099c92fb5678df49d: totalHours * hourlyRate,
      cast7037cd20383611f099c92fb5678df49d: eventName,
      cast81ba1210383611f099c92fb5678df49d: orgName,
      cast8b5f1860383611f099c92fb5678df49d: photographerName,
      cast9454cbe0383611f099c92fb5678df49d: eventDate,
    };
    const pdfData2 = {
      invoiceDate: formatToMMDDYYYY(Date.now()),
      totalHours: totalHours,
      hourlyRate: hourlyRate,
      totalCost: totalHours * hourlyRate,
      eventName: eventName,
      orgName: orgName,
      photographerName: photographerName,
      eventDate: eventDate,
    };

    try {
      const response = await fetch("/api/sendInvoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anvilData: { data: pdfData },
          pdfData: pdfData2,
          emailData: {
            orgName: orgName,
            eventDate: eventDate,
            costObject: costObject,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to generate PDF");
      // console.log("Invoice sent successfully");
      setTotalHours("");
      setHourlyRate("");
      setEventName("");
      setOrgName("");
      setPhotographerName("");
      setEventDate("");
      setOpen(true);
    } catch (error) {
      console.error(error);
      setError(true);
      setOpen(true);
    }
  };

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        <section className="section-tight container-narrow">
          <div className="text-center mb-8">
            <h1 className="mb-2">Invoice Form</h1>
            <p className="text-text-secondary">
              Submit your photography invoice.
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
              await sendInvoice();
            }}
          >
            <TextField
              required
              label="Organization Name"
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              value={orgName}
              onChange={(event) => setOrgName(event.target.value)}
              name="orgName"
              sx={textFieldSx}
              fullWidth
            />
            <TextField
              required
              label="Photographer Name"
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              value={photographerName}
              onChange={(event) => setPhotographerName(event.target.value)}
              name="photographerName"
              sx={textFieldSx}
              fullWidth
            />
            <TextField
              required
              label="Event Name"
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              value={eventName}
              onChange={(event) => setEventName(event.target.value)}
              name="eventName"
              sx={textFieldSx}
              fullWidth
            />
            <TextField
              required
              label="Your Cost Object"
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              value={costObject}
              onChange={(event) => setCostObject(event.target.value)}
              type="number"
              name="costObject"
              sx={textFieldSx}
              fullWidth
            />
            <div className="grid grid-cols-2 gap-4">
              <TextField
                required
                label="Hourly Rate"
                variant="outlined"
                type="number"
                InputLabelProps={{ shrink: true }}
                value={hourlyRate}
                onChange={(event) => setHourlyRate(event.target.value)}
                name="hourlyRate"
                sx={textFieldSx}
              />
              <TextField
                required
                label="Total Hours"
                variant="outlined"
                type="number"
                InputLabelProps={{ shrink: true }}
                value={totalHours}
                onChange={(event) => setTotalHours(event.target.value)}
                name="totalHours"
                sx={textFieldSx}
              />
            </div>
            <TextField
              required
              label="Date of the Event"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={eventDate}
              onChange={(event) => setEventDate(event.target.value)}
              name="eventDate"
              sx={textFieldSx}
              fullWidth
            />
            <Button
              type="submit"
              variant="contained"
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
                transition: "all 0.2s ease",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 500,
                py: 1.5,
                boxShadow: "none",
              }}
              fullWidth
            >
              Submit Invoice
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
          {error
            ? "There was an error sending your invoice"
            : "Your invoice was sent successfully"}
        </Alert>
      </Snackbar>
      <Footer />
    </>
  );
}
