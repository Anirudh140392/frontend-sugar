import React, { useEffect, useContext, useState, useMemo, useRef } from "react";
import MuiDataTableComponent from "../../common/muidatatableComponent";
import '../../../styles/keywordsComponent/keywordsComponent.less';
import { Typography, Snackbar, Alert, Button, Switch, Box, FormControl, InputLabel, Select, MenuItem, CircularProgress } from "@mui/material";
import overviewContext from "../../../../store/overview/overviewContext";
import { useSearchParams, useNavigate } from "react-router";
import ColumnPercentageDataComponent from "../../common/columnPercentageDataComponent";
import TrendsModal from "./modal/trendsModal";
import BidCell from "./overview/bidCell";
import { Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { cachedFetch } from "../../../../services/cachedFetch";
import { getCache } from "../../../../services/cacheUtils";
import NewPercentageDataComponent from "../../common/newPercentageDataComponent";

const KeywordsComponent = () => {

    const { dateRange, getBrandsData, brands, formatDate, campaignName } = useContext(overviewContext)

    const [showTrendsModal, setShowTrendsModal] = useState({ name: '', show: false, date: [] })
    const [updatingKeywords, setUpdatingKeywords] = useState({});
    const [keywordsData, setKeywordsData] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [confirmation, setConfirmation] = useState({ show: false, campaignType: null, keywordId: null, targetId: null, adGroupId: null, campaignId: null });

    const [searchParams, setSearchParams] = useSearchParams();
    const operator = searchParams.get("operator");
    const selectedBrand = searchParams.get("brand") || "Cinthol Grocery";
    const navigate = useNavigate()

    // Add ref to handle abort controller for API calls
    const abortControllerRef = useRef(null);

    // Brand account combinations
    const accountCombinations = [
        {"baccount": "PR83RX8HIYLX", "aaccount": "BGHM2A61UYC1", "brand": "Godrej Fab Nationals"},
        {"baccount": "PR83RX8HIYLX", "aaccount": "OQHE4X5E9H9Z", "brand": "Ezee Grocery"},
        {"baccount": "PR83RX8HIYLX", "aaccount": "KFMJJUIIWBEO", "brand": "Godrej No. 1 Grocery"},
        {"baccount": "PR83RX8HIYLX", "aaccount": "G6QNRWQT32XH", "brand": "Cinthol Nationals"},
        {"baccount": "PR83RX8HIYLX", "aaccount": "2LEFMRE1IKA4", "brand": "Good knight Grocery"},
        {"baccount": "PR83RX8HIYLX", "aaccount": "Y7TQL54CL7SR", "brand": "Good knight Nationals"},
        {"baccount": "PR83RX8HIYLX", "aaccount": "BRBAXN6KS9EV", "brand": "Expert Grocery"},
        {"baccount": "PR83RX8HIYLX", "aaccount": "X2E0Y0M08PVQ", "brand": "Genteel Nationals"},
        {"baccount": "PR83RX8HIYLX", "aaccount": "0J0ATUB4X43G", "brand": "Godrej Aer Grocery"},
        {"baccount": "PR83RX8HIYLX", "aaccount": "KWHA1YD3JIBJ", "brand": "Expert Nationals"},
        {"baccount": "PR83RX8HIYLX", "aaccount": "77W12KF7HW7S", "brand": "Hit Grocery"},
        {"baccount": "PR83RX8HIYLX", "aaccount": "28KC2C2ZE3W5", "brand": "Godrej Fab Grocery"},
        {"baccount": "PR83RX8HIYLX", "aaccount": "P3EKJ4KIV6VA", "brand": "Hit Nationals"},
        {"baccount": "PR83RX8HIYLX", "aaccount": "2LEFMRE1IKA4", "brand": "Godrej No.1 Nationals"},
        {"baccount": "PR83RX8HIYLX", "aaccount": "75FKCW7PXX4N", "brand": "Cinthol Grocery"},
        {"baccount": "PR83RX8HIYLX", "aaccount": "UH0ND54US2AL", "brand": "Godrej Aer Nationals"},
        {"baccount": "PR83RX8HIYLX", "aaccount": "DWONWCO5L46V", "brand": "Genteel Grocery"},
        {"baccount": "K4ZBBTIP0R", "aaccount": "WX40F7MLW5VX", "brand": "Park Avenue Grocery"},
        {"baccount": "K4ZBBTIP0R", "aaccount": "ENSAR2MNLFGS", "brand": "Kamasutra Grocery"},
        {"baccount": "K4ZBBTIP0R", "aaccount": "J66C5M8GUNCN", "brand": "Park Avenue Nationals"},
        {"baccount": "K4ZBBTIP0R", "aaccount": "GGRG6OJKHMNQ", "brand": "Kamasutra Nationals"}
    ];

    // Get unique brands for dropdown
    const uniqueBrands = useMemo(() => {
        const brands = [...new Set(accountCombinations.map(combo => combo.brand))];
        return brands.sort();
    }, []);

    const getKeywordsData = async (forceRefresh = false) => {
        if (!operator) return;

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setKeywordsData({});
        setIsLoading(true);

        const token = localStorage.getItem("accessToken");
        if (!token) {
            console.error("No access token found");
            setIsLoading(false);
            return;
        }

        const startDate = formatDate(dateRange[0].startDate);
        const endDate = formatDate(dateRange[0].endDate);
        const ts = forceRefresh ? `&_=${Date.now()}` : "";

        let url = `https://react-api-script.onrender.com/sugar/keywords?start_date=${startDate}&end_date=${endDate}&platform=${operator}${ts}`;
        if (selectedBrand && typeof selectedBrand === "string") {
            url += `&brand_name=${encodeURIComponent(selectedBrand)}`;
        }
        const cacheKey = `cache:GET:${url}`;

        if (forceRefresh) {
            try { localStorage.removeItem(cacheKey); } catch (_) {}
        } else {
            const cached = getCache(cacheKey);
            if (cached) {
                setKeywordsData(cached);
                setIsLoading(false);
                return;
            }
        }

        try {
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
            setKeywordsData(data);
            if (forceRefresh) {
                try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch (_) {}
            }
        } catch (error) {
            if (error.name === "AbortError") {
                console.log("Previous request aborted due to operator change.");
            } else {
                console.error("Failed to fetch keywords data:", error.message);
                setKeywordsData({});
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = () => {
        getKeywordsData(true);
    };

    // Single useEffect that mirrors OverviewComponent behavior
    useEffect(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const timeout = setTimeout(() => {
            if (localStorage.getItem("accessToken")) {
                getKeywordsData();
            }
        }, 100);

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            clearTimeout(timeout);
        }
    }, [operator, dateRange, selectedBrand]); // Include selectedBrand to force refresh on brand change

    useEffect(() => {
        getBrandsData()
    }, [operator])

    useEffect(() => {
        if (!localStorage.getItem("accessToken")) {
            navigate("/login");
            window.location.reload();
        }
    }, []);

    const handleToggle = (campaignType, keywordId, targetId, adGroupId, campaignId) => {
        setConfirmation({ show: true, campaignType, keywordId, targetId, adGroupId, campaignId });
    };

 const KeywordsColumnBlinkit = [
    {
        field: "keyword", // Changed from "keyword_name"
        headerName: "TARGET",
        minWidth: 150,
        renderCell: (params) => (
            <div className="text-icon-div cursor-pointer" onClick={() => handleKeywordClick(params.row.keyword, params.row.campaign_id)}>
                <Typography className="redirect" variant="body2">{params.row.keyword}</Typography>
            </div>
        ),
    },
    { 
        field: "keyword_type", // Changed from "match_type"
        headerName: "MATCH TYPE", 
        minWidth: 150, 
        headerAlign: "left", 
    },
    {
            field: "cpc",
            headerName: "BID",
            minWidth: 150,
            renderCell: (params) => (
                <BidCell
                    value={params.row.avg_cpm}
                    campaignId={params.row.campaign_id}
                    platform={operator}
                    keyword={params.row.keyword}
                    matchType={params.row.keyword_type}
                    onUpdate={(campaignId, keyword, newBid, matchType) => {
                        console.log("Updating bid:", { campaignId, keyword, newBid, matchType });
                        setKeywordsData(prevData => {
                            const updatedData = {
                                ...prevData,
                                data: prevData.data.map(row =>
                                    row.campaign_id === campaignId &&
                                        row.keyword === keyword &&
                                        row.keyword_type === matchType
                                        ? { ...row, avg_cpm: newBid }
                                        : row
                                )
                            };
                            console.log("Updated keywordsData:", updatedData);
                            return updatedData;
                        });
                    }} onSnackbarOpen={handleSnackbarOpen}
                />
            ), type: "number", align: "left",
            headerAlign: "left",
        },
    {
        field: "impressions",
        headerName: "IMPRESSIONS",
        minWidth: 150,
        renderCell: (params) => (
            <ColumnPercentageDataComponent mainValue={params.row.impressions} percentValue={params.row.impressions_change} />
        ), 
        type: "number", 
        align: "left",
        headerAlign: "left",
    },
    {
        field: "clicks",
        headerName: "CLICKS",
        minWidth: 150,
        renderCell: (params) => (
            <ColumnPercentageDataComponent mainValue={params.row.clicks} percentValue={params.row.clicks_change} />
        ), 
        type: "number", 
        align: "left",
        headerAlign: "left",
    },
    {
        field: "spend",
        headerName: "SPENDS",
        minWidth: 170,
        renderCell: (params) => (
            <ColumnPercentageDataComponent mainValue={params.row.spend} percentValue={params.row.spend_change} />
        ), 
        type: "number", 
        align: "left",
        headerAlign: "left",
    },
    {
        field: "orders",
        headerName: "ORDERS",
        minWidth: 170,
        renderCell: (params) => (
            <ColumnPercentageDataComponent mainValue={params.row.orders} percentValue={params.row.orders_change} />
        ), 
        type: "number", 
        align: "left",
        headerAlign: "left",
    },
    {
        field: "sales", // Changed from "revenue"
        headerName: "SALES",
        minWidth: 150,
        renderCell: (params) => (
            <ColumnPercentageDataComponent mainValue={params.row.sales} percentValue={params.row.sales_change} /> // Changed revenue_change to sales_change
        ), 
        type: "number", 
        align: "left",
        headerAlign: "left",
    },
   
  
    {
        field: "roas",
        headerName: "ROAS",
        minWidth: 150,
        renderCell: (params) => (
            <ColumnPercentageDataComponent mainValue={params.row.roas} percentValue={params.row.roas_change} />
        ), 
        type: "number", 
        align: "left",
        headerAlign: "left",
    },
    

    {
        field: "total_atc",
        headerName: "ATC",
        minWidth: 150,
        renderCell: (params) => (
            <ColumnPercentageDataComponent mainValue={params.row.total_atc} percentValue={params.row.total_atc_change} />
        ), 
        type: "number", 
        align: "left",
        headerAlign: "left",
    },
   
    {
        field: "campaign_name",
        headerName: "CAMPAIGN",
        minWidth: 300,
    },
];

    const columns = useMemo(() => {
        if (operator === "Blinkit") return KeywordsColumnBlinkit;
        return [];
    }, [operator, brands, updatingKeywords]);

    const handleKeywordClick = async (keywordName, campaignId) => {
        try {
            const token = localStorage.getItem("accessToken");
            const startDate = formatDate(dateRange[0].startDate);
            const endDate = formatDate(dateRange[0].endDate);
            
            let url = `https://react-api-script.onrender.com/sugar/keyword_graph?start_date=${formatDate(startDate)}&end_date=${formatDate(endDate)}&platform=${operator}&campaign_id=${campaignId}&keyword=${keywordName}`;
            if (selectedBrand) {
                url += `&brand_name=${encodeURIComponent(selectedBrand)}`;
            }
            
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json()
            if (response.ok) {
                setShowTrendsModal({ name: keywordName, show: true, data: data });
            } else {
                console.error("Failed to fetch campaign data");
            }
        } catch (error) {
            console.error("Error fetching campaign data", error);
        }
    };

    const handleSnackbarClose = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleSnackbarOpen = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const updateKeywordStatus = (campaignType, keywordId, targetId, adGroupId, campaignId) => {
        setKeywordsData(prevData => ({
            ...prevData,
            data: prevData.data.map(keyword =>
                keyword.campaign_id_x === campaignId && keyword.campaign_type_x === campaignType && keyword.keyword_id_x === keywordId && keyword.targeting_id_x === targetId && keyword.ad_group_id_x === adGroupId ? { ...keyword, status: keyword.status === 1 ? 0 : 1 } : keyword
            )
        }));
    };

    const confirmStatusChange = async () => {
        setConfirmation({ show: false, campaignType: null, keywordId: null, targetId: null, adGroupId: null, campaignId: null });
        const { campaignType, keywordId, targetId, adGroupId, campaignId } = confirmation;

        setUpdatingKeywords(prev => ({ ...prev, [campaignId]: true, [campaignType]: true, [keywordId]: true, [targetId]: true, [adGroupId]: true }));

        try {
            const token = localStorage.getItem("accessToken");
            if (!token) throw new Error("No access token found");
            const params = new URLSearchParams({
                platform: operator,
                campaign_type: campaignType,
                keyword_id: keywordId,
                target_id: targetId,
                ad_group_id: adGroupId,
                campaign_id: campaignId
            });
            
            if (selectedBrand) {
                params.append('brand_name', selectedBrand);
            }
            
            const response = await fetch(`https://react-api-script.onrender.com/sugar/toggle_keyword_or_target_state?${params.toString()}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
            });

            if (!response.ok) throw new Error("Failed to update keyword status");
            updateKeywordStatus(campaignType, keywordId, targetId, adGroupId, campaignId);
            handleSnackbarOpen("Status updated successfully!", "success");
        } catch (error) {
            console.error("Error updating campaign status:", error);
            handleSnackbarOpen("Failed to update status!", "error");
        } finally {
            setUpdatingKeywords(prev => {
                const newState = { ...prev };
                delete newState[campaignId];
                delete newState[campaignType];
                delete newState[adGroupId];
                delete newState[keywordId];
                delete newState[targetId];
                return newState;
            });
        }
    };

    return (
        <React.Fragment>
            <Dialog open={confirmation.show} onClose={() => setConfirmation({ show: false, campaignType: null, keywordId: null, targetId: null, adGroupId: null, campaignId: null })}>
                <DialogTitle>Confirm Status Change</DialogTitle>
                <DialogContent>Are you sure you want to change status of this keyword/target?</DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmation({ show: false, campaignType: null, keywordId: null, targetId: null, adGroupId: null, campaignId: null })}>Cancel</Button>
                    <Button onClick={confirmStatusChange} color="primary">Confirm</Button>
                </DialogActions>
            </Dialog>
            <TrendsModal
                showTrendsModal={showTrendsModal}
                setShowTrendsModal={setShowTrendsModal} />
            <div className="shadow-box-con-keywords aggregated-view-con">
                <div className="datatable-con-keywords">
                    <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
                        <Button variant="outlined" size="small" onClick={handleRefresh}>
                            Refresh
                        </Button>
                    </Box>

                    {isLoading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <MuiDataTableComponent
                            isLoading={isLoading}
                            isExport={true}
                            columns={columns}
                            data={keywordsData.data || []} />
                    )}
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

export default KeywordsComponent;