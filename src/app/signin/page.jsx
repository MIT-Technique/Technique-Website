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
  const [mitEmail, setMitEmail] = useState("");
  const [open, setOpen] = useState(false);
  const vertical = "top";
  const horizontal = "center";

  function handleClose() {
    setOpen(false);
  }

  return (
    <>
      <div className="min-h-[90vh]  relative lg:pt-[5vh] pt-[10vh] flex flex-col">
        <main className="flex-1  flex items-center justify-start flex-col">
          <h2 className="text-[#043b28] flex justify-center pb-4 font-medium">
            Sign In
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
                xs: "75%", // extra-small devices (phones)
                sm: "55%", // small devices
                md: "40%", // medium devices
                lg: "30%", // large devices
                xl: "30%", // extra-large devices
              },
              height: "25vh",
              paddingX: "12px",
              "& > :not(button)": {
                m: 1,
                width: "100%",
                flexShrink: 0,
              },
              marginBottom: "1rem",
            }}
            method="POST"
            action="/api/userSignIn"
          >
            <TextField
              required
              label="MIT email"
              variant="outlined"
              InputLabelProps={{
                shrink: true,
              }}
              value={mitEmail}
              onChange={(event) => {
                setMitEmail(event.target.value);
              }}
              name="email"
              type="email"
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
