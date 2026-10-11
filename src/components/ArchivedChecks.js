import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const ARCHIVE_API_URL = "https://abdbac2-10.onrender.com/archivedChecks";

const numberValue = (value) => {
  const parsed = Number(String(value ?? 0).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const money = (value, maximumFractionDigits = 2) =>
  numberValue(value).toLocaleString("en-US", {
    maximumFractionDigits,
  });

const getItems = (check) => {
  if (Array.isArray(check?.items)) return check.items;
  if (check && (check.productType || check.specifications || check.quantity != null)) {
    return [{
      productType: check.productType || "",
      specifications: check.specifications || "",
      quantity: check.quantity ?? 0,
      priceUsd: check.priceUsd ?? check.price ?? 0,
      priceSyp: check.priceSyp ?? 0,
    }];
  }
  return [];
};

const totalUsd = (check) => getItems(check).reduce(
  (sum, item) => sum + numberValue(item.quantity) * numberValue(item.priceUsd ?? item.price), 0
);

const totalSyp = (check) => getItems(check).reduce(
  (sum, item) => sum + numberValue(item.quantity) * numberValue(item.priceSyp), 0
);

function ArchivedChecks() {
  const [archivedChecks, setArchivedChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("الكل");
  const [filterYear, setFilterYear] = useState("الكل");
  const [selectedCheck, setSelectedCheck] = useState(null);

  const fetchArchivedChecks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(ARCHIVE_API_URL);
      const data = Array.isArray(response.data) ? response.data : [];
      setArchivedChecks(
        data.sort((a, b) => new Date(b.archivedAt || b.date || 0) - new Date(a.archivedAt || a.date || 0))
      );
    } catch (err) {
      console.error("Error fetching archived checks:", err);
      setError("ما قدرنا نجيب الأرشيف. تأكدي أن قسم archivedChecks موجود بملف db.json على Render وأن الباك شغّال.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArchivedChecks();
  }, [fetchArchivedChecks]);

  const years = useMemo(() => {
    const values = archivedChecks
      .map((check) => check.archivedYear || (check.archivedAt ? new Date(check.archivedAt).getFullYear() : null) || (check.date ? new Date(check.date).getFullYear() : null))
      .filter((year) => year && Number.isFinite(Number(year)))
      .map(String);
    return [...new Set(values)].sort((a, b) => Number(b) - Number(a));
  }, [archivedChecks]);

  const filteredChecks = useMemo(() => {
    const term = search.trim().toLowerCase();
    return archivedChecks.filter((check) => {
      const matchesSearch = !term || [
        check.customerName,
        check.recipientName,
        check.checkNumber,
        check.bookNumber,
        check.phone,
        check.residence,
        check.type,
        check.notes,
      ].some((value) => String(value ?? "").toLowerCase().includes(term));
      const matchesType = filterType === "الكل" || check.type === filterType;
      const year = String(check.archivedYear || (check.archivedAt ? new Date(check.archivedAt).getFullYear() : null) || (check.date ? new Date(check.date).getFullYear() : ""));
      const matchesYear = filterYear === "الكل" || year === filterYear;
      return matchesSearch && matchesType && matchesYear;
    });
  }, [archivedChecks, search, filterType, filterYear]);

  const stats = useMemo(() => filteredChecks.reduce((acc, check) => {
    acc.usd += totalUsd(check);
    acc.syp += totalSyp(check);
    return acc;
  }, { usd: 0, syp: 0 }), [filteredChecks]);

  const styles = {
    page: { direction: "rtl", minHeight: "100vh", padding: "24px", background: "#f7f2ea", color: "#3e3027", fontFamily: "Tajawal, Arial, sans-serif" },
    container: { maxWidth: "1400px", margin: "0 auto" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", flexWrap: "wrap", marginBottom: "22px" },
    title: { margin: 0, fontSize: "clamp(23px, 4vw, 32px)", color: "#563c2d" },
    subtitle: { margin: "7px 0 0", color: "#7b6a5d" },
    button: { border: 0, borderRadius: "10px", padding: "11px 16px", cursor: "pointer", fontWeight: 700, fontSize: "14px", background: "#a65f32", color: "white", textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" },
    panel: { background: "white", border: "1px solid #eadfd2", borderRadius: "16px", padding: "18px", marginBottom: "18px", boxShadow: "0 4px 18px rgba(62,48,39,.05)" },
    filters: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" },
    label: { display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "7px", color: "#6b5140" },
    input: { width: "100%", minWidth: 0, boxSizing: "border-box", padding: "11px 12px", border: "1px solid #ddcbbb", borderRadius: "9px", background: "#fffdfa", color: "#3e3027", outlineColor: "#b97649" },
    stats: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px", marginBottom: "18px" },
    stat: { background: "#fff", border: "1px solid #eadfd2", borderRadius: "14px", padding: "16px" },
    statLabel: { color: "#7b6a5d", fontSize: "13px", marginBottom: "7px" },
    statValue: { fontSize: "21px", fontWeight: 800, color: "#70472f", overflowWrap: "anywhere" },
    tableWrap: { overflowX: "auto", width: "100%" },
    table: { width: "100%", minWidth: "980px", borderCollapse: "collapse", fontSize: "14px" },
    th: { textAlign: "right", padding: "13px 12px", background: "#f0e5d8", color: "#5a4030", whiteSpace: "nowrap" },
    td: { padding: "13px 12px", borderBottom: "1px solid #f0e7de", verticalAlign: "top" },
    muted: { color: "#817165", fontSize: "13px" },
    badge: { display: "inline-block", borderRadius: "20px", padding: "5px 10px", background: "#f5e5d5", color: "#794a2d", fontWeight: 700, whiteSpace: "nowrap" },
    secondaryButton: { border: "1px solid #d8c3b0", borderRadius: "8px", padding: "7px 10px", background: "#fffaf5", color: "#69462f", cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap" },
    overlay: { position: "fixed", inset: 0, zIndex: 1000, background: "rgba(35,25,18,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" },
    modal: { width: "min(900px, 100%)", maxHeight: "90vh", overflowY: "auto", background: "#fffdfa", borderRadius: "16px", padding: "22px", boxSizing: "border-box" },
    item: { border: "1px solid #eadfd2", background: "white", borderRadius: "10px", padding: "12px", marginTop: "10px" },
  };

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>جرد الكشوف المؤرشفة</h1>
            <p style={styles.subtitle}>كل كشف تم نقله للأرشيف عند حذفه من الكشوف الحالية.</p>
          </div>
          <div style={{ display: "flex", gap: "9px", flexWrap: "wrap" }}>
            <button type="button" style={styles.button} onClick={fetchArchivedChecks}>↻ تحديث الأرشيف</button>
            <Link to="/checks" style={{ ...styles.button, background: "#6f6257" }}>العودة للكشوف</Link>
          </div>
        </header>

        <section style={styles.stats}>
          <div style={styles.stat}><div style={styles.statLabel}>عدد الكشوف المعروضة</div><div style={styles.statValue}>{filteredChecks.length}</div></div>
          <div style={styles.stat}><div style={styles.statLabel}>إجمالي المواد بالدولار</div><div style={styles.statValue}>${money(stats.usd)}</div></div>
          <div style={styles.stat}><div style={styles.statLabel}>إجمالي المواد بالليرة السورية</div><div style={styles.statValue}>{money(stats.syp, 0)} ل.س</div></div>
        </section>

        <section style={styles.panel}>
          <div style={styles.filters}>
            <div><label style={styles.label}>بحث</label><input style={styles.input} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="اسم الزبون، رقم الكشف، الهاتف..." /></div>
            <div><label style={styles.label}>نوع الكشف</label><select style={styles.input} value={filterType} onChange={(e) => setFilterType(e.target.value)}><option value="الكل">كل الأنواع</option><option value="بيع">بيع</option><option value="شراء">شراء</option><option value="مرتجع">مرتجع</option></select></div>
            <div><label style={styles.label}>سنة الأرشفة</label><select style={styles.input} value={filterYear} onChange={(e) => setFilterYear(e.target.value)}><option value="الكل">كل السنوات</option>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select></div>
          </div>
        </section>

        <section style={styles.panel}>
          {loading ? <p>عم يتم تحميل الأرشيف...</p> : error ? <div role="alert" style={{ color: "#a12e25", lineHeight: 1.8 }}>{error}<div style={{ marginTop: 12 }}><button style={styles.button} onClick={fetchArchivedChecks}>إعادة المحاولة</button></div></div> : filteredChecks.length === 0 ? <div style={{ textAlign: "center", padding: "36px 12px" }}><h3 style={{ marginTop: 0 }}>ما في كشوف مؤرشفة مطابقة</h3><p style={styles.muted}>إذا لسه ما نقلتي أي كشف للأرشيف، رح يظهر هون بعد أرشفته.</p></div> : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>رقم الكشف</th><th style={styles.th}>اسم الزبون</th><th style={styles.th}>النوع</th><th style={styles.th}>تاريخ الكشف</th><th style={styles.th}>رقم الدفتر</th><th style={styles.th}>الإجمالي بالدولار</th><th style={styles.th}>الإجمالي بالسوري</th><th style={styles.th}>سنة الأرشفة</th><th style={styles.th}>التفاصيل</th></tr></thead>
                <tbody>{filteredChecks.map((check) => {
                  const archivedYear = check.archivedYear || (check.archivedAt ? new Date(check.archivedAt).getFullYear() : null) || (check.date ? new Date(check.date).getFullYear() : "-");
                  return <tr key={check.id ?? `${check.checkNumber}-${check.archivedAt}`}>
                    <td style={styles.td}>#{check.checkNumber || check.originalId || check.id || "-"}</td>
                    <td style={styles.td}><strong>{check.customerName || check.recipientName || "-"}</strong><div style={styles.muted}>{check.phone || ""}</div></td>
                    <td style={styles.td}><span style={styles.badge}>{check.type || "-"}</span></td>
                    <td style={styles.td}>{check.date || "-"}</td>
                    <td style={styles.td}>{check.bookNumber || "-"}</td>
                    <td style={styles.td}>${money(totalUsd(check))}</td>
                    <td style={styles.td}>{money(totalSyp(check), 0)} ل.س</td>
                    <td style={styles.td}>{archivedYear}</td>
                    <td style={styles.td}><button type="button" style={styles.secondaryButton} onClick={() => setSelectedCheck(check)}>عرض التفاصيل</button></td>
                  </tr>;
                })}</tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {selectedCheck && <div style={styles.overlay} onClick={() => setSelectedCheck(null)}>
        <section style={styles.modal} role="dialog" aria-modal="true" aria-label="تفاصيل الكشف المؤرشف" onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
            <h2 style={{ margin: 0, color: "#563c2d" }}>تفاصيل الكشف المؤرشف #{selectedCheck.checkNumber || selectedCheck.originalId || selectedCheck.id || "-"}</h2>
            <button type="button" style={styles.secondaryButton} onClick={() => setSelectedCheck(null)}>إغلاق ✕</button>
          </div>
          <div style={styles.filters}>
            <div><label style={styles.label}>اسم الزبون</label><div>{selectedCheck.customerName || selectedCheck.recipientName || "-"}</div></div>
            <div><label style={styles.label}>الهاتف</label><div>{selectedCheck.phone || "-"}</div></div>
            <div><label style={styles.label}>مكان الإقامة</label><div>{selectedCheck.residence || "-"}</div></div>
            <div><label style={styles.label}>نوع الكشف</label><div>{selectedCheck.type || "-"}</div></div>
            <div><label style={styles.label}>تاريخ الكشف</label><div>{selectedCheck.date || "-"}</div></div>
            <div><label style={styles.label}>رقم الدفتر</label><div>{selectedCheck.bookNumber || "-"}</div></div>
            <div><label style={styles.label}>حالة الدفع</label><div>{selectedCheck.paymentStatus || "-"}</div></div>
            <div><label style={styles.label}>سعر الصرف المحفوظ</label><div>{selectedCheck.exchangeRate ?? selectedCheck.dollarRate ?? "-"}</div></div>
            <div><label style={styles.label}>تاريخ الأرشفة</label><div>{selectedCheck.archivedAt ? new Date(selectedCheck.archivedAt).toLocaleString("ar-SY") : "غير مسجل"}</div></div>
          </div>
          <h3 style={{ marginTop: 24, color: "#70472f" }}>مواد الكشف</h3>
          {getItems(selectedCheck).length === 0 ? <p style={styles.muted}>ما في تفاصيل مواد محفوظة بهذا الكشف.</p> : getItems(selectedCheck).map((item, index) => <div style={styles.item} key={index}>
            <strong>{index + 1}. {item.productType || "مادة بدون اسم"}</strong>
            <p style={{ margin: "7px 0" }}>المواصفات: {item.specifications || "-"}</p>
            <p style={{ margin: "7px 0" }}>الكمية: {money(item.quantity, 0)}</p>
            <p style={{ margin: "7px 0" }}>سعر الوحدة بالدولار: ${money(item.priceUsd ?? item.price)}</p>
            <p style={{ margin: "7px 0 0" }}>سعر الوحدة بالسوري: {money(item.priceSyp, 0)} ل.س</p>
          </div>)}
          <div style={{ ...styles.panel, marginTop: 16, marginBottom: 0, background: "#f8efe5" }}><strong>الإجمالي بالدولار: ${money(totalUsd(selectedCheck))}</strong><div style={{ marginTop: 8 }}><strong>الإجمالي بالسوري: {money(totalSyp(selectedCheck), 0)} ل.س</strong></div></div>
          {selectedCheck.notes && <div style={{ marginTop: 16 }}><label style={styles.label}>ملاحظات</label><p style={{ whiteSpace: "pre-wrap" }}>{selectedCheck.notes}</p></div>}
        </section>
      </div>}
    </main>
  );
}

export default ArchivedChecks;
