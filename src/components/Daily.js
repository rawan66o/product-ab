import { useEffect, useState } from "react";
import axios from "axios";
import "./Daily.css";
import { Link } from "react-router-dom";

// ========================================
// API - نفس الباك إند الحالي
// ========================================

const API_URL = "https://abdbac2-10.onrender.com/daily";

// ========================================
// النموذج الفارغ
// ========================================

const getEmptyDaily = () => ({
  customerName: "",
  date: new Date().toISOString().split("T")[0],
  transactionType: "بيع",
  paymentStatus: "غير مقبوض",
  notes: "",
});

// ========================================
// Component
// ========================================

function Daily() {
  const [daily, setDaily] = useState([]);
  const [form, setForm] = useState(getEmptyDaily());

  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("الكل");
  const [filterType, setFilterType] = useState("الكل");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ========================================
  // جلب اليوميات
  // ========================================

  const fetchDaily = async () => {
    try {
      setLoading(true);

      const response = await axios.get(API_URL);

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      const sortedData = [...data].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      setDaily(sortedData);
    } catch (error) {
      console.error("Error fetching daily:", error);

      if (error.response) {
        alert(`حدث خطأ من السيرفر (${error.response.status})`);
      } else {
        alert("تعذر الاتصال بالسيرفر، تأكدي من Render");
      }
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // تشغيل أول مرة
  // ========================================

  useEffect(() => {
    fetchDaily();
  }, []);

  // ========================================
  // تغيير الحقول
  // ========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    // عند تغيير نوع الحركة نغيّر الحالة الافتراضية
    if (name === "transactionType") {
      setForm((prev) => ({
        ...prev,
        transactionType: value,
        paymentStatus:
          value === "شراء" ? "غير مدفوع" : "غير مقبوض",
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ========================================
  // إضافة / تعديل اليومية
  // ========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.customerName.trim()) {
      alert("يرجى إدخال اسم الزبون أو المورد");
      return;
    }

    if (!form.date) {
      alert("يرجى اختيار التاريخ");
      return;
    }

    try {
      setSaving(true);

      const dailyData = {
        customerName: form.customerName.trim(),
        date: form.date,
        transactionType: form.transactionType,
        paymentStatus: form.paymentStatus,
        notes: form.notes.trim(),
      };

      // تعديل
      if (editingId !== null) {
        await axios.put(`${API_URL}/${editingId}`, {
          id: editingId,
          ...dailyData,
        });

        alert("تم تعديل الحركة بنجاح");
      } else {
        // إضافة
        const newDaily = {
          id: Date.now().toString(),
          ...dailyData,
        };

        await axios.post(API_URL, newDaily);

        alert("تمت إضافة الحركة بنجاح");
      }

      setForm(getEmptyDaily());
      setEditingId(null);

      await fetchDaily();
    } catch (error) {
      console.error("Error saving daily:", error);

      if (error.response) {
        alert(`حدث خطأ أثناء الحفظ (${error.response.status})`);
      } else {
        alert("حدث خطأ أثناء حفظ الحركة");
      }
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // تعديل اليومية
  // ========================================

  const handleEdit = (item) => {
    setEditingId(item.id);

    setForm({
      customerName: item.customerName || "",
      date: item.date || "",
      // السجلات القديمة التي لا تحتوي نوع حركة تعتبر بيع
      transactionType: item.transactionType || "بيع",
      paymentStatus:
        item.paymentStatus ||
        (item.transactionType === "شراء"
          ? "غير مدفوع"
          : "غير مقبوض"),
      notes: item.notes || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ========================================
  // إلغاء التعديل
  // ========================================

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(getEmptyDaily());
  };

  // ========================================
  // حذف اليومية
  // ========================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "هل أنت متأكد من حذف هذه الحركة؟"
    );

    if (!confirmed) return;

    try {
      await axios.delete(`${API_URL}/${id}`);

      setDaily((prev) =>
        prev.filter((item) => item.id !== id)
      );

      if (editingId === id) {
        handleCancelEdit();
      }

      alert("تم حذف الحركة بنجاح");
    } catch (error) {
      console.error("Error deleting daily:", error);

      if (error.response) {
        alert(`حدث خطأ أثناء الحذف (${error.response.status})`);
      } else {
        alert("حدث خطأ أثناء حذف الحركة");
      }
    }
  };

  // ========================================
  // البحث والفلترة
  // ========================================

  const filteredDaily = daily.filter((item) => {
    const customerName = item.customerName || "";

    // البيانات القديمة تعتبر بيع
    const transactionType = item.transactionType || "بيع";

    const paymentStatus =
      item.paymentStatus ||
      (transactionType === "شراء" ? "غير مدفوع" : "غير مقبوض");

    const matchesSearch = customerName
      .toLowerCase()
      .includes(search.toLowerCase().trim());

    const matchesType =
      filterType === "الكل" ||
      transactionType === filterType;

    const matchesStatus =
      filterStatus === "الكل" ||
      paymentStatus === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  // ========================================
  // الإحصائيات
  // ========================================

  const totalDaily = daily.length;

  const salesCount = daily.filter(
    (item) => (item.transactionType || "بيع") === "بيع"
  ).length;

  const purchasesCount = daily.filter(
    (item) => item.transactionType === "شراء"
  ).length;

  const paidCount = daily.filter(
    (item) =>
      (item.transactionType || "بيع") === "بيع" &&
      item.paymentStatus === "مقبوض"
  ).length;

  const unpaidCount = daily.filter(
    (item) =>
      (item.transactionType || "بيع") === "بيع" &&
      (item.paymentStatus || "غير مقبوض") === "غير مقبوض"
  ).length;

  const purchasePaidCount = daily.filter(
    (item) =>
      item.transactionType === "شراء" &&
      item.paymentStatus === "مدفوع"
  ).length;

  const purchaseUnpaidCount = daily.filter(
    (item) =>
      item.transactionType === "شراء" &&
      (item.paymentStatus || "غير مدفوع") === "غير مدفوع"
  ).length;

  // ========================================
  // العرض
  // ========================================

  return (
    <div className="daily-page" dir="rtl">

      {/* Navbar */}

      <nav className="store-navbar">
        <div className="store-logo">متجري</div>

        <div className="store-links">
          <Link to="/products">المنتجات</Link>
          <Link to="/checks">الكشوف</Link>
          <Link to="/dashboard">الداشبورد</Link>
        </div>
      </nav>

      {/* Header */}

      <div className="daily-header">
        <div>
          <h1 style={{ color: "white" }}>📖 اليوميات</h1>

          <p>
            تسجيل ومتابعة حركات البيع والشراء اليومية
          </p>
        </div>
      </div>

      {/* Statistics */}

      <div className="daily-stats">

        <div className="daily-stat-card">
          <span className="stat-icon">📋</span>
          <div>
            <h3>إجمالي الحركات</h3>
            <strong>{totalDaily}</strong>
          </div>
        </div>

        <div className="daily-stat-card">
          <span className="stat-icon">🛒</span>
          <div>
            <h3>حركات البيع</h3>
            <strong>{salesCount}</strong>
          </div>
        </div>

        <div className="daily-stat-card">
          <span className="stat-icon">📦</span>
          <div>
            <h3>حركات الشراء</h3>
            <strong>{purchasesCount}</strong>
          </div>
        </div>

        <div className="daily-stat-card paid">
          <span className="stat-icon">💰</span>
          <div>
            <h3>مقبوض من البيع</h3>
            <strong>{paidCount}</strong>
          </div>
        </div>

        <div className="daily-stat-card unpaid">
          <span className="stat-icon">⏳</span>
          <div>
            <h3>غير مقبوض</h3>
            <strong>{unpaidCount}</strong>
          </div>
        </div>

        <div className="daily-stat-card paid">
          <span className="stat-icon">✅</span>
          <div>
            <h3>مدفوع للمورد</h3>
            <strong>{purchasePaidCount}</strong>
          </div>
        </div>

        <div className="daily-stat-card unpaid">
          <span className="stat-icon">💳</span>
          <div>
            <h3>غير مدفوع للمورد</h3>
            <strong>{purchaseUnpaidCount}</strong>
          </div>
        </div>

      </div>

      {/* Form */}

      <div className="daily-form-card">

        <div className="form-title">
          <h2>
            {editingId !== null
              ? "✏️ تعديل الحركة"
              : "➕ إضافة حركة جديدة"}
          </h2>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="daily-form-grid">

            {/* نوع الحركة */}

            <div className="daily-input-group">
              <label>نوع الحركة</label>

              <select
                name="transactionType"
                value={form.transactionType}
                onChange={handleChange}
              >
                <option value="بيع">🛒 بيع</option>
                <option value="شراء">📦 شراء</option>
              </select>
            </div>

            {/* اسم الزبون أو المورد */}

            <div className="daily-input-group">
              <label>
                {form.transactionType === "شراء"
                  ? "اسم المورد"
                  : "اسم الزبون"}
              </label>

              <input
                type="text"
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                placeholder={
                  form.transactionType === "شراء"
                    ? "أدخل اسم المورد"
                    : "أدخل اسم الزبون"
                }
              />
            </div>

            {/* التاريخ */}

            <div className="daily-input-group">
              <label>التاريخ</label>

              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
              />
            </div>

            {/* حالة الدفع أو القبض */}

            <div className="daily-input-group">
              <label>
                {form.transactionType === "شراء"
                  ? "حالة الدفع"
                  : "حالة القبض"}
              </label>

              <select
                name="paymentStatus"
                value={form.paymentStatus}
                onChange={handleChange}
              >
                {form.transactionType === "شراء" ? (
                  <>
                    <option value="غير مدفوع">غير مدفوع</option>
                    <option value="مدفوع">مدفوع</option>
                  </>
                ) : (
                  <>
                    <option value="غير مقبوض">غير مقبوض</option>
                    <option value="مقبوض">مقبوض</option>
                  </>
                )}
              </select>
            </div>

            {/* الملاحظات */}

            <div className="daily-input-group daily-notes-group">
              <label>الملاحظات</label>

              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="اكتب تفاصيل حركة البيع أو الشراء..."
                rows="4"
              />
            </div>

          </div>

          {/* الأزرار */}

          <div className="daily-form-buttons">

            <button
              type="submit"
              className="daily-save-btn"
              disabled={saving}
            >
              {saving
                ? "جاري الحفظ..."
                : editingId !== null
                ? "💾 حفظ التعديل"
                : "➕ إضافة الحركة"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="daily-cancel-btn"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                ✖ إلغاء
              </button>
            )}

          </div>
        </form>
      </div>

      {/* Search + Filters */}

      <div className="daily-tools">

        <div className="daily-search">
          <span>🔎</span>

          <input
            type="text"
            placeholder="ابحث باسم الزبون أو المورد..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* فلترة نوع الحركة */}

        <select
          className="daily-filter"
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setFilterStatus("الكل");
          }}
        >
          <option value="الكل">كل الحركات</option>
          <option value="بيع">البيع فقط</option>
          <option value="شراء">الشراء فقط</option>
        </select>

        {/* فلترة الحالة */}

        <select
          className="daily-filter"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="الكل">كل الحالات</option>

          {filterType !== "شراء" && (
            <>
              <option value="مقبوض">مقبوض</option>
              <option value="غير مقبوض">غير مقبوض</option>
            </>
          )}

          {filterType !== "بيع" && (
            <>
              <option value="مدفوع">مدفوع</option>
              <option value="غير مدفوع">غير مدفوع</option>
            </>
          )}
        </select>

      </div>

      {/* Table */}

      <div className="daily-table-card">

        <div className="daily-table-wrapper">

          <table className="daily-table">

            <thead>
              <tr>
                <th>#</th>
                <th>نوع الحركة</th>
                <th>اسم الزبون / المورد</th>
                <th>التاريخ</th>
                <th>حالة الدفع / القبض</th>
                <th>الملاحظات</th>
                <th>الإجراءات</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td colSpan="7" className="daily-empty">
                    جاري تحميل البيانات...
                  </td>
                </tr>
              ) : filteredDaily.length === 0 ? (
                <tr>
                  <td colSpan="7" className="daily-empty">
                    لا توجد حركات
                  </td>
                </tr>
              ) : (
                filteredDaily.map((item, index) => {
                  const transactionType =
                    item.transactionType || "بيع";

                  const isPurchase =
                    transactionType === "شراء";

                  const paymentStatus =
                    item.paymentStatus ||
                    (isPurchase ? "غير مدفوع" : "غير مقبوض");

                  const isPaid =
                    paymentStatus === "مقبوض" ||
                    paymentStatus === "مدفوع";

                  return (
                    <tr key={item.id}>

                      <td>{index + 1}</td>

                      {/* نوع الحركة */}

                      <td>
                        <span
                          className={`payment-badge ${
                            isPurchase
                              ? "purchase-badge"
                              : "sale-badge"
                          }`}
                        >
                          {isPurchase ? "📦 شراء" : "🛒 بيع"}
                        </span>
                      </td>

                      {/* الاسم */}

                      <td className="customer-name">
                        {item.customerName || "-"}
                      </td>

                      {/* التاريخ */}

                      <td>{item.date || "-"}</td>

                      {/* الحالة */}

                      <td>
                        <span
                          className={`payment-badge ${
                            isPaid
                              ? "paid-badge"
                              : "unpaid-badge"
                          }`}
                        >
                          {isPurchase
                            ? isPaid
                              ? "✓ مدفوع"
                              : "⏳ غير مدفوع"
                            : isPaid
                            ? "✓ مقبوض"
                            : "⏳ غير مقبوض"}
                        </span>
                      </td>

                      {/* الملاحظات */}

                      <td className="notes-cell">
                        {item.notes || "لا توجد ملاحظات"}
                      </td>

                      {/* الإجراءات */}

                      <td>
                        <div className="daily-actions">

                          <button
                            type="button"
                            className="edit-daily-btn"
                            onClick={() => handleEdit(item)}
                            title="تعديل"
                          >
                            ✏️
                          </button>

                          <button
                            type="button"
                            className="delete-daily-btn"
                            onClick={() => handleDelete(item.id)}
                            title="حذف"
                          >
                            🗑️
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}

            </tbody>
          </table>

        </div>
      </div>

    </div>
  );
}

export default Daily;