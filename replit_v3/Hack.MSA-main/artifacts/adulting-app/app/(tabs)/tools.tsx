import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

type ToolTab = "budget" | "lease" | "tax";

function BudgetBuilder() {
  const colors = useColors();
  const { budgetItems, updateBudgetItems } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const totalIncome = useMemo(
    () => budgetItems.filter((i) => i.type === "income").reduce((s, i) => s + i.amount, 0),
    [budgetItems]
  );
  const totalExpenses = useMemo(
    () => budgetItems.filter((i) => i.type === "expense").reduce((s, i) => s + i.amount, 0),
    [budgetItems]
  );
  const balance = totalIncome - totalExpenses;

  const startEdit = (id: string, amount: number) => {
    setEditingId(id);
    setEditValue(amount.toString());
  };

  const saveEdit = async (id: string) => {
    const num = parseFloat(editValue);
    if (!isNaN(num) && num >= 0) {
      const updated = budgetItems.map((i) => (i.id === id ? { ...i, amount: num } : i));
      await updateBudgetItems(updated);
    }
    setEditingId(null);
  };

  const categories = Array.from(new Set(budgetItems.map((i) => i.category)));

  return (
    <View>
      <View style={[styles.budgetSummary, { backgroundColor: balance >= 0 ? "#2ED573" : "#FF4757" }]}>
        <Text style={styles.budgetSummaryLabel}>{balance >= 0 ? "Monthly Surplus" : "Monthly Deficit"}</Text>
        <Text style={styles.budgetSummaryAmount}>
          {balance >= 0 ? "+" : ""}${Math.abs(balance).toFixed(0)}
        </Text>
        <View style={styles.budgetSubRow}>
          <View style={styles.budgetSubItem}>
            <Feather name="arrow-down-circle" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.budgetSubText}>Income: ${totalIncome}</Text>
          </View>
          <View style={styles.budgetSubItem}>
            <Feather name="arrow-up-circle" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.budgetSubText}>Expenses: ${totalExpenses}</Text>
          </View>
        </View>
      </View>

      {categories.map((cat) => (
        <View key={cat} style={styles.budgetCategory}>
          <Text style={[styles.categoryLabel, { color: colors.mutedForeground }]}>{cat}</Text>
          {budgetItems
            .filter((i) => i.category === cat)
            .map((item) => (
              <View
                key={item.id}
                style={[styles.budgetItem, { borderColor: colors.border, backgroundColor: colors.card }]}
              >
                <Text style={[styles.budgetItemLabel, { color: colors.foreground }]}>{item.label}</Text>
                {editingId === item.id ? (
                  <View style={styles.editRow}>
                    <Text style={[styles.dollarSign, { color: colors.foreground }]}>$</Text>
                    <TextInput
                      value={editValue}
                      onChangeText={setEditValue}
                      keyboardType="numeric"
                      autoFocus
                      onBlur={() => saveEdit(item.id)}
                      onSubmitEditing={() => saveEdit(item.id)}
                      style={[styles.editInput, { color: colors.foreground, borderColor: colors.primary }]}
                    />
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => startEdit(item.id, item.amount)} style={styles.amountTouch}>
                    <Text
                      style={[
                        styles.budgetItemAmount,
                        { color: item.type === "income" ? "#2ED573" : colors.primary },
                      ]}
                    >
                      ${item.amount}
                    </Text>
                    <Feather name="edit-2" size={12} color={colors.mutedForeground} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
        </View>
      ))}
      <Text style={[styles.budgetNote, { color: colors.mutedForeground }]}>
        Tap any amount to edit it
      </Text>
    </View>
  );
}

function LeaseChecklist() {
  const colors = useColors();
  const { leaseChecklist, toggleLeaseItem } = useApp();

  const categories = Array.from(new Set(leaseChecklist.map((i) => i.category)));
  const completedCount = leaseChecklist.filter((i) => i.checked).length;
  const total = leaseChecklist.length;

  return (
    <View>
      <View style={[styles.checklistHeader, { backgroundColor: "#A29BFE" }]}>
        <Text style={styles.checklistHeaderTitle}>Lease Checklist</Text>
        <Text style={styles.checklistHeaderSub}>
          {completedCount}/{total} items completed
        </Text>
        <View style={styles.checklistProgress}>
          <View
            style={[
              styles.checklistProgressBar,
              { width: `${(completedCount / total) * 100}%`, backgroundColor: "#fff" },
            ]}
          />
        </View>
      </View>
      {categories.map((cat) => (
        <View key={cat} style={styles.checklistSection}>
          <Text style={[styles.categoryLabel, { color: colors.mutedForeground }]}>{cat}</Text>
          {leaseChecklist
            .filter((i) => i.category === cat)
            .map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  toggleLeaseItem(item.id);
                }}
                style={[
                  styles.checklistItem,
                  {
                    backgroundColor: item.checked ? "#A29BFE18" : colors.card,
                    borderColor: item.checked ? "#A29BFE40" : colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: item.checked ? "#A29BFE" : colors.background,
                      borderColor: item.checked ? "#A29BFE" : colors.border,
                    },
                  ]}
                >
                  {item.checked && <Feather name="check" size={12} color="#fff" />}
                </View>
                <Text
                  style={[
                    styles.checklistItemText,
                    {
                      color: item.checked ? colors.mutedForeground : colors.foreground,
                      textDecorationLine: item.checked ? "line-through" : "none",
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
        </View>
      ))}
    </View>
  );
}

function TaxDocTracker() {
  const colors = useColors();
  const { taxDocuments, toggleTaxDocument } = useApp();

  const received = taxDocuments.filter((d) => d.received).length;
  const total = taxDocuments.length;

  return (
    <View>
      <View style={[styles.checklistHeader, { backgroundColor: "#4ECDC4" }]}>
        <Text style={styles.checklistHeaderTitle}>Tax Doc Tracker</Text>
        <Text style={styles.checklistHeaderSub}>
          {received}/{total} documents collected
        </Text>
        <View style={styles.checklistProgress}>
          <View
            style={[
              styles.checklistProgressBar,
              { width: `${(received / total) * 100}%`, backgroundColor: "#fff" },
            ]}
          />
        </View>
      </View>
      {taxDocuments.map((doc) => (
        <TouchableOpacity
          key={doc.id}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleTaxDocument(doc.id);
          }}
          style={[
            styles.taxDocItem,
            {
              backgroundColor: doc.received ? "#4ECDC418" : colors.card,
              borderColor: doc.received ? "#4ECDC440" : colors.border,
            },
          ]}
        >
          <View style={styles.taxDocLeft}>
            <View
              style={[
                styles.checkbox,
                {
                  backgroundColor: doc.received ? "#4ECDC4" : colors.background,
                  borderColor: doc.received ? "#4ECDC4" : colors.border,
                },
              ]}
            >
              {doc.received && <Feather name="check" size={12} color="#fff" />}
            </View>
            <View style={styles.taxDocInfo}>
              <Text
                style={[
                  styles.taxDocName,
                  {
                    color: doc.received ? colors.mutedForeground : colors.foreground,
                    textDecorationLine: doc.received ? "line-through" : "none",
                  },
                ]}
              >
                {doc.name}
              </Text>
              <Text style={[styles.taxDocDesc, { color: colors.mutedForeground }]}>
                {doc.description}
              </Text>
            </View>
          </View>
          {doc.dueDate && (
            <View style={[styles.dueDateBadge, { backgroundColor: doc.received ? "#4ECDC430" : colors.muted }]}>
              <Text style={[styles.dueDateText, { color: doc.received ? "#4ECDC4" : colors.mutedForeground }]}>
                {doc.dueDate}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function ToolsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<ToolTab>("budget");

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const tabs: { key: ToolTab; label: string; icon: string; color: string }[] = [
    { key: "budget", label: "Budget", icon: "sliders", color: "#FF6B6B" },
    { key: "lease", label: "Lease", icon: "home", color: "#A29BFE" },
    { key: "tax", label: "Tax Docs", icon: "file-text", color: "#4ECDC4" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 16, backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Practical Tools</Text>
        <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
          Use these right now — no lesson required
        </Text>
        <View style={[styles.tabBar, { backgroundColor: colors.muted }]}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => {
                setActiveTab(tab.key);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={[
                styles.tab,
                activeTab === tab.key && { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
              ]}
            >
              <Feather
                name={tab.icon as any}
                size={16}
                color={activeTab === tab.key ? tab.color : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: activeTab === tab.key ? colors.foreground : colors.mutedForeground },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: bottomInset + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "budget" && <BudgetBuilder />}
        {activeTab === "lease" && <LeaseChecklist />}
        {activeTab === "tax" && <TaxDocTracker />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    gap: 2,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 5,
  },
  tabLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  budgetSummary: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  budgetSummaryLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.85)",
    marginBottom: 4,
  },
  budgetSummaryAmount: {
    fontSize: 36,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#fff",
    marginBottom: 12,
  },
  budgetSubRow: {
    flexDirection: "row",
    gap: 16,
  },
  budgetSubItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  budgetSubText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.9)",
  },
  budgetCategory: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  budgetItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 6,
  },
  budgetItemLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  amountTouch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  budgetItemAmount: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  dollarSign: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  editInput: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    borderBottomWidth: 2,
    minWidth: 60,
    textAlign: "right",
    paddingBottom: 2,
  },
  budgetNote: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  checklistHeader: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  checklistHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#fff",
    marginBottom: 4,
  },
  checklistHeaderSub: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.85)",
    marginBottom: 12,
  },
  checklistProgress: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 3,
    overflow: "hidden",
  },
  checklistProgressBar: {
    height: 6,
    borderRadius: 3,
  },
  checklistSection: {
    marginBottom: 16,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 6,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checklistItemText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
  },
  taxDocItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  taxDocLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  taxDocInfo: {
    flex: 1,
  },
  taxDocName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  taxDocDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  dueDateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 8,
  },
  dueDateText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
});
