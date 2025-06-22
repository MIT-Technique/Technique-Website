"use client";
import Footer from "../../components/Footer/Footer";
import { useState } from "react";
import * as React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { Button } from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import Alert from "@mui/material/Alert";
export default function page() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [major, setMajor] = useState("");
  const [quote, setQuote] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);

  const vertical = "top";
  const horizontal = "center";

  function handleClose() {
    setOpen(false);
    setError(false);
  }

  /**
   * This function will send a request to the server to update the
   *  senior infor with the new information that was provided
   */
  async function updateBio() {
    try {
      const response = await fetch("/api/updateBio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName,
          lastName: lastName,
          major: major,
          quote: quote,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate PDF");
      setOpen(true);
    } catch {
      console.error(error);
      setError(true);
      setOpen(true);
    }
  }

  return (
    <>
      <div className="min-h-[90vh]  relative lg:pt-[5vh] pt-[10vh] flex flex-col">
        <main className="flex-1  flex items-center justify-start flex-col">
          <h2 className="text-[#043b28] flex justify-center pb-4 font-medium">
            Senior Bio
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
              await updateBio();
            }}
          >
            <TextField
              required
              label="First Name"
              variant="outlined"
              InputLabelProps={{
                shrink: true,
              }}
              value={firstName}
              onChange={(event) => {
                setFirstName(event.target.value);
              }}
              name="orgName"
            />
            <TextField
              required
              label="Last Name"
              variant="outlined"
              InputLabelProps={{
                shrink: true,
              }}
              value={lastName}
              onChange={(event) => {
                setLastName(event.target.value);
              }}
              name="photographerName"
            />

            <FormControl fullWidth>
              <InputLabel id="demo-simple-select-label" shrink>
                Major*
              </InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={major}
                label="Major"
                notched
                required
                onChange={(event) => {
                  setMajor(event.target.value);
                }}
              >
                <MenuItem value={"1"}>1</MenuItem>
                <MenuItem value={"1-12"}>1-12</MenuItem>
                <MenuItem value={"1-ENG"}>1-ENG</MenuItem>
                <MenuItem value={"2"}>2</MenuItem>
                <MenuItem value={"2A"}>2A</MenuItem>
                <MenuItem value={"2-OE"}>2-OE</MenuItem>
                <MenuItem value={"3"}>3</MenuItem>
                <MenuItem value={"3-A"}>3-A</MenuItem>
                <MenuItem value={"3-C"}>3-C</MenuItem>
                <MenuItem value={"4"}>4</MenuItem>
                <MenuItem value={"4-B"}>4-B</MenuItem>
                <MenuItem value={"5"}>5</MenuItem>
                <MenuItem value={"5-7"}>5-7</MenuItem>
                <MenuItem value={"6-1"}>6-1</MenuItem>
                <MenuItem value={"6-2"}>6-2</MenuItem>
                <MenuItem value={"6-3"}>6-3</MenuItem>
                <MenuItem value={"6-3A"}>6-3</MenuItem>
                <MenuItem value={"6-4"}>6-4</MenuItem>
                <MenuItem value={"6-5"}>6-5</MenuItem>
                <MenuItem value={"6-7"}>6-7</MenuItem>
                <MenuItem value={"6-9"}>6-9</MenuItem>
                <MenuItem value={"6-14"}>6-14</MenuItem>
                <MenuItem value={"6-P"}>6-P</MenuItem>
                <MenuItem value={"7"}>7</MenuItem>
                <MenuItem value={"8"}>8</MenuItem>
                <MenuItem value={"9"}>9</MenuItem>
                <MenuItem value={"10"}>10</MenuItem>
                <MenuItem value={"10-B"}>10-B</MenuItem>
                <MenuItem value={"10-C"}>10-C</MenuItem>
                <MenuItem value={"10-ENG"}>10-ENG</MenuItem>
                <MenuItem value={"11"}>11</MenuItem>
                <MenuItem value={"11-6"}>11-6</MenuItem>
                <MenuItem value={"12"}>12</MenuItem>
                <MenuItem value={"14-1"}>14-1</MenuItem>
                <MenuItem value={"14-2"}>14-2</MenuItem>
                <MenuItem value={"15-1"}>15-1</MenuItem>
                <MenuItem value={"15-2"}>15-2</MenuItem>
                <MenuItem value={"15-3"}>15-3</MenuItem>
                <MenuItem value={"16"}>16</MenuItem>
                <MenuItem value={"16-ENG"}>16-ENG</MenuItem>
                <MenuItem value={"17"}>17</MenuItem>
                <MenuItem value={"17-M"}>17-M</MenuItem>
                <MenuItem value={"18"}>18</MenuItem>
                <MenuItem value={"18-C"}>18-C</MenuItem>
                <MenuItem value={"21"}>21</MenuItem>
                <MenuItem value={"21A"}>21A</MenuItem>
                <MenuItem value={"21-CMS"}>21-CMS</MenuItem>
                <MenuItem value={"21E"}>21E</MenuItem>
                <MenuItem value={"21G"}>21G</MenuItem>
                <MenuItem value={"21L"}>21L</MenuItem>
                <MenuItem value={"21H"}>21H</MenuItem>
                <MenuItem value={"21M"}>21M</MenuItem>
                <MenuItem value={"21T"}>21T</MenuItem>
                <MenuItem value={"21S"}>21S</MenuItem>
                <MenuItem value={"21W"}>21W</MenuItem>
                <MenuItem value={"20"}>20</MenuItem>
                <MenuItem value={"22"}>22</MenuItem>
                <MenuItem value={"22-ENG"}>22-ENG</MenuItem>
                <MenuItem value={"24"}>24</MenuItem>
                <MenuItem value={"24-1"}>24-1</MenuItem>
                <MenuItem value={"24-2"}>24-2</MenuItem>
                <MenuItem value={"STS"}>STS</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Quote"
              variant="outlined"
              InputLabelProps={{
                shrink: true,
              }}
              value={quote}
              onChange={(event) => {
                setQuote(event.target.value);
              }}
              name="eventName"
              multiline
              minRows={2}
              maxRows={8}
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
          severity={error ? "error" : "success"}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {error
            ? "There was an error updating your bio"
            : "Your bio was updated successfully"}
        </Alert>
      </Snackbar>
      <Footer />
    </>
  );
}
