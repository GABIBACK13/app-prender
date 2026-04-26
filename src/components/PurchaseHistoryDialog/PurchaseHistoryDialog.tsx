import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Chip,
  Divider,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import * as MuiIcons from "@mui/icons-material";
import { getPurchaseHistory } from "../../models/purchaseHistory";
import { LocalPurchase } from "../../types/localStorage";

interface PurchaseHistoryDialogProps {
  open: boolean;
  onClose: () => void;
}

export function PurchaseHistoryDialog({ open, onClose }: PurchaseHistoryDialogProps) {
  const [purchases, setPurchases] = useState<LocalPurchase[]>([]);

  useEffect(() => {
    if (open) {
      loadPurchases();
    }
  }, [open]);

  const loadPurchases = () => {
    const history = getPurchaseHistory();
    setPurchases(history);
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderIcon = (purchase: LocalPurchase) => {
    if (purchase.iconType === "emoji") {
      return (
        <Typography
          variant="h4"
          sx={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {purchase.iconValue}
        </Typography>
      );
    } else {
      // Material Icon
      const IconComponent = (MuiIcons as any)[purchase.iconValue];
      if (IconComponent) {
        return <IconComponent sx={{ fontSize: 40, color: "primary.main" }} />;
      }
      return <ShoppingCartIcon sx={{ fontSize: 40, color: "primary.main" }} />;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ShoppingCartIcon />
          <Typography variant="h6" component="span">
            Histórico de Compras
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {purchases.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography variant="body1" color="text.secondary">
              Nenhuma compra realizada ainda.
            </Typography>
          </Box>
        ) : (
          <List>
            {purchases.map((purchase, index) => (
              <Box key={purchase.id}>
                <ListItem
                  sx={{
                    py: 2,
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <Box sx={{ display: "flex", width: "100%", gap: 2, alignItems: "center" }}>
                    <ListItemIcon sx={{ minWidth: "auto" }}>{renderIcon(purchase)}</ListItemIcon>

                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                            {purchase.itemName}
                          </Typography>
                          {!purchase.synced && (
                            <Chip label="Pendente sync" size="small" color="warning" variant="outlined" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(purchase.purchasedAt)}
                          </Typography>
                        </Box>
                      }
                    />

                    <Box sx={{ textAlign: "right" }}>
                      <Typography
                        variant="subtitle1"
                        color="error.main"
                        sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        -{purchase.pointsSpent} pts
                      </Typography>
                    </Box>
                  </Box>
                </ListItem>
                {index < purchases.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
