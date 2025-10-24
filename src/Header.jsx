import React, { useState, useEffect, useContext } from "react";
import { Dropdown } from "react-bootstrap";
import SelectFieldComponent from "./assets/components/molecules/selectFieldComponent";
import HamburgerMenuIcon from "./assets/icons/header/hamburgerMenuIcon";
import ShareIcon from "./assets/icons/header/shareIcon";
import { OPERATOR } from "./assets/lib/constant/index";
import { useNavigate, useLocation, useSearchParams } from "react-router";
import CustomDateRangePicker from "./assets/components/molecules/customDateRangePicker";
import { Box, Button, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import overviewContext from "./store/overview/overviewContext";

const Header = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const operatorType = searchParams.get("operator") || "";
  const brandType = searchParams.get("brand") || "";
  const navigate = useNavigate();
  const location = useLocation();

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

  // Available operators - Only Flipkart
  const availableOperators = ["Flipkart"];

  // Get unique brands for dropdown
  const uniqueBrands = React.useMemo(() => {
    const brands = [...new Set(accountCombinations.map(combo => combo.brand))];
    return brands.sort();
  }, []);

  const getPageHeading = () => {
    const path = location.pathname.replace("/", "");
    if (path) {
      return path
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
    }
    return "Performance Overview";
  };

  const { dateRange, formatDate } = useContext(overviewContext) || {
    dateRange: [{ startDate: new Date(), endDate: new Date() }],
  };

  // Initial state is undefined/empty instead of having a default operator
  const [showSelectedOperator, setShowSelectedOperator] = useState(
    operatorType || ""
  );
  const [selectedBrand, setSelectedBrand] = useState(brandType || "Cinthol Grocery");

  const [showHeaderLogo, setShowHeaderLogo] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Update URL when operator changes
  useEffect(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (showSelectedOperator) {
      newSearchParams.set("operator", showSelectedOperator);
    } else {
      newSearchParams.delete("operator");
    }
    setSearchParams(newSearchParams);
  }, [showSelectedOperator]);

  // Handle brand selection change
  const handleBrandChange = (event) => {
    const brandValue = event.target.value;
    setSelectedBrand(brandValue);
    
    const newSearchParams = new URLSearchParams(searchParams);
    if (brandValue) {
      newSearchParams.set('brand', brandValue);
    } else {
      newSearchParams.delete('brand');
    }
    setSearchParams(newSearchParams);
  };

  // Initialize from URL params
  useEffect(() => {
    const operator = searchParams.get("operator");
    const brand = searchParams.get("brand");
    
    if (operator) {
      setShowSelectedOperator(operator);
    }
    if (brand) {
      setSelectedBrand(brand);
    }
  }, [searchParams]);

  const options = [{ label: "GCPL", value: "GCPL" }];

  const onHamburgerClick = () => {
    let sideNavMain = document.getElementsByClassName(
      "left-navbar-main-con"
    )[0];
    let mainContainer = document.getElementsByClassName("main-con")[0];
    let headerContainer = document.getElementsByClassName("header-main-con")[0];

    sideNavMain.classList.value =
      sideNavMain.classList.value === "left-navbar-main-con"
        ? "left-navbar-main-con hide-sidenavbar"
        : "left-navbar-main-con";
    mainContainer.classList.value =
      mainContainer.classList.value === "main-con"
        ? "main-con hide-sidenavbar"
        : "main-con";
    headerContainer.classList.value =
      headerContainer.classList.value === "header-main-con"
        ? "header-main-con hide-sidenavbar"
        : "header-main-con";
    setShowHeaderLogo(!showHeaderLogo);
  };

  return (
    <React.Fragment>
      <div className="header-main-con">
        <div className="icon-heading-con">
          <span className="d-inline-block" onClick={() => onHamburgerClick()}>
            <HamburgerMenuIcon
              iconClass="cursor-pointer"
              iconWidth="20"
              iconHeight="20"
              iconColor="#222e3c"
            />
          </span>
          <div className="card-header">
            <div className="row">
              <div className="col">
                <h1 className="page-heading">{getPageHeading()}</h1>
              </div>
            </div>
          </div>
        </div>
        <div className="d-flex actions-con">
          {/* Operator Dropdown - Only Flipkart */}
          <Dropdown className="operator-selected-tab">
            <Dropdown.Toggle variant="white" id="dropdown-basic">
              {showSelectedOperator || "Select Platform"}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {availableOperators.map((operator) => (
                <OperatorList
                  key={operator}
                  showSelectedOperator={showSelectedOperator}
                  setShowSelectedOperator={setShowSelectedOperator}
                  selectedOperator={operator}
                />
              ))}
            </Dropdown.Menu>
          </Dropdown>

          {/* Brand Dropdown - only show on home/overview/campaigns/keywords/products pages */}
          {(location.pathname === "/" ||
            location.pathname === "/performance-overview" ||
            location.pathname === "/campaigns" ||
            location.pathname === "/keywords" ||
            location.pathname === "/products") && (
            <Box sx={{ minWidth: 200, mx: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel
                  id="brand-select-label"
                  sx={{
                    fontSize: '0.875rem',
                    backgroundColor: 'white',
                    px: 0.5
                  }}
                >
                  Select Brand
                </InputLabel>
                <Select
                  labelId="brand-select-label"
                  id="brand-select"
                  value={selectedBrand}
                  label="Select Brand"
                  onChange={handleBrandChange}
                  sx={{
                    height: '36px',
                    backgroundColor: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#ddd',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#0081ff',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#0081ff',
                    }
                  }}
                >
                  <MenuItem value="">
                    <em>All Brands</em>
                  </MenuItem>
                  {uniqueBrands.map((brand) => (
                    <MenuItem key={brand} value={brand}>
                      {brand}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Client Select */}
          <SelectFieldComponent
            isFieldLabelRequired={false}
            areaLabel="user-detail"
            fieldClass={"client-select"}
            isDisabled={true}
            options={options}
            onChange={(e) => setUserCountryData(e.target.value)}
          />

          {/* Date Picker */}
          <div className="col text-end position-relative">
            <Box className="d-inline-flex align-items-center gap-2">
              <Button
                variant="contained"
                sx={{ color: "#0081ff", background: "#0081ff1a" }}
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                {`${formatDate(dateRange[0].startDate)} - ${formatDate(
                  dateRange[0].endDate
                )}`}
              </Button>
            </Box>
            {showDatePicker && (
              <Box className="date-range-container">
                <CustomDateRangePicker onClose={() => setShowDatePicker(false)} />
              </Box>
            )}
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

const OperatorList = (props) => {
  const { setShowSelectedOperator, selectedOperator } = props;
  return (
    <Dropdown.Item onClick={() => setShowSelectedOperator(selectedOperator)}>
      {selectedOperator}
    </Dropdown.Item>
  );
};

export default Header;