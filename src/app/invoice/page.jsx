"use client";
import Footer from "../../components/Footer/Footer";
import { useState } from "react";
import * as React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import { Button } from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import Alert from "@mui/material/Alert";
export default function page() {
  const [orgName, setOrgName] = useState("");
  const [photographerName, setPhotographerName] = useState("");
  const [eventName, setEventName] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [totalHours, setTotalHours] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [costObject, setCostObject] = useState("");
  const [open, setOpen] = useState(false);
  const vertical = "top";
  const horizontal = "center";

  function handleClose() {
    setOpen(false);
  }
  /**
   *
   * @param  dateString string to format into a MMDDYYYY string
   * @returns the formatted string with the month, day, and year seperated by backslash
   */
  function formatToMMDDYYYY(dateString) {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  /**
   * Sends a request to the backend to send the invoice to tnq-exec@mit.edu
   *  based on values in the fields from the form. If you want to you can do a form submission similar
   *  to sign in where the form just forwards the fields to the backend through the formData in the body, but
   *  this is good enough.
   */
  const sendInvoice = async () => {
    //The reason for these keys is that this is what Anvil told me to do.
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

    try {
      const response = await fetch("/api/sendInvoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anvilData: { data: pdfData },
          emailData: {
            orgName: orgName,
            eventDate: eventDate,
            costObject: costObject,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to generate PDF");
      console.log("Invoice sent successfully");
      setTotalHours("");
      setHourlyRate("");
      setEventName("");
      setOrgName("");
      setPhotographerName("");
      setEventDate("");
      // Trigger download
      setOpen(true);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <>
      <div className="min-h-[90vh]  relative lg:pt-[5vh] pt-[10vh] flex flex-col">
        <main className="flex-1  flex items-center justify-start flex-col">
          <h2 className="text-[#043b28] flex justify-center pb-4 font-medium">
            Invoice Form
          </h2>
          <Box
            component="form"
            sx={{
              border: "1px solid #043b28",
              borderRadius: "0.3rem",
              borderColor: "",
              padding: "8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: {
                xs: "90%", // extra-small devices (phones)
                sm: "70%", // small devices
                md: "50%", // medium devices
                lg: "40%", // large devices
                xl: "40%", // extra-large devices
              },
              height: "90%",
              paddingX: "12px",
              "& > :not(button)": {
                m: 1,
                width: "100%",
                flexShrink: 0,
              },
              marginBottom: "1rem",
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
              InputLabelProps={{
                shrink: true,
              }}
              value={orgName}
              onChange={(event) => {
                setOrgName(event.target.value);
              }}
              name="orgName"
            />
            <TextField
              required
              label="Photographer Name"
              variant="outlined"
              InputLabelProps={{
                shrink: true,
              }}
              value={photographerName}
              onChange={(event) => {
                setPhotographerName(event.target.value);
              }}
              name="photographerName"
            />
            <TextField
              required
              label="Event Name"
              variant="outlined"
              InputLabelProps={{
                shrink: true,
              }}
              value={eventName}
              onChange={(event) => {
                setEventName(event.target.value);
              }}
              name="eventName"
            />
            <TextField
              required
              label="Your Cost Object"
              variant="outlined"
              InputLabelProps={{
                shrink: true,
              }}
              value={costObject}
              onChange={(event) => {
                setCostObject(event.target.value);
              }}
              type="number"
              name="costObject"
            />
            <TextField
              required
              label="Hourly Rate"
              variant="outlined"
              type="number"
              InputLabelProps={{
                shrink: true,
              }}
              value={hourlyRate}
              onChange={(event) => {
                setHourlyRate(event.target.value);
              }}
              name="hourlyRate"
            />
            <TextField
              required
              label="Total Hours"
              variant="outlined"
              type="number"
              InputLabelProps={{
                shrink: true,
              }}
              value={totalHours}
              onChange={(event) => {
                setTotalHours(event.target.value);
                // console.log("total hours", event.target.value);
              }}
              name="totalHours"
            />

            <TextField
              required
              label="Date of the Event"
              type="date"
              InputLabelProps={{
                shrink: true,
              }}
              sx={{}}
              value={eventDate}
              onChange={(event) => {
                setEventDate(event.target.value);
                // console.log("eventDate", event.target.value);
              }}
              name="eventDate"
            />
            <Button
              type="submit"
              variant="contained"
              sx={{
                margin: "8px",
                backgroundColor: "#043b28",
                "&:hover": {
                  backgroundColor: "#06503a",
                  boxShadow:
                    "0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)",
                },
                "&:active": {
                  backgroundColor: "#03281d",
                  boxShadow:
                    "0px 5px 5px -3px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)",
                  transform: "translateY(1px)",
                },
                transition: "all 0.3s ease",
                width: "60%",
              }}
            >
              Submit Invoice
            </Button>
          </Box>
        </main>
      </div>
      <Snackbar
        anchorOrigin={{ vertical, horizontal }}
        open={open}
        onClose={handleClose}
        message="Invoice Sent Successfully"
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
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          Invoice Sent Successfully
        </Alert>
      </Snackbar>
      <Footer />
    </>
  );
}
