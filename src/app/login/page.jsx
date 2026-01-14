"use client";
import Footer from "../../components/Footer/Footer";
import { useState } from "react";
import * as React from "react";
import Box from "@mui/material/Box";
import { Button } from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import Alert from "@mui/material/Alert";

export default function LoginPage() {
  const [open, setOpen] = useState(false);
  const vertical = "top";
  const horizontal = "center";

  function handleClose() {
    setOpen(false);
  }

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        <section className="section container-narrow">
          <div className="text-center mb-8">
            <h1 className="mb-2">Senior Bio</h1>
            <p className="text-text-secondary">
              Sign in to update your senior bio information.
            </p>
          </div>

          <Box
            component="form"
            className="card-elevated"
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              py: 6,
            }}
            method="GET"
            action="/api/login"
          >
            <p className="text-sm text-text-secondary text-center mb-6 pb-0">
              Click below to sign in with your MIT credentials.
            </p>
            <Button
              type="submit"
              variant="contained"
              sx={{
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
                px: 6,
                boxShadow: "none",
              }}
            >
              Sign In
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
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          Signed in successfully
        </Alert>
      </Snackbar>
      <Footer />
    </>
  );
}
