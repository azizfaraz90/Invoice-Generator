import { useState, useEffect } from "react";

const CURRENCIES = [
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
];

const DEFAULT_PROFILE = {
  name: "", title: "", address: "", phone: "", email: "",
};

const DEFAULT_PAYMENTS = {
  GBP: { method: "FPS (Faster Payments)", holder: "", accountNumber: "", sortCode: "", swift: "", bankName: "", bankAddress: "" },
  USD: { method: "Bank Wire / ACH", holder: "", accountType: "", accountNumber: "", routingNumber: "", swift: "", bankName: "", bankAddress: "" },
  EUR: { method: "SEPA Transfer", holder: "", iban: "", swift: "", bankName: "", bankAddress: "" },
  BDT: { method: "bKash / Nagad / Bank", bkash: "", nagad: "", accountNumber: "", bankName: "" },
  CAD: { method: "e-Transfer / Wire", email: "", accountNumber: "", bankName: "" },
  AUD: { method: "Bank Transfer", bsb: "", accountNumber: "", holder: "" },
  INR: { method: "UPI / NEFT", upi: "", accountNumber: "", ifsc: "", bankName: "" },
};

const US_ACCOUNT_TYPES = ["Checking", "Savings", "Money Market", "Business Checking", "Business Savings"];

const CRYPTO_CURRENCIES = [
  { code: "BTC", name: "Bitcoin" }, { code: "ETH", name: "Ethereum" },
  { code: "USDT", name: "Tether (USDT)" }, { code: "USDC", name: "USD Coin" },
  { code: "BNB", name: "BNB" }, { code: "SOL", name: "Solana" },
  { code: "XRP", name: "Ripple" }, { code: "LTC", name: "Litecoin" },
  { code: "Other", name: "Other" },
];

const CRYPTO_NETWORKS = {
  BTC: ["Bitcoin (BTC)"],
  ETH: ["Ethereum (ERC-20)", "Arbitrum", "Optimism", "Base"],
  USDT: ["Ethereum (ERC-20)", "Tron (TRC-20)", "BNB Smart Chain (BEP-20)", "Solana", "Polygon"],
  USDC: ["Ethereum (ERC-20)", "Solana", "Polygon", "Arbitrum", "Base"],
  BNB: ["BNB Smart Chain (BEP-20)", "BNB Beacon Chain (BEP-2)"],
  SOL: ["Solana"], XRP: ["XRP Ledger"], LTC: ["Litecoin (LTC)"], Other: ["Other"],
};

const CURRENCY_FIELDS = {
  GBP: [["Method","method"],["Account Holder","holder"],["Account Number","accountNumber"],["Sort Code","sortCode"],["Swift Code","swift"],["Bank Name","bankName"],["Bank Address","bankAddress"]],
  USD: [["Method","method"],["Account Holder","holder"],["Account Type","accountType"],["Account Number","accountNumber"],["Routing Number","routingNumber"],["Swift Code","swift"],["Bank Name","bankName"],["Bank Address","bankAddress"]],
  EUR: [["Method","method"],["Account Holder","holder"],["IBAN","iban"],["Swift Code","swift"],["Bank Name","bankName"],["Bank Address","bankAddress"]],
  BDT: [["Method","method"],["bKash","bkash"],["Nagad","nagad"],["Account Number","accountNumber"],["Bank Name","bankName"]],
  CAD: [["Method","method"],["e-Transfer Email","email"],["Account Number","accountNumber"],["Bank Name","bankName"]],
  AUD: [["Method","method"],["Account Holder","holder"],["BSB","bsb"],["Account Number","accountNumber"]],
  INR: [["Method","method"],["UPI ID","upi"],["Account Number","accountNumber"],["IFSC","ifsc"],["Bank Name","bankName"]],
};

const emptyItem = () => ({ id: Date.now() + Math.random(), project: "", desc: "", hours: "", rate: "", amount: "" });
const emptyClient = () => ({ id: Date.now(), name: "", address: "", phone: "", email: "", currency: "GBP" });
const fmtAmt = (val, sym) => { const n = parseFloat(val) || 0; return sym + (n % 1 === 0 ? String(n) : n.toFixed(2)); };
const todayStr = () => new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const TABS = ["Profile & Payment", "Clients", "New Invoice", "History"];

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

