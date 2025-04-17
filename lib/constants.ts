const ports = ["Szczecin", "Gdańsk", "Gdynia", "Kołobrzeg", "Świnoujście"]
const commodityGroups = ["Węgiel", "Ruda", "Zboże", "Drewno", "Drobnica", "Inne masowe", "Paliwa płynne"]

const portData: Record<string, Record<string, { value: number; secondary: number | null }>> = {
  Szczecin: {
    Węgiel: { value: 3400, secondary: 851 },
    Ruda: { value: 14400, secondary: null },
    Zboże: { value: 14400, secondary: 935 },
    Drewno: { value: 156571, secondary: null },
    Drobnica: { value: 22917, secondary: 791 },
    "Inne masowe": { value: 3519, secondary: 663 },
    "Paliwa płynne": { value: 37646, secondary: 422 },
    "SUMA (TONY)": { value: 10200, secondary: 697 },
    "KONTENERY (TEU)": { value: 2203, secondary: 287 },
  },
  Gdańsk: {
    Węgiel: { value: 24680, secondary: 1250 },
    Ruda: { value: 18750, secondary: null },
    Zboże: { value: 5840, secondary: 1120 },
    Drewno: { value: 89320, secondary: null },
    Drobnica: { value: 35680, secondary: 980 },
    "Inne masowe": { value: 7890, secondary: 540 },
    "Paliwa płynne": { value: 58970, secondary: 780 },
    "SUMA (TONY)": { value: 125430, secondary: 890 },
    "KONTENERY (TEU)": { value: 4580, secondary: 520 },
  },
  Gdynia: {
    Węgiel: { value: 18750, secondary: 920 },
    Ruda: { value: 14568, secondary: null },
    Zboże: { value: 4320, secondary: 780 },
    Drewno: { value: 78450, secondary: null },
    Drobnica: { value: 19870, secondary: 650 },
    "Inne masowe": { value: 5430, secondary: 480 },
    "Paliwa płynne": { value: 42580, secondary: 560 },
    "SUMA (TONY)": { value: 95680, secondary: 750 },
    "KONTENERY (TEU)": { value: 1870, secondary: 320 },
  },
  Kołobrzeg: {
    Węgiel: { value: 8750, secondary: 480 },
    Ruda: { value: 6543, secondary: null },
    Zboże: { value: 2180, secondary: 420 },
    Drewno: { value: 45680, secondary: null },
    Drobnica: { value: 12450, secondary: 380 },
    "Inne masowe": { value: 2870, secondary: 240 },
    "Paliwa płynne": { value: 18750, secondary: 320 },
    "SUMA (TONY)": { value: 52340, secondary: 420 },
    "KONTENERY (TEU)": { value: 980, secondary: 150 },
  },
  Świnoujście: {
    Węgiel: { value: 21340, secondary: 1080 },
    Ruda: { value: 17892, secondary: null },
    Zboże: { value: 6750, secondary: 1250 },
    Drewno: { value: 102450, secondary: null },
    Drobnica: { value: 29870, secondary: 870 },
    "Inne masowe": { value: 6780, secondary: 520 },
    "Paliwa płynne": { value: 49870, secondary: 680 },
    "SUMA (TONY)": { value: 112580, secondary: 820 },
    "KONTENERY (TEU)": { value: 3980, secondary: 480 },
  },
}

const allCommodities = [
    "Węgiel",
    "Ruda",
    "Zboże",
    "Drewno",
    "Drobnica",
    "Inne masowe",
    "Paliwa płynne",
    "SUMA (TONY)",
    "KONTENERY (TEU)",
  ]


export { commodityGroups, ports, portData, allCommodities }
