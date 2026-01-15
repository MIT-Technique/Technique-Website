"use client";
import Footer from "../../components/Footer/Footer";
import { useState, useEffect } from "react";
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
import CircularProgress from "@mui/material/CircularProgress";

// Shared MUI text field styling
const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: "#E5E5E5" },
    "&:hover fieldset": { borderColor: "#D0D0D0" },
    "&.Mui-focused fieldset": { borderColor: "#750014" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "#750014" },
};

const selectSx = {
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E5E5E5" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#D0D0D0" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#750014" },
};

export default function BioPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [major, setMajor] = useState("");
  const [quote, setQuote] = useState("");
  const [achievements, setAchievements] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const vertical = "top";
  const horizontal = "center";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/getUserData", {
          method: "GET",
        });

        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }

        const json = await res.json();
        setFirstName(json.data.firstName);
        setLastName(json.data.lastName);
        setMajor(json.data.major);
        setQuote(json.data.quote);
      } catch (err) {
        // setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  function handleClose() {
    setOpen(false);
    setError(false);
  }

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
          achievements: achievements,
        }),
      });

      if (!response.ok) throw new Error("Failed to update bio");
      setOpen(true);
    } catch (err) {
      console.error(err);
      setError(true);
      setOpen(true);
    }
  }

  const majors = [
    "1",
    "1-12",
    "1-ENG",
    "2",
    "2A",
    "2-OE",
    "3",
    "3-A",
    "3-C",
    "4",
    "4-B",
    "5",
    "5-7",
    "6-1",
    "6-2",
    "6-3",
    "6-3A",
    "6-4",
    "6-5",
    "6-7",
    "6-9",
    "6-14",
    "6-P",
    "7",
    "8",
    "9",
    "10",
    "10-B",
    "10-C",
    "10-ENG",
    "11",
    "11-6",
    "12",
    "14-1",
    "14-2",
    "15-1",
    "15-2",
    "15-3",
    "16",
    "16-ENG",
    "17",
    "17-M",
    "18",
    "18-C",
    "21",
    "21A",
    "21-CMS",
    "21E",
    "21G",
    "21L",
    "21H",
    "21M",
    "21T",
    "21S",
    "21W",
    "20",
    "22",
    "22-ENG",
    "24",
    "24-1",
    "24-2",
    "STS",
  ];

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CircularProgress sx={{ color: "#790606" }} />
          </Box>
        ) : (
          <>
            <section className="section-tight container-narrow">
              <div className="text-center mb-8">
                <h1 className="mb-2">Senior Bio</h1>
                <p className="text-text-secondary">
                  Update your information for the yearbook.
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
                  await updateBio();
                }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <TextField
                    required
                    label="First Name"
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    name="firstName"
                    sx={textFieldSx}
                  />
                  <TextField
                    required
                    label="Last Name"
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    name="lastName"
                    sx={textFieldSx}
                  />
                </div>

                <FormControl fullWidth>
                  <InputLabel
                    id="major-label"
                    shrink
                    sx={{
                      "&.Mui-focused": { color: "#750014" },
                    }}
                  >
                    Major *
                  </InputLabel>
                  <Select
                    labelId="major-label"
                    id="major-select"
                    value={major}
                    label="Major *"
                    notched
                    required
                    onChange={(event) => setMajor(event.target.value)}
                    sx={selectSx}
                  >
                    {majors.map((m) => (
                      <MenuItem key={m} value={m}>
                        {m}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Quote"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  value={quote}
                  onChange={(event) => setQuote(event.target.value)}
                  name="quote"
                  multiline
                  minRows={3}
                  maxRows={8}
                  sx={textFieldSx}
                  fullWidth
                  placeholder="Enter a quote for your yearbook entry (optional)"
                />
                <TextField
                  label="Acheivements"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  value={achievements}
                  onChange={(event) => setAchievements(event.target.value)}
                  name="achievements"
                  multiline
                  minRows={3}
                  maxRows={8}
                  sx={textFieldSx}
                  fullWidth
                  placeholder="Enter the clubs/extracurriculars/societies that you have been part of as a student (optional)"
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
                  Update Bio
                </Button>
              </Box>
            </section>
            <section className="section bg-bg-secondary">
              <div className="container-content">
                <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
                  <div className="card">
                    <div className="divider-accent mb-6" />
                    <h3>Quote Example 1</h3>
                    <p>
                      Dearest of friends, I hope that you will be happy with
                      every moment of life, every breath every touch every
                      sight, smell and sound. This is my wishof happiness for
                      you, and my way of saying "I love you". May your dreams
                      never disappear with age, but may they continue as alive
                      and as beautiful as you with the knowledge that they will
                      someday come true.
                    </p>
                    <p>
                      {" "}
                      <i>- Vivienne Lee</i>
                    </p>
                  </div>

                  <div className="card">
                    <div className="divider-accent mb-6" />
                    <h3>Quote Example 2</h3>
                    <p>
                      This place has the reputation of daling with education
                      from a one-sided, scientific viewpoint. The people I have
                      met here, students, professors, fraternity brothers,
                      teammates and friends, have proven far from one-sided. The
                      things I have learned and the challenges I have been
                      presented have been exhilarating, but it is the people I
                      have spent these years with that I will remember when I
                      look back fondly on my days at MIT.
                    </p>
                    <p>
                      <i>- Christopher F DeBlois</i>
                    </p>
                  </div>

                  <div className="card">
                    <div className="divider-accent mb-6" />
                    <h3>Quote Example 3</h3>
                    <p>
                      Graduation. Wow. From Midlothian H.S. to MIT. From
                      Virginia backwoods to the big city. From SAT to GMAT. From
                      lightweight to alcoholic. From boyhood to manhood (?). Did
                      I learn anything? Is this random enough to get into the
                      MIT yearbook?
                    </p>
                    <p>
                      <i>- Steve Jones</i>
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
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
            ? "There was an error updating your bio"
            : "Your bio was updated successfully"}
        </Alert>
      </Snackbar>
      <Footer />
    </>
  );
}
