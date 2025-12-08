import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  TextField,
  Paper,
  List,
  ListItemButton,
  CircularProgress,
  ClickAwayListener,
} from "@mui/material";

const DEBOUNCE_MS = 300;

export default function AsyncSearchDropdown({
  label,
  placeholder = "Search...",
  fetchFn,     // (query, page) => Promise<{ items, hasMore }>
  onSelect,    // selectedItem => void
  valueKey = "id",
  labelKey = "name",
  selectedValue,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef(null);

  // Debounced search handler
  const handleQueryChange = (text) => {
    setQuery(text);
    setPage(1);
    setHasMore(true);

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      loadItems(text, 1, false);
    }, DEBOUNCE_MS);
  };

  // Load items
  const loadItems = async (searchText, pageNumber, append = false) => {
    setLoading(true);
    try {
      const res = await fetchFn(searchText, pageNumber);
      setItems((prev) =>
        append ? [...prev, ...res.items] : res.items
      );
      setHasMore(res.hasMore);
    } catch (err) {
      console.error("Dropdown fetch error", err);
    }
    setLoading(false);
  };

  // Handle infinite scroll inside dropdown
  const listRef = useRef(null);
  const handleScroll = (e) => {
    const bottom =
      e.target.scrollTop + e.target.clientHeight >=
      e.target.scrollHeight - 20;

    if (bottom && !loading && hasMore) {
      const next = page + 1;
      setPage(next);
      loadItems(query, next, true);
    }
  };

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box sx={{ position: "relative" }}>
        <TextField
          fullWidth
          label={label}
          placeholder={placeholder}
          value={query || selectedValue || ""}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setOpen(true)}
        />

        {open && (
          <Paper
            elevation={3}
            sx={{
              position: "absolute",
              width: "100%",
              maxHeight: 260,
              overflow: "auto",
              zIndex: 9999,
              mt: 1,
            }}
            ref={listRef}
            onScroll={handleScroll}
          >
            <List dense>
              {items.map((item) => (
                <ListItemButton
                  key={item[valueKey]}
                  onClick={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                >
                  {item[labelKey]}
                </ListItemButton>
              ))}

              {loading && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    py: 1,
                  }}
                >
                  <CircularProgress size={22} />
                </Box>
              )}
            </List>
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  );
}
