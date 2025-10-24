import React, { useContext, useState, useEffect } from "react";
import { Box, Button } from "@mui/material";
import { DataGrid, GridToolbarContainer, GridFilterPanel, GridToolbarColumnsButton, GridToolbarDensitySelector, GridToolbarFilterButton } from "@mui/x-data-grid";
import CircularProgress from '@mui/material/CircularProgress';
import overviewContext from "../../../store/overview/overviewContext";
import ExcelDownloadButton from "../molecules/excelDownloadButton";

const CustomFilterPanel = (props) => {

    const handleSearchClick = () => {
        console.log('Search button clicked');
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginTop: 1 }}>
            <Box sx={{ flexGrow: 1 }}>
                <GridFilterPanel {...props} />
            </Box>
            <Button
                onClick={handleSearchClick}
                variant="contained"
                color="primary"
                size="small"
                sx={{ margin: "10px" }}
            >
                Search
            </Button>
        </Box>
    );
};

const MuiDataTableComponent = (props) => {
    const { overviewLoading } = useContext(overviewContext)
    const { columns, data, isExport, isLoading } = props;
    const customLocaleText = {
        filterPanelOperator: 'Condition',
    }

    const isLoadingData = overviewLoading

    const [filterModel, setFilterModel] = useState({ items: [] });

    // MODIFICATION 1: Create dynamic column visibility model based on columns prop
    const [columnVisibilityModel, setColumnVisibilityModel] = useState({});

    // MODIFICATION 2: Initialize column visibility when columns change
    useEffect(() => {
        if (columns && columns.length > 0) {
            const newVisibilityModel = {};
            
            // Hide all percentage change and diff columns by default
            const defaultHiddenColumns = [
                'cost_diff', 'total_converted_revenue_diff', 'troas_diff', 'clicks_diff',
                'total_converted_units_diff', 'roas_diff', 'roi_diff', 'ctr_diff', 'views_diff',
                'cost_pct_change', 'total_converted_revenue_pct_change', 'clicks_pct_change',
                'roi_pct_change', 'views_pct_change', 'aov_pct_change', 'cpc_pct_change',
                'acos_pct_change', 'total_sales_diff', 'cvr_diff', 'orders_diff', 'acos_diff',
                'cpc_diff', 'aov_diff', 'indirect_sales_diff', 'direct_orders_diff',
                'indirect_orders_diff', 'roi_direct_diff', 'bsr_change', 'spends_change',
                'direct_revenue_change', 'ctr_change', 'troas_change', 'rating_change',
                'price_change', 'roas_direct_change', 'availability_change', 'spend_inr_diff',
                'sales_inr_diff', 'impressions_diff', 'spend_diff', 'sales_diff',
                'estimated_budget_consumed_diff', 'direct_atc_diff'
            ];

            columns.forEach((column, index) => {
                // Show first 5 columns by default, hide the rest
                // Also check if column has defaultVisible property
                if (column.defaultVisible !== undefined) {
                    newVisibilityModel[column.field] = column.defaultVisible;
                } else if (index < 5) {
                    newVisibilityModel[column.field] = true;
                } else if (defaultHiddenColumns.includes(column.field)) {
                    newVisibilityModel[column.field] = false;
                } else {
                    newVisibilityModel[column.field] = false; // Hide additional columns by default
                }
            });

            setColumnVisibilityModel(newVisibilityModel);
        }
    }, [columns]);

    const handleExport = (columns, rows) => {
        const csvContent = [
            columns.map(col => col.headerName).join(','),
            ...rows.map(row =>
                columns.map(col => {
                    let value = row[col.field];
                    if (col.valueGetter) {
                        value = col.valueGetter({ row });
                    }
                    if (typeof value === 'number') {
                        return value;
                    }
                    return value;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'export.csv';
        link.click();
    };

    const CustomToolbar = () => (
        <GridToolbarContainer className="w-100 d-flex justify-content-between align-items-center" sx={{ padding: "8px" }}>
            <div>
                <GridToolbarColumnsButton />
                <GridToolbarFilterButton />
                <GridToolbarDensitySelector />
            </div>
            {isExport && <ExcelDownloadButton
                handleExport={handleExport}
                columns={columns}
                rows={data}
                buttonClass="excel-button bg-dark text-white border-dark"
                buttonLabel="Export" />}
        </GridToolbarContainer>
    );

    return (
        <Box sx={{ height: "100%", overflowY: "auto", display: "flex", justifyContent: "center", alignItems: "center" }}>
            {(isLoading || isLoadingData) ? (<CircularProgress />) : (
                <DataGrid
                    rows={data}
                    columns={columns}
                    checkboxSelection
                    disableRowSelectionOnClick
                    filterModel={filterModel}
                    onFilterModelChange={setFilterModel}
                    initialState={{
                        pagination: {
                            paginationModel: {
                                pageSize: 100,
                            },
                        },
                    }}
                    pageSizeOptions={[100]}
                    slots={{
                        toolbar: CustomToolbar,
                        filterPanel: CustomFilterPanel,
                    }}
                    slotProps={{
                        filterPanel: {
                        },
                        toolbar: { csvOptions: { allColumns: true } }
                    }}
                    localeText={customLocaleText}
                    columnVisibilityModel={columnVisibilityModel}
                    onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
                />
            )}
        </Box>
    );
};

export default MuiDataTableComponent;