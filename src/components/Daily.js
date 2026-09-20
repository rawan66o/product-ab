
import { useEffect, useState } from "react";
import axios from "axios";
import "./Daily.css";
import { Link } from "react-router-dom";
// ========================================
// API
// ========================================

const API_URL = "https://abdbac2-10.onrender.com/daily";

// ========================================
// النموذج الفارغ
// ========================================

const getEmptyDaily = () => ({
  customerName: "",
  date: new Date().toISOString().split("T")[0],
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

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  // ========================================
  // جلب اليوميات
  // ========================================

  const fetchDaily = async () => {
    try {
      setLoading(true);

      const response = await axios.get(API_URL);

      console.log("Daily data:", response.data);

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
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);

        alert(
          `حدث خطأ من السيرفر (${error.response.status})`
        );
      } else if (error.request) {
        alert(
          "لم يتم الاتصال بالسيرفر، تأكدي أن الباك يعمل على Render"
        );
      } else {
        alert("حدث خطأ أثناء جلب اليوميات");
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

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ========================================
  // إضافة / تعديل
  // ========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.customerName.trim()) {
      alert("يرجى إدخال اسم الزبون");
      return;
    }

    if (!form.date) {
      alert("يرجى اختيار التاريخ");
      return;
    }

    try {
      setSaving(true);

      // ====================================
      // تعديل
      // ====================================

      if (editingId) {
        const updatedDaily = {
          customerName: form.customerName.trim(),
          date: form.date,
          paymentStatus: form.paymentStatus,
          notes: form.notes.trim(),
        };

        await axios.put(
          `${API_URL}/${editingId}`,
          updatedDaily
        );

        alert("تم تعديل اليومية بنجاح");

      } else {

        // ====================================
        // إضافة
        // ====================================

        const newDaily = {
          id: Date.now().toString(),
          customerName: form.customerName.trim(),
          date: form.date,
          paymentStatus: form.paymentStatus,
          notes: form.notes.trim(),
        };

        await axios.post(API_URL, newDaily);

        alert("تمت إضافة اليومية بنجاح");
      }

      // إعادة ضبط النموذج
      setForm(getEmptyDaily());

      setEditingId(null);

      // إعادة جلب البيانات
      await fetchDaily();

    } catch (error) {
      console.error("Error saving daily:", error);

      if (error.response) {
        alert(
          `حدث خطأ أثناء الحفظ (${error.response.status})`
        );
      } else {
        alert("حدث خطأ أثناء حفظ اليومية");
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
      paymentStatus:
        item.paymentStatus || "غير مقبوض",
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
  // حذف
  // ========================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "هل أنت متأكد من حذف هذه اليومية؟"
    );

    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/${id}`);

      setDaily((prev) =>
        prev.filter((item) => item.id !== id)
      );

      alert("تم حذف اليومية بنجاح");

    } catch (error) {
      console.error("Error deleting daily:", error);

      if (error.response) {
        alert(
          `حدث خطأ أثناء الحذف (${error.response.status})`
        );
      } else {
        alert("حدث خطأ أثناء حذف اليومية");
      }
    }
  };

  // ========================================
  // البحث والفلترة
  // ========================================

  const filteredDaily = daily.filter((item) => {

    const customerName =
      item.customerName || "";

    const paymentStatus =
      item.paymentStatus || "";

    const matchesSearch =
      customerName
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesStatus =
      filterStatus === "الكل" ||
      paymentStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // ========================================
  // الإحصائيات
  // ========================================

  const totalDaily = daily.length;

  const paidCount = daily.filter(
    (item) =>
      item.paymentStatus === "مقبوض"
  ).length;

  const unpaidCount = daily.filter(
    (item) =>
      item.paymentStatus === "غير مقبوض"
  ).length;

  // ========================================
  // العرض
  // ========================================

  return (
    <div className="daily-page" dir="rtl">
  <nav className="store-navbar">

        <div className="store-logo">
          متجري
        </div>

        <div className="store-links">

          <Link to="/products">
            المنتجات
          </Link>

          <Link to="/checks">
            الكشوف
          </Link>

          <Link to="/dashboard">
            الداشبورد
          </Link>

        </div>

      </nav>
  
      {/* ====================================
          Header
      ==================================== */}

      <div className="daily-header">

        <div>
   <h1 style={{ color: "white" }}>📖 اليوميات</h1>

          <p>
            تسجيل ومتابعة ملاحظات وحركات الزبائن اليومية
          </p>
        </div>

      </div>

      {/* ====================================
          Statistics
      ==================================== */}

      <div className="daily-stats">

        {/* إجمالي */}
        <div className="daily-stat-card">

          <span className="stat-icon">
            📋
          </span>

          <div>
            <h3>
              إجمالي اليوميات
            </h3>

            <strong>
              {totalDaily}
            </strong>
          </div>

        </div>

        {/* مقبوض */}
        <div className="daily-stat-card paid">

          <span className="stat-icon">
            💰
          </span>

          <div>
            <h3>
              مقبوض
            </h3>

            <strong>
              {paidCount}
            </strong>
          </div>

        </div>

        {/* غير مقبوض */}
        <div className="daily-stat-card unpaid">

          <span className="stat-icon">
            ⏳
          </span>

          <div>
            <h3>
              غير مقبوض
            </h3>

            <strong>
              {unpaidCount}
            </strong>
          </div>

        </div>

      </div>

      {/* ====================================
          Form
      ==================================== */}

      <div className="daily-form-card">

        <div className="form-title">

          <h2>
            {editingId
              ? "✏️ تعديل اليومية"
              : "➕ إضافة يومية جديدة"}
          </h2>

        </div>

        <form onSubmit={handleSubmit}>

          <div className="daily-form-grid">

            {/* اسم الزبون */}
            <div className="daily-input-group">

              <label>
                اسم الزبون
              </label>

              <input
                type="text"
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                placeholder="أدخل اسم الزبون"
              />

            </div>

            {/* التاريخ */}
            <div className="daily-input-group">

              <label>
                التاريخ
              </label>

              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
              />

            </div>

            {/* حالة القبض */}
            <div className="daily-input-group">

              <label>
                حالة القبض
              </label>

              <select
                name="paymentStatus"
                value={form.paymentStatus}
                onChange={handleChange}
              >

                <option value="غير مقبوض">
                  غير مقبوض
                </option>

                <option value="مقبوض">
                  مقبوض
                </option>

              </select>

            </div>

            {/* الملاحظات */}
            <div className="daily-input-group daily-notes-group">

              <label>
                الملاحظات
              </label>

              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="اكتب الملاحظات هنا..."
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
                : editingId
                ? "💾 حفظ التعديل"
                : "➕ إضافة اليومية"}

            </button>

            {editingId && (

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

      {/* ====================================
          Search + Filter
      ==================================== */}

      <div className="daily-tools">

        {/* البحث */}

        <div className="daily-search">

          <span>
            🔎
          </span>

          <input
            type="text"
            placeholder="ابحث باسم الزبون..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        {/* الفلترة */}

        <select
          className="daily-filter"
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(e.target.value)
          }
        >

          <option value="الكل">
            كل الحالات
          </option>

          <option value="مقبوض">
            مقبوض
          </option>

          <option value="غير مقبوض">
            غير مقبوض
          </option>

        </select>

      </div>

      {/* ====================================
          Table
      ==================================== */}

      <div className="daily-table-card">

        <div className="daily-table-wrapper">

          <table className="daily-table">

            <thead>

              <tr>

                <th>
                  #
                </th>

                <th>
                  اسم الزبون
                </th>

                <th>
                  التاريخ
                </th>

                <th>
                  حالة القبض
                </th>

                <th>
                  الملاحظات
                </th>

                <th>
                  الإجراءات
                </th>

              </tr>

            </thead>

            <tbody>

              {/* Loading */}

              {loading ? (

                <tr>

                  <td
                    colSpan="6"
                    className="daily-empty"
                  >
                    جاري تحميل البيانات...
                  </td>

                </tr>

              ) : filteredDaily.length === 0 ? (

                /* لا يوجد بيانات */

                <tr>

                  <td
                    colSpan="6"
                    className="daily-empty"
                  >
                    لا توجد يوميات
                  </td>

                </tr>

              ) : (

                /* البيانات */

                filteredDaily.map(
                  (item, index) => (

                    <tr key={item.id}>

                      {/* الرقم */}

                      <td>
                        {index + 1}
                      </td>

                      {/* الزبون */}

                      <td className="customer-name">
                        {item.customerName}
                      </td>

                      {/* التاريخ */}

                      <td>
                        {item.date}
                      </td>

                      {/* حالة القبض */}

                      <td>

                        <span
                          className={`payment-badge ${
                            item.paymentStatus ===
                            "مقبوض"
                              ? "paid-badge"
                              : "unpaid-badge"
                          }`}
                        >

                          {item.paymentStatus ===
                          "مقبوض"
                            ? "✓ مقبوض"
                            : "⏳ غير مقبوض"}

                        </span>

                      </td>

                      {/* الملاحظات */}

                      <td className="notes-cell">

                        {item.notes
                          ? item.notes
                          : "لا توجد ملاحظات"}

                      </td>

                      {/* الإجراءات */}

                      <td>

                        <div className="daily-actions">

                          <button
                            type="button"
                            className="edit-daily-btn"
                            onClick={() =>
                              handleEdit(item)
                            }
                            title="تعديل"
                          >
                            ✏️
                          </button>

                          <button
                            type="button"
                            className="delete-daily-btn"
                            onClick={() =>
                              handleDelete(item.id)
                            }
                            title="حذف"
                          >
                            🗑️
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

export default Daily;
