import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import {
  VictoryChart,
  VictoryLine,
  VictoryArea,
  VictoryAxis,
} from "victory-native";
import Feather from "react-native-vector-icons/Feather";
import SummaryCard from "./SummaryCard";

const timeRanges = ["1M", "3M", "6M", "1Y"] as const;
type TimeRange = (typeof timeRanges)[number];

const currentPeriod = [
  { x: new Date(2024, 0, 1), y: 2000 },
  { x: new Date(2024, 0, 15), y: 2500 },
  { x: new Date(2024, 0, 30), y: 3000 },
  { x: new Date(2024, 1, 14), y: 3500 },
];

const previousPeriod = [
  { x: new Date(2023, 11, 1), y: 1500 },
  { x: new Date(2023, 11, 15), y: 1700 },
  { x: new Date(2023, 11, 30), y: 1800 },
  { x: new Date(2024, 0, 14), y: 1900 },
];

const faqs = [
  {
    q: "What is net worth?",
    a: "Net worth is the value of your assets minus your liabilities.",
  },
  {
    q: "How is the chart calculated?",
    a: "The chart compares your current period to the previous period.",
  },
];

export default function OverviewDashboard() {
  const { width } = useWindowDimensions();
  const [range, setRange] = useState<TimeRange>("1M");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#ff5f6d", "#ffc371"]} style={styles.header}>
        <Text style={styles.headerTitle}>Net Worth</Text>
        <Text style={styles.netWorth}>$12.5k</Text>
        <View style={styles.rangeRow}>
          {timeRanges.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setRange(t)}
              style={[styles.rangeBtn, range === t && styles.rangeBtnActive]}
            >
              <Text
                style={[
                  styles.rangeText,
                  range === t && styles.rangeTextActive,
                ]}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        <VictoryChart
          width={width - 32}
          height={200}
          padding={{ top: 20, left: 40, right: 20, bottom: 40 }}
        >
          <VictoryAxis
            tickFormat={(t) => `${t.getMonth() + 1}/${t.getDate()}`}
            style={{ tickLabels: { fontSize: 10, angle: -40 } }}
          />
          <VictoryArea
            data={previousPeriod}
            style={{ data: { fill: "rgba(255,99,132,0.2)" } }}
          />
          <VictoryLine
            data={currentPeriod}
            style={{ data: { stroke: "#ff5f6d", strokeWidth: 2 } }}
          />
        </VictoryChart>
        <View style={styles.cardsRow}>
          <SummaryCard title="Assets" value="$5.83k" change={127} />
          <SummaryCard title="Debt" value="$1.20k" change={4} />
          <SummaryCard title="Net Worth" value="$4.63k" change={187} />
        </View>
        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
          {faqs.map((item, idx) => (
            <View key={idx} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.faqHeader}
                onPress={() => toggleFaq(idx)}
              >
                <Text style={styles.faqQuestion}>{item.q}</Text>
                <Feather
                  name={openFaq === idx ? "chevron-up" : "chevron-down"}
                  size={16}
                />
              </TouchableOpacity>
              {openFaq === idx && (
                <Text style={styles.faqAnswer}>{item.a}</Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.bottomNav}>
        <NavItem icon="home" label="Dashboard" />
        <NavItem icon="repeat" label="Recurring" />
        <NavItem icon="pie-chart" label="Spending" />
        <NavItem icon="list" label="Transactions" />
        <NavItem icon="more-horizontal" label="More" />
      </View>
    </View>
  );
}

function NavItem({ icon, label }: { icon: string; label: string }) {
  return (
    <TouchableOpacity style={styles.navItem}>
      <Feather name={icon} size={20} color="#444" />
      <Text style={styles.navLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  netWorth: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    marginVertical: 8,
  },
  rangeRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  rangeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  rangeBtnActive: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  rangeText: {
    color: "#fff",
    fontSize: 12,
  },
  rangeTextActive: {
    fontWeight: "700",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  cardsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 16,
  },
  faqSection: {
    marginTop: 16,
  },
  faqTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  faqItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: "500",
  },
  faqAnswer: {
    marginTop: 8,
    fontSize: 13,
    color: "#555",
  },
  bottomNav: {
    ...Platform.select({
      web: { position: "fixed" },
      default: { position: "absolute" },
    }),
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
  },
  navItem: {
    alignItems: "center",
  },
  navLabel: {
    fontSize: 12,
    marginTop: 2,
    color: "#444",
  },
});
