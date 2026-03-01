"use client";
import { useEffect } from "react";
export default function Home() { useEffect(() => { window.location.href = localStorage.getItem("token") ? "/dashboard" : "/login"; }, []); return null; }
