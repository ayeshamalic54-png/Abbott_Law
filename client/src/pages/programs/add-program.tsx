import { useEffect } from "react";
import { useLocation } from "wouter";

export default function AddProgram() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/programs/manage");
  }, [setLocation]);

  return null;
}
