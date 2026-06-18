import { getKanbanItems, getTrashedKanbanItems } from '@/actions';
import { KanbanBoard } from '@/components/layouts';
import { linearRegression, linearRegressionLine, rSquared } from "simple-statistics";

export default async function KanbanPage() {
  const [items, trash] = await Promise.all([
    getKanbanItems(),
    getTrashedKanbanItems(),
  ]);

  // 📊 DEMO DANYCH (trend)
  const points = [
    [1, 2],
    [2, 4],
    [3, 5],
    [4, 4],
    [5, 5],
  ];

  // 📈 regresja liniowa
  const lr = linearRegression(points);
  const line = linearRegressionLine(lr);

  // 📉 punkty linii trendu
  const trendPoints = points.map(([x]) => ({
    x,
    y: line(x),
  }));

  // 📊 jakość dopasowania
  const r2 = rSquared(points, line);

  return (
    <div className="w-full py-4 space-y-6">

      {/* KANBAN */}
      <KanbanBoard initialItems={items} initialTrash={trash} />

      {/* DEMO STATYSTYCZNE */}
      <div className="p-4 border rounded-lg bg-white">
        <h2 className="text-lg font-bold mb-2">
          📊 Demo regresji liniowej (simple-statistics)
        </h2>

        <div className="text-sm space-y-1">
          <p><b>Równanie linii:</b> y = {lr.m.toFixed(2)}x + {lr.b.toFixed(2)}</p>
          <p><b>R²:</b> {r2.toFixed(3)}</p>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold">Punkty trendu:</h3>
          <pre className="text-xs bg-gray-100 p-2 rounded mt-2">
            {JSON.stringify(trendPoints, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}