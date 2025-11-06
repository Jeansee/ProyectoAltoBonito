// src/services/chatbot.service.tsx
import type { ChatTree } from "../components/home/chatbot";

// Centraliza datos de contacto
const PHONE = "+56912345678";
const WA_INTENT = `https://wa.me/56912345678?text=${encodeURIComponent("Hola, quiero reservar")}`;

const chatTree: ChatTree = {
  startId: "inicio",
  nodes: {
    inicio: {
      id: "inicio",
      message:
        "¡Hola! 👋 Soy tu asistente del Quincho Alto Bonito. Te ayudo a reservar y resolver dudas. ¿Qué necesitas?",
      options: [
        { id: "reservar", label: "Reservar", next: "reservar", description: "Ver disponibilidad y elegir servicio" },
        {
          id: "servicios-precios",
          label: "Servicios y precios",
          next: "servicios-precios",
          description: "Qué incluye + valores + horarios",
        },
        { id: "contacto", label: "Contacto", next: "contacto", description: "WhatsApp, llamada o correo" },
      ],
    },

    // ====== Reservar ======
    reservar: {
      id: "reservar",
      message:
        "Genial 🙂 Puedes reservar en línea o hablar con nosotros por WhatsApp. Elige cómo prefieres continuar:",
      options: [
        {
          id: "ir-reservas",
          label: "Reservar en línea",
          description: "Ir a la sección Servicios",
          // Lleva al Home y hace scroll a #servicios (lo maneja onEvent en App.tsx)
          action: { type: "emit", event: "scroll_to", payload: { selector: "#servicios", route: "/" } },
        },
        {
          id: "wa",
          label: "Reservar por WhatsApp",
          description: "Te ayudamos al tiro",
          action: { type: "open_url", url: WA_INTENT },
        },
        { id: "volver-inicio", label: "Volver al inicio", next: "inicio" },
      ],
    },

    // ====== Nodo UNIFICADO: Servicios + Precios/Horarios + Qué incluye ======
    "servicios-precios": {
      id: "servicios-precios",
      message: "Elige un servicio para ver **qué incluye**, **precios** y **horarios**:",
      options: [
        { id: "sp-quincho", label: "Quincho", next: "sp-info-quincho" },
        { id: "sp-piscina", label: "Piscina", next: "sp-info-piscina" },
        { id: "sp-cancha", label: "Cancha", next: "sp-info-cancha" },
        { id: "sp-inicio", label: "Volver al inicio", next: "inicio" },
      ],
    },

    // ====== Detalles por servicio (combinado) ======
    "sp-info-quincho": {
      id: "sp-info-quincho",
      message:
        "🛖 **Quincho**\n" +
        "Incluye: parrilla y utensilios básicos, mesa/sillas, electricidad, estacionamiento.\n" +
        "Precios/horarios: día completo 10:00–22:00 (valores referenciales; se confirman al reservar).\n" +
        "Políticas: capacidad sugerida X personas y no fumar en interior.\n",
      options: [
        {
          id: "sp-q-reservar",
          label: "Reservar Quincho",
          action: { type: "emit", event: "go_to", payload: { path: "/recursos?tipo=QUINCHO&activo=true" } },
        },
        { id: "sp-q-volver", label: "Volver", next: "servicios-precios" },
      ],
    },

    "sp-info-piscina": {
      id: "sp-info-piscina",
      message:
        "🏊 **Piscina**\n" +
        "Incluye: acceso a camarines/duchas.\n" +
        "Precios/horarios: tramos de 2 horas (valores referenciales; se confirman al reservar).\n" +
        "Políticas: menores con adulto responsable; respeta normas de seguridad.\n",
      options: [
        {
          id: "sp-p-reservar",
          label: "Reservar Piscina",
          action: { type: "emit", event: "go_to", payload: { path: "/recursos?tipo=PISCINA&activo=true" } },
        },
        { id: "sp-p-volver", label: "Volver", next: "servicios-precios" },
      ],
    },

    "sp-info-cancha": {
      id: "sp-info-cancha",
      message:
        "⚽ **Cancha**\n" +
        "Incluye: arcos; iluminación opcional.\n" +
        "Precios/horarios: por hora (valores referenciales; se confirman al reservar).\n" +
        "Políticas: uso de calzado adecuado; mantener limpieza del recinto.\n",
      options: [
        {
          id: "sp-c-reservar",
          label: "Reservar Cancha",
          action: { type: "emit", event: "go_to", payload: { path: "/recursos?tipo=CANCHA&activo=true" } },
        },
        { id: "sp-c-volver", label: "Volver", next: "servicios-precios" },
      ],
    },

    // ====== Contacto ======
    contacto: {
      id: "contacto",
      message: "¿Prefieres hablar con alguien? Encantados de ayudarte:",
      options: [
        { id: "co-wa", label: "Abrir WhatsApp", description: "Respuesta rápida", action: { type: "open_url", url: WA_INTENT } },
        { id: "co-call", label: "Llamar por teléfono", description: "Te atendemos", action: { type: "open_url", url: `tel:${PHONE}` } },
        {
          id: "co-mail",
          label: "Copiar correo",
          description: "reservas@quinchoaltobonito.cl",
          action: { type: "copy", text: "reservas@quinchoaltobonito.cl" },
        },
        { id: "co-inicio", label: "Volver al inicio", next: "inicio" },
      ],
    },
  },
};

export default chatTree;
