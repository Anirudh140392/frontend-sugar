import React, { useState } from "react";
import { Box, TextField, IconButton, CircularProgress } from "@mui/material";
import { Check } from "@mui/icons-material";

const BidCell = ({ 
  value, 
  campaignId, 
  onUpdate, 
  platform, 
  keyword, 
  keywordType, 
  onSnackbarOpen,
  targetId,
  campaignType,
  adGroupId,
  keywordId
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
        platform: platform,
        campaign_id: String(campaignId),
        bid: Number(bid),
        keyword: keyword,
        match_type: keywordType,
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
      
      // Handle different platforms with different onUpdate signatures
      if (platform === "Amazon") {
        onUpdate(campaignId, targetId, campaignType, adGroupId, keywordId, updatedData.bid || bid);
      } else {
        // For Blinkit, Zepto, Swiggy
        onUpdate(campaignId, keyword, updatedData.bid || bid, keywordType);
      }

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
    <Box sx={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: 1, width: "100%", height: "100%" }}>
      <TextField
        type="number"
        variant="outlined"
        size="small"
        value={bid}
        onChange={handleBidChange}
        sx={{ width: "120px" }}
        disabled={isUpdating}
      />
      <IconButton color="primary" onClick={handleUpdate} disabled={isUpdating}>
        {isUpdating ? <CircularProgress size={24} /> : <Check />}
      </IconButton>
    </Box>
  );
};

export default BidCell;