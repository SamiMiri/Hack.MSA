import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Sliders, Home, FileText, Edit2, Check, AlertCircle } from "lucide-react";

type ToolTab = "budget" | "lease" | "tax";

function BudgetBuilder() {
  const { budgetItems, updateBudgetItems } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const totalIncome = budgetItems.filter((i) => i.type === "income").reduce((s, i) => s + i.amount, 0);
  const totalExpenses = budgetItems.filter((i) => i.type === "expense").reduce((s, i) => s + i.amount, 0);
  const balance = totalIncome - totalExpenses;

  const categories = Array.from(new Set(budgetItems.map((i) => i.category)));

  const saveEdit = (id: string) => {
    const num = parseFloat(editValue);
    if (!isNaN(num) && num >= 0) {
      updateBudgetItems(budgetItems.map((i) => i.id === id ? { ...i, amount: num } : i));
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl p-5 ${balance >= 0 ? "bg-green-500" : "bg-red-500"}`}>
        <div className="text-sm text-white/85 font-medium mb-1">{balance >= 0 ? "Monthly Surplus" : "Monthly Deficit"}</div>
        <div className="text-4xl font-extrabold text-white mb-3">{balance >= 0 ? "+" : ""}${Math.abs(balance).toFixed(0)}</div>
        <div className="flex items-center gap-4 text-sm text-white/90">
          <span>↓ Income: ${totalIncome}</span>
          <span>↑ Expenses: ${totalExpenses}</span>
        </div>
      </div>

      {categories.map((cat) => (
        <div key={cat}>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">{cat}</p>
          <div className="space-y-1.5">
            {budgetItems.filter((i) => i.category === cat).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3.5 rounded-xl border bg-card">
                <span className="text-sm font-medium text-foreground flex-1">{item.label}</span>
                {editingId === item.id ? (
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-foreground">$</span>
                    <input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => saveEdit(item.id)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit(item.id)}
                      autoFocus
                      className="w-20 text-right text-sm font-bold border-b-2 border-primary bg-transparent outline-none text-foreground"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingId(item.id); setEditValue(item.amount.toString()); }}
                    className="flex items-center gap-1.5"
                  >
                    <span className="text-sm font-bold" style={{ color: item.type === "income" ? "#10B981" : "var(--primary)" }}>
                      ${item.amount}
                    </span>
                    <Edit2 size={12} className="text-muted-foreground" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground text-center">Tap any amount to edit it</p>
    </div>
  );
}

function LeaseChecklist() {
  const { leaseChecklist, toggleLeaseItem } = useApp();
  const categories = Array.from(new Set(leaseChecklist.map((i) => i.category)));
  const completedCount = leaseChecklist.filter((i) => i.checked).length;
  const total = leaseChecklist.length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5 bg-[#A29BFE]">
        <div className="text-lg font-bold text-white mb-1">Lease Checklist</div>
        <div className="text-sm text-white/85 mb-3">{completedCount}/{total} items completed</div>
        <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full" style={{ width: `${(completedCount / total) * 100}%` }} />
        </div>
      </div>

      {categories.map((cat) => (
        <div key={cat}>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">{cat}</p>
          <div className="space-y-1.5">
            {leaseChecklist.filter((i) => i.category === cat).map((item) => (
              <button
                key={item.id}
                onClick={() => toggleLeaseItem(item.id)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all ${item.checked ? "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900" : "bg-card border-border"}`}
              >
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${item.checked ? "bg-[#A29BFE] border-[#A29BFE]" : "border-border bg-background"}`}>
                  {item.checked && <Check size={13} className="text-white" />}
                </div>
                <span className={`text-sm font-medium text-left ${item.checked ? "line-through text-muted-foreground" : "text-foreground"}`}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TaxDocTracker() {
  const { taxDocuments, toggleTaxDocument } = useApp();
  const received = taxDocuments.filter((d) => d.received).length;
  const total = taxDocuments.length;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl p-5 bg-[#4ECDC4]">
        <div className="text-lg font-bold text-white mb-1">Tax Doc Tracker</div>
        <div className="text-sm text-white/85 mb-3">{received}/{total} documents collected</div>
        <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full" style={{ width: `${(received / total) * 100}%` }} />
        </div>
      </div>

      {taxDocuments.map((doc) => (
        <button
          key={doc.id}
          onClick={() => toggleTaxDocument(doc.id)}
          className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${doc.received ? "bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900" : "bg-card border-border"}`}
        >
          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${doc.received ? "bg-[#4ECDC4] border-[#4ECDC4]" : "border-border bg-background"}`}>
            {doc.received && <Check size={13} className="text-white" />}
          </div>
          <div className="flex-1 text-left">
            <div className={`text-sm font-semibold ${doc.received ? "line-through text-muted-foreground" : "text-foreground"}`}>{doc.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{doc.description}</div>
          </div>
          {doc.dueDate && (
            <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${doc.received ? "bg-teal-100 dark:bg-teal-900/30 text-teal-600" : "bg-muted text-muted-foreground"}`}>
              {doc.dueDate}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState<ToolTab>("budget");

  const tabs: { key: ToolTab; label: string; Icon: typeof Sliders; color: string }[] = [
    { key: "budget", label: "Budget", Icon: Sliders, color: "#FF6B6B" },
    { key: "lease", label: "Lease", Icon: Home, color: "#A29BFE" },
    { key: "tax", label: "Tax Docs", Icon: FileText, color: "#4ECDC4" },
  ];

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-8 pb-3 flex-shrink-0">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-1">Practical Tools</h1>
        <p className="text-sm text-muted-foreground mb-4">Use these right now — no lesson required</p>

        {/* Tab switcher */}
        <div className="flex bg-muted rounded-xl p-1 gap-1">
          {tabs.map(({ key, label, Icon, color }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${activeTab === key ? "bg-white dark:bg-card shadow text-foreground" : "text-muted-foreground"}`}
            >
              <Icon size={14} style={{ color: activeTab === key ? color : undefined }} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-24 pt-4">
        {activeTab === "budget" && <BudgetBuilder />}
        {activeTab === "lease" && <LeaseChecklist />}
        {activeTab === "tax" && <TaxDocTracker />}
      </div>
    </div>
  );
}
