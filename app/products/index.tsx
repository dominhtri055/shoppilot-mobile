import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { getProducts } from "../../src/api/merchantApi";
import { Card } from "../../src/components/Card";
import { EmptyState } from "../../src/components/EmptyState";
import { StatusPill } from "../../src/components/StatusPill";
import { colors, spacing } from "../../src/constants/theme";
import { Product, ProductStatus } from "../../src/types/commerce";
import { formatCurrency } from "../../src/utils/formatCurrency";
import { isLowStock } from "../../src/utils/inventory";

type Filter = "all" | ProductStatus | "low-stock";
