import { useEffect, useState } from "react";
import axios from "axios";
import "./Debts.css";
import { Link } from "react-router-dom";

const API_URL = "https://abdbac2-10.onrender.com/debts";

const getToday = () => new Date().toISOString().split("T")[0];

const emptyDebt = {
  personName: "",
  date: getToday(),
  checkNumber: "",
  debtType: "customer",
  amountUsd: "",
  amountSyp: "",
};

function Debts() {
  const [debts, setDebts] = useState([]);
  const [formData, setFormData] = useState(emptyDebt);

  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");
  const [debtFilter, setDebtFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ==========================================
  // جلب الديون من API
  // ==========================================

  const fetchDebts = async () => {
    try {
      setLoading(true);

      const response = await axios.get(API_URL);

      setDebts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching debts:", error);
      alert("حدث خطأ أثناء تحميل الديون");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, []);

  // ==========================================
  // تغيير الحقول
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // فتح نموذج إضافة
  // ==========================================

  const handleAddNew = () => {
    setEditingId(null);

    setFormData({
      ...emptyDebt,
      date: getToday(),
    });

    setShowForm(true);
  };

  // ==========================================
  // فتح نموذج تعديل
  // ==========================================

  const handleEdit = (debt) => {
    setEditingId(debt.id);

    setFormData({
      personName: debt.personName || "",
      date: debt.date || getToday(),
      checkNumber: debt.checkNumber || "",

      // السجلات القديمة بدون نوع تعتبر ديون زبائن
      debtType: debt.debtType || "customer",

      amountUsd: debt.amountUsd ?? "",
      amountSyp: debt.amountSyp ?? "",
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================
  // إغلاق النموذج
  // ==========================================

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ ...emptyDebt });
  };

  // ==========================================
  // إضافة أو تعديل دين
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.personName.trim()) {
      alert("يرجى إدخال اسم الشخص");
      return;
    }

    if (!formData.date) {
      alert("يرجى اختيار التاريخ");
      return;
    }

    if (!formData.checkNumber.trim()) {
      alert("يرجى إدخال رقم الشيك");
      return;
    }

    if (
      formData.amountUsd === "" &&
      formData.amountSyp === ""
    ) {
      alert("يرجى إدخال مبلغ الدين");
      return;
    }

    const amountUsd = Number(formData.amountUsd || 0);
    const amountSyp = Number(formData.amountSyp || 0);

    if (
      !Number.isFinite(amountUsd) ||
      !Number.isFinite(amountSyp) ||
      amountUsd < 0 ||
      amountSyp < 0
    ) {
      alert("يرجى إدخال مبالغ صحيحة");
      return;
    }

    const debtData = {
      personName: formData.personName.trim(),
      date: formData.date,
      checkNumber: formData.checkNumber.trim(),
      debtType: formData.debtType,
      amountUsd,
      amountSyp,
    };

    try {
      setSaving(true);

      if (editingId !== null) {
        await axios.patch(`${API_URL}/${editingId}`, debtData);

        alert("تم تعديل الدين بنجاح");
      } else {
        await axios.post(API_URL, {
          id: Date.now().toString(),
          ...debtData,
        });

        alert("تمت إضافة الدين بنجاح");
      }

      handleCloseForm();
      await fetchDebts();
    } catch (error) {
      console.error("Error saving debt:", error);
      alert("حدث خطأ أثناء حفظ الدين");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // حذف دين
  // ==========================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "هل أنت متأكد من حذف هذا الدين؟"
    );

    if (!confirmed) return;

    try {
      await axios.delete(`${API_URL}/${id}`);

      setDebts((prev) =>
        prev.filter((debt) => String(debt.id) !== String(id))
      );

      alert("تم حذف الدين بنجاح");
    } catch (error) {
      console.error("Error deleting debt:", error);
      alert("حدث خطأ أثناء حذف الدين");
    }
  };

  // ==========================================
  // تنسيق الأرقام
  // ==========================================

  const formatNumber = (number) => {
    return Number(number || 0).toLocaleString("en-US", {
      maximumFractionDigits: 2,
    });
  };

  // ==========================================
  // تنسيق التاريخ
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "-";

    const parts = date.split("-");

    if (parts.length !== 3) return date;

    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  // ==========================================
  // اسم نوع الدين
  // ==========================================

  const getDebtTypeName = (debt) => {
    return (debt.debtType || "customer") === "personal"
      ? "دين شخصي"
      : "دين زبون";
  };

  // ==========================================
  // البحث والفلترة
  // ==========================================

  const filteredDebts = debts.filter((debt) => {
    const text = search.trim().toLowerCase();

    const matchesSearch =
      String(debt.personName || "")
        .toLowerCase()
        .includes(text) ||
      String(debt.checkNumber || "")
        .toLowerCase()
        .includes(text);

    const type = debt.debtType || "customer";

    const matchesType =
      debtFilter === "all" || type === debtFilter;

    return matchesSearch && matchesType;
  });

  // ==========================================
  // الإجماليات حسب الفلتر المختار
  // ==========================================

  const totalUsd = filteredDebts.reduce(
    (sum, debt) => sum + Number(debt.amountUsd || 0),
    0
  );

  const totalSyp = filteredDebts.reduce(
    (sum, debt) => sum + Number(debt.amountSyp || 0),
    0
  );

  // ==========================================
  // JSX
  // ==========================================

  return (
    <div className="debts-page" dir="rtl">
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
      <div>
        <br></br>
      </div>
      {/* رأس الصفحة */}

      <div className="debts-header">
        <div>
          <h1>إدارة الديون</h1>
          <p>متابعة ديون الزبائن والديون الشخصية</p>
        </div>

        <button className="add-debt-btn" onClick={handleAddNew}>
          + إضافة دين جديد
        </button>
      </div>

      {/* ملخص الديون */}

      <div className="debts-summary">
        <div className="debt-summary-card">
          <span>عدد الديون</span>
          <strong>{filteredDebts.length}</strong>
        </div>

        <div className="debt-summary-card usd-card">
          <span>إجمالي الديون بالدولار</span>
          <strong>{formatNumber(totalUsd)} $</strong>
        </div>

        <div className="debt-summary-card syp-card">
          <span>إجمالي الديون بالليرة السورية</span>
          <strong>{formatNumber(totalSyp)} ل.س</strong>
        </div>
      </div>

      {/* البحث */}

      <div className="debts-search">
        <input
          type="text"
          placeholder="ابحث باسم الشخص أو رقم الشيك..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* فلترة نوع الدين */}

      <div className="debts-filter">
        <button
          className={debtFilter === "all" ? "active" : ""}
          onClick={() => setDebtFilter("all")}
        >
          كل الديون
        </button>

        <button
          className={debtFilter === "customer" ? "active" : ""}
          onClick={() => setDebtFilter("customer")}
        >
          ديون الزبائن
        </button>

        <button
          className={debtFilter === "personal" ? "active" : ""}
          onClick={() => setDebtFilter("personal")}
        >
          الديون الشخصية
        </button>
      </div>

      {/* نموذج الإضافة والتعديل */}

      {showForm && (
        <div className="debt-form-container">
          <div className="debt-form-header">
            <h2>
              {editingId !== null ? "تعديل الدين" : "إضافة دين جديد"}
            </h2>

            <button
              type="button"
              className="debt-close-btn"
              onClick={handleCloseForm}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="debt-form-grid">

              <div className="debt-field">
                <label>نوع الدين</label>

                <select
                  name="debtType"
                  value={formData.debtType}
                  onChange={handleChange}
                >
                  <option value="customer">دين زبون</option>
                  <option value="personal">دين شخصي</option>
                </select>
              </div>

              <div className="debt-field">
                <label>اسم الشخص</label>

                <input
                  type="text"
                  name="personName"
                  value={formData.personName}
                  onChange={handleChange}
                  placeholder="اسم الزبون أو الشخص"
                  required
                />
              </div>

              <div className="debt-field">
                <label>التاريخ</label>

                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="debt-field">
                <label>رقم الشيك</label>

                <input
                  type="text"
                  name="checkNumber"
                  value={formData.checkNumber}
                  onChange={handleChange}
                  placeholder="مثال: 002036"
                  required
                />
              </div>

              <div className="debt-field">
                <label>المبلغ بالدولار ($)</label>

                <input
                  type="number"
                  name="amountUsd"
                  value={formData.amountUsd}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="any"
                />
              </div>

              <div className="debt-field">
                <label>المبلغ بالليرة السورية (ل.س)</label>

                <input
                  type="number"
                  name="amountSyp"
                  value={formData.amountSyp}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="any"
                />
              </div>
            </div>

            <div className="debt-form-actions">
              <button
                type="submit"
                className="save-debt-btn"
                disabled={saving}
              >
                {saving
                  ? "جاري الحفظ..."
                  : editingId !== null
                  ? "حفظ التعديلات"
                  : "إضافة الدين"}
              </button>

              <button
                type="button"
                className="cancel-debt-btn"
                onClick={handleCloseForm}
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* الجدول والكروت */}

      <div className="debts-table-container">
        {loading ? (
          <div className="debts-message">جاري تحميل الديون...</div>
        ) : filteredDebts.length === 0 ? (
          <div className="debts-message">
            <h3>لا توجد ديون</h3>
            <p>ما في بيانات مطابقة للبحث أو الفلترة الحالية</p>
          </div>
        ) : (
          <>
            {/* جدول الكمبيوتر */}

            <table className="debts-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>نوع الدين</th>
                  <th>اسم الشخص</th>
                  <th>التاريخ</th>
                  <th>رقم الشيك</th>
                  <th>المبلغ بالدولار</th>
                  <th>المبلغ بالليرة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>

              <tbody>
                {filteredDebts.map((debt, index) => (
                  <tr key={debt.id}>
                    <td>{index + 1}</td>

                    <td>
                      <span
                        className={`debt-type-badge ${
                          (debt.debtType || "customer") === "personal"
                            ? "personal-badge"
                            : "customer-badge"
                        }`}
                      >
                        {getDebtTypeName(debt)}
                      </span>
                    </td>

                    <td className="debt-person">{debt.personName}</td>

                    <td>{formatDate(debt.date)}</td>

                    <td className="debt-check-number">
                      {debt.checkNumber}
                    </td>

                    <td className="debt-usd">
                      {formatNumber(debt.amountUsd)} $
                    </td>

                    <td className="debt-syp">
                      {formatNumber(debt.amountSyp)} ل.س
                    </td>

                    <td>
                      <div className="debt-actions">
                        <button
                          className="edit-debt-btn"
                          onClick={() => handleEdit(debt)}
                        >
                          ✏️ تعديل
                        </button>

                        <button
                          className="delete-debt-btn"
                          onClick={() => handleDelete(debt.id)}
                        >
                          🗑️ حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr>
                  <td colSpan="5">الإجمالي</td>

                  <td className="debt-usd">
                    {formatNumber(totalUsd)} $
                  </td>

                  <td className="debt-syp">
                    {formatNumber(totalSyp)} ل.س
                  </td>

                  <td>-</td>
                </tr>
              </tfoot>
            </table>

            {/* كروت الموبايل */}

            <div className="debts-mobile-cards">
              {filteredDebts.map((debt, index) => (
                <div className="debt-card" key={debt.id}>
                  <div className="debt-card-header">
                    <span className="debt-card-number">
                      دين #{index + 1}
                    </span>

                    <span className="debt-card-date">
                      {formatDate(debt.date)}
                    </span>
                  </div>

                  <div className="debt-card-row">
                    <span>نوع الدين</span>

                    <strong
                      className={
                        (debt.debtType || "customer") === "personal"
                          ? "personal-text"
                          : "customer-text"
                      }
                    >
                      {getDebtTypeName(debt)}
                    </strong>
                  </div>

                  <div className="debt-card-person">
                    <span>اسم الشخص</span>
                    <strong>{debt.personName}</strong>
                  </div>

                  <div className="debt-card-row">
                    <span>رقم الشيك</span>
                    <strong className="mobile-check-number">
                      {debt.checkNumber}
                    </strong>
                  </div>

                  <div className="debt-card-row">
                    <span>المبلغ بالدولار</span>
                    <strong className="mobile-usd">
                      {formatNumber(debt.amountUsd)} $
                    </strong>
                  </div>

                  <div className="debt-card-row">
                    <span>المبلغ بالليرة</span>
                    <strong className="mobile-syp">
                      {formatNumber(debt.amountSyp)} ل.س
                    </strong>
                  </div>

                  <div className="debt-card-actions">
                    <button
                      className="edit-debt-btn"
                      onClick={() => handleEdit(debt)}
                    >
                      ✏️ تعديل
                    </button>

                    <button
                      className="delete-debt-btn"
                      onClick={() => handleDelete(debt.id)}
                    >
                      🗑️ حذف
                    </button>
                  </div>
                </div>
              ))}

              {/* إجمالي الموبايل */}

              <div className="mobile-total-card">
                <div>
                  <span>إجمالي الديون بالدولار</span>
                  <strong>{formatNumber(totalUsd)} $</strong>
                </div>

                <div>
                  <span>إجمالي الديون بالليرة</span>
                  <strong>{formatNumber(totalSyp)} ل.س</strong>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Debts;