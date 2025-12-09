import React, { useEffect, useState, useContext, useMemo, useRef } from "react";
import MuiDataTableComponent from "../../common/muidatatableComponent";
import overviewContext from "../../../../store/overview/overviewContext";
import { useSearchParams, useNavigate } from "react-router";
import EditRuleModal from "./modal/editRuleModal";
import NewRuleModal from "./modal/newRuleModal";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import CircularProgress from '@mui/material/CircularProgress';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Snackbar, Box, Button, Tooltip } from "@mui/material";
import { Alert } from "react-bootstrap";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";

// Cache configuration
const CACHE_KEY_PREFIX = 'rules_cache_';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Cache utility functions
const getCacheKey = (operator) => `${CACHE_KEY_PREFIX}${operator}`;

const getCachedData = (operator) => {
  try {
    const cacheKey = getCacheKey(operator);
    const cached = sessionStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - timestamp < CACHE_DURATION) {
      return data;
    }
    
    // Cache expired, remove it
    sessionStorage.removeItem(cacheKey);
    return null;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
};

const setCachedData = (operator, data) => {
  try {
    const cacheKey = getCacheKey(operator);
    const cacheObject = {
      data,
      timestamp: Date.now()
    };
    sessionStorage.setItem(cacheKey, JSON.stringify(cacheObject));
  } catch (error) {
    console.error('Error setting cache:', error);
  }
};

