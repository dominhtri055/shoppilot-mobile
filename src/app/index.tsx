import { Redirect, type Href } from "expo-router";
import { useAuth } from "../contexts/AuthContext";

export default function IndexScreen() {
  const { session } = useAuth();

  return <Redirect href={(session ? "/dashboard" : "/login") as Href} />;
}