export default function App() {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState(2);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [payments, setPayments] = useState(DEFAULT_PAYMENTS);
  const [cryptoChannels, setCryptoChannels] = useState([]);
  const [showAddCrypto, setShowAddCrypto] = useState(false);
  const [draftCrypto, setDraftCrypto] = useState({ coin: "BTC", network: "Bitcoin (BTC)", address: "", label: "" });
  const [profileSaved, setProfileSaved] = useState(false);
  const [clients, setClients] = useState([]);
  const [editingClient, setEditingClient] = useState(null);
  const [draftClient, setDraftClient] = useState(emptyClient());
  const [inv, setInv] = useState({
    number: "01", date: todayStr(), currency: "GBP", clientId: null,
    client: { name: "", address: "", phone: "", email: "" },
    items: [emptyItem()], deductions: "0", notes: "",
  });
  const [history, setHistory] = useState([]);
  const [preview, setPreview] = useState(null);
  const [activeCur, setActiveCur] = useState("GBP");

  useEffect(() => {
    try { const p = localStorage.getItem("fbi3_profile"); if (p) setProfile(JSON.parse(p)); } catch {}
    try { const py = localStorage.getItem("fbi3_payments"); if (py) setPayments(JSON.parse(py)); } catch {}
    try { const cr = localStorage.getItem("fbi3_crypto"); if (cr) setCryptoChannels(JSON.parse(cr)); } catch {}
    try { const cl = localStorage.getItem("fbi3_clients"); if (cl) setClients(JSON.parse(cl)); } catch {}
    try { const h = localStorage.getItem("fbi3_history"); if (h) setHistory(JSON.parse(h)); } catch {}
    try { const n = localStorage.getItem("fbi3_inv_num"); if (n) setInv(p => ({ ...p, number: n })); } catch {}
  }, []);

  const saveProfile = () => {
    localStorage.setItem("fbi3_profile", JSON.stringify(profile));
    localStorage.setItem("fbi3_payments", JSON.stringify(payments));
    localStorage.setItem("fbi3_crypto", JSON.stringify(cryptoChannels));
    setProfileSaved(true); setTimeout(() => setProfileSaved(false), 2000);
  };

  const saveClients = (list) => { setClients(list); localStorage.setItem("fbi3_clients", JSON.stringify(list)); };
  const startNewClient = () => { setDraftClient(emptyClient()); setEditingClient("new"); };
  const startEditClient = (c) => { setDraftClient({ ...c }); setEditingClient(c.id); };

  const commitClient = () => {
    if (!draftClient.name.trim()) return;
    const updated = editingClient === "new"
      ? [...clients, { ...draftClient, id: Date.now() }]
      : clients.map(c => c.id === editingClient ? { ...draftClient } : c);
    saveClients(updated); setEditingClient(null);
  };

  const deleteClient = (id) => { saveClients(clients.filter(c => c.id !== id)); };

  const getClientPaymentInfo = (c) => {
    if (!c.currency) return null;
    const fields = CURRENCY_FIELDS[c.currency] || [];
    const info = { method: "" };
    fields.forEach(([, k]) => { info[k] = c["pay_" + k] || ""; });
    return info;
  };

  const applyClient = (c) => {
    const pi = getClientPaymentInfo(c);
    setInv(p => ({ ...p, clientId: c.id, client: { name: c.name, address: c.address, phone: c.phone, email: c.email }, ...(c.currency ? { currency: c.currency } : {}) }));
    if (pi && c.currency) setPayments(p => ({ ...p, [c.currency]: { ...p[c.currency], ...pi } }));
  };

  const selectClientForInvoice = (c) => { applyClient(c); setTab(2); };

  const cur = CURRENCIES.find(c => c.code === inv.currency) || CURRENCIES[0];
  const subtotal = inv.items.reduce((s, it) => {
    if (it.amount !== "" && it.amount !== undefined) return s + (parseFloat(it.amount) || 0);
    return s + (parseFloat(it.hours) || 0) * (parseFloat(it.rate) || 0);
  }, 0);
  const deductions = parseFloat(inv.deductions) || 0;
  const grandTotal = subtotal - deductions;

  const addItem = () => setInv(p => ({ ...p, items: [...p.items, emptyItem()] }));
  const removeItem = (id) => setInv(p => ({ ...p, items: p.items.filter(i => i.id !== id) }));
  const updateItem = (id, f, v) => setInv(p => ({ ...p, items: p.items.map(i => i.id === id ? { ...i, [f]: v } : i) }));
  const nextNum = (n) => { const m = n.match(/^(0*)(\d+)$/); if (!m) return n; const nx = parseInt(m[2]) + 1; return m[1].slice(0, Math.max(0, (m[1].length + m[2].length) - String(nx).length)) + nx; };

  const saveInvoice = () => {
    const record = { ...inv, subtotal, deductions, grandTotal, profile: { ...profile }, paymentInfo: payments[inv.currency] };
    const newHistory = [record, ...history].slice(0, 50);
    setHistory(newHistory);
    localStorage.setItem("fbi3_history", JSON.stringify(newHistory));
    const next = nextNum(inv.number);
    localStorage.setItem("fbi3_inv_num", next);
    setInv(p => ({ ...p, number: next, clientId: null, client: { name: "", address: "", phone: "", email: "" }, items: [emptyItem()], deductions: "0", notes: "" }));
    setTab(3);
  };

  const downloadPdf = () => {
    const el = document.getElementById("print-area-fbi3");
    const style = "*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,sans-serif;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}@page{size:A4 portrait;margin:12mm;}";
    const html = "<!DOCTYPE html><html><head><meta charset='utf-8'><style>" + style + "</style></head><body>" + el.innerHTML + "</body></html>";
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    win.addEventListener("load", () => { win.print(); URL.revokeObjectURL(url); });
  };

  const inp = { padding: "6px 10px", border: "1px solid #ccc", borderRadius: 5, fontSize: 13, width: "100%", boxSizing: "border-box", background: "var(--color-background-primary)", color: "var(--color-text-primary)" };
  const lbl = { fontSize: 11, color: "var(--color-text-secondary)", display: "block", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.04em" };
  const btn = { padding: "8px 18px", border: "1.5px solid #111", borderRadius: 7, cursor: "pointer", fontSize: 13, background: "#111", color: "#fff", fontWeight: 500 };
  const btnOutline = { padding: "8px 18px", border: "1.5px solid #111", borderRadius: 7, cursor: "pointer", fontSize: 13, background: "transparent", color: "var(--color-text-primary)", fontWeight: 500 };
  const card = { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, padding: "14px 18px" };
  const col2 = { display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 };

  const renderPayField = (k, val, onChange) => {
    if (k === "bankAddress") return <textarea style={{ ...inp, height: 50, resize: "vertical" }} value={val} onChange={onChange} />;
    if (k === "accountType") return (
      <select style={inp} value={val} onChange={onChange}>
        <option value="">— select —</option>
        {US_ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
    );
    return <input style={inp} value={val} onChange={onChange} />;
  };

  const InvoiceDoc = ({ r }) => {
    const c = CURRENCIES.find(x => x.code === r.currency) || CURRENCIES[0];
    const pi = r.paymentInfo || {};
    const sub = r.items ? r.items.reduce((s, it) => {
      if (it.amount !== "" && it.amount !== undefined) return s + (parseFloat(it.amount) || 0);
      return s + (parseFloat(it.hours) || 0) * (parseFloat(it.rate) || 0);
    }, 0) : r.subtotal;
    const ded = parseFloat(r.deductions) || 0;
    const grand = sub - ded;
    const payRows = [];
    if (pi.holder) payRows.push(["Account Holder", pi.holder]);
    if (pi.accountType) payRows.push(["Account Type", pi.accountType]);
    if (pi.accountNumber) payRows.push(["Account Number", pi.accountNumber]);
    if (pi.sortCode) payRows.push(["Sort Code", pi.sortCode]);
    if (pi.routingNumber) payRows.push(["Routing Number", pi.routingNumber]);
    if (pi.swift) payRows.push(["Swift Code", pi.swift]);
    if (pi.iban) payRows.push(["IBAN", pi.iban]);
    if (pi.bsb) payRows.push(["BSB", pi.bsb]);
    if (pi.bankName) payRows.push(["Bank Name", pi.bankName]);
    if (pi.bankAddress) payRows.push(["Bank Address", pi.bankAddress]);
    if (pi.bkash) payRows.push(["bKash", pi.bkash]);
    if (pi.nagad) payRows.push(["Nagad", pi.nagad]);
    if (pi.upi) payRows.push(["UPI ID", pi.upi]);
    if (pi.ifsc) payRows.push(["IFSC", pi.ifsc]);

    return (
      <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 13, color: "#111", background: "#fff", width: 794, padding: "40px 48px", boxSizing: "border-box" }}>
        <p style={{ fontSize: 32, fontWeight: 700, margin: "0 0 2px" }}>{r.profile?.name}</p>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", color: "#555", margin: "0 0 24px", textTransform: "uppercase" }}>{r.profile?.title}</p>
        <div style={{ background: "#e8e8e8", padding: "14px 18px", marginBottom: 24, fontSize: 12, lineHeight: 1.7 }}>
          <div>{r.profile?.address}</div>
          <div><strong>Phone :</strong> {r.profile?.phone} &nbsp;|&nbsp; <strong>Email :</strong> {r.profile?.email}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: "0.06em", marginBottom: 10 }}>BILL TO :</div>
            {[["NAME", r.client?.name || ""], ["ADDRESS", r.client?.address || ""], ["PHONE", r.client?.phone || ""], ["EMAIL", r.client?.email || ""]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", marginBottom: 5, fontSize: 12 }}>
                <span style={{ fontWeight: 700, minWidth: 90 }}>{k}</span>
                <span style={{ margin: "0 10px 0 4px" }}>:</span>
                <span style={{ color: k === "EMAIL" ? "#2563eb" : "#111", whiteSpace: "pre-line", flex: 1 }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "right", fontSize: 13, lineHeight: 1.8 }}>
            <div style={{ fontWeight: 700 }}>No. {r.number}</div>
            <div>{r.date}</div>
          </div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
          <thead>
            <tr style={{ borderTop: "2px solid #111", borderBottom: "1.5px solid #111" }}>
              {[["PROJECT","left","18%",0],["DESCRIPTION","left","36%",12],["HOURS","right","10%",0],["RATE","right","10%",0],["AMOUNT","right","16%",0]].map(([h,a,w,pl]) => (
                <th key={h} style={{ padding: "7px 0", fontWeight: 700, fontSize: 11, letterSpacing: "0.06em", textAlign: a, width: w, paddingLeft: pl }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {r.items && r.items.map((it, i) => {
              const amt = (it.amount !== "" && it.amount !== undefined) ? parseFloat(it.amount) || 0 : (parseFloat(it.hours) || 0) * (parseFloat(it.rate) || 0);
              return (
                <tr key={i}>
                  <td style={{ padding: "8px 0", fontSize: 12, borderBottom: "0.5px solid #ddd", verticalAlign: "top" }}>{it.project}</td>
                  <td style={{ padding: "8px 0 8px 12px", fontSize: 12, borderBottom: "0.5px solid #ddd", verticalAlign: "top" }}>{it.desc}</td>
                  <td style={{ padding: "8px 0", fontSize: 12, borderBottom: "0.5px solid #ddd", textAlign: "right" }}>{it.hours || ""}</td>
                  <td style={{ padding: "8px 0", fontSize: 12, borderBottom: "0.5px solid #ddd", textAlign: "right" }}>{it.rate ? fmtAmt(it.rate, c.symbol) : ""}</td>
                  <td style={{ padding: "8px 0", fontSize: 12, borderBottom: "0.5px solid #ddd", textAlign: "right" }}>{fmtAmt(amt, c.symbol)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
          <div style={{ minWidth: 260 }}>
            <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: "0.06em", borderBottom: "1.5px solid #111", paddingBottom: 5 }}>INVOICE TOTAL</div>
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              {[["SUB-TOTAL", fmtAmt(sub, c.symbol), false], ["DEDUCTIONS", ded > 0 ? "-" + fmtAmt(ded, c.symbol) : "$0.00", false], ["GRAND TOTAL", fmtAmt(grand, c.symbol), true]].map(([k, v, last]) => (
                <tr key={k}>
                  <td style={{ fontWeight: 700, fontSize: 12, letterSpacing: "0.06em", paddingRight: 32, paddingTop: last ? 6 : 4, paddingBottom: 2, borderTop: last ? "1.5px solid #111" : "0.5px solid #ccc" }}>{k}</td>
                  <td style={{ fontWeight: 700, fontSize: 12, textAlign: "right", paddingTop: last ? 6 : 4, borderTop: last ? "1.5px solid #111" : "0.5px solid #ccc" }}>{v}</td>
                </tr>
              ))}
            </table>
          </div>
        </div>
        {pi.method && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>PAYMENT METHOD: {pi.method}</div>
            {payRows.map(([k, v]) => (
              <div key={k} style={{ display: "flex", marginBottom: 5, fontSize: 12 }}>
                <span style={{ fontWeight: 700, minWidth: 140 }}>{k}:</span>
                <span style={{ color: "#333", whiteSpace: "pre-line" }}>{v}</span>
              </div>
            ))}
          </div>
        )}
        {r.notes && <div style={{ fontSize: 12, color: "#555", borderTop: "0.5px solid #ddd", paddingTop: 10 }}><strong>Notes:</strong> {r.notes}</div>}
      </div>
    );
  };

  return (
    <div style={{ background: "#F8F8F8", minHeight: "100vh", padding: isMobile ? "12px 8px" : "24px 16px" }}>
      <div style={{ maxWidth: 740, margin: "0 auto", background: "#fff", border: "1px solid #EAEAEA", borderRadius: 8, padding: isMobile ? "16px 14px" : "24px 28px" }}>
        <h2 style={{ fontSize: 0, margin: 0 }}>Invoice Generator</h2>

        {/* TABS */}
        <div style={{ display: "flex", marginBottom: 20, borderBottom: "1px solid #e0e0e0", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => { setTab(i); if (i === 1) setEditingClient(null); }} style={{ border: "none", background: "none", borderBottom: tab === i ? "2px solid #6c47ff" : "2px solid transparent", padding: isMobile ? "10px 12px" : "10px 18px", fontWeight: tab === i ? 600 : 400, cursor: "pointer", fontSize: isMobile ? 12 : 13, color: tab === i ? "#6c47ff" : "var(--color-text-secondary)", borderRadius: 0, marginBottom: -1, whiteSpace: "nowrap", flexShrink: 0 }}>{t}</button>
          ))}
        </div>

        {/* PROFILE TAB */}
        {tab === 0 && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={card}>
              <div style={{ fontWeight: 500, marginBottom: 14 }}>Your profile</div>
              <div style={col2}>
                {[["Full Name","name"],["Title / Role","title"],["Phone","phone"],["Email","email"]].map(([l, k]) => (
                  <div key={k}><label style={lbl}>{l}</label><input style={inp} value={profile[k] || ""} onChange={e => setProfile(p => ({ ...p, [k]: e.target.value }))} /></div>
                ))}
                <div style={{ gridColumn: "1/-1" }}><label style={lbl}>Address</label><textarea style={{ ...inp, height: 54, resize: "vertical" }} value={profile.address} onChange={e => setProfile(p => ({ ...p, address: e.target.value }))} /></div>
              </div>
            </div>
            <div style={card}>
              <div style={{ fontWeight: 500, marginBottom: 14 }}>Payment channels by currency</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 8, marginBottom: 18 }}>
                {CURRENCIES.map(c => {
                  const isActive = activeCur === c.code;
                  const filled = Object.entries(payments[c.code] || {}).some(([k, v]) => k !== "method" && v);
                  return (
                    <button key={c.code} onClick={() => setActiveCur(c.code)} style={{ border: isActive ? "1.5px solid #111" : "1px solid #ddd", borderRadius: 10, padding: "10px 6px 8px", cursor: "pointer", background: isActive ? "#111" : "var(--color-background-primary)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: isActive ? "#fff" : "var(--color-text-primary)" }}>{c.symbol}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: isActive ? "#fff" : "var(--color-text-primary)" }}>{c.code}</span>
                      <span style={{ fontSize: 10, color: isActive ? "#bbb" : "var(--color-text-secondary)", textAlign: "center", lineHeight: 1.2 }}>{c.name}</span>
                      {filled && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6c47ff", marginTop: 2 }} />}
                    </button>
                  );
                })}
              </div>
              <div style={{ borderTop: "0.5px solid #e0e0e0", paddingTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {CURRENCIES.find(c => c.code === activeCur)?.name} — {activeCur}
                </div>
                <div style={col2}>
                  {(CURRENCY_FIELDS[activeCur] || []).map(([l, k]) => (
                    <div key={k} style={k === "bankAddress" ? { gridColumn: "1/-1" } : {}}>
                      <label style={lbl}>{l}</label>
                      {renderPayField(k, (payments[activeCur] || {})[k] || "", e => setPayments(p => ({ ...p, [activeCur]: { ...p[activeCur], [k]: e.target.value } })))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontWeight: 500 }}>Crypto payment channels</div>
                <button onClick={() => { setDraftCrypto({ coin: "BTC", network: "Bitcoin (BTC)", address: "", label: "" }); setShowAddCrypto(true); }} style={{ ...btnOutline, fontSize: 12, padding: "5px 12px" }}>+ Add wallet</button>
              </div>
              {cryptoChannels.length === 0 && !showAddCrypto && (
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)", padding: "10px 0" }}>No crypto channels added yet.</div>
              )}
              {cryptoChannels.map((ch, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: "0.5px solid #e0e0e0" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{ch.coin}{ch.label ? " — " + ch.label : ""}</div>
                    <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>{ch.network}</div>
                    <div style={{ fontSize: 11, fontFamily: "monospace", color: "var(--color-text-secondary)", marginTop: 3, wordBreak: "break-all" }}>{ch.address}</div>
                  </div>
                  <button onClick={() => setCryptoChannels(p => p.filter((_, j) => j !== i))} style={{ ...btnOutline, fontSize: 11, padding: "3px 10px", borderColor: "#c0392b", color: "#c0392b", flexShrink: 0, marginLeft: 12 }}>Remove</button>
                </div>
              ))}
              {showAddCrypto && (
                <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={lbl}>Coin</label>
                    <select style={inp} value={draftCrypto.coin} onChange={e => { const coin = e.target.value; const net = (CRYPTO_NETWORKS[coin] || ["Other"])[0]; setDraftCrypto(p => ({ ...p, coin, network: net })); }}>
                      {CRYPTO_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Network</label>
                    <select style={inp} value={draftCrypto.network} onChange={e => setDraftCrypto(p => ({ ...p, network: e.target.value }))}>
                      {(CRYPTO_NETWORKS[draftCrypto.coin] || ["Other"]).map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    <label style={lbl}>Wallet address</label>
                    <input style={{ ...inp, fontFamily: "monospace", fontSize: 12 }} value={draftCrypto.address} onChange={e => setDraftCrypto(p => ({ ...p, address: e.target.value }))} placeholder="0x... or bc1..." />
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    <label style={lbl}>Label (optional)</label>
                    <input style={inp} value={draftCrypto.label} onChange={e => setDraftCrypto(p => ({ ...p, label: e.target.value }))} placeholder="e.g. Main wallet, Cold storage…" />
                  </div>
                  <div style={{ gridColumn: "1/-1", display: "flex", gap: 8 }}>
                    <button onClick={() => setShowAddCrypto(false)} style={{ ...btnOutline, flex: 1 }}>Cancel</button>
                    <button onClick={() => { if (!draftCrypto.address.trim()) return; setCryptoChannels(p => [...p, { ...draftCrypto }]); setShowAddCrypto(false); }} style={{ ...btn, flex: 2 }}>Add wallet</button>
                  </div>
                </div>
              )}
            </div>
            <button onClick={saveProfile} style={{ ...btn, justifySelf: "start", padding: "10px 24px" }}>
              {profileSaved ? "Saved ✓" : "Save profile & payment info"}
            </button>
          </div>
        )}

        {/* CLIENTS LIST */}
        {tab === 1 && editingClient === null && (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{clients.length} saved client{clients.length !== 1 ? "s" : ""}</span>
              <button onClick={startNewClient} style={btn}>+ New client</button>
            </div>
            {clients.length === 0 && (
              <div style={{ textAlign: "center", color: "var(--color-text-secondary)", padding: "40px 0", border: "0.5px dashed var(--color-border-tertiary)", borderRadius: 10 }}>No clients saved yet.</div>
            )}
            {clients.map(c => (
              <div key={c.id} style={{ ...card, display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 12 : 0 }}>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 2 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{c.email}{c.email && c.phone ? " · " : ""}{c.phone}</div>
                  {c.address && <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{c.address.replace(/\n/g, ", ")}</div>}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => selectClientForInvoice(c)} style={{ ...btn, fontSize: 12, padding: "6px 12px" }}>Use in invoice</button>
                  <button onClick={() => startEditClient(c)} style={{ ...btnOutline, fontSize: 12, padding: "6px 12px" }}>Edit</button>
                  <button onClick={() => deleteClient(c.id)} style={{ ...btnOutline, fontSize: 12, padding: "6px 12px", borderColor: "#c0392b", color: "#c0392b" }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CLIENT EDIT/NEW */}
        {tab === 1 && editingClient !== null && (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <button onClick={() => setEditingClient(null)} style={{ ...btnOutline, fontSize: 12, padding: "5px 12px" }}>← Back</button>
              <span style={{ fontWeight: 500 }}>{editingClient === "new" ? "New client" : "Edit client"}</span>
            </div>
            <div style={card}>
              <div style={{ fontWeight: 500, marginBottom: 12 }}>Contact details</div>
              <div style={col2}>
                {[["Company / Client Name","name"],["Email","email"],["Phone","phone"]].map(([l, k]) => (
                  <div key={k}><label style={lbl}>{l}</label><input style={inp} value={draftClient[k] || ""} onChange={e => setDraftClient(p => ({ ...p, [k]: e.target.value }))} /></div>
                ))}
                <div style={{ gridColumn: "1/-1" }}><label style={lbl}>Address</label><textarea style={{ ...inp, height: 60, resize: "vertical" }} value={draftClient.address || ""} onChange={e => setDraftClient(p => ({ ...p, address: e.target.value }))} /></div>
              </div>
            </div>
            <div style={card}>
              <div style={{ fontWeight: 500, marginBottom: 12 }}>Payment method</div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Currency they pay in</label>
                <select style={{ ...inp, width: "auto", minWidth: 200 }} value={draftClient.currency || "GBP"} onChange={e => setDraftClient(p => ({ ...p, currency: e.target.value }))}>
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                </select>
              </div>
              {(() => {
                const profPay = payments[draftClient.currency || "GBP"] || {};
                const hasPay = Object.entries(profPay).some(([k, v]) => k !== "method" && v);
                if (!hasPay) return null;
                return (
                  <div style={{ background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>Use saved {draftClient.currency} payment details</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>{profPay.method}{profPay.bankName ? " · " + profPay.bankName : ""}</div>
                    </div>
                    <button onClick={() => {
                      const fields = CURRENCY_FIELDS[draftClient.currency || "GBP"] || [];
                      const updates = {};
                      fields.forEach(([, k]) => { updates["pay_" + k] = profPay[k] || ""; });
                      setDraftClient(p => ({ ...p, ...updates }));
                    }} style={{ ...btnOutline, fontSize: 12, padding: "5px 12px", flexShrink: 0 }}>Import</button>
                  </div>
                );
              })()}
              <div style={col2}>
                {(CURRENCY_FIELDS[draftClient.currency || "GBP"] || []).map(([l, k]) => {
                  const pk = "pay_" + k;
                  return (
                    <div key={k} style={k === "bankAddress" ? { gridColumn: "1/-1" } : {}}>
                      <label style={lbl}>{l}</label>
                      {renderPayField(k, draftClient[pk] || "", e => setDraftClient(p => ({ ...p, [pk]: e.target.value })))}
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setEditingClient(null)} style={{ ...btnOutline, flex: 1 }}>Cancel</button>
              <button onClick={commitClient} style={{ ...btn, flex: 2 }}>Save client</button>
            </div>
          </div>
        )}

        {/* NEW INVOICE */}
        {tab === 2 && (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 10 }}>
              <div><label style={lbl}>Invoice No.</label><input style={inp} value={inv.number} onChange={e => setInv(p => ({ ...p, number: e.target.value }))} /></div>
              <div><label style={lbl}>Date</label><input style={inp} value={inv.date} onChange={e => setInv(p => ({ ...p, date: e.target.value }))} /></div>
              <div style={isMobile ? { gridColumn: "1/-1" } : {}}><label style={lbl}>Currency</label>
                <select style={inp} value={inv.currency} onChange={e => setInv(p => ({ ...p, currency: e.target.value }))}>
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                </select>
              </div>
            </div>

            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile && clients.length > 0 ? "column" : "row", gap: 10, marginBottom: 10 }}>
                <div style={{ fontWeight: 500 }}>Bill To</div>
                {clients.length > 0 ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <label style={{ ...lbl, marginBottom: 0 }}>Load client:</label>
                    <select style={{ ...inp, width: "auto", padding: "4px 8px", fontSize: 12 }} value={inv.clientId || ""} onChange={e => { const c = clients.find(x => String(x.id) === e.target.value); if (c) applyClient(c); }}>
                      <option value="">— select —</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                ) : (
                  <button onClick={() => { setTab(1); startNewClient(); }} style={{ ...btnOutline, fontSize: 12, padding: "5px 12px" }}>+ Save client</button>
                )}
              </div>
              <div style={col2}>
                {[["Client Name","name"],["Email","email"],["Phone","phone"]].map(([l, k]) => (
                  <div key={k}><label style={lbl}>{l}</label><input style={inp} value={inv.client[k]} onChange={e => setInv(p => ({ ...p, client: { ...p.client, [k]: e.target.value } }))} /></div>
                ))}
                <div style={{ gridColumn: "1/-1" }}><label style={lbl}>Address</label><textarea style={{ ...inp, height: 50, resize: "vertical" }} value={inv.client.address} onChange={e => setInv(p => ({ ...p, client: { ...p.client, address: e.target.value } }))} /></div>
              </div>
            </div>

            {/* LINE ITEMS */}
            <div style={card}>
              <div style={{ fontWeight: 500, marginBottom: 10 }}>Line Items</div>
              {isMobile ? (
                /* Mobile: stacked card per item */
                inv.items.map(it => (
                  <div key={it.id} style={{ borderBottom: "0.5px solid #e0e0e0", paddingBottom: 14, marginBottom: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginBottom: 8, alignItems: "start" }}>
                      <div><label style={lbl}>Project</label><input style={inp} placeholder="Project" value={it.project} onChange={e => updateItem(it.id, "project", e.target.value)} /></div>
                      <button onClick={() => removeItem(it.id)} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 20, padding: "22px 0 0 0", lineHeight: 1 }}>×</button>
                    </div>
                    <div style={{ marginBottom: 8 }}><label style={lbl}>Description</label><input style={inp} placeholder="Description" value={it.desc} onChange={e => updateItem(it.id, "desc", e.target.value)} /></div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      <div><label style={lbl}>Hours</label><input style={{ ...inp, textAlign: "center" }} type="number" min="0" placeholder="0" value={it.hours} onChange={e => updateItem(it.id, "hours", e.target.value)} /></div>
                      <div><label style={lbl}>Rate</label><input style={{ ...inp, textAlign: "right" }} type="number" min="0" placeholder="rate" value={it.rate} onChange={e => updateItem(it.id, "rate", e.target.value)} /></div>
                      <div><label style={lbl}>Amount</label><input style={{ ...inp, textAlign: "right" }} type="number" min="0" placeholder="fixed" value={it.amount} onChange={e => updateItem(it.id, "amount", e.target.value)} /></div>
                    </div>
                  </div>
                ))
              ) : (
                /* Desktop: row grid */
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.9fr 65px 75px 85px 24px", gap: 6, marginBottom: 6 }}>
                    {["Project","Description","Hours","Rate","Amount",""].map((h, i) => <div key={i} style={{ fontSize: 10, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</div>)}
                  </div>
                  {inv.items.map(it => (
                    <div key={it.id} style={{ display: "grid", gridTemplateColumns: "1.1fr 1.9fr 65px 75px 85px 24px", gap: 6, marginBottom: 8, alignItems: "center" }}>
                      <input style={inp} placeholder="Project" value={it.project} onChange={e => updateItem(it.id, "project", e.target.value)} />
                      <input style={inp} placeholder="Description" value={it.desc} onChange={e => updateItem(it.id, "desc", e.target.value)} />
                      <input style={{ ...inp, textAlign: "center" }} type="number" min="0" placeholder="0" value={it.hours} onChange={e => updateItem(it.id, "hours", e.target.value)} />
                      <input style={{ ...inp, textAlign: "right" }} type="number" min="0" placeholder="rate" value={it.rate} onChange={e => updateItem(it.id, "rate", e.target.value)} />
                      <input style={{ ...inp, textAlign: "right" }} type="number" min="0" placeholder="fixed" value={it.amount} onChange={e => updateItem(it.id, "amount", e.target.value)} />
                      <button onClick={() => removeItem(it.id)} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 18, padding: 0 }}>×</button>
                    </div>
                  ))}
                </>
              )}
              <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 8 }}>Tip: fill Amount for fixed-price items, or use Hours × Rate</div>
              <button onClick={addItem} style={{ ...btnOutline, fontSize: 12, padding: "5px 12px" }}>+ Add item</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              <div><label style={lbl}>Deductions ({cur.symbol})</label><input style={inp} type="number" min="0" placeholder="0.00" value={inv.deductions} onChange={e => setInv(p => ({ ...p, deductions: e.target.value }))} /></div>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                <div style={{ background: "var(--color-background-secondary)", borderRadius: 6, padding: "10px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 3 }}><span>Sub-Total</span><span>{fmtAmt(subtotal, cur.symbol)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 3 }}><span>Deductions</span><span>{deductions > 0 ? "-" + fmtAmt(deductions, cur.symbol) : "$0.00"}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, fontSize: 14, borderTop: "0.5px solid var(--color-border-tertiary)", paddingTop: 6, marginTop: 4 }}><span>Grand Total</span><span>{fmtAmt(grandTotal, cur.symbol)}</span></div>
                </div>
              </div>
            </div>
            <div><label style={lbl}>Notes (optional)</label><textarea style={{ ...inp, height: 50, resize: "vertical" }} placeholder="Payment terms, thank you note…" value={inv.notes} onChange={e => setInv(p => ({ ...p, notes: e.target.value }))} /></div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setPreview({ ...inv, subtotal, deductions, grandTotal, profile: { ...profile }, paymentInfo: payments[inv.currency] })} style={{ ...btnOutline, flex: 1 }}>Preview</button>
              <button onClick={saveInvoice} style={{ ...btn, flex: 2 }}>Save & Export →</button>
            </div>
          </div>
        )}

        {/* HISTORY */}
        {tab === 3 && (
          <div>
            {history.length === 0
              ? <div style={{ textAlign: "center", color: "var(--color-text-secondary)", padding: "40px 0" }}>No invoices saved yet.</div>
              : <div style={{ display: "grid", gap: 10 }}>
                  {history.map((r, i) => {
                    const c = CURRENCIES.find(x => x.code === r.currency) || CURRENCIES[0];
                    const grand = r.grandTotal !== undefined ? r.grandTotal : (r.subtotal - (parseFloat(r.deductions) || 0));
                    return (
                      <div key={i} style={{ ...card, display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 10 : 0 }}>
                        <div>
                          <div style={{ fontWeight: 500 }}>No. {r.number} — {r.client?.name || "No client"}</div>
                          <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>{r.date} · {r.currency}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ fontWeight: 600 }}>{fmtAmt(grand, c.symbol)}</span>
                          <button onClick={() => setPreview(r)} style={{ ...btn, fontSize: 12, padding: "6px 14px" }}>View / Print</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
            }
          </div>
        )}

        {/* PREVIEW MODAL */}
        {preview && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: isMobile ? 0 : 16, overflowY: "auto" }} onClick={() => setPreview(null)}>
            <div style={{ background: "#fff", borderRadius: isMobile ? 0 : 10, maxWidth: 860, width: "100%", minHeight: isMobile ? "100dvh" : "auto" }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "0.5px solid #e5e5e5", background: "#fff", position: "sticky", top: 0, zIndex: 10 }}>
                <span style={{ fontWeight: 500, color: "#111", fontSize: isMobile ? 13 : 14 }}>Invoice No. {preview.number}</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button onClick={downloadPdf} style={{ ...btn, fontSize: 12, padding: "6px 14px" }}>Download PDF</button>
                  <button onClick={() => setPreview(null)} style={{ ...btnOutline, fontSize: 12, padding: "6px 14px" }}>Close</button>
                </div>
              </div>
              {/* Scrollable invoice wrapper on mobile */}
              <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <div id="print-area-fbi3"><InvoiceDoc r={preview} /></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
