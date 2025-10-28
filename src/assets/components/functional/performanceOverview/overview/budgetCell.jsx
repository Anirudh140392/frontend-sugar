import React, { useState } from "react";
import { Box, TextField, IconButton, CircularProgress } from "@mui/material";
import { Check } from "@mui/icons-material";

const BudgetCell = ({
  value,
  campaignId,
  platform,
  onUpdate,
  onSnackbarOpen,
  brand_name
}) => {
  const [budget, setBudget] = useState(value);
  const [isUpdating, setIsUpdating] = useState(false);
  const originalBudget = value;

  const handleBudgetChange = (e) => {
    setBudget(Number(e.target.value));
  };

  const handleUpdate = async () => {
   
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");
      setIsUpdating(true);

      const payload = {
        platform: platform,
        campaign_id: Number(campaignId),
        budget: Number(budget),
        brand_name: brand_name
      };

      const response = await fetch(
        `https://react-api-script.onrender.com/sugar/budget-change`,
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
      
      // Call onUpdate with the campaign_id and budget from response
      onUpdate(campaignId, updatedData.budget || budget);

      onSnackbarOpen(updatedData.message || "Budget updated successfully!", "success");
    } catch (error) {
      console.error("Error updating budget:", error);
      onSnackbarOpen("Failed to update budget!", "error");
      setBudget(originalBudget);
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
        inputProps={{ min: originalBudget }}
      />
      <IconButton color="primary" onClick={handleUpdate} disabled={isUpdating}>
        {isUpdating ? <CircularProgress size={24} /> : <Check />}
      </IconButton>
    </Box>
  );
};

export default BudgetCell;