import { linearRegression, linearRegressionLine, rSquared } from 'simple-statistics';

export type TrendType =
  | 'linear'
  | 'logarithmic'
  | 'polynomial'
  | 'power'
  | 'exponential'
  | 'movingAverage';

export interface MathDetails {
  methodDescription: string;
  steps: string[];
}

export interface TrendResult {
  trendPoints: number[];
  equation: string;
  r2: number | null;
  mathDetails: MathDetails;
}

const pos = (v: number) => (v > 0 ? v : 1e-10);

export function calculateTrend(yValues: number[], type: TrendType, windowSize = 3): TrendResult {
  const n = yValues.length;
  if (n < 2) return { trendPoints: [...yValues], equation: '', r2: null, mathDetails: { methodDescription: 'Za mało danych', steps: [] } };

  const xs = yValues.map((_, i) => i + 1);
  const points: [number, number][] = yValues.map((y, i) => [i + 1, y]);

  if (type === 'linear') {
    const lr = linearRegression(points);
    const lineFn = linearRegressionLine(lr);
    const trendPoints = xs.map(lineFn);
    const r2 = rSquared(points, lineFn);
    const sign = lr.b >= 0 ? '+ ' : '– ';
    return {
      trendPoints,
      equation: `y = ${lr.m.toFixed(2)}x ${sign}${Math.abs(lr.b).toFixed(2)}`,
      r2,
      mathDetails: {
        methodDescription: 'Regresja liniowa (MNK) – minimalizuje sumę kwadratów reszt Σ(yᵢ − ŷᵢ)²',
        steps: [
          `Dane: n = ${n} punktów (x = numer okresu, y = wartość)`,
          `Σx = ${xs.reduce((s, x) => s + x, 0).toFixed(2)},  Σy = ${yValues.reduce((s, y) => s + y, 0).toFixed(2)},  Σxy = ${xs.reduce((s, x, i) => s + x * yValues[i], 0).toFixed(2)},  Σx² = ${xs.reduce((s, x) => s + x ** 2, 0).toFixed(2)}`,
          `m = (n·Σxy − Σx·Σy) / (n·Σx² − (Σx)²) = ${lr.m.toFixed(6)}`,
          `b = (Σy − m·Σx) / n = ${lr.b.toFixed(6)}`,
          `R² = 1 − SSE/SST`,
        ],
      },
    };
  }

  if (type === 'logarithmic') {
    const logPts: [number, number][] = points.map(([x, y]) => [Math.log(pos(x)), y]);
    const lr = linearRegression(logPts);
    const fn = (x: number) => lr.m * Math.log(pos(x)) + lr.b;
    const trendPoints = xs.map(fn);
    const r2 = rSquared(points, x => fn(x));
    const sign = lr.b >= 0 ? '+ ' : '– ';
    return {
      trendPoints,
      equation: `y = ${lr.m.toFixed(2)} · ln(x) ${sign}${Math.abs(lr.b).toFixed(2)}`,
      r2,
      mathDetails: {
        methodDescription: 'Regresja logarytmiczna – transformacja x → x\' = ln(x), następnie MNK na punktach (x\', y)',
        steps: [
          `Transformacja: x' = ln(x) dla x = 1..${n}`,
          `Dopasowanie MNK: y = a·x' + b`,
          `a = ${lr.m.toFixed(6)},  b = ${lr.b.toFixed(6)}`,
          `Model końcowy: y = ${lr.m.toFixed(2)}·ln(x) ${sign}${Math.abs(lr.b).toFixed(2)}`,
          `R² liczony dla oryginalnych y względem wartości dopasowanych ŷ`,
        ],
      },
    };
  }

  if (type === 'polynomial') {
    if (n < 3) {
      const lr = linearRegression(points);
      const lineFn = linearRegressionLine(lr);
      return {
        trendPoints: xs.map(lineFn),
        equation: `y = ${lr.m.toFixed(2)}x + ${lr.b.toFixed(2)} (za mało punktów dla wielomianowego)`,
        r2: rSquared(points, lineFn),
        mathDetails: {
          methodDescription: 'Za mało punktów (n < 3) – zastosowano regresję liniową',
          steps: [`n = ${n}, wymagane minimum 3 punkty`],
        },
      };
    }

    const sX = xs.reduce((s, x) => s + x, 0);
    const sX2 = xs.reduce((s, x) => s + x ** 2, 0);
    const sX3 = xs.reduce((s, x) => s + x ** 3, 0);
    const sX4 = xs.reduce((s, x) => s + x ** 4, 0);
    const sY = yValues.reduce((s, y) => s + y, 0);
    const sXY = xs.reduce((s, x, i) => s + x * yValues[i], 0);
    const sX2Y = xs.reduce((s, x, i) => s + x ** 2 * yValues[i], 0);

    const mat = [
      [n, sX, sX2, sY],
      [sX, sX2, sX3, sXY],
      [sX2, sX3, sX4, sX2Y],
    ];

    for (let col = 0; col < 3; col++) {
      let maxRow = col;
      for (let row = col + 1; row < 3; row++) {
        if (Math.abs(mat[row][col]) > Math.abs(mat[maxRow][col])) maxRow = row;
      }
      [mat[col], mat[maxRow]] = [mat[maxRow], mat[col]];
      for (let row = col + 1; row < 3; row++) {
        const f = mat[row][col] / mat[col][col];
        for (let j = col; j <= 3; j++) mat[row][j] -= f * mat[col][j];
      }
    }

    const sol = [0, 0, 0];
    for (let row = 2; row >= 0; row--) {
      sol[row] = mat[row][3];
      for (let j = row + 1; j < 3; j++) sol[row] -= mat[row][j] * sol[j];
      sol[row] /= mat[row][row];
    }

    const [c, b, a] = sol;
    const fn = (x: number) => a * x ** 2 + b * x + c;
    const trendPoints = xs.map(fn);
    const r2 = rSquared(points, x => fn(x));
    const bSign = b >= 0 ? '+ ' : '– ';
    const cSign = c >= 0 ? '+ ' : '– ';
    return {
      trendPoints,
      equation: `y = ${a.toFixed(4)}x² ${bSign}${Math.abs(b).toFixed(2)}x ${cSign}${Math.abs(c).toFixed(2)}`,
      r2,
      mathDetails: {
        methodDescription: 'Regresja wielomianowa st. 2 – układ 3 równań normalnych rozwiązany eliminacją Gaussa z częściowym pivotem',
        steps: [
          `Minimalizacja Σ(yᵢ − axᵢ² − bxᵢ − c)² → 3 równania normalne`,
          `Sumy: Σx=${sX.toFixed(2)}, Σx²=${sX2.toFixed(2)}, Σx³=${sX3.toFixed(2)}, Σx⁴=${sX4.toFixed(2)}`,
          `      Σy=${sY.toFixed(2)}, Σxy=${sXY.toFixed(2)}, Σx²y=${sX2Y.toFixed(2)}`,
          `Eliminacja Gaussa → a = ${a.toFixed(6)},  b = ${b.toFixed(6)},  c = ${c.toFixed(6)}`,
          `Model: y = ${a.toFixed(4)}x² ${bSign}${Math.abs(b).toFixed(2)}x ${cSign}${Math.abs(c).toFixed(2)}`,
        ],
      },
    };
  }

  if (type === 'power') {
    const validPts = points.filter(([, y]) => y > 0) as [number, number][];
    if (validPts.length < 2) {
      return {
        trendPoints: [...yValues],
        equation: 'Brak wystarczających danych > 0',
        r2: null,
        mathDetails: { methodDescription: 'Brak danych dodatnich', steps: [] },
      };
    }
    const logPts: [number, number][] = validPts.map(([x, y]) => [Math.log(pos(x)), Math.log(y)]);
    const lr = linearRegression(logPts);
    const a = Math.exp(lr.b);
    const b = lr.m;
    const fn = (x: number) => a * Math.pow(pos(x), b);
    const trendPoints = xs.map(fn);
    const r2 = rSquared(validPts, x => fn(x));
    return {
      trendPoints,
      equation: `y = ${a.toFixed(2)} · x^${b.toFixed(2)}`,
      r2,
      mathDetails: {
        methodDescription: 'Regresja potęgowa – logarytmowanie obu zmiennych przekształca model do postaci liniowej',
        steps: [
          `Transformacja: x' = ln(x),  y' = ln(y)  (tylko punkty z y > 0, użyto ${validPts.length}/${n})`,
          `Dopasowanie MNK na (x', y'): y' = B·x' + A`,
          `B = ${lr.m.toFixed(6)},  A = ${lr.b.toFixed(6)}`,
          `Odwrócenie: a = e^A = ${a.toFixed(6)},  b = B = ${b.toFixed(6)}`,
          `Model: y = ${a.toFixed(2)}·x^${b.toFixed(2)}`,
          `R² liczony dla punktów z y > 0 względem wartości dopasowanych`,
        ],
      },
    };
  }

  if (type === 'exponential') {
    const validPts = points.filter(([, y]) => y > 0) as [number, number][];
    if (validPts.length < 2) {
      return {
        trendPoints: [...yValues],
        equation: 'Brak wystarczających danych > 0',
        r2: null,
        mathDetails: { methodDescription: 'Brak danych dodatnich', steps: [] },
      };
    }
    const logPts: [number, number][] = validPts.map(([x, y]) => [x, Math.log(y)]);
    const lr = linearRegression(logPts);
    const a = Math.exp(lr.b);
    const b = lr.m;
    const fn = (x: number) => a * Math.exp(b * x);
    const trendPoints = xs.map(fn);
    const r2 = rSquared(validPts, x => fn(x));
    return {
      trendPoints,
      equation: `y = ${a.toFixed(2)} · e^(${b.toFixed(4)}x)`,
      r2,
      mathDetails: {
        methodDescription: 'Regresja wykładnicza – logarytmowanie y przekształca model do postaci liniowej',
        steps: [
          `Transformacja: y' = ln(y)  (tylko punkty z y > 0, użyto ${validPts.length}/${n})`,
          `Dopasowanie MNK na (x, y'): y' = bx + A`,
          `b = ${lr.m.toFixed(6)},  A = ${lr.b.toFixed(6)}`,
          `Odwrócenie: a = e^A = ${a.toFixed(6)}`,
          `Model: y = ${a.toFixed(2)}·e^(${b.toFixed(4)}x)`,
          `R² liczony dla punktów z y > 0 względem wartości dopasowanych`,
        ],
      },
    };
  }

  const half = Math.floor(windowSize / 2);
  const trendPoints = yValues.map((_, i) => {
    const start = Math.max(0, i - half);
    const end = Math.min(n - 1, i + half);
    const slice = yValues.slice(start, end + 1);
    return slice.reduce((s, v) => s + v, 0) / slice.length;
  });
  return {
    trendPoints,
    equation: `Średnia krocząca (okno: ${windowSize})`,
    r2: null,
    mathDetails: {
      methodDescription: `Średnia krocząca – dla każdego punktu i liczy się średnią z sąsiednich wartości w oknie o rozmiarze ${windowSize}`,
      steps: [
        `Okno: ${windowSize} okresów (symetryczne; skrócone przy brzegach danych)`,
        `ŷᵢ = (1/k) · Σ yⱼ,  gdzie j ∈ ⟨max(0, i−⌊k/2⌋), min(n−1, i+⌊k/2⌋)⟩`,
        `k = efektywna długość okna (może być < ${windowSize} przy brzegach)`,
        `Brak R² – średnia krocząca nie jest modelem regresji parametrycznej`,
      ],
    },
  };
}
