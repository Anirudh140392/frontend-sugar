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
    const selectedBrand = searchParams.get("brand") || "";
    const navigate = useNavigate()

    const abortControllerRef = useRef(null);

    // Brand account combinations
    const accountCombinations = [
        { "brand": "Quench Botanics"},
        { "brand": "SUGAR Cosmetics"},
         { "brand": "SUGAR POP"}
    ];

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
       if (selectedBrand && selectedBrand.trim() !== "")  {
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
    }, [operator, dateRange, selectedBrand]);

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

    // Helper to display keyword or fallback
    const getKeywordDisplay = (keyword) => {
        if (!keyword || keyword === 0 || keyword === "0") {
            return "N/A";
        }
        return keyword;
    };

    const KeywordsColumnBlinkit = [
        {
            field: "keyword",
            headerName: "TARGET",
            minWidth: 150,
            renderCell: (params) => {
                const keywordDisplay = getKeywordDisplay(params.row.keyword);
                const isClickable = keywordDisplay !== "N/A";
                
                return (
                    <div 
                        className={isClickable ? "text-icon-div cursor-pointer" : "text-icon-div"}
                        onClick={isClickable ? () => handleKeywordClick(params.row.keyword, params.row.campaign_id) : undefined}
                    >
                        <Typography 
                            className={isClickable ? "redirect" : ""} 
                            variant="body2"
                            sx={{ color: isClickable ? 'inherit' : 'text.secondary' }}
                        >
                            {keywordDisplay}
                        </Typography>
                    </div>
                );
            },
        },
        { 
            field: "keyword_type",
            headerName: "MATCH TYPE", 
            minWidth: 150, 
            headerAlign: "left",
            renderCell: (params) => {
                const matchType = params.row.keyword_type;
                return matchType && matchType !== "" ? matchType : "N/A";
            }
        },
        {
            field: "avg_cpm",
            headerName: "BID",
            minWidth: 150,
            renderCell: (params) => {
                const keyword = params.row.keyword;
                const keywordType = params.row.keyword_type;
                
                // Don't show BidCell for SPR campaigns (keyword === 0)
                if (!keyword || keyword === 0 || keyword === "0") {
                    return (
                        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {params.row.avg_cpm ? params.row.avg_cpm.toFixed(2) : "N/A"}
                            </Typography>
                        </Box>
                    );
                }

                return (
                    <BidCell
                        value={params.row.avg_cpm}
                        campaignId={params.row.campaign_id}
                        campaignType={params.row.campaign_type}
                        keyword={keyword}
                        keywordType={keywordType}
                        platform={operator}
                        onUpdate={(campaignId, updatedKeyword, newBid, updatedKeywordType) => {
                            // Clear cache and refresh data after bid update
                            const startDate = formatDate(dateRange[0].startDate);
                            const endDate = formatDate(dateRange[0].endDate);
                            const ts = `&_=${Date.now()}`;
                            let url = `https://react-api-script.onrender.com/sugar/keywords?start_date=${startDate}&end_date=${endDate}&platform=${operator}${ts}`;
                            if (selectedBrand && selectedBrand.trim() !== "") {
                                url += `&brand_name=${encodeURIComponent(selectedBrand)}`;
                            }
                            const cacheKey = `cache:GET:${url}`;
                            try { localStorage.removeItem(cacheKey); } catch (_) {}
                            getKeywordsData(true);
                        }}
                        onSnackbarOpen={handleSnackbarOpen}
                    />
                );
            }, 
            type: "number", 
            align: "left",
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
            field: "sales",
            headerName: "SALES",
            minWidth: 150,
            renderCell: (params) => (
                <ColumnPercentageDataComponent mainValue={params.row.sales} percentValue={params.row.sales_change} />
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

       const KeywordsColumnZepto = [
        {
            field: "keyword_name",
            headerName: "TARGET",
            minWidth: 150,
            renderCell: (params) => {
                const keywordDisplay = getKeywordDisplay(params.row.keyword_name);
                const isClickable = keywordDisplay !== "N/A";
                
                return (
                    <div 
                        className={isClickable ? "text-icon-div cursor-pointer" : "text-icon-div"}
                        onClick={isClickable ? () => handleKeywordClick(params.row.keyword, params.row.campaign_id) : undefined}
                    >
                        <Typography 
                            className={isClickable ? "redirect" : ""} 
                            variant="body2"
                            sx={{ color: isClickable ? 'inherit' : 'text.secondary' }}
                        >
                            {keywordDisplay}
                        </Typography>
                    </div>
                );
            },
        },
        { 
            field: "match_type",
            headerName: "MATCH TYPE", 
            minWidth: 150, 
            headerAlign: "left",
            renderCell: (params) => {
                const matchType = params.row.match_type;
                return matchType && matchType !== "" ? matchType : "N/A";
            }
        },
        {
  field: "bid",
  headerName: "BID",
  minWidth: 150,
  renderCell: (params) => {
    const keyword = params.row.keyword_name;
    const keywordType = params.row.match_type;

    if (!keyword || keyword === 0 || keyword === "0") {
      return (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {params.row.bid ? params.row.bid.toFixed(2) : "N/A"}
          </Typography>
        </Box>
      );
    }

    return (
      <BidCell
        value={params.row.bid}
        campaignId={params.row.campaign_id}
        campaignType={params.row.campaign_type}
        keyword={keyword}
        keywordType={keywordType}
        platform={operator}
        brand_name={params.row.brand_name}
        onUpdate={(campaignId, updatedKeyword, newBid, updatedKeywordType) => {
          console.log('Updating keyword bid:', {
            campaignId,
            keyword: updatedKeyword,
            keywordType: updatedKeywordType,
            newBid,
          });

          setKeywordsData(prevData => {
            const updatedData = {
              ...prevData,
              data: prevData.data.map(row =>
                row.campaign_id === campaignId &&
                row.keyword_name === updatedKeyword &&
                row.keyword_type === updatedKeywordType
                  ? { ...row, bid: newBid }
                  : row
              ),
            };
            console.log('Updated keywordsData:', updatedData);
            return updatedData;
          });
        }}
        onSnackbarOpen={handleSnackbarOpen}
      />
    );
  }, 
  type: "number", 
  align: "left",
  headerAlign: "left",
}
,
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
            field: "revenue",
            headerName: "SALES",
            minWidth: 150,
            renderCell: (params) => (
                <ColumnPercentageDataComponent mainValue={params.row.revenue} percentValue={params.row.revenue_change} />
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
            field: "aov",
            headerName: "AOV",
            minWidth: 150,
            renderCell: (params) => (
                <ColumnPercentageDataComponent mainValue={params.row.aov} percentValue={params.row.aov_change} />
            ), 
            type: "number", 
            align: "left",
            headerAlign: "left",
        },
         {
            field: "ctr",
            headerName: "CTR",
            minWidth: 150,
            renderCell: (params) => (
                <ColumnPercentageDataComponent mainValue={params.row.ctr} percentValue={params.row.ctr_change} />
            ), 
            type: "number", 
            align: "left",
            headerAlign: "left",
        },
         {
            field: "cvr",
            headerName: "CVR",
            minWidth: 150,
            renderCell: (params) => (
                <ColumnPercentageDataComponent mainValue={params.row.cvr} percentValue={params.row.cvr_change} />
            ), 
            type: "number", 
            align: "left",
            headerAlign: "left",
        },
         {
            field: "cpm",
            headerName: "CPM",
            minWidth: 150,
            renderCell: (params) => (
                <ColumnPercentageDataComponent mainValue={params.row.cpm} percentValue={params.row.cpm_change} />
            ), 
            type: "number", 
            align: "left",
            headerAlign: "left",
        },
         {
            field: "cpc",
            headerName: "CPC",
            minWidth: 150,
            renderCell: (params) => (
                <ColumnPercentageDataComponent mainValue={params.row.cpc} percentValue={params.row.cpc_change} />
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
        if (operator === "Zepto") return KeywordsColumnZepto;
        return [];
    }, [operator, brands, updatingKeywords]);

    const handleKeywordClick = async (keywordName, campaignId) => {
        // Don't allow clicking for SPR campaigns
        if (!keywordName || keywordName === 0 || keywordName === "0") {
            return;
        }

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