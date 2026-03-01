import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: { colors: { background:"#F7F8FA",surface:"#FFFFFF",text:"#101828",muted:"#667085",border:"#EAECF0",primary:{DEFAULT:"#344054","hover":"#1D2939"},success:"#027A48",warning:"#B54708",danger:"#B42318" }, fontFamily: { sans:["Inter","system-ui","sans-serif"] } } },
  plugins: [],
};
export default config;