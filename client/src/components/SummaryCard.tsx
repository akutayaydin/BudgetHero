import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Feather from "react-native-vector-icons/Feather";

export type SummaryCardProps = {
  title: string;
  value: string;
  change: number; // percentage change
};

export default function SummaryCard({
  title,
  value,
  change,
}: SummaryCardProps) {
  const positive = change >= 0;
  const icon = positive ? "arrow-up-right" : "arrow-down-right";
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      <View style={styles.changeRow}>
        <Feather
          name={icon}
          size={16}
          color={positive ? "green" : "red"}
          style={styles.changeIcon}
        />
        <Text style={[styles.change, { color: positive ? "green" : "red" }]}>
          {positive ? "↑" : "↓"}
          {Math.abs(change)}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 100,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    margin: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  changeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  changeIcon: {
    marginRight: 4,
  },
  change: {
    fontSize: 14,
    fontWeight: "600",
  },
});
