import { Accordion, AccordionDetails, AccordionSummary, Box, Link, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { Link as RouterLink } from "react-router-dom";

const SECTIONS = [
  {
    title: "1. Sobre o Apprender",
    content: (
      <>
        Aplicativo educacional de matemática voltado a crianças de 5 a 12 anos. O uso deve ser supervisionado por um
        responsável, que configura a conta e define as recompensas.
      </>
    ),
  },
  {
    title: "2. Dados coletados",
    content: (
      <ul>
        <li>
          <strong>Cadastro:</strong> nome, apelido, e-mail e idade.
        </li>
        <li>
          <strong>Uso:</strong> pontos, nível, rating, histórico de respostas e ofensiva.
        </li>
        <li>
          <strong>Loja:</strong> recompensas configuradas e histórico de resgates.
        </li>
      </ul>
    ),
  },
  {
    title: "3. Finalidade",
    content: (
      <ul>
        <li>Personalizar a dificuldade das questões.</li>
        <li>Registrar progresso, pontos e recompensas.</li>
        <li>Sincronizar dados entre dispositivos via nuvem.</li>
      </ul>
    ),
  },
  {
    title: "4. Consentimento parental",
    content: (
      <>
        O cadastro é realizado por ou com supervisão de um adulto responsável. Ao criar a conta, o responsável consente
        com esta política e pode solicitar exclusão dos dados a qualquer momento.
      </>
    ),
  },
  {
    title: "5. Armazenamento e segurança",
    content: (
      <>
        Dados armazenados no Firebase (Google Cloud, EUA) com criptografia em trânsito (TLS) e em repouso. Uma cópia
        local fica no dispositivo para uso offline.
      </>
    ),
  },
  {
    title: "6. Exclusão de dados",
    content: (
      <>
        Acesse <strong>Perfil → Excluir Conta</strong> no app, ou entre em contato pelo e-mail abaixo (9. Contato). A
        exclusão é permanente e irreversível.
      </>
    ),
  },
  {
    title: "7. Publicidade e terceiros",
    content: (
      <>
        Sem anúncios. Tecnologias de terceiros: <strong>Firebase Authentication</strong> e{" "}
        <strong>Cloud Firestore</strong> (Google LLC).{" "}
        <Link href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
          Política de Privacidade do Google
        </Link>
        .
      </>
    ),
  },
  {
    title: "8. Direitos do titular",
    content: (
      <>O responsável pode acessar, corrigir ou solicitar exclusão dos dados a qualquer momento pelo e-mail abaixo.</>
    ),
  },
  {
    title: "9. Contato",
    content: <Link href="mailto:gabrielluisback.work@gmail.com">gabrielluisback.work@gmail.com</Link>,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "background.paper", display: "flex", flexDirection: "column" }}>
      {/* Cabeçalho compacto */}
      <Box
        sx={{
          px: 2,
          py: 1,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Link
          component={RouterLink}
          to="/"
          underline="none"
          color="primary"
          sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}
        >
          <ArrowBackRoundedIcon fontSize="small" />
        </Link>
        <Box>
          <Typography
            variant="body1"
            sx={{ fontFamily: '"Fredoka", sans-serif', fontWeight: 700, color: "primary.main", lineHeight: 1.1 }}
          >
            Política de Privacidade
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: '"Nunito", sans-serif' }}>
            Apprender · 30 abr 2026
          </Typography>
        </Box>
      </Box>

      {/* Seções em Accordion */}
      <Box sx={{ flex: 1 }}>
        {SECTIONS.map((section) => (
          <Accordion
            key={section.title}
            disableGutters
            elevation={0}
            square
            sx={{
              borderBottom: "1px solid",
              borderColor: "divider",
              "&::before": { display: "none" },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ px: 2, minHeight: 44, "& .MuiAccordionSummary-content": { my: 0.75 } }}
            >
              <Typography
                variant="body2"
                sx={{ fontFamily: '"Fredoka", sans-serif', fontWeight: 600, color: "primary.dark" }}
              >
                {section.title}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2, pt: 0, pb: 1.5 }}>
              <Typography
                variant="body2"
                component="div"
                sx={{
                  fontFamily: '"Nunito", sans-serif',
                  lineHeight: 1.65,
                  color: "text.secondary",
                  "& ul": { pl: 2, m: 0 },
                  "& li": { mb: 0.25 },
                  "& strong": { color: "text.primary" },
                  overflowWrap: "break-word",
                  wordBreak: "break-word",
                }}
              >
                {section.content}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="caption" color="text.disabled" sx={{ fontFamily: '"Nunito", sans-serif' }}>
          Esta política pode ser atualizada periodicamente.
        </Typography>
      </Box>
    </Box>
  );
}
