import React, { useState } from "react";
import { Box, TextField, IconButton, CircularProgress } from "@mui/material";
import { Check } from "@mui/icons-material";

const BidCell = ({ value, campaignId, onUpdate, targetId, campaignType, adGroupId, keywordId, onSnackbarOpen, platform }) => {
    const [bid, setBid] = useState(value);
    const [isUpdating, setIsUpdating] = useState(false)

    const handleBidChange = (e) => {
        setBid(e.target.value);
    };

    const handleUpdate = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) throw new Error("No access token found");
            setIsUpdating(true)
            const params = new URLSearchParams({
                platform: platform,
                campaign_id: campaignId,
                target_id: targetId,
                campaign_type: campaignType,
                ad_group_id: adGroupId,
                keyword_id: keywordId,
                bid: bid
            });
            const response = await fetch(`https://react-api-script.onrender.com/sugar/update_bid?${params.toString()}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) throw new Error("Failed to update bid");

            const updatedData = await response.json();
            onUpdate(campaignId, targetId, campaignType, adGroupId, keywordId, bid);

            onSnackbarOpen("Bid updated successfully!", "success");
        } catch (error) {
            console.error("Error updating bid:", error);

            onSnackbarOpen("Failed to update bid!", "error");
        } finally {
            setIsUpdating(false)
        }
    };

    return (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1, width: "100%", height: "100%" }}>
            <TextField
                type="number"
                variant="outlined"
                size="small"
                value={bid}
                onChange={handleBidChange}
                sx={{ width: "80px" }}
            />
            <IconButton color="primary" onClick={handleUpdate}>
                {isUpdating ? <CircularProgress size={24} /> : <Check />}
            </IconButton>
        </Box>
    );
};

export default BidCell;
