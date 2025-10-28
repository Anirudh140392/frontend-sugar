import React, { useState } from "react";
import { Box, TextField, IconButton, CircularProgress } from "@mui/material";
import { Check } from "@mui/icons-material";

const BidCell = ({ 
  value, 
  campaignId, 
  campaignType,
  keyword, 
  keywordType, 
  platform, 
  brand_name,
  onUpdate, 
  onSnackbarOpen,
}) => {
  const [bid, setBid] = useState(value);
  const [isUpdating, setIsUpdating] = useState(false);
  const originalBid = value;

  const handleBidChange = (e) => {
    setBid(Number(e.target.value));
  };

  const handleUpdate = async () => {
    if (bid === originalBid) {
      onSnackbarOpen("No changes made to bid!", "info");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");
      setIsUpdating(true);

      const payload = {
        platform,
        campaign_id: String(campaignId),
        bid: Number(bid),
        keyword,
        match_type: keywordType,
        brand_name,
      };

      const response = await fetch(
        "https://react-api-script.onrender.com/sugar/bid-change",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error("Failed to update bid");

      const updatedData = await response.json();
      const newBid = updatedData.bid ?? bid;

      // ✅ Always call with consistent signature
      onUpdate(campaignId, keyword, newBid, keywordType);

      onSnackbarOpen(updatedData.message || "Bid updated successfully!", "success");
    } catch (error) {
      console.error("Error updating bid:", error);
      onSnackbarOpen("Failed to update bid!", "error");
      setBid(originalBid);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%", height: "100%" }}>
      <TextField
        type="number"
        variant="outlined"
        size="small"
        value={bid}
        onChange={handleBidChange}
        sx={{ width: 120 }}
        disabled={isUpdating}
      />
      <IconButton color="primary" onClick={handleUpdate} disabled={isUpdating}>
        {isUpdating ? <CircularProgress size={24} /> : <Check />}
      </IconButton>
    </Box>
  );
};

export default BidCell;
