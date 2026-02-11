"use client";
import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
} from "@mui/material";

export default function ConfirmationModal({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isDangerous = false,
  disabled = false,
}) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "4px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        },
      }}
    >
      <DialogTitle
        sx={{
          fontSize: "1.125rem",
          fontWeight: 500,
          color: "#1A1A1A",
          pb: 2,
          backgroundColor: isDangerous ? "#FFEBEE" : "transparent",
        }}
      >
        {title}
      </DialogTitle>

      <DialogContent
        sx={{
          mt: 2,
          pb: 3,
          px: 4,
        }}
      >
        <Box sx={{ color: "#666666", fontSize: "0.95rem", lineHeight: 1.6 }}>
          {message}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          pt: 2,
          pb: 2,
          px: 4,
          gap: 1,
          borderTop: "1px solid #E5E5E5",
        }}
      >
        <Button
          onClick={onCancel}
          variant="outlined"
          disabled={disabled}
          sx={{
            textTransform: "none",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "#1A1A1A",
            borderColor: "#E5E5E5",
            "&:hover": {
              backgroundColor: "#FFF5F5",
              borderColor: "#D0D0D0",
            },
          }}
        >
          {cancelText}
        </Button>

        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={disabled}
          sx={{
            textTransform: "none",
            fontSize: "0.875rem",
            fontWeight: 500,
            backgroundColor: "#750014",
            color: "white",
            "&:hover": {
              backgroundColor: "#5C0010",
            },
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
