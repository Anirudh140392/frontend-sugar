import React, { useContext, useState, useEffect, useMemo, useRef, useImperativeHandle, forwardRef } from "react";
import MuiDataTableComponent from "../../common/muidatatableComponent";
import '../../../styles/campaignsComponent/campaignsComponent.less';
import overviewContext from "../../../../store/overview/overviewContext";
import { Switch, Box, Button, Snackbar, Alert, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { Dialog, DialogActions, DialogContent, DialogTitle, CircularProgress } from "@mui/material";
import { useSearchParams } from "react-router";
import ColumnPercentageDataComponent from "../../common/columnPercentageDataComponent";
import TrendsModal from "./modal/trendsModal";
import BudgetCell from "./overview/budgetCell";
import NewPercentageDataComponent from "../../common/newPercentageDataComponent";
import { cachedFetch } from "../../../../services/cachedFetch";
import { getCache, setCache } from "../../../../services/cacheUtils";
import OnePercentageDataComponent from "../../common/onePercentageComponent";
import ValueFormatter from "../../common/valueFormatter";

const CampaignsComponent = (props, ref) => {

    const dataContext = useContext(overviewContext)
    const { dateRange, brands, getBrandsData, formatDate } = dataContext

    const [updatingCampaigns, setUpdatingCampaigns] = useState({});
    const [showTrendsModal, setShowTrendsModal] = useState({ name: '', show: false, date: [] })
    const [campaignsData, setCampaignsData] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    const [confirmation, setConfirmation] = useState({ 
        show: false, 
        campaignId: null, 
        campaignType: null,
        adType: null 
    });
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    const [searchParams, setSearchParams] = useSearchParams();
    const operator = searchParams.get("operator");
    const selectedBrand = searchParams.get("brand") || "Cinthol Grocery";

    // Add ref to handle abort controller for API calls
    const abortControllerRef = useRef(null);
    
    // Track if data was mutated (budget/status changed) to force refresh on next component mount
    const dataMutated = useRef(false);
    
    // Track if component is currently visible/mounted
    const isComponentActive = useRef(true);

    const STATUS_OPTIONS = [
        { value: 1, label: 'Active' },
        { value: 0, label: 'Paused' }
    ]

    // Utility function to clear all campaign-related caches
    const clearCampaignCaches = () => {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.includes('/sugar/campaign')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            console.log(`Cleared ${keysToRemove.length} campaign cache entries`);
        } catch (error) {
            console.error("Error clearing campaign caches:", error);
        }
    };

  const CampaignsColumnBlinkit = [
    {
        field: "campaign_name",
        headerName: "CAMPAIGN",
        minWidth: 200,
        renderCell: (params) => (
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                    cursor: "pointer"
                }}
                onClick={() => handleCampaignClick(params.row.campaign_name, params.row.campaign_id)}
                className="redirect"
            >
                {params.row.campaign_name}
            </Box>
        ),
    },
    {
        field: "budget", // Changed from "Budget" to match API response
        headerName: "BUDGET",
        minWidth: 200,
        renderCell: (params) => <BudgetCell 
            status={params.row.status} // Changed from campaign_status
            value={params.row.budget} // Changed from Budget
            campaignId={params.row.campaign_id} 
            adType={params.row.campaign_type} // Changed from ad_type
            brand={selectedBrand} // Use selectedBrand from context
            endDate={params.row.end_date || null} 
            platform={operator}
            onUpdate={(campaignId, newBudget) => {
                console.log("Updating campaign:", campaignId, "New budget:", newBudget);
                dataMutated.current = true;
                clearCampaignCaches();
                setCampaignsData(prevData => {
                    const updatedData = {
                        ...prevData,
                        data: prevData.data.map(campaign =>
                            campaign.campaign_id === campaignId
                                ? { ...campaign, budget: newBudget } // Changed Budget to budget
                                : campaign
                        )
                    };
                    console.log("Updated campaignsData:", updatedData);
                    return updatedData;
                });
            }} 
            onSnackbarOpen={handleSnackbarOpen} 
        />,
        headerAlign: "left",
        type: "number", 
        align: "left",
    },
    {
        field: "status",
        headerName: "STATUS",
        minWidth: 100,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => {
            const status = params.row.status;

            if (updatingCampaigns[params.row.campaign_id]) {
                return (
                    <Box sx={{ height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <CircularProgress size={24} />
                    </Box>
                );
            }

            // Handle both numeric and string status values
            const isActive = status === 1 || status === "1" || status === "ACTIVE" || status === "active";

            return (
                <Switch
                    checked={isActive}
                    onChange={() => handleToggle(
                        params.row.campaign_id,
                        isActive ? 0 : 1,
                        params.row.campaign_type // Changed from ad_type
                    )}
                />
            );
        },
        type: "singleSelect",
        valueOptions: [
            { value: 1, label: "Active" },
            { value: 0, label: "Paused" }
        ]
    },
    {
        field: "campaign_type", // Changed from "ad_type"
        headerName: "CAMPAIGN TYPE",
        minWidth: 155,
    },
    {
        field: "impressions", // Changed from "views_y"
        headerName: "IMPRESSIONS",
        minWidth: 150,
        renderCell: (params) => (
            <ColumnPercentageDataComponent 
                mainValue={params.row.impressions} 
                percentValue={params.row.impressions_change} // Changed from views_diff
            />
        ), 
        type: "number", 
        align: "left",
        headerAlign: "left",
    },
    {
        field: "clicks", // Changed from "clicks_y"
        headerName: "CLICKS",
        minWidth: 150,
        renderCell: (params) => (
            <ColumnPercentageDataComponent 
                mainValue={params.row.clicks} 
                percentValue={params.row.clicks_change} // Changed from clicks_diff
            />
        ), 
        type: "number", 
        align: "left",
        headerAlign: "left",
    },
    {
        field: "spend", // Changed from "cost_y"
        headerName: "SPENDS",
        minWidth: 150,
        renderCell: (params) => (
            <ColumnPercentageDataComponent 
                mainValue={params.row.spend} 
                percentValue={params.row.spend_change} // Changed from cost_diff
            />
        ), 
        type: "number", 
        align: "left",
        headerAlign: "left",
    },
    {
        field: "orders", // Changed from "total_converted_units_y"
        headerName: "ORDERS",
        minWidth: 150,
        renderCell: (params) => (
            <ColumnPercentageDataComponent 
                mainValue={params.row.orders} 
                percentValue={params.row.orders_change} // Changed from total_converted_units_diff
            />
        ), 
        type: "number", 
        align: "left",
        headerAlign: "left",
    },
    {
        field: "sales", // Changed from "total_converted_revenue_y"
        headerName: "SALES",
        minWidth: 150,
        renderCell: (params) => (
            <ColumnPercentageDataComponent 
                mainValue={params.row.sales} 
                percentValue={params.row.sales_change} // Changed from total_converted_revenue_diff
            />
        ), 
        type: "number", 
        align: "left",
        headerAlign: "left",
    },
     {
        field: "avg_cpm",
        headerName: "CPM",
        minWidth: 150,
        renderCell: (params) => (
            <ColumnPercentageDataComponent mainValue={params.row.avg_cpm} percentValue={params.row.avg_cpm_change} />
        ), 
        type: "number", 
        align: "left",
        headerAlign: "left",
    },
     {
        field: "total_atc", // Changed from "total_converted_revenue_y"
        headerName: "ATC",
        minWidth: 150,
        renderCell: (params) => (
            <ColumnPercentageDataComponent 
                mainValue={params.row.total_atc} 
                percentValue={params.row.total_atc_change} // Changed from total_converted_revenue_diff
            />
        ), 
        type: "number", 
        align: "left",
        headerAlign: "left",
    },
  
];
    const normalizedBrands = useMemo(() => {
        const source = brands;
        if (!source) return [];
        if (Array.isArray(source)) {
            if (source.length === 0) return [];
            if (typeof source[0] === "string") return source;
            return source
                .map((item) => item?.brand_name || item?.brand || item?.name)
                .filter(Boolean);
        }
        if (Array.isArray(source?.data)) {
            const arr = source.data;
            if (arr.length === 0) return [];
            if (typeof arr[0] === "string") return arr;
            return arr
                .map((item) => item?.brand_name || item?.brand || item?.name)
                .filter(Boolean);
        }
        return [];
    }, [brands]);

    const getCampaignsData = async (forceRefresh = false) => {
        if (!operator) return;

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setCampaignsData({});
        setIsLoading(true);

        const token = localStorage.getItem("accessToken");
        if (!token) {
            console.error("No access token found");
            setIsLoading(false);
            return;
        }

        const startDate = formatDate(dateRange[0].startDate);
        const endDate = formatDate(dateRange[0].endDate);

        try {
            const ts = forceRefresh ? `&_=${Date.now()}` : "";
            let url = `https://react-api-script.onrender.com/sugar/campaign?start_date=${startDate}&end_date=${endDate}&platform=${operator}${ts}`;
            if (selectedBrand && typeof selectedBrand === "string") {
                url += `&brand_name=${encodeURIComponent(selectedBrand)}`;
            }
            const cacheKey = `cache:GET:${url}`;

            if (forceRefresh) {
                try { localStorage.removeItem(cacheKey); } catch (_) {}
            } else {
                const cached = getCache(cacheKey);
                if (cached) {
                    setCampaignsData(cached);
                    setIsLoading(false);
                    return;
                }
            }

            const response = await cachedFetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                signal: controller.signal,
            }, { ttlMs: 5 * 60 * 1000, cacheKey, bypassCache: forceRefresh });

            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            setCampaignsData(data);
            if (forceRefresh) {
                try { setCache(cacheKey, data, 5 * 60 * 1000); } catch (_) {}
            }
        } catch (error) {
            if (error.name === "AbortError") {
                console.log("Previous request aborted due to operator change.");
            } else {
                console.error("Failed to fetch campaigns data:", error.message);
                setCampaignsData({});
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        console.log("Refresh clicked: forcing network fetch");
        clearCampaignCaches();
        getCampaignsData(true);
    };

    useImperativeHandle(ref, () => ({
        refresh: handleRefresh
    }));

    // Effect to handle component mount and parameter changes
    useEffect(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Mark component as active when this effect runs
        isComponentActive.current = true;

        const timeout = setTimeout(() => {
            if (localStorage.getItem("accessToken")) {
                // Check if we're returning to component after a mutation happened
                if (dataMutated.current && isComponentActive.current) {
                    console.log("Component switched back after mutation, fetching fresh data");
                    clearCampaignCaches();
                    getCampaignsData(true);
                    dataMutated.current = false; // Reset the flag after fetching
                } else {
                    console.log("Normal navigation, using cache if available");
                    getCampaignsData(false); // Use cache
                }
            }
        }, 100);

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            clearTimeout(timeout);
            // Mark component as inactive when unmounting
            isComponentActive.current = false;
        }
    }, [operator, dateRange, selectedBrand]);

    // Component lifecycle tracking - detect when component becomes visible again
    useEffect(() => {
        // Component is mounting/becoming visible
        isComponentActive.current = true;
        
        return () => {
            // Component is unmounting/becoming hidden
            isComponentActive.current = false;
        };
    }, []);

    useEffect(() => {
        try { getBrandsData(); } catch (_) {}
    }, [operator]);

    const columns = useMemo(() => {
        if (operator === "Blinkit") return CampaignsColumnBlinkit;
        return [];
    }, [operator, brands, updatingCampaigns]);

    const handleCampaignClick = async (campaignName, campaignId) => {
        try {
            const token = localStorage.getItem("accessToken");
            const startDate = formatDate(dateRange[0].startDate);
            const endDate = formatDate(dateRange[0].endDate);
            let url = `https://react-api-script.onrender.com/sugar/campaign_graph?start_date=${formatDate(startDate)}&end_date=${formatDate(endDate)}&platform=${operator}&campaign_id=${campaignId}`;
            if (selectedBrand && typeof selectedBrand === "string") {
                url += `&brand_name=${encodeURIComponent(selectedBrand)}`;
            }
            const cacheKey = `cache:GET:${url}`;

            const cached = getCache(cacheKey);
            if (cached) {
                setShowTrendsModal({ name: campaignName, show: true, data: cached });
                return;
            }

            const response = await cachedFetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }, { ttlMs: 5 * 60 * 1000, cacheKey });
            const data = await response.json()
            if (response.ok) {
                setShowTrendsModal({ name: campaignName, show: true, data: data });
            } else {
                console.error("Failed to fetch campaign data");
            }
        } catch (error) {
            console.error("Error fetching campaign data", error);
        }
    };

    const handleToggle = (campaignId, newStatus, adType) => {
        setConfirmation({ 
            show: true, 
            campaignId, 
            campaignType: newStatus,
            adType
        });
    };

    const updateCampaignStatus = (campaignId, newStatus, adType) => {
        setConfirmation({ show: false, campaignId: null, campaignType: null, adType: null });
        setUpdatingCampaigns(prev => ({ ...prev, [campaignId]: true }));
        confirmStatusChange(campaignId, newStatus, adType);
    };

    const confirmStatusChange = async (campaignId, newStatus, adType) => {
        try {
            const token = localStorage.getItem("accessToken");
            
            const requestBody = {
                campaign_id: campaignId,
                ad_type: adType,
                brand: selectedBrand
            };

            const playPauseUrl = `https://react-api-script.onrender.com/sugar/campaign-play-pause?platform=${operator}`;

            const response = await fetch(playPauseUrl, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Failed to update campaign status: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log("Campaign status updated successfully", data);

            // Mark that data was mutated (for next navigation/filter change)
            dataMutated.current = true;
            
            // Clear all campaign-related caches so next fetch gets fresh data
            clearCampaignCaches();

            // Update local state with the new status (optimistic update)
            // Use the status returned from API, or fallback to newStatus
            const updatedStatus = data.status !== undefined ? data.status : newStatus;
            
            setCampaignsData(prevData => ({
                ...prevData,
                data: prevData.data.map(campaign =>
                    campaign.campaign_id === campaignId
                        ? { ...campaign, status: updatedStatus }
                        : campaign
                )
            }));

            setUpdatingCampaigns(prev => ({ ...prev, [campaignId]: false }));
            handleSnackbarOpen(data.message || "Campaign status updated successfully!", "success");
            
            // DON'T fetch fresh data immediately - rely on optimistic update
            // Fresh data will be fetched on next navigation/filter change due to dataMutated flag
            
        } catch (error) {
            console.error("Error updating campaign status:", error);
            handleSnackbarOpen("Error updating campaign status", "error");
            setUpdatingCampaigns(prev => ({ ...prev, [campaignId]: false }));
            
            // On error, revert the UI by fetching fresh data
            clearCampaignCaches();
            setTimeout(() => getCampaignsData(true), 500);
        }
    };

    const handleSnackbarOpen = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const handleSnackbarClose = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <React.Fragment>
            <Dialog open={confirmation.show} onClose={() => setConfirmation({ show: false, campaignId: null, campaignType: null, adType: null })}>
                <DialogTitle>Confirm Status Change</DialogTitle>
                <DialogContent>
                    Are you sure you want to {confirmation.campaignType === 1 ? 'activate' : 'pause'} this campaign?
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmation({ show: false, campaignId: null, campaignType: null, adType: null })}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={() => updateCampaignStatus(confirmation.campaignId, confirmation.campaignType, confirmation.adType)} 
                        color="primary"
                    >
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
            <TrendsModal
                showTrendsModal={showTrendsModal}
                setShowTrendsModal={setShowTrendsModal} />
            <div className="shadow-box-con-campaigns aggregated-view-con">
                <div className="datatable-con-campaigns">
                    <MuiDataTableComponent
                        isLoading={isLoading}
                        isExport={true}
                        columns={columns}
                        data={campaignsData.data || []} />
                </div>
            </div>
            <Snackbar anchorOrigin={{ vertical: "top", horizontal: "center" }}
                open={snackbar.open} autoHideDuration={4000} onClose={handleSnackbarClose}>
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity} variant="filled" sx={{ width: "100%" }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </React.Fragment>
    )
}

export default forwardRef(CampaignsComponent);