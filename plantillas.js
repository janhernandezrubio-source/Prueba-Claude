// Partidas de ejemplo por oficio. Precios orientativos: el usuario los ajusta.
window.PRESU_PLANTILLAS = {
  fontaneria: {
    nombre: "Fontanería",
    partidas: [
      { concepto: "Desplazamiento y diagnóstico", cantidad: 1, unidad: "ud", precio: 30 },
      { concepto: "Mano de obra fontanero", cantidad: 2, unidad: "h", precio: 35 },
      { concepto: "Sustitución de grifo monomando (material incluido)", cantidad: 1, unidad: "ud", precio: 85 },
      { concepto: "Tubería multicapa Ø16 instalada", cantidad: 5, unidad: "m", precio: 12 },
    ],
    condiciones: "Material de primera calidad. Garantía de 6 meses en mano de obra. Cualquier trabajo no incluido se presupuestará aparte.",
  },
  electricidad: {
    nombre: "Electricidad",
    partidas: [
      { concepto: "Desplazamiento", cantidad: 1, unidad: "ud", precio: 25 },
      { concepto: "Mano de obra electricista", cantidad: 3, unidad: "h", precio: 32 },
      { concepto: "Punto de luz nuevo (cableado y mecanismo)", cantidad: 2, unidad: "ud", precio: 55 },
      { concepto: "Enchufe Schuko empotrado", cantidad: 4, unidad: "ud", precio: 38 },
    ],
    condiciones: "Instalación conforme al REBT. Garantía de 1 año en mano de obra.",
  },
  pintura: {
    nombre: "Pintura",
    partidas: [
      { concepto: "Protección de suelos y muebles", cantidad: 1, unidad: "ud", precio: 60 },
      { concepto: "Pintura plástica blanca en paredes (2 manos)", cantidad: 80, unidad: "m²", precio: 7 },
      { concepto: "Pintura de techos (2 manos)", cantidad: 25, unidad: "m²", precio: 8 },
      { concepto: "Reparación de grietas y alisado puntual", cantidad: 1, unidad: "ud", precio: 90 },
    ],
    condiciones: "Pintura incluida. Limpieza final de la zona de trabajo incluida.",
  },
  reformas: {
    nombre: "Reformas",
    partidas: [
      { concepto: "Demolición de alicatado y retirada de escombros", cantidad: 18, unidad: "m²", precio: 18 },
      { concepto: "Alicatado de paredes (sin material cerámico)", cantidad: 18, unidad: "m²", precio: 28 },
      { concepto: "Solado de suelo (sin material cerámico)", cantidad: 5, unidad: "m²", precio: 32 },
      { concepto: "Plato de ducha y mampara instalados", cantidad: 1, unidad: "ud", precio: 650 },
      { concepto: "Gestión de residuos y contenedor", cantidad: 1, unidad: "ud", precio: 180 },
    ],
    condiciones: "Licencia de obra menor a cargo del cliente si fuera necesaria. Plazo estimado: 7 días laborables.",
  },
};
