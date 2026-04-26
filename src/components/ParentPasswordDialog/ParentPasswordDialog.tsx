import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Typography,
  Link,
  Box,
} from "@mui/material";
import { validatePasswordOrMasterKey } from "../../models/auth";

interface ParentPasswordDialogProps {
  open: boolean;
  mode: "create" | "validate" | "reset";
  storedPassword?: string;
  onSuccess: (password: string) => void;
  onCancel?: () => void;
  onRequestReset?: () => void;
}

export function ParentPasswordDialog({
  open,
  mode,
  storedPassword,
  onSuccess,
  onCancel,
  onRequestReset,
}: ParentPasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");

    if (!password.trim()) {
      setError("Digite uma senha.");
      return;
    }

    if (mode === "create") {
      if (password.length < 4) {
        setError("A senha deve ter pelo menos 4 caracteres.");
        return;
      }

      if (password !== confirmPassword) {
        setError("As senhas não coincidem.");
        return;
      }

      onSuccess(password);
      resetForm();
    } else if (mode === "reset") {
      // Modo reset: criar nova senha
      if (password.length < 4) {
        setError("A senha deve ter pelo menos 4 caracteres.");
        return;
      }

      if (password !== confirmPassword) {
        setError("As senhas não coincidem.");
        return;
      }

      onSuccess(password);
      resetForm();
    } else {
      // mode === 'validate'
      if (!storedPassword) {
        setError("Senha não configurada.");
        return;
      }

      if (!validatePasswordOrMasterKey(storedPassword, password)) {
        setError("Senha incorreta.");
        return;
      }

      // Se digitou a master key 'APRENDER', redireciona para reset
      if (password === "APRENDER" && onRequestReset) {
        resetForm();
        onRequestReset();
        return;
      }

      onSuccess(password);
      resetForm();
    }
  };

  const handleCancel = () => {
    resetForm();
    onCancel?.();
  };

  const resetForm = () => {
    setPassword("");
    setConfirmPassword("");
    setError("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onClose={mode === "validate" && onCancel ? handleCancel : undefined} maxWidth="xs" fullWidth>
      <DialogTitle>
        {mode === "create" && "Criar Senha de Gerenciamento"}
        {mode === "validate" && "Senha de Gerenciamento"}
        {mode === "reset" && "Redefinir Senha de Gerenciamento"}
      </DialogTitle>

      <DialogContent>
        {mode === "create" && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Crie uma senha para proteger o gerenciamento da loja. Esta senha será necessária para adicionar, editar ou
              excluir recompensas.
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              💡 Se em algum dia esquecer a senha, basta informar a palavra-chave <strong>"APRENDER"</strong> (em
              maiúsculas) para redefini-la.
            </Alert>
          </Box>
        )}

        {mode === "validate" && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Digite a senha de gerenciamento para continuar.
          </Typography>
        )}

        {mode === "reset" && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Defina uma nova senha de gerenciamento.
            </Typography>
            <Alert severity="success" sx={{ mb: 2 }}>
              ✓ Palavra-chave verificada! Você pode criar uma nova senha.
            </Alert>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label={mode === "reset" ? "Nova Senha" : "Senha"}
          type="password"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={handleKeyPress}
          autoFocus
          sx={{ mb: 2 }}
        />

        {(mode === "create" || mode === "reset") && (
          <TextField
            label="Confirmar Senha"
            type="password"
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        )}

        {mode === "validate" && onRequestReset && (
          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Link
              component="button"
              variant="body2"
              onClick={() => {
                resetForm();
                onRequestReset();
              }}
              sx={{ cursor: "pointer" }}
            >
              Esqueci minha senha
            </Link>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {(mode === "validate" || mode === "reset") && onCancel && <Button onClick={handleCancel}>Cancelar</Button>}
        <Button onClick={handleSubmit} variant="contained">
          {mode === "create" && "Criar Senha"}
          {mode === "validate" && "Confirmar"}
          {mode === "reset" && "Redefinir Senha"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
