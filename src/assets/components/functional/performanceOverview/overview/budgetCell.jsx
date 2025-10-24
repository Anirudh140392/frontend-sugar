import React, { useState } from "react";
import { Box, TextField, IconButton, CircularProgress } from "@mui/material";
import { Check } from "@mui/icons-material";

const BudgetCell = ({
  value,
  campaignId,
  platform,
  onUpdate,
  onSnackbarOpen, 
  adType, // Add adType as a prop
  brand, // Add brand as a prop
}) => {
  const [budget, setBudget] = useState(value);
  const [isUpdating, setIsUpdating] = useState(false);
  const originalBudget = value; // Store the original budget value

  const handleBudgetChange = (e) => {
    setBudget(Number(e.target.value));
  };

  const handleUpdate = async () => {
    // Check if budget is being decreased
    if (budget < originalBudget) {
      onSnackbarOpen("Budget cannot be decreased!", "error");
      setBudget(originalBudget); // Reset to original value
      return;
    }

    // Check if budget is the same as original
    if (budget === originalBudget) {
      onSnackbarOpen("No changes made to budget!", "info");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");
      setIsUpdating(true);

      const payload = {
        Campaign_ID: String(campaignId),
        ad_type: adType,
        Budget: Number(budget),
        brand: brand,
      };

      const response = await fetch(
        `https://react-api-script.onrender.com/sugar/budget-change?platform=${platform}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error("Failed to update budget");

      const updatedData = await response.json();
        onUpdate(campaignId, budget);
     onSnackbarOpen("Budget updated successfully!", "success");
    } catch (error) {
      console.error("Error updating budget:", error);
      onSnackbarOpen("Failed to update budget!", "error");
      setBudget(originalBudget); // Reset to original value on error
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: 1, width: "100%", height: "100%" }}>
      <TextField
        type="number"
        variant="outlined"
        size="small"
        value={budget}
        onChange={handleBudgetChange}
        sx={{ width: "140px" }}
        disabled={isUpdating}
        inputProps={{ min: originalBudget }} // Set minimum value to original budget
      />
      <IconButton color="primary" onClick={handleUpdate} disabled={isUpdating}>
        {isUpdating ? <CircularProgress size={24} /> : <Check />}
      </IconButton>
    </Box>
  );
};

export default BudgetCell;