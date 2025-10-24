import React, { useEffect, useState } from "react";
import { Box, Button, MenuItem, Select, TextField, Typography, InputLabel, FormControl, Checkbox, FormControlLabel, } from "@mui/material";
import FormGroup from '@mui/material/FormGroup';
import SelectFieldComponent from "../../molecules/selectFieldComponent";
import TextFieldComponent from "../../molecules/textFieldCompnent";

const AddRuleCreator = (props) => {

    const { editRuleData, setShowRuleModal, getRulesData, operator, isEditMode = false } = props;

    const [ruleData, setRuleData] = useState({
        rule_name: "",
        campaign_type: "",
        rule_type: "",
        operation_name: "",
        operation_type: "",
        limit_value: "",
        extension_date: "",
        frequency: "Once a day",
        description: "",
        filters: [{ spends: 0, spends_op: "eq" }]
    });
    const [showFilters, setShowFilters] = useState(false);
    
    useEffect(() => {
        if (editRuleData && isEditMode) {
            setRuleData(editRuleData);
        }
    }, [editRuleData, isEditMode]);

    const normalizeFilters = (filters) => {
        return filters.map(obj => {
            const [key] = Object.keys(obj).filter(k => !k.endsWith("_op"));
            const op = obj[`${key}_op`] === "0" ? "eq" : obj[`${key}_op`];
            return {
                key,
                value: obj[key],
                op
            };
        });
    };
    
    const normalized = Array.isArray(ruleData?.filters) ? normalizeFilters(ruleData.filters) : [];

    const getOperatorSymbol = (op) => {
        switch (op) {
            case "eq":
            case "0":
                return "=";
            case "gt":
                return ">";
            case "lt":
                return "<";
            case "in":
                return "in";
            default:
                return op;
        }
    };

    const extractFilterValue = (filters, key) => {
        const match = filters.find(f => f.hasOwnProperty(key));
        return match ? match[key] : "";
    };

    const handleSave = async () => {
        // Validation
        if (!ruleData.rule_name || !ruleData.rule_type) {
            alert("Please fill in Rule Name and Type");
            return;
        }

        if (ruleData.rule_type === "Bid" && (!ruleData.operation_name || !ruleData.operation_type)) {
            alert("Please fill in all bid-related fields");
            return;
        }

        if (ruleData.rule_type === "Date Extension" && !ruleData.extension_date) {
            alert("Please select an extension date");
            return;
        }

        const payload = {
            rule_name: ruleData.rule_name || "",
            operation_name: ruleData.operation_name || "",
            operation_type: ruleData.operation_type || "",
            description: ruleData.description || "",
            limit_value: ruleData.limit_value || "",
            rule_type: ruleData.rule_type || "",
            program_type: ruleData.campaign_type || "",
            extension_date: ruleData.extension_date || "",
            frequency: ruleData.frequency || "Once a day",
            spends: extractFilterValue(ruleData.filters, "spends"),
            sales: extractFilterValue(ruleData.filters, "sales"),
            roas: extractFilterValue(ruleData.filters, "roas"),
            troas: extractFilterValue(ruleData.filters, "troas"),
            impression: extractFilterValue(ruleData.filters, "impression"),
            clicks: extractFilterValue(ruleData.filters, "clicks"),
            cvr: extractFilterValue(ruleData.filters, "cvr"),
            acos: extractFilterValue(ruleData.filters, "acos"),
        };

        const accessToken = localStorage.getItem("accessToken");
        
        try {
            let url, method;
            
            if (isEditMode) {
                // Update existing rule
                const getUpdateRuleUrl = () => {
                    if (operator === "Blinkit") {
                        return `https://react-api-script.onrender.com/sugar/update-rule?rule_id=${ruleData.rule_id}&platform=${operator}`;
                    } else if (operator === "BigBasket") {
                        return `http://react-api-script.onrender.com/sugar/update-rule?platform=${operator}&rule_id=${ruleData.rule_id}`;
                    }
                    return "";
                };
                url = getUpdateRuleUrl();
                method = "PATCH";
            } else {
                // Create new rule
                url = `https://react-api-script.onrender.com/sugar/create-rule?platform=${operator}`;
                method = "POST";
            }

            console.log(payload, "payload");

            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                alert(isEditMode ? "Rule updated successfully!" : "Rule created successfully!");
                getRulesData();
                setShowRuleModal(false);
            } else {
                console.error(`${isEditMode ? 'Update' : 'Create'} failed:`, data);
                alert(data.message || `Failed to ${isEditMode ? 'update' : 'create'} rule.`);
            }
        } catch (error) {
            console.error("Error:", error);
            alert(`An error occurred while ${isEditMode ? 'updating' : 'creating'} the rule.`);
        }
    };

    const updateFilterKey = (index, newKey) => {
        setRuleData(prevState => {
            const filter = prevState.filters[index];
            const oldKey = Object.keys(filter).find(k => !k.endsWith('_op'));
            const oldOp = filter[`${oldKey}_op`];
            const oldValue = filter[oldKey];
            
            const newFilter = {
                [newKey]: oldValue,
                [`${newKey}_op`]: oldOp
            };
            
            const updatedFilters = [...prevState.filters];
            updatedFilters[index] = newFilter;
            
            return {
                ...prevState,
                filters: updatedFilters
            };
        });
    };

    const updateFilterField = (index, filterName, field, value) => {
        setRuleData(prevState => {
            const updatedFilters = prevState.filters.map((f, i) => {
                if (i === index) {
                    const key = Object.keys(f).find(k => !k.endsWith('_op'));
                    if (key === filterName) {
                        return {
                            ...f,
                            [field]: value
                        };
                    }
                }
                return f;
            });

            return {
                ...prevState,
                filters: updatedFilters
            };
        });
    };

    return (
        <React.Fragment>
            <Box mb={2}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                    <Box
                        sx={{
                            display: "inline-block",
                            background: "#e0e0e0",
                            borderRadius: 1,
                            px: 1,
                            py: 0.5,
                            mr: 1,
                        }}
                    >
                        {`report_date = ${isEditMode ? ruleData?.report_type : 'Last 7 days'}`}
                    </Box>
                    <Box
                        sx={{
                            display: "inline-block",
                            background: "#e0e0e0",
                            borderRadius: 1,
                            px: 1,
                            py: 0.5,
                        }}
                    >
                        {`${normalized[0]?.key || 'spends'} ${getOperatorSymbol(normalized[0]?.op || 'eq')} ${normalized[0]?.value || 0}`}
                    </Box>
                </Typography>
            </Box>
            <Box sx={{ display: "flex" }} mb={2}>
                <FormGroup row>
                    <FormControlLabel
                        disabled
                        control={<Checkbox checked={false} />}
                        label="New Query"
                    />
                    <FormControlLabel
                        disabled
                        control={<Checkbox checked={true} />}
                        label="New Rule"
                    />
                </FormGroup>
                <Typography variant="body2" sx={{ mb: 1 }}>
                    <Box
                        sx={{
                            display: "inline-block",
                            background: "#e0e0e0",
                            borderRadius: 1,
                            px: 1,
                            py: 0.5,
                            mr: 1,
                        }}
                    >
                        module=keywords
                    </Box>
                </Typography>
            </Box>
            <Button variant="outlined" size="small" sx={{ mb: 2 }} onClick={() => setShowFilters(!showFilters)}>
                {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            {showFilters && normalized.map((filter, index) => {
                const filterName = filter.key;
                const filterValue = filter.value;

                return (
                    <div key={index} className="form-group mb-3">
                        <div className="d-flex">
                            {/* First Select: Filter Name */}
                            <SelectFieldComponent
                                fieldClass="form-select rounded-end-0"
                                areaLabel="querySelectorOne"
                                options={[
                                    { label: "spends", value: "spends" },
                                    { label: "sales", value: "sales" },
                                    { label: "roas", value: "roas" },
                                    { label: "troas", value: "troas" },
                                    { label: "clicks", value: "clicks" },
                                    { label: "impression", value: "impression" },
                                    { label: "cvr", value: "cvr" },
                                    { label: "acos", value: "acos" }
                                ]}
                                value={filterName}
                                disabled={isEditMode}
                                onChange={e => !isEditMode && updateFilterKey(index, e.target.value)}
                            />

                            {/* Second Select: Operation */}
                            <SelectFieldComponent
                                fieldClass="form-select rounded-0 condition-form-select"
                                areaLabel="queryConditionOne"
                                value={filter.op}
                                options={[
                                    { label: "=", value: "eq" },
                                    { label: ">", value: "gt" },
                                    { label: "<", value: "lt" },
                                    { label: "in", value: "in" }
                                ]}
                                disabled={isEditMode}
                                onChange={e => !isEditMode && updateFilterField(index, filterName, `${filterName}_op`, e.target.value)}
                            />

                            {/* Third Input: Numeric Field */}
                            <TextFieldComponent
                                fieldClass="form-control rounded-start-0"
                                fieldType="number"
                                areaLabel="queryValueOne"
                                fieldPlaceholder="Enter value"
                                fieldValue={filterValue || 0}
                                min="0"
                                onChange={e => {
                                    const newValue = e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0);

                                    // Update ruleData in the original structure
                                    setRuleData(prevState => {
                                        const updatedFilters = prevState.filters.map((f, i) => {
                                            if (i === index) {
                                                const key = Object.keys(f).find(k => !k.endsWith('_op'));
                                                if (key === filterName) {
                                                    return {
                                                        ...f,
                                                        [filterName]: newValue
                                                    };
                                                }
                                            }
                                            return f;
                                        });

                                        return {
                                            ...prevState,
                                            filters: updatedFilters
                                        };
                                    });
                                }}
                            />
                        </div>
                    </div>
                );
            })}
            <TextField
                fullWidth
                label="Name"
                value={ruleData?.rule_name || ""}
                margin="normal"
                required
                onChange={(e) => setRuleData({ ...ruleData, rule_name: e.target.value })}
            />

            <TextField
                fullWidth
                label="Program Type"
                value={ruleData?.campaign_type || ""}
                margin="normal"
                onChange={(e) => setRuleData({ ...ruleData, campaign_type: e.target.value })}
            />

            {/* Type Field */}
            <FormControl fullWidth margin="normal" required>
                <InputLabel>Type</InputLabel>
                <Select
                    label="Type"
                    value={ruleData?.rule_type || ""}
                    onChange={(e) => {
                        const newType = e.target.value;
                        setRuleData(prevData => ({
                            ...prevData,
                            rule_type: newType,
                            // Reset related fields when type changes
                            operation_name: "",
                            operation_type: "",
                            extension_date: ""
                        }));
                    }}
                >
                    <MenuItem value="Bid">Bid</MenuItem>
                    <MenuItem value="Date Extension">Date Extension</MenuItem>
                </Select>
            </FormControl>

            {/* Conditional rendering based on Type */}
            {ruleData?.rule_type === "Bid" && (
                <>
                    <Box display="flex" alignItems="center" gap={2} mt={2}>
                        <FormControl sx={{ width: "45%" }}>
                            <InputLabel>Actions</InputLabel>
                            <Select
                                label="Actions"
                                value={ruleData?.operation_name || ""}
                                onChange={(e) =>
                                    setRuleData({ ...ruleData, operation_name: e.target.value })
                                }
                            >
                                <MenuItem value="In">Increase Bid %</MenuItem>
                                <MenuItem value="De">Decrease Bid %</MenuItem>
                            </Select>
                        </FormControl>
                        <Typography>by</Typography>
                        <TextField
                            type="number"
                            value={ruleData.operation_type || ""}
                            sx={{ width: "45%" }}
                            onChange={(e) =>
                                setRuleData({ ...ruleData, operation_type: e.target.value })
                            }
                        />
                    </Box>
                    
                    <TextField
                        fullWidth
                        label="Limit Value (INR)"
                        type="number"
                        value={ruleData.limit_value || ""}
                        margin="normal"
                        onChange={(e) =>
                            setRuleData({ ...ruleData, limit_value: e.target.value })
                        }
                    />
                </>
            )}

            {ruleData?.rule_type === "Date Extension" && (
                <TextField
                    fullWidth
                    label="Extension Date"
                    type="date"
                    value={ruleData?.extension_date || ""}
                    margin="normal"
                    InputLabelProps={{
                        shrink: true,
                    }}
                    onChange={(e) =>
                        setRuleData({ ...ruleData, extension_date: e.target.value })
                    }
                />
            )}

            <Box mt={2}>
                <TextField
                    fullWidth
                    label="Frequency"
                    type="text"
                    value={ruleData.frequency}
                    margin="normal"
                    disabled
                />
            </Box>

            <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                margin="normal"
                value={ruleData.description || ""}
                onChange={(e) => setRuleData({ ...ruleData, description: e.target.value })}
            />
            <Button onClick={() => setShowRuleModal(false)}>Close</Button>
            <Button onClick={handleSave} sx={{ marginLeft: "8px" }} variant="contained">
                {isEditMode ? "Save changes" : "Create Rule"}
            </Button>
        </React.Fragment>
    )
}

export default AddRuleCreator;