const clearCache = (operator) => {
  try {
    const cacheKey = getCacheKey(operator);
    sessionStorage.removeItem(cacheKey);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

const SmartControlDatatable = () => {
  const [showEditRuleModal, setShowEditRuleModal] = useState(false);
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [rulesData, setRulesData] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [isLoading, setIsLoading] = useState(false);
  const [updatingRuleId, setUpdatingRuleId] = useState(null);
  const [deletingRuleId, setDeletingRuleId] = useState(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);

  const { campaignSetter } = useContext(overviewContext);

  const [searchParams] = useSearchParams();
  const operator = searchParams.get("operator");
  const navigate = useNavigate();

  const abortControllerRef = useRef(null);

  const getRulesData = async (forceRefresh = false) => {
    if (!operator) return;

    // Try to get cached data first (unless force refresh)
    if (!forceRefresh) {
      const cachedData = getCachedData(operator);
      if (cachedData) {
        setRulesData(cachedData);
        setIsFromCache(true);
        console.log('Loaded rules from cache');
        return;
      }
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setIsFromCache(false);
    
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.error("No access token found");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://react-api-script.onrender.com/sugar/displayrules?platform=${operator}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal
        }
      );

      

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setRulesData(data);
      
      // Cache the fetched data
      setCachedData(operator, data);
      console.log('Fetched fresh rules data and cached it');
      
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Previous request aborted due to operator change.");
      } else {
        console.error("Failed to fetch rules data:", error.message);
        handleSnackbarOpen("Failed to fetch rules data", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      getRulesData();
    }, 100);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      clearTimeout(timeout);
    }
  }, [operator]);

  const onCampaignClick = (value) => {
    campaignSetter(value);
    navigate(`/?operator=${operator}&tab=keywords`);
  };

  const handleOpenConfirmDialog = (rule) => {
    setRuleToDelete(rule);
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setRuleToDelete(null);
    setOpenConfirmDialog(false);
  };

  const handleRefresh = () => {
    clearCache(operator);
    getRulesData(true);
    handleSnackbarOpen("Refreshing rules data...", "info");
  };

  const SmartControlColumn = useMemo(() => [
    {
      field: 'id', headerName: '#ID', minWidth: 100, type: "number", align: "left",
      headerAlign: "left",
    },
    {
      field: 'name',
      headerName: 'NAME',
      minWidth: 300,
      renderCell: (params) => (
        <span
          className="text-icon-div cursor-pointer redirect"
          onClick={() => onCampaignClick(params.row.name)}
        >
          {params.row.name}
        </span>
      )
    },
    { field: 'module', headerName: 'MODULE', minWidth: 150 },
    { field: 'type', headerName: 'TYPE', minWidth: 150 },
    {
      field: 'frequency_type', headerName: 'SCHEDULE', minWidth: 150, type: "number", align: "left",
      headerAlign: "left",
    },
    {
      field: 'status',
      headerName: 'STATUS',
      minWidth: 150,
      type: 'singleSelect',
      valueOptions: [
        { value: 1, label: 'Active' },
        { value: 0, label: 'In-Active' }
      ],
      renderCell: (params) => (
        <span>{params.value === 1 ? 'Active' : 'In-Active'}</span>
      ),
    },
    {
      field: 'action',
      headerName: 'ACTION',
      minWidth: 250,
      renderCell: (params) => (
        <span className="flex items-center gap-2">
          {updatingRuleId === params.row.rule_id ? (
            <div className="w-5 h-5">
              <CircularProgress size={18} />
            </div>
          ) : (
            <span
              className="cursor-pointer"
              onClick={() => toggleRuleStatus(params.row.rule_id, params.row.status)}
            >
              {params.row.status === 1 ? <PauseIcon /> : <PlayArrowIcon />}
            </span>
          )}
          <span
            className="cursor-pointer"
            onClick={() => {
              if (!params.row?.type) return;
              setSelectedRule(params.row);
              setShowEditRuleModal(true);
            }}
          >
            <EditIcon />
          </span>
          {deletingRuleId === params.row.id ? (
            <CircularProgress size={18} />
          ) : (
            <span
              className="cursor-pointer"
              onClick={() => handleOpenConfirmDialog(params.row)}
            >
              <DeleteIcon />
            </span>
          )}
        </span>
      ),
      sortable: false,
    },
  ], [updatingRuleId, deletingRuleId]);

  const SmartControlData = rulesData?.data.map((item) => ({
    ...item,
    id: item.id,
    name: item.rule_name,
    module: "Campaigns",
    type: item.type,
    schedule: item.frequency,
    status: item.status,
    rule_id: item.rule_id
  }));

  const toggleRuleStatus = async (ruleId, currentStatus) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    setUpdatingRuleId(ruleId);

    try {
      const response = await fetch(
        `https://react-api-script.onrender.com/sugar/play-pause-rule?rule_id=${ruleId}&platform=${operator}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();

      setRulesData((prevData) => {
        const updatedData = {
          ...prevData,
          data: prevData.data.map(rule =>
            rule.rule_id === ruleId ? { ...rule, status: result.new_status } : rule
          )
        };
        
        // Update cache with new data
        setCachedData(operator, updatedData);
        return updatedData;
      });

      handleSnackbarOpen("Rule status updated successfully", "success");

    } catch (error) {
      console.error("Failed to update rule status:", error.message);
      handleSnackbarOpen("Failed to update rule status", "error");
    } finally {
      setUpdatingRuleId(null);
    }
  };

  const deleteRule = async (ruleId, status) => {
    if (status !== 0) {
      handleSnackbarOpen("Only inactive rules can be deleted", "warning");
      return;
    }
    
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    setDeletingRuleId(ruleId);

    try {
      const response = await fetch(
        `https://react-api-script.onrender.com/rules_engine/rules/${ruleId}/delete/`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();

      setRulesData((prevData) => {
        const updatedData = {
          ...prevData,
          data: prevData.data.filter(rule => rule.rule_id !== ruleId)
        };
        
        // Update cache after deletion
        setCachedData(operator, updatedData);
        return updatedData;
      });

      handleSnackbarOpen("Rule deleted successfully", "success");

    } catch (error) {
      console.error("Failed to delete rule:", error.message);
      handleSnackbarOpen("Failed to delete rule", "error");
    } finally {
      setDeletingRuleId(null);
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
      <Dialog open={openConfirmDialog} onClose={handleCloseConfirmDialog}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the rule "<strong>{ruleToDelete?.name}</strong>"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={() => {
              deleteRule(ruleToDelete.rule_id, ruleToDelete.status);
              handleCloseConfirmDialog();
            }}
            color="error"
            disabled={deletingRuleId === ruleToDelete?.rule_id}
          >
            {deletingRuleId === ruleToDelete?.rule_id ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <EditRuleModal 
        getRulesData={getRulesData} 
        showEditRuleModal={showEditRuleModal}
        setShowEditRuleModal={setShowEditRuleModal} 
        editRuleData={selectedRule} 
        operator={operator}
      />
      
      <NewRuleModal
        showRuleModal={showAddRuleModal}
        setShowRuleModal={setShowAddRuleModal}
        getRulesData={getRulesData}
        operator={operator}
      />

      {/* Action buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 2 }}>
        <Tooltip title={isFromCache ? "Data loaded from cache. Click to refresh" : "Refresh data"}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={isLoading}
            sx={{
              borderColor: '#1976d2',
              color:'#1976d2',
              
            }}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Tooltip>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddRuleModal(true)}
          sx={{ 
            backgroundColor: '#1976d2',
            '&:hover': {
              backgroundColor: '#1565c0'
            }
          }}
        >
          Add Rule
        </Button>
      </Box>

      <div className="datatable-con">
        <MuiDataTableComponent
          isLoading={isLoading}
          columns={SmartControlColumn}
          data={SmartControlData} 
        />
      </div>
      
      <Snackbar 
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={handleSnackbarClose}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity} 
          variant="filled" 
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </React.Fragment>
  );
};

export default SmartControlDatatable;