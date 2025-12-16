import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  MenuItem,
  Select,
  TextField,
  Typography,
  InputLabel,
  FormControl,
  Paper,
  IconButton,
  Alert,
  CircularProgress,
  Drawer,
  Divider,
  Chip,
  Fade,
  Zoom,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  useTheme,
  alpha,
} from "@mui/material";
import AsyncSearchDropdown from "./modal/AsyncSearchDropdown";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import TuneIcon from "@mui/icons-material/Tune";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const PLATFORM_MAP = {
  amazon: 6,
  bigbasket: 4,
  blinkit: 1,
  flipkart: 5,
  flipkart_minutes: 7,
  instamart: 3,
  zepto: 2,
};

const BRAND_MAP = {
  continental: 2,
  sugar: 3,
  sugar: 1,
};
const PLATFORM_OPTIONS = Object.keys(PLATFORM_MAP);

const AddRuleCreator = ({ operator, onSave, onClose, setShowRuleModal, open = true }) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);

  // Common fields
  const [ruleType, setRuleType] = useState("bid");
  const [errors, setErrors] = useState({});
  const [platformName, setPlatformName] = useState(operator ? operator.toLowerCase() : "");


  const [ruleName, setRuleName] = useState("");
  const [userName, setUserName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("");
  const [frequencyNumber, setFrequencyNumber] = useState(1);
  const [placements, setPlacements] = useState("search");
  const generateUserId = () => Math.floor(100000 + Math.random() * 900000);
  const [userId] = useState(generateUserId());

  // Filters
  const [filters, setFilters] = useState([]);

  // TYPE-SPECIFIC
  const [targets, setTargets] = useState([
    {
      campaign_id: "",
      campaign_name: "",
      ad_group_id: "",
      keyword_id: "",
      ad_group_name: "",
      target_type: "",
      target_identifier: "",
      match_type: "",
      placement_type: "",
      bid_value: "",
      min_bid: "",
      max_bid: "",
    },
  ]);

  const [actions, setActions] = useState([
    {
      campaign_id: "",
      apply_action: "",
      scheduled_at: "",
      reason: "",
    },
  ]);

  const [campaigns, setCampaigns] = useState([
    {
      campaign_id: "",
      budget_value: "",
      min_budget: "",
      max_budget: "",
      daily_or_total: "",
    },
  ]);
  const [statusFlag, setStatusFlag] = useState(0);
  const [loading, setLoading] = useState(false);
  const [jsonError, setJsonError] = useState("");
  const [hasMoreCampaigns, setHasMoreCampaigns] = useState(true);


  // API data states
  const [campaignsData, setCampaignsData] = useState([]);
  const [keywordsData, setKeywordsData] = useState({});
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  const [operationName, setOperationName] = useState("");
  const [operationValue, setOperationValue] = useState("");

  // Async search states
  const [campaignSearchQuery, setCampaignSearchQuery] = useState("");
  const [keywordSearchQuery, setKeywordSearchQuery] = useState({});


  // Pagination states
  const [campaignPage, setCampaignPage] = useState(1);
  const [campaignPageSize, setCampaignPageSize] = useState(5);
  const [keywordPage, setKeywordPage] = useState(1);
  const [keywordPageSize, setKeywordPageSize] = useState(5);

  // Available filter metrics
  const filterMetrics = [
    { value: "cvr", label: "CVR", icon: "📊" },
    { value: "roas", label: "ROAS", icon: "💰" },
    { value: "acos", label: "ACOS", icon: "📈" },
    { value: "ctr", label: "CTR", icon: "👆" },
    { value: "spends", label: "Spends", icon: "💳" },
    { value: "sales", label: "Sales", icon: "🛒" },
    { value: "troas", label: "TROAS", icon: "📉" },
    { value: "impressions", label: "Impressions", icon: "👁️" },
    { value: "clicks", label: "Clicks", icon: "🖱️" },
    { value: "limit_value", label: "Limit", icon: "🖱️" },
  ];

  const operatorOptions = [
    { value: "<", label: "<" },
    { value: ">", label: ">" },
    { value: "=", label: "=" },
    { value: "<=", label: "<=" },
    { value: ">=", label: ">=" },
  ];

  const steps = ['Basic Info', 'Filters', 'Configuration'];
  const loadMoreCampaigns = (page) => {
    setCampaignPage(page);
    fetchCampaigns(true, new AbortController());
  };


  const fetchCampaigns = async (isMounted, abortController, campaignName = "", campaignId = "") => {
    if (!brandName || !platformName) {
      if (isMounted) setCampaignsData([]);
      return;
    }

    const brandId = BRAND_MAP[brandName?.toLowerCase()];
    if (!brandId) return;

    if (isMounted) setLoadingCampaigns(true);

    try {
      const token = localStorage.getItem("accessToken");

      let url = `https://react-api-script.onrender.com/rules_engine/metadata/campaigns/?brand_id=${brandId}&platform=${platformName}&page=${campaignPage}&page_size=25`;
      
      if (campaignName) {
        url += `&campaign_name=${encodeURIComponent(campaignName)}`;
      }
      if (campaignId) {
        url += `&campaign_id=${encodeURIComponent(campaignId)}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: abortController.signal,
      });

      if (!response.ok) throw new Error("Failed to fetch campaigns");

      const json = await response.json();

      // your API returns {data: []}
      const list = json.data || json.campaigns || []; 

      const newCampaigns = (list || [])?.map((c) => ({
        campaign_id:
          c.campaign_id ?? c.id ?? c.CampaignId ?? c.campaignId ?? c.campaignID,
        campaign_name:
          c.campaign_name ?? c.name ?? c.campaignName ?? c.title ?? "",
      }));

      if (!isMounted) return;

      // PAGE 1 → replace
      // PAGE > 1 → append
      setCampaignsData((prev) =>
        campaignPage === 1 ? newCampaigns : [...prev, ...newCampaigns]
      );

      // enable/disable infinite scroll (page_size is 5 for campaigns)
      setHasMoreCampaigns(newCampaigns.length === 5);

    } catch (err) {
      if (err.name !== "AbortError") console.error(err);
      if (isMounted) setCampaignsData([]);
    } finally {
      if (isMounted) setLoadingCampaigns(false);
    }
  };

  // Fetch campaigns when brandName and platformName change
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();


    fetchCampaigns(isMounted, abortController);

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [brandName, platformName]);

  const fetchKeywords = async (campaignId, index, targetType, searchTerm = "", page = 1) => {
    if (!campaignId || !brandName || !platformName) return;

    const brandId = BRAND_MAP[brandName?.toLowerCase()];
    if (!brandId) return;

    try {
      const token = localStorage.getItem("accessToken");
      let url = `https://react-api-script.onrender.com/rules_engine/metadata/campaigns/${campaignId}/?brand_id=${brandId}&platform=${platformName}&page=${page}&page_size=25`;
      
      if (searchTerm) {
        url += `&search_term=${encodeURIComponent(searchTerm)}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch campaign details");

      const data = await response.json();

      const keywordsListRaw = Array.isArray(data?.keywords)
        ? data.keywords
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];

      const keywordsList = (keywordsListRaw || []).map((k) => ({
        keyword: k.KeywordName ?? k.keyword ?? k.name ?? k.text ?? "",
        KeywordName: k.KeywordName ?? k.keyword ?? k.name ?? k.text ?? "",
        bid: k.bid ?? k.defaultBid ?? k.default_bid ?? "",
        match_type: k.KeywordMatchType ?? k.matchType ?? k.match_type ?? "",
        ad_group_id: k.adGroupId ?? k.ad_group_id ?? k.adgroupId ?? "",
        ad_group_name: k.adGroupName ?? k.ad_group_name ?? k.adgroupName ?? "",
        campaign_id: k.campaign_id ?? k.CampaignId ?? campaignId,
      }));

      const placementsListRaw = Array.isArray(data?.placements)
        ? data.placements
        : Array.isArray(data?.targets)
          ? data.targets
          : [];

      const placementsList = (placementsListRaw || []).map((p) => ({
        target_identifier: p.target_identifier ?? p.targetIdentifier ?? p.identifier ?? p.placement_id ?? "",
        placement_type: p.placement_type ?? p.placementType ?? p.type ?? "",
        bid: p.bid ?? p.default_bid ?? p.bid_value ?? "",
      }));

      setKeywordsData((prev) => ({
        ...prev,
        [`${targetType}_${index}`]: {
          keywords: keywordsList,
          placements: placementsList,
        },
      }));
    } catch (err) {
      console.error("Error fetching campaign details:", err);
      setKeywordsData((prev) => ({
        ...prev,
        [`${targetType}_${index}`]: {
          keywords: [],
          placements: [],
        },
      }));
    }
  };

  // Async search handler for campaigns
 // Async search handler for campaigns
// Async search handler for campaigns
const searchCampaigns = async (query, page = 1, signal) => {
  if (!brandName || !platformName) return { items: [], hasMore: false };

  const brandId = BRAND_MAP[brandName?.toLowerCase()];
  if (!brandId) return { items: [], hasMore: false };

  try {
    const token = localStorage.getItem("accessToken");
    
    // Base URL with required params and pagination
    let url = `https://react-api-script.onrender.com/rules_engine/metadata/campaigns/?brand_id=${brandId}&platform=${platformName}&page=${page}&page_size=25`;
    
    // Add search params only if query exists
    if (query && query.trim()) {
      const trimmedQuery = query.trim();
      
      // Check if query is numeric (likely campaign_id)
      const isNumeric = /^\d+$/.test(trimmedQuery);
      
      if (isNumeric) {
        // Search by campaign_id
        url += `&campaign_id=${encodeURIComponent(trimmedQuery)}`;
      } else {
        // Search by campaign_name
        url += `&campaign_name=${encodeURIComponent(trimmedQuery)}`;
      }
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: signal, // Pass abort signal
    });

    if (!response.ok) throw new Error("Failed to fetch campaigns");

    const json = await response.json();
    const list = json.campaigns?.data || json.data || json.campaigns || [];

    const items = (list || []).map((c) => ({
      id: c.campaign_id ?? c.id ?? c.CampaignId ?? c.campaignId ?? "",
      name: `ID: ${c.campaign_id ?? c.id} - ${c.campaign_name ?? c.name ?? c.campaignName ?? ""}`,
      campaign_id: c.campaign_id ?? c.id ?? c.CampaignId ?? c.campaignId ?? "",
      campaign_name: c.campaign_name ?? c.name ?? c.campaignName ?? c.title ?? "",
    }));

    // Check if there are more items (page_size is 5)
    return { items, hasMore: items.length === 5 };
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error("Error searching campaigns:", err);
    }
    return { items: [], hasMore: false };
  }
};

  // Async search handler for keywords
  const searchKeywords = async (campaignId, index, query, page = 1) => {
    if (!campaignId || !brandName || !platformName) return { items: [], hasMore: false };

    const brandId = BRAND_MAP[brandName?.toLowerCase()];
    if (!brandId) return { items: [], hasMore: false };

    try {
      const token = localStorage.getItem("accessToken");
      
      let url = `https://react-api-script.onrender.com/rules_engine/metadata/campaigns/${campaignId}/?brand_id=${brandId}&platform=${platformName}&page=${page}&page_size=25`;
      
      if (query) {
        url += `&search_term=${encodeURIComponent(query)}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch keywords");

      const data = await response.json();

      const keywordsListRaw = Array.isArray(data?.keywords)
        ? data.keywords
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];

      const items = (keywordsListRaw || []).map((k) => ({
        id: k.KeywordName ?? k.keyword ?? k.name ?? "",
        name: k.KeywordName ?? k.keyword ?? k.name ?? "",
        keyword: k.KeywordName ?? k.keyword ?? k.name ?? "",
        KeywordName: k.KeywordName ?? k.keyword ?? k.name ?? "",
        bid: k.bid ?? k.defaultBid ?? k.default_bid ?? "",
        match_type: k.KeywordMatchType ?? k.matchType ?? k.match_type ?? "",
        ad_group_id: k.adGroupId ?? k.ad_group_id ?? k.adgroupId ?? "",
        ad_group_name: k.adGroupName ?? k.ad_group_name ?? k.adgroupName ?? "",
        campaign_id: k.campaign_id ?? k.CampaignId ?? campaignId,
      }));

      return { items, hasMore: items.length === 25 };
    } catch (err) {
      console.error("Error searching keywords:", err);
      return { items: [], hasMore: false };
    }
  };

  const getCampaignKeywords = (targetIndex, campaignId) => {
    const allKeywords = keywordsData[`target_${targetIndex}`]?.keywords || [];
    return allKeywords.filter(k => String(k.campaign_id) === String(campaignId));
  };

  const setKeywordPageForTarget = (targetIndex, page) => {
    setKeywordPage((prev) => ({
      ...prev,
      [targetIndex]: page,
    }));
  };

  // FILTER FUNCTIONS
  const addFilter = () => setFilters([...filters, { key: "cvr", operator: "<", value: "" }]);
  const removeFilter = (i) => setFilters(filters.filter((_, idx) => idx !== i));
  const updateFilter = (i, field, val) => {
    const updated = [...filters];
    updated[i][field] = val;
    setFilters(updated);
  };

  // BID RULE FUNCTIONS
  const addTarget = () =>
    setTargets([
      ...targets,
      {
        campaign_id: "",
        campaign_name: "",
        ad_group_id: "",
        keyword_id: "",
        ad_group_name: "",
        target_type: "",
        target_identifier: "",
        match_type: "",
        placement_type: "",
        bid_value: "",
        min_bid: "",
        max_bid: "",
      },
    ]);

  const removeTarget = (i) => setTargets(targets.filter((_, idx) => idx !== i));

  const updateTargetField = (i, field, value) => {
    const updated = [...targets];
    updated[i][field] = value;

    if (field === "campaign_id") {
      const campaign = campaignsData.find((c) => c.campaign_id == value);
      if (campaign) {
        updated[i].campaign_name = campaign.campaign_name;
      }
      fetchKeywords(value, i, "target");
      updated[i].keyword_id = "";
      updated[i].ad_group_id = "";
      updated[i].ad_group_name = "";
      updated[i].match_type = "";
      updated[i].bid_value = "";
      updated[i].target_identifier = "";
      updated[i].placement_type = "";
    }

    if (field === "target_type") {
      updated[i].keyword_id = "";
      updated[i].ad_group_id = "";
      updated[i].ad_group_name = "";
      updated[i].match_type = "";
      updated[i].bid_value = "";
      updated[i].target_identifier = "";
      updated[i].placement_type = "";
    }

    if (field === "keyword_id") {
      const campaignData = keywordsData[`target_${i}`] || {};
      const keywords = campaignData.keywords || [];
      const keyword = keywords.find((k) => k.KeywordName === value);

      if (keyword) {
        updated[i].target_identifier = keyword.KeywordName;
        updated[i].bid_value = keyword.bid ?? "";
        updated[i].match_type = keyword.match_type ?? "";
        updated[i].ad_group_id = keyword.ad_group_id ?? "";
        updated[i].ad_group_name = keyword.ad_group_name ?? "";
      }
    }

    if (field === "target_identifier" && updated[i].target_type === "keyword") {
      const campaignData = keywordsData[`target_${i}`] || {};
      const keywords = campaignData.keywords || [];
      const keyword = keywords.find((k) => k.KeywordName === value);

      if (keyword) {
        updated[i].keyword_id = keyword.KeywordName || value;
        updated[i].target_identifier = keyword.KeywordName || value;
        updated[i].bid_value = keyword.bid ?? "";
        updated[i].match_type = keyword.match_type ?? "";
        updated[i].ad_group_id = keyword.ad_group_id ?? "";
        updated[i].ad_group_name = keyword.ad_group_name ?? "";
      }
    }

    if (field === "ad_group_id") {
      const campaignData = keywordsData[`target_${i}`] || {};
      const keywords = campaignData.keywords || [];
      const keyword = keywords.find((k) => k.ad_group_id === value);
      if (keyword) {
        updated[i].ad_group_name = keyword.ad_group_name || "";
      }
    }

    if (field === "target_identifier" && updated[i].target_type === "placement") {
      const campaignData = keywordsData[`target_${i}`] || {};
      const placements = campaignData.placements || [];
      const placement = placements.find((p) => p.target_identifier === value);
      if (placement) {
        updated[i].bid_value = placement.bid || "";
        updated[i].placement_type = placement.placement_type || "";
      }
    }

    setTargets(updated);
  };
  console.log('targets', targets); 

  // STATUS RULE FUNCTIONS
  const addAction = () =>
    setActions([
      ...actions,
      {
        campaign_id: "",
        apply_action: "",
        scheduled_at: "",
        reason: "",
      },
    ]);

  const removeAction = (i) => setActions(actions.filter((_, idx) => idx !== i));

  const updateActionField = (i, field, value) => {
    const updated = [...actions];
    updated[i][field] = value;

    if (field === "campaign_id") {
      const campaign = campaignsData.find((c) => c.campaign_id == value);
      if (campaign) {
        // Store campaign_name if needed
      }
      fetchKeywords(value, i, "action");
    }

    setActions(updated);
  };

  // BUDGET RULE FUNCTIONS
  const addCampaign = () =>
    setCampaigns([
      ...campaigns,
      {
        campaign_id: "",
        budget_value: "",
        min_budget: "",
        max_budget: "",
        daily_or_total: "",
      },
    ]);

  const removeCampaign = (i) => setCampaigns(campaigns.filter((_, idx) => idx !== i));

  const updateCampaignField = (i, field, value) => {
    const updated = [...campaigns];
    updated[i][field] = value;

    if (field === "campaign_id") {
      const campaign = campaignsData.find((c) => c.campaign_id == value);
      if (campaign) {
        // Store campaign_name if needed
      }
      fetchKeywords(value, i, "campaign");
    }

    setCampaigns(updated);
  };

  const validateForm = () => {
    try {
      let newErrors = {};

      if (!userName.trim()) newErrors.userName = "User Name is required";
      if (!ruleName.trim()) newErrors.ruleName = "Rule Name is required";
      if (!brandName.trim()) newErrors.brandName = "Brand Name is required";
      if (!platformName || platformName.trim() === "")
        newErrors.platform = "Platform Name is required";

      if (frequencyNumber === 1) {
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(frequency)) {
          newErrors.frequency = "Enter a valid time in 24-hour format (HH:MM)";
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    } catch (err) {
      console.error("Validation error:", err);
      return false;
    }
  };

  const buildPayload = () => {
    const payload = {
      TYPE: ruleType,
      platform_name: platformName,
      pf_id: PLATFORM_MAP[platformName] || null,
      STATUS: Number(statusFlag),

      operation_name: operationName || null,
      operation_type: operationValue ? Number(operationValue) : null,


      user_id: userId,
      user_name: userName,
      rule_name: ruleName,
      brand_name: brandName,
      brand_id: BRAND_MAP[brandName?.toLowerCase()] || null,
      description,
      //frequency: frequencyNumber > 1 ? "" : frequency,
      frequency_number: Number(frequencyNumber) || 1,

      placements,
    };

    // filters.forEach((f) => {
    //   if (f.value) {
    //     payload[f.key] = parseFloat(f.value);
    //     payload[`${f.key}_op`] = f.operator;
    //   }
    // });
    filters.forEach((f) => {
      if (f.value) {
        // Always store the numeric value
        payload[f.key] = parseFloat(f.value);

        // Special rule: limit_value → send limit_type
        if (f.key === "limit_value") {
          payload.limit_type = f.operator; // Increase / Decrease
        } else {
          // Default behavior for all other filters
          payload[`${f.key}_op`] = f.operator;
        }
      }
    });


    if (ruleType === "bid") {
      payload.targets = targets.map(t => {
        const baseTarget = {
          campaign_id: t.campaign_id,
          campaign_name: t.campaign_name,
          target_type: t.target_type,
        };

        if (t.target_type === "keyword") {
          return {
            ...baseTarget,
            ad_group_id: t.ad_group_id,
            keyword_id: t.keyword_id,
            ad_group_name: t.ad_group_name,
            target_identifier: t.target_identifier,
            match_type: t.match_type,
            bid_value: parseFloat(t.bid_value) || 0,
            min_bid: parseFloat(t.min_bid) || 0,
            max_bid: parseFloat(t.max_bid) || 0,
          };
        } else if (t.target_type === "placement") {
          return {
            ...baseTarget,
            target_identifier: t.target_identifier,
            placement_type: t.placement_type,
            bid_value: parseFloat(t.bid_value) || 0,
          };
        }
        return baseTarget;
      });
    }

    if (ruleType === "status") payload.actions = actions;
    if (ruleType === "budget") payload.campaigns = campaigns;

    return payload;
  };

  const handleSubmit = async () => {
    try {
      if (!validateForm()) {
        return;
      }

      const payload = buildPayload();

      const token = localStorage.getItem("accessToken");
      if (!token) {
        setJsonError("No access token found");
        alert("No access token found");
        return;
      }

      setLoading(true);

      const response = await fetch(
        `https://react-api-script.onrender.com/rules_engine/rules`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorMsg = `Failed to create rule: ${response.status}`;
        setJsonError(errorMsg);
        throw new Error(errorMsg);
      }

      alert("Rule created successfully and will be activated in 8hrs!");
      setJsonError("");

      if (onSave) onSave();
      if (setShowRuleModal) setShowRuleModal(false);
      if (onClose) onClose();
    } catch (err) {
      console.error("Submit error:", err);
      if (!err.message.includes("Failed to create rule")) {
        setJsonError(err.message || "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const getRuleTypeIcon = () => {
    switch (ruleType) {
      case 'bid': return <TuneIcon />;
      case 'status': return <PlayCircleOutlineIcon />;
      case 'budget': return <AttachMoneyIcon />;
      default: return <TuneIcon />;
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose || (() => setShowRuleModal(false))}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '90%', sm: '70%', md: '55%', lg: '52%' },


          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            p: 3,
            background: 'rgba(0,0,0,0.2)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {getRuleTypeIcon()}
              <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.5px' }}>
                Create New Rule
              </Typography>
            </Box>
            <IconButton
              onClick={onClose || (() => setShowRuleModal(false))}
              sx={{
                color: '#fff',
                background: 'rgba(255,255,255,0.1)',
                '&:hover': { background: 'rgba(255,255,255,0.2)' },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Stepper activeStep={activeStep} sx={{ mt: 2 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel
                  sx={{
                    '& .MuiStepLabel-label': { color: 'rgba(255,255,255,0.7)' },
                    '& .MuiStepLabel-label.Mui-active': { color: '#fff', fontWeight: 600 },
                    '& .MuiStepIcon-root': { color: 'rgba(255,255,255,0.3)' },
                    '& .MuiStepIcon-root.Mui-active': { color: '#fff' },
                    '& .MuiStepIcon-root.Mui-completed': { color: '#4caf50' },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Content */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            px: 2,
            py: activeStep === 0 ? 1 : 3,     // reduced padding ONLY in step 0
          }}
        >


          {jsonError && (
            <Zoom in={!!jsonError}>
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  background: 'rgba(211, 47, 47, 0.2)',
                  color: '#fff',
                  border: '1px solid rgba(211, 47, 47, 0.5)',
                }}
              >
                {jsonError}
              </Alert>
            </Zoom>
          )}


          {/* Step 0: Basic Info */}
          {activeStep === 0 && (
            <Fade in={activeStep === 0}>
              <Box>
                <Card
                  sx={{
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: 3,
                    mb: 3,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ mb: 3, color: '#333', fontWeight: 600 }}>
                      Rule Type & Platform
                    </Typography>

                    {/* Rule Type + Platform Side-by-Side */}
                    <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                      <FormControl fullWidth>
                        <InputLabel>Rule Type</InputLabel>
                        <Select value={ruleType} label="Rule Type" onChange={(e) => setRuleType(e.target.value)}>
                          <MenuItem value="bid">Bid Rule</MenuItem>
                          <MenuItem value="status">Status Rule</MenuItem>
                          <MenuItem value="budget">Budget Rule</MenuItem>
                        </Select>
                      </FormControl>

                      <FormControl fullWidth>
                        <InputLabel>Platform Name</InputLabel>
                        <Select
                          value={platformName || ""}
                          label="Platform Name"
                          onChange={(e) => setPlatformName(e.target.value?.toLowerCase() || "")}
                          error={!!errors.platform}
                        >
                          {PLATFORM_OPTIONS.map((p) => (
                            <MenuItem key={p} value={p}>
                              {p.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>

                    {/* User Name + Rule Name Side-by-Side */}
                    <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                      <TextField
                        fullWidth
                        label="User Name"
                        value={userName}
                        error={!!errors.userName}
                        helperText={errors.userName}
                        onChange={(e) => setUserName(e.target.value)}
                      />

                      <TextField
                        fullWidth
                        label="Rule Name"
                        value={ruleName}
                        error={!!errors.ruleName}
                        helperText={errors.ruleName}
                        onChange={(e) => setRuleName(e.target.value)}
                      />
                    </Box>

                    {/* Brand + Placements Side-by-Side */}
                    <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                      <FormControl fullWidth>
                        <InputLabel>Brand Name</InputLabel>
                        <Select
                          value={brandName}
                          label="Brand Name"
                          onChange={(e) => setBrandName(e.target.value)}
                          error={!!errors.brandName}
                        >
                          {Object.keys(BRAND_MAP).map((brand) => (
                            <MenuItem key={brand} value={brand}>
                              {brand.replace(/\b\w/g, (c) => c.toUpperCase())}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl fullWidth>
                        <InputLabel>Placements</InputLabel>
                        <Select value={placements} label="Placements" onChange={(e) => setPlacements(e.target.value)}>
                          <MenuItem value="search">Search</MenuItem>
                          <MenuItem value="display">Display</MenuItem>
                          <MenuItem value="all">All</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>

                    {/* Reduced Description Box Height */}
                    <TextField
                      fullWidth
                      label="Description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      multiline
                      rows={2}             // ↓ reduced height
                      sx={{ mb: 3 }}
                    />

                    {(ruleType === "bid" || ruleType === "budget") && (
                      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>

                        {/* Operation Name */}
                        <FormControl fullWidth>
                          <InputLabel>Operation</InputLabel>
                          <Select
                            value={operationName}
                            label="Operation"
                            onChange={(e) => setOperationName(e.target.value)}
                          >
                            <MenuItem value="Increase">Increase</MenuItem>
                            <MenuItem value="Decrease">Decrease</MenuItem>
                          </Select>
                        </FormControl>

                        {/* Operation Value */}
                        <TextField
                          fullWidth
                          label="Operation Value"
                          type="number"
                          inputProps={{ min: 0 }}
                          value={operationValue}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (/^\d*$/.test(v)) setOperationValue(v); // allow integers only
                          }}
                        />
                      </Box>
                    )}


                    {/* Frequency Number + Time Side-by-Side */}
                    <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                      <TextField
                        fullWidth
                        label="Frequency Number"
                        type="number"
                        value={frequencyNumber}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFrequencyNumber(val);
                          if (Number(val) > 1) setFrequency("");
                        }}
                      />

                      {frequencyNumber === "1" || frequencyNumber === 1 ? (
                        <TextField
                          fullWidth
                          type="time"
                          value={frequency}
                          onChange={(e) => setFrequency(e.target.value)}
                          inputProps={{ step: 60 }}
                          InputLabelProps={{ shrink: true }}
                          label="Frequency (HH:MM)"
                          error={!!errors.frequency}
                          helperText={errors.frequency}
                        />
                      ) : (
                        <Box sx={{ flex: 1 }} /> // keeps alignment clean
                      )}
                    </Box>
                    {/* Status Toggle */}
                    {/* Sea Blue Status Toggle */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                      <Typography sx={{ color: "#333", fontWeight: 600 }}>
                        Status
                      </Typography>

                      <Box
                        onClick={() => setStatusFlag(prev => (Number(prev) === 1 ? 0 : 1))}

                        sx={{
                          width: 52,
                          height: 28,
                          borderRadius: 50,
                          background: statusFlag === 1 ? "#0288d1" : "#b0bec5",
                          position: "relative",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          boxShadow: "inset 0 0 5px rgba(0,0,0,0.2)",
                        }}
                      >
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: "#ffffff",
                            position: "absolute",
                            top: "2px",
                            left: statusFlag === 1 ? "26px" : "2px",
                            transition: "all 0.3s ease",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                          }}
                        />
                      </Box>

                      <Typography sx={{ color: statusFlag === 1 ? "#0288d1" : "#777", fontWeight: 600 }}>
                        {statusFlag === 1 ? "ON" : "OFF"}
                      </Typography>
                    </Box>


                  </CardContent>
                </Card>
              </Box>
            </Fade>
          )}


          {/* Step 1: Filters */}
          {activeStep === 1 && (
            <Fade in={activeStep === 1}>
              <Box>
                <Card
                  sx={{
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: 3,
                    mb: 3,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FilterAltIcon sx={{ color: '#667eea' }} />
                        <Typography variant="h6" sx={{ color: '#333', fontWeight: 600 }}>
                          Performance Filters
                        </Typography>
                      </Box>
                      <Button
                        startIcon={<AddIcon />}
                        onClick={addFilter}
                        variant="contained"
                        sx={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: 2,
                          textTransform: 'none',
                          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                        }}
                      >
                        Add Filter
                      </Button>
                    </Box>

                    {filters.length === 0 && (
                      <Box sx={{ textAlign: 'center', py: 6, color: '#999' }}>
                        <FilterAltIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
                        <Typography>No filters added yet. Click "Add Filter" to get started.</Typography>
                      </Box>
                    )}

                    {filters.map((f, i) => (
                      <Zoom in key={i}>
                        <Card
                          sx={{
                            mb: 2,
                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                            border: '1px solid rgba(102, 126, 234, 0.2)',
                            borderRadius: 2,
                            overflow: 'hidden',
                            transition: 'all 0.3s',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            },
                          }}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                              <FormControl sx={{ minWidth: 150, flex: 1 }}>
                                <InputLabel>Metric</InputLabel>
                                <Select
                                  value={f.key}
                                  label="Metric"
                                  onChange={(e) => updateFilter(i, "key", e.target.value)}
                                >
                                  {filterMetrics.map((m) => (
                                    <MenuItem key={m.value} value={m.value}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <span>{m.icon}</span>
                                        {m.label}
                                      </Box>
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>

                              <FormControl sx={{ minWidth: 120 }}>
                                <InputLabel>Operator</InputLabel>
                                <Select
                                  value={f.operator}
                                  label="Operator"
                                  onChange={(e) => updateFilter(i, "operator", e.target.value)}
                                >
                                  {operatorOptions.map((op) => (
                                    <MenuItem key={op.value} value={op.value}>
                                      {op.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>

                              <TextField
                                label="Value"
                                type="number"
                                value={f.value}
                                onChange={(e) => updateFilter(i, "value", e.target.value)}
                                sx={{ minWidth: 150, flex: 1 }}
                              />
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <IconButton
                                color="error"
                                onClick={() => removeFilter(i)}
                                sx={{
                                  background: 'rgba(211, 47, 47, 0.1)',
                                  '&:hover': { background: 'rgba(211, 47, 47, 0.2)' },
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </CardContent>
                        </Card>
                      </Zoom>
                    ))}
                  </CardContent>
                </Card>
              </Box>
            </Fade>
          )}

          {/* Step 2: Configuration (Type-specific) */}
          {activeStep === 2 && (
            <Fade in={activeStep === 2}>
              <Box>
                {ruleType === "bid" && (
                  <Card
                    sx={{
                      background: 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(20px)',
                      borderRadius: 3,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" sx={{ color: '#333', fontWeight: 600 }}>
                          Bid Targets
                        </Typography>
                        <Button
                          startIcon={<AddIcon />}
                          onClick={addTarget}
                          variant="contained"
                          sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: 2,
                            textTransform: 'none',
                          }}
                        >
                          Add Target
                        </Button>
                      </Box>

                      {targets.map((t, i) => (
                        <Card
                          key={i}
                          sx={{
                            mb: 3,
                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                            border: '1px solid rgba(102, 126, 234, 0.2)',
                            borderRadius: 2,
                          }}
                        >
                          <CardContent>
                            <Typography variant="subtitle2" sx={{ mb: 2, color: '#667eea', fontWeight: 600 }}>
                              Target #{i + 1}
                            </Typography>

                            <Box sx={{ mb: 2 }}>
                              <AsyncSearchDropdown
                                label="Campaign"
                                placeholder="Search campaigns..."
                                fetchFn={(query, page) => searchCampaigns(query, page)}
                                onSelect={(item) => updateTargetField(i, "campaign_id", item.campaign_id)}
                                valueKey="id"
                                labelKey="name"
                                selectedValue={t.campaign_name ? `ID: ${t.campaign_id} - ${t.campaign_name}` : ""}
                              />
                            </Box>

                            {t.campaign_id && (
                              <>
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                  <InputLabel>Target Type</InputLabel>
                                  <Select
                                    value={t.target_type}
                                    label="Target Type"
                                    onChange={(e) => updateTargetField(i, "target_type", e.target.value)}
                                  >
                                    <MenuItem value="keyword">Keyword</MenuItem>
                                    <MenuItem value="placement">Placement</MenuItem>
                                  </Select>
                                </FormControl>

                                {t.target_type === "keyword" && (
                                  <>
                                    <Box sx={{ mb: 2 }}>
                                      <AsyncSearchDropdown
                                        label="Keyword"
                                        placeholder="Search keywords..."
                                        fetchFn={(query, page) => searchKeywords(t.campaign_id, i, query, page)}
                                        onSelect={(item) => {
                                          updateTargetField(i, "target_identifier", item.KeywordName);
                                          updateTargetField(i, "keyword_id", item.KeywordName);
                                          updateTargetField(i, "bid_value", item.bid);
                                          updateTargetField(i, "match_type", item.match_type);
                                          updateTargetField(i, "ad_group_id", item.ad_group_id);
                                          updateTargetField(i, "ad_group_name", item.ad_group_name);
                                        }}
                                        valueKey="id"
                                        labelKey="name"
                                        selectedValue={t.target_identifier || ""}
                                      />
                                    </Box>

                                    <TextField fullWidth label="Match Type" value={t.match_type} onChange={(e) => updateTargetField(i, "match_type", e.target.value)} sx={{ mb: 2 }} />
                                    <TextField fullWidth label="Bid Value" type="number" value={t.bid_value ?? ""} onChange={(e) => updateTargetField(i, "bid_value", e.target.value)} sx={{ mb: 2 }} />
                                    <TextField fullWidth label="Min Bid" type="number" value={t.min_bid} onChange={(e) => updateTargetField(i, "min_bid", e.target.value)} sx={{ mb: 2 }} />
                                    <TextField fullWidth label="Max Bid" type="number" value={t.max_bid} onChange={(e) => updateTargetField(i, "max_bid", e.target.value)} sx={{ mb: 2 }} />
                                  </>
                                )}

                                {t.target_type === "placement" && (
                                  <>
                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                      <InputLabel>Target Identifier</InputLabel>
                                      <Select
                                        value={t.target_identifier}
                                        label="Target Identifier"
                                        onChange={(e) => updateTargetField(i, "target_identifier", e.target.value)}
                                      >
                                        {((keywordsData[`target_${i}`] || {}).placements || []).map((placement, idx) => (
                                          <MenuItem key={`${placement.target_identifier}-${idx}`} value={placement.target_identifier}>
                                            {placement.target_identifier}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                    <TextField fullWidth label="Placement Type" value={t.placement_type} onChange={(e) => updateTargetField(i, "placement_type", e.target.value)} sx={{ mb: 2 }} />
                                    <TextField fullWidth label="Bid Value" type="number" value={t.bid_value ?? ""} onChange={(e) => updateTargetField(i, "bid_value", e.target.value)} sx={{ mb: 2 }} />
                                  </>
                                )}
                              </>
                            )}

                            <Button
                              color="error"
                              onClick={() => removeTarget(i)}
                              startIcon={<DeleteIcon />}
                              sx={{ mt: 1 }}
                            >
                              Remove Target
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {ruleType === "status" && (
                  <Card sx={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderRadius: 3 }}>
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h6" sx={{ mb: 3, color: '#333', fontWeight: 600 }}>Status Actions</Typography>
                      {/* Similar structure for actions */}
                      <Button startIcon={<AddIcon />} onClick={addAction} variant="contained">Add Action</Button>
                    </CardContent>
                  </Card>
                )}

                {ruleType === "budget" && (
                  <Card sx={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderRadius: 3 }}>
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h6" sx={{ mb: 3, color: '#333', fontWeight: 600 }}>Budget Campaigns</Typography>
                      {/* Similar structure for budgets */}
                      <Button startIcon={<AddIcon />} onClick={addCampaign} variant="contained">Add Campaign</Button>
                    </CardContent>
                  </Card>
                )}
              </Box>
            </Fade>
          )}
        </Box>

        {/* Footer Actions */}

        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(15px)',
            borderTop: '1px solid rgba(255,255,255,0.2)',
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 90,
          }}
        >
          <Button
            disabled={activeStep === 0}
            onClick={() => setActiveStep(activeStep - 1)}
            startIcon={<NavigateBeforeIcon />}
            sx={{
              color: '#fff',
              textTransform: 'none',
              '&:hover': { background: 'rgba(255,255,255,0.15)' },
            }}
          >
            Back
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={onClose || (() => setShowRuleModal(false))}
              sx={{
                color: '#fff',
                borderColor: 'rgba(255,255,255,0.4)',
                textTransform: 'none',
                '&:hover': { borderColor: '#fff' },
              }}
            >
              Cancel
            </Button>

            {activeStep < steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={() => setActiveStep(activeStep + 1)}
                endIcon={<NavigateNextIcon />}
                sx={{
                  background: '#fff',
                  color: '#667eea',
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                sx={{
                  background: '#fff',
                  color: '#667eea',
                  fontWeight: 600,
                  minWidth: 140,
                  textTransform: 'none',
                }}
              >
                {loading ? 'Creating...' : 'Create Rule'}
              </Button>
            )}
          </Box>
        </Box>

      </Box>
    </Drawer>
  );
};

export default AddRuleCreator;