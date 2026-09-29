// frontend/src/pages/TraderProblems/Partials.jsx
import { useState } from "react";
import { Calculator, Plus, Trash2, PieChart } from "lucide-react";

export default function Partials() {
  const [executions, setExecutions] = useState([
    { id: 1, percentOfPosition: 50, rMultiple: 1.5 },
    { id: 2, percentOfPosition: 30, rMultiple: 2.5 },
    { id: 3, percentOfPosition: 20, rMultiple: 0 }, // Break even runner
  ]);

  const addExecution = () => {
    setExecutions([
      ...executions,
      { id: Date.now(), percentOfPosition: 0, rMultiple: 0 },
    ]);
  };

  const updateExecution = (id, field, value) => {
    setExecutions(
      executions.map((exe) =>
        exe.id === id ? { ...exe, [field]: Number(value) } : exe,
      ),
    );
  };

  const removeExecution = (id) => {
    if (executions.length > 1) {
      setExecutions(executions.filter((exe) => exe.id !== id));
    }
  };

  // Math Logic
  const totalPercentage = executions.reduce(
    (acc, exe) => acc + exe.percentOfPosition,
    0,
  );

  // Calculate Blended R: Sum of (Percent * R) / 100
  const blendedR = executions.reduce((acc, exe) => {
    return acc + (exe.percentOfPosition / 100) * exe.rMultiple;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[4px] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
              <Calculator className="w-5 h-5 text-emerald-500" /> Partials
              Calculator
            </h2>
            <p className="text-sm text-gray-500">
              Calculate your true, blended R-Multiple when scaling out of
              positions.
            </p>
          </div>
          <button
            onClick={addExecution}
            className="px-4 py-2 bg-[#2f8df4]/10 text-[#2f8df4] hover:bg-[#2f8df4]/20 border border-[#2f8df4]/20 font-bold text-xs rounded-[2px] transition-colors flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Execution
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Executions List */}
          <div className="lg:col-span-2 space-y-3">
            {/* Headers */}
            <div className="grid grid-cols-12 gap-4 px-4 pb-2 border-b border-gray-200 dark:border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <div className="col-span-5">Position Closed (%)</div>
              <div className="col-span-5">Exit R-Multiple</div>
              <div className="col-span-2 text-center">Action</div>
            </div>

            {/* Inputs */}
            {executions.map((exe, index) => (
              <div
                key={exe.id}
                className="grid grid-cols-12 gap-4 items-center bg-gray-50 dark:bg-[#1a1d24] p-3 rounded-[2px] border border-gray-200 dark:border-white/5"
              >
                <div className="col-span-5 relative">
                  <input
                    type="number"
                    value={exe.percentOfPosition}
                    onChange={(e) =>
                      updateExecution(
                        exe.id,
                        "percentOfPosition",
                        e.target.value,
                      )
                    }
                    className="w-full bg-white dark:bg-[#0d0e12] border border-gray-200 dark:border-white/10 rounded-[2px] pl-3 pr-8 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#2f8df4]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">
                    %
                  </span>
                </div>
                <div className="col-span-5 relative">
                  <input
                    type="number"
                    step="0.1"
                    value={exe.rMultiple}
                    onChange={(e) =>
                      updateExecution(exe.id, "rMultiple", e.target.value)
                    }
                    className="w-full bg-white dark:bg-[#0d0e12] border border-gray-200 dark:border-white/10 rounded-[2px] pl-3 pr-8 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#2f8df4]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">
                    R
                  </span>
                </div>
                <div className="col-span-2 flex justify-center">
                  <button
                    onClick={() => removeExecution(exe.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-[2px] transition-colors"
                    disabled={executions.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Results Summary */}
          <div className="bg-gray-50 dark:bg-[#1a1d24] p-6 border border-gray-200 dark:border-white/5 rounded-[4px] flex flex-col justify-center relative overflow-hidden">
            <PieChart className="absolute -right-6 -top-6 w-32 h-32 text-gray-200 dark:text-white/5 transform -rotate-12 pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                  Total Position Accounted
                </p>
                <p
                  className={`text-2xl font-bold ${totalPercentage === 100 ? "text-emerald-500" : "text-yellow-500"}`}
                >
                  {totalPercentage}%
                </p>
                {totalPercentage !== 100 && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1 font-medium">
                    Note: Position does not equal 100%.
                  </p>
                )}
              </div>

              <div className="pt-6 border-t border-gray-200 dark:border-white/10">
                <p className="text-[10px] font-bold text-[#2f8df4] uppercase tracking-widest mb-1">
                  Blended Net R-Multiple
                </p>
                <p className="text-4xl font-black text-gray-900 dark:text-white">
                  {blendedR >= 0 ? "+" : ""}
                  {blendedR.toFixed(2)}R
                </p>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Log this single R-Multiple in your journal to accurately
                  reflect your partial exits.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
