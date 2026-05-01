import { useState, useMemo } from "react";
import { Box, TextField, Typography, Paper, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import * as MuiIcons from "@mui/icons-material";
import shopIconsData from "../../data/shopIcons.json";

interface IconData {
  id: string;
  type: "emoji" | "material";
  value: string;
  name: string;
  category: string;
}

interface IconPickerProps {
  selectedIcon: { type: "emoji" | "material"; value: string } | null;
  onSelect: (iconType: "emoji" | "material", iconValue: string) => void;
}

export function IconPicker({ selectedIcon, onSelect }: IconPickerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const icons = shopIconsData.icons as IconData[];

  // Filtra ícones apenas por busca (sem categoria)
  const filteredIcons = useMemo(() => {
    return icons.filter((icon) => {
      const matchesSearch =
        icon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        icon.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [icons, searchTerm]);

  const renderIcon = (icon: IconData) => {
    if (icon.type === "emoji") {
      return (
        <Typography component="span" sx={{ fontSize: "1.5rem" }}>
          {icon.value}
        </Typography>
      );
    } else {
      // Material Icon
      const IconComponent = (MuiIcons as any)[icon.value];
      return IconComponent ? <IconComponent sx={{ fontSize: "1.5rem" }} /> : null;
    }
  };

  const isSelected = (icon: IconData) => {
    return selectedIcon?.type === icon.type && selectedIcon?.value === icon.value;
  };

  return (
    <Box>
      <TextField
        placeholder="Buscar ícone..."
        fullWidth
        size="small"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 1.5 }}
      />

      {/* Grid de ícones */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(50px, 1fr))",
          gap: 0.75,
          maxHeight: 250,
          overflowY: "auto",
          p: 1,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
        }}
      >
        {filteredIcons.map((icon) => (
          <Paper
            key={icon.id}
            elevation={isSelected(icon) ? 6 : 1}
            onClick={() => onSelect(icon.type, icon.value)}
            sx={{
              p: 0.5,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s",
              border: isSelected(icon) ? 2 : 0,
              borderColor: "primary.main",
              bgcolor: isSelected(icon) ? "primary.50" : "background.paper",
              "&:hover": {
                bgcolor: "action.hover",
                transform: "scale(1.05)",
              },
              aspectRatio: "1",
            }}
          >
            {renderIcon(icon)}
          </Paper>
        ))}
      </Box>

      {filteredIcons.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
          Nenhum ícone encontrado.
        </Typography>
      )}
    </Box>
  );
}